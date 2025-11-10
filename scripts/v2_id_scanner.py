"""
OnlyFans V2 ID Scanner - Sequential numeric ID enumeration
Features:
- Async Playwright with XHR interception
- Filter non-performers (isperformer=false)
- Detect deleted/unavailable pages
- Direct Supabase upsert with snapshots
- Resume capability with progress tracking
- Rate limiting and exponential backoff
- Proxy and user-agent rotation support
"""

import asyncio
import argparse
import json
import os
import sys
from typing import Dict, Any, Optional, Set, List
from datetime import datetime, timezone, timedelta
from dateutil.parser import parse as parse_date
from pathlib import Path
import time

from playwright.async_api import async_playwright, Browser, BrowserContext, Page
from tqdm import tqdm

# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv()

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))
from v2_shared_utils import SupabaseClient, RateLimiter, ProxyPool, UserAgentRotator


# ============================================================================
# Field Extraction (reused from V1 scraper)
# ============================================================================

# Whitelist of columns that exist in onlyfans_profiles table - EXACT CASE MATCH REQUIRED
# These must match the DB schema exactly for PostgREST
VALID_DB_COLUMNS = {
    # Core fields
    'id', 'username', 'name', 'about', 'location', 'website', 'wishlist', 'view',
    # Images
    'avatar', 'header', 
    # Counts
    'archivedPostsCount', 'audiosCount', 'favoritedCount', 'favoritesCount', 
    'finishedStreamsCount', 'mediasCount', 'photosCount', 'postsCount', 
    'privateArchivedPostsCount', 'subscribersCount', 'videosCount',
    # Prices/Tips
    'subscribePrice', 'currentSubscribePrice', 'tipsEnabled', 'tipsMax', 'tipsMin', 
    'tipsMinInternal', 'tipsTextEnabled', 'referalBonusSummForReferer',
    # Booleans - can*
    'canAddSubscriber', 'canChat', 'canCommentStory', 'canCreatePromotion', 
    'canCreateTrial', 'canEarn', 'canLookStory', 'canPayInternal', 
    'canReceiveChatMessage', 'canReport', 'canRestrict', 'canTrialSend',
    # Booleans - has*
    'hasLabels', 'hasLinks', 'hasNotViewedStory', 'hasPinnedPosts', 
    'hasSavedStreams', 'hasScheduledStream', 'hasStories', 'hasStream',
    # Booleans - is*
    'isAdultContent', 'isBlocked', 'isFriend', 'isMarkdownDisabledForAbout', 
    'isPerformer', 'isPrivateRestriction', 'isRealPerformer', 'isReferrerAllowed', 
    'isRestricted', 'isSpotifyConnected', 'isSpringConnected', 'isVerified',
    # Booleans - show*
    'showMediaCount', 'showPostsInFeed', 'showSubscribersCount', 'shouldShowFinishedStreams',
    # Booleans - subscribed*
    'subscribedBy', 'subscribedOn', 'subscribedIsExpiredNow',
    # Numeric subscribed*
    'subscribedByAutoprolong', 'subscribedByData', 'subscribedByExpire', 
    'subscribedByExpireDate', 'subscribedOnData', 'subscribedOnDuration', 
    'subscribedOnExpiredNow',
    # Dates
    'joinDate', 'lastSeen', 'firstPublishedPostDate',
    # Other
    'avatarHeaderConverterUpload',
    # Thumbs and sizes
    'avatar_c50', 'avatar_c144', 'avatar_thumbs_json', 
    'header_w480', 'header_w760', 'header_thumbs_json', 'header_size', 
    'header_width', 'header_height',
    # Promotions and bundles
    'promotion1_id', 'promotion1_price', 'promotion1_discount', 'promotion1_title',
    'promotion2_id', 'promotion2_price', 'promotion2_discount', 'promotion2_title',
    'promotion3_id', 'promotion3_price', 'promotion3_discount', 'promotion3_title',
    'bundle1_id', 'bundle1_discount', 'bundle1_duration', 'bundle1_price', 'bundle1_canBuy',
    'bundle2_id', 'bundle2_discount', 'bundle2_duration', 'bundle2_price', 'bundle2_canBuy',
    'bundle3_id', 'bundle3_discount', 'bundle3_duration', 'bundle3_price', 'bundle3_canBuy',
    # Metadata
    'raw_json', 'source_url', 'success_attempt', 'timestamp',
    # V2 tracking columns from migration
    'first_seen_at', 'last_seen_at', 'last_refreshed_at', 'next_refresh_at', 'status'
}

def extract_fields(json_data: Dict) -> Dict[str, Any]:
    """Extract and normalize fields from OnlyFans API response - matches V1 scraper"""
    
    # Helper to safely get nested values
    def safe_get(obj, key, default=""):
        return obj.get(key, default) if isinstance(obj, dict) else default
    
    def flatten_thumb_dict(d: Dict[str, Any]) -> Dict[str, Any]:
        out = {"c50": "", "c144": "", "w480": "", "w760": "", "thumbs_json": ""}
        if not isinstance(d, dict):
            return out
        for k in ("c50", "c144", "w480", "w760"):
            out[k] = safe_get(d, k, "")
        try:
            out["thumbs_json"] = json.dumps(d, ensure_ascii=False)
        except Exception:
            out["thumbs_json"] = ""
        return out
    
    def flatten_header_size(hs: Dict[str, Any]):
        if not isinstance(hs, dict):
            return ("", 0, 0)
        w = safe_get(hs, "width", 0) or 0
        h = safe_get(hs, "height", 0) or 0
        try:
            w = int(w)
        except Exception:
            w = 0
        try:
            h = int(h)
        except Exception:
            h = 0
        return (f"{w}x{h}" if w and h else "", w, h)
    
    # ALL scalar fields from V1 scraper
    scalar_fields = [
        "about","archivedPostsCount","audiosCount","avatar","avatarHeaderConverterUpload",
        "canAddSubscriber","canChat","canCommentStory","canCreatePromotion","canCreateTrial",
        "canEarn","canLookStory","canPayInternal","canReceiveChatMessage","canReport","canRestrict",
        "canTrialSend","currentSubscribePrice","favoritedCount","favoritesCount","finishedStreamsCount",
        "firstPublishedPostDate","hasLabels","hasLinks","hasNotViewedStory","hasPinnedPosts",
        "hasSavedStreams","hasScheduledStream","hasStories","hasStream","header","id","isAdultContent",
        "isBlocked","isFriend","isMarkdownDisabledForAbout","isPerformer","isPrivateRestriction",
        "isRealPerformer","isReferrerAllowed","isRestricted","isSpotifyConnected","isSpringConnected",
        "isVerified","joinDate","lastSeen","location","mediasCount","name","photosCount","postsCount",
        "privateArchivedPostsCount","referalBonusSummForReferer","shouldShowFinishedStreams",
        "showMediaCount","showPostsInFeed","showSubscribersCount","subscribePrice","subscribedBy",
        "subscribedByAutoprolong","subscribedByData","subscribedByExpire","subscribedByExpireDate",
        "subscribedIsExpiredNow","subscribedOn","subscribedOnData","subscribedOnDuration",
        "subscribedOnExpiredNow","subscribersCount","tipsEnabled","tipsMax","tipsMin","tipsMinInternal",
        "tipsTextEnabled","username","videosCount","view","website","wishlist"
    ]
    
    fields = {}
    for f in scalar_fields:
        v = safe_get(json_data, f, "")
        if isinstance(v, (dict, list)):
            try:
                fields[f] = json.dumps(v, ensure_ascii=False)
            except Exception:
                fields[f] = str(v)
        else:
            fields[f] = v
    
    # Avatar thumbs
    a_thumbs = flatten_thumb_dict(safe_get(json_data, "avatarThumbs", {}))
    fields["avatar_c50"] = a_thumbs["c50"]
    fields["avatar_c144"] = a_thumbs["c144"]
    fields["avatar_thumbs_json"] = a_thumbs["thumbs_json"]
    
    # Header thumbs + size
    h_thumbs = flatten_thumb_dict(safe_get(json_data, "headerThumbs", {}))
    fields["header_w480"] = h_thumbs["w480"]
    fields["header_w760"] = h_thumbs["w760"]
    fields["header_thumbs_json"] = h_thumbs["thumbs_json"]
    
    size_str, w, h = flatten_header_size(safe_get(json_data, "headerSize", {}))
    fields["header_size"] = size_str
    fields["header_width"] = w
    fields["header_height"] = h
    
    # Promotions (3 max, with id/price/discount/title)
    promos = safe_get(json_data, "promotions", [])
    if not isinstance(promos, list):
        promos = []
    for i in range(3):
        pref = f"promotion{i+1}"
        if i < len(promos) and isinstance(promos[i], dict):
            p = promos[i]
            fields[f"{pref}_id"] = safe_get(p, "id", "")
            fields[f"{pref}_price"] = safe_get(p, "price", "")
            fields[f"{pref}_discount"] = safe_get(p, "discount", "")
            fields[f"{pref}_title"] = safe_get(p, "title", "")
        else:
            fields[f"{pref}_id"] = ""
            fields[f"{pref}_price"] = ""
            fields[f"{pref}_discount"] = ""
            fields[f"{pref}_title"] = ""
    
    # Bundles (3 max, with id/discount/duration/price/canBuy)
    bundles = safe_get(json_data, "subscriptionBundles", [])
    if not isinstance(bundles, list):
        bundles = []
    for i in range(3):
        pref = f"bundle{i+1}"
        if i < len(bundles) and isinstance(bundles[i], dict):
            b = bundles[i]
            fields[f"{pref}_id"] = safe_get(b, "id", "")
            fields[f"{pref}_discount"] = safe_get(b, "discount", "")
            fields[f"{pref}_duration"] = safe_get(b, "duration", "")
            fields[f"{pref}_price"] = safe_get(b, "price", "")
            fields[f"{pref}_canBuy"] = safe_get(b, "canBuy", "")
        else:
            fields[f"{pref}_id"] = ""
            fields[f"{pref}_discount"] = ""
            fields[f"{pref}_duration"] = ""
            fields[f"{pref}_price"] = ""
            fields[f"{pref}_canBuy"] = ""
    
    # Raw JSON (for debugging)
    try:
        fields["raw_json"] = json.dumps(json_data, ensure_ascii=False)
    except Exception:
        fields["raw_json"] = ""
    
    # Filter to only include columns that exist in DB schema (prevent PostgREST 400 errors)
    # Use exact case matching - PostgREST is case-sensitive
    filtered = {}
    for k, v in fields.items():
        if k in VALID_DB_COLUMNS:
            filtered[k] = v
        elif k not in VALID_DB_COLUMNS:
            # Debug: show which fields are being filtered out
            if 'archived' in k.lower() or 'posts' in k.lower():
                print(f"🔍 Filtering out field: '{k}' (not in whitelist)")
    
    return filtered


# ============================================================================
# Deleted Page Detection
# ============================================================================

async def is_deleted_page(page: Page) -> bool:
    """Check if page shows deleted/unavailable message"""
    try:
        # Wait briefly for content to load
        await asyncio.sleep(0.5)
        
        # Check for common "not available" text
        content = await page.content()
        deleted_phrases = [
            "Sorry this page is not available",
            "page is not available",
            "profile not found",
            "user not found",
            "This profile no longer exists"
        ]
        
        return any(phrase.lower() in content.lower() for phrase in deleted_phrases)
    except Exception as e:
        print(f"⚠️ Error checking deleted page: {e}")
        return False


# ============================================================================
# ID Scanner
# ============================================================================

class IDScanner:
    """Sequential OnlyFans ID scanner"""
    
    def __init__(self, 
                 supabase_url: str,
                 supabase_key: str,
                 cookies_file: str,
                 start_id: int = 1,
                 end_id: int = 1000000,
                 concurrency: int = 3,
                 rate: float = 1.0,
                 proxies: Optional[List[str]] = None,
                 dry_run: bool = False,
                 resume: bool = True):
        
        self.start_id = start_id
        self.end_id = end_id
        self.concurrency = concurrency
        self.dry_run = dry_run
        self.resume = resume
        
        # Load cookies
        with open(cookies_file, 'r') as f:
            self.cookies = json.load(f)
        
        # Initialize utilities
        self.db = SupabaseClient(supabase_url, supabase_key) if not dry_run else None
        self.rate_limiter = RateLimiter(rate=rate, burst=5)
        self.proxy_pool = ProxyPool(proxies or [])
        self.ua_rotator = UserAgentRotator()
        
        # Stats
        self.stats = {
            'total_attempted': 0,
            'total_success': 0,
            'total_skipped': 0,
            'total_errors': 0,
            'creators_found': 0,
            'non_performers': 0,
            'inactive_creators': 0,
            'deleted': 0
        }
        
        # Semaphore for concurrency control
        self.semaphore = asyncio.Semaphore(concurrency)
        
        # Store failed IDs
        self.failed_ids: Dict[int, str] = {}
    
    async def setup(self):
        """Setup: create crawl run, load progress"""
        if not self.dry_run:
            # Load resume point if enabled
            if self.resume:
                progress = await self.db.get_scan_progress()
                if progress and progress.get('last_id_scanned', 0) > self.start_id:
                    self.start_id = progress['last_id_scanned'] + 1
                    print(f"📍 Resuming from ID {self.start_id}")
            
            # Create crawl run
            config = {
                'concurrency': self.concurrency,
                'rate': self.rate_limiter.rate,
                'proxies_count': len(self.proxy_pool.proxies) if not self.proxy_pool.no_proxies else 0
            }
            self.run_id = await self.db.create_crawl_run('discovery', self.start_id, self.end_id, config)
            print(f"🆔 Crawl run ID: {self.run_id}")
        else:
            print("🔍 DRY RUN MODE - No database writes")
    
    async def scan_id(self, browser: Browser, creator_id: int) -> Optional[Dict[str, Any]]:
        """Scan single ID and return profile data if valid creator"""
        async with self.semaphore:
            # Rate limiting
            await self.rate_limiter.acquire()
            
            # Get proxy and user agent
            proxy = await self.proxy_pool.get_proxy()
            user_agent = self.ua_rotator.get_random_agent()
            
            context = None
            page = None
            
            try:
                # Create context
                context_opts = {'user_agent': user_agent}
                if proxy:
                    context_opts['proxy'] = {'server': proxy}
                
                context = await browser.new_context(**context_opts)
                
                # Add cookies
                await context.add_cookies(self.cookies)
                
                page = await context.new_page()
                
                # Setup response interception
                profile_data = None
                user_not_found = False
                
                async def handle_response(response):
                    nonlocal profile_data, user_not_found
                    try:
                        if "/api2/v2/users/" in response.url:
                            json_data = await response.json()
                            # Check for "User not found" error response (can come with 200 or error status)
                            if 'error' in json_data:
                                error = json_data.get('error', {})
                                if isinstance(error, dict) and error.get('message') == 'User not found':
                                    user_not_found = True
                                    return
                            # Only extract fields if status is 200 and no error AND has id field (means full profile)
                            # The 'id' check filters out auth/stats responses and ensures we have the main profile data
                            if response.status == 200 and 'id' in json_data:
                                profile_data = extract_fields(json_data)
                    except Exception as e:
                        pass  # Ignore response parsing errors
                
                page.on("response", handle_response)
                
                # Visit page
                url = f"https://onlyfans.com/{creator_id}"
                await page.goto(url, wait_until="networkidle", timeout=30000)
                
                # Wait for API response
                await asyncio.sleep(1)
                
                # Check for "User not found" error from API
                if user_not_found:
                    self.stats['deleted'] += 1
                    self.stats['total_skipped'] += 1
                    if proxy:
                        await self.proxy_pool.report_success(proxy)
                    return None
                
                # Check if deleted via page content
                if not profile_data:
                    is_deleted = await is_deleted_page(page)
                    if is_deleted:
                        self.stats['deleted'] += 1
                        self.stats['total_skipped'] += 1
                        if proxy:
                            await self.proxy_pool.report_success(proxy)
                        return None
                
                # Filter non-performers - STRICT: only collect if isPerformer=True
                if profile_data and not profile_data.get('isPerformer', False):
                    self.stats['non_performers'] += 1
                    self.stats['total_skipped'] += 1
                    if proxy:
                        await self.proxy_pool.report_success(proxy)
                    return None
                
                # Filter inactive creators with smart activity detection
                if profile_data:
                    last_seen = profile_data.get('lastSeen')
                    first_pub = profile_data.get('firstPublishedPostDate')
                    posts_count = profile_data.get('postsCount', 0) or 0
                    photos_count = profile_data.get('photosCount', 0) or 0
                    videos_count = profile_data.get('videosCount', 0) or 0
                    favorited_count = profile_data.get('favoritedCount', 0) or 0
                    is_verified = profile_data.get('isVerified', False)
                    
                    # First check: Has the account been abandoned? (lastSeen > 1 year ago)
                    is_abandoned = False
                    if last_seen:
                        try:
                            last_seen_date = parse_date(last_seen)
                            one_year_ago = datetime.now(timezone.utc) - timedelta(days=365)
                            is_abandoned = last_seen_date < one_year_ago
                        except:
                            pass
                    
                    # Strong activity indicators (can override abandonment for very popular/verified creators)
                    has_high_engagement = favorited_count > 100  # Lowered from 1000 to catch smaller active creators
                    has_lots_of_posts = posts_count > 50
                    has_lots_of_media = (photos_count + videos_count) > 100
                    is_verified_creator = is_verified  # OnlyFans vets active creators
                    
                    # Check if recent account (within 2 years)
                    is_recent_account = False
                    if first_pub:
                        try:
                            first_pub_date = parse_date(first_pub)
                            two_years_ago = datetime.now(timezone.utc) - timedelta(days=730)
                            is_recent_account = first_pub_date > two_years_ago
                        except:
                            pass
                    
                    # If abandoned (lastSeen > 1 year), filter UNLESS they have exceptional activity
                    if is_abandoned:
                        # Only keep abandoned accounts if they're verified OR extremely popular (10k+ favorites)
                        has_exceptional_activity = is_verified_creator or favorited_count > 10000
                        if not has_exceptional_activity:
                            self.stats['inactive_creators'] += 1
                            self.stats['total_skipped'] += 1
                            if proxy:
                                await self.proxy_pool.report_success(proxy)
                            return None
                    
                    # For non-abandoned accounts, check other activity indicators
                    if has_high_engagement or has_lots_of_posts or has_lots_of_media or is_verified_creator or is_recent_account:
                        pass  # Keep this creator, they're clearly active
                    else:
                        # Only filter if ALL these inactive indicators are true
                        low_posts = posts_count < 10
                        low_media = (photos_count + videos_count) <= 5
                        low_engagement = favorited_count < 100  # Lowered from 500 to match activity threshold
                        
                        # Check if old/no lastSeen
                        old_or_no_lastseen = False
                        if not last_seen:
                            old_or_no_lastseen = True  # null lastSeen + other low indicators = inactive
                        else:
                            try:
                                last_seen_date = parse_date(last_seen)
                                one_year_ago = datetime.now(timezone.utc) - timedelta(days=365)
                                old_or_no_lastseen = last_seen_date < one_year_ago
                            except:
                                pass
                        
                        # Filter only if ALL indicators point to inactive
                        if low_posts and low_media and low_engagement and old_or_no_lastseen:
                            self.stats['inactive_creators'] += 1
                            self.stats['total_skipped'] += 1
                            if proxy:
                                await self.proxy_pool.report_success(proxy)
                            return None
                
                # Valid creator found
                if profile_data:
                    self.stats['creators_found'] += 1
                    self.stats['total_success'] += 1
                    if proxy:
                        await self.proxy_pool.report_success(proxy)
                    
                    # Add V2 tracking fields
                    # Use timezone-aware UTC timestamps (utcnow() deprecated)
                    now_iso = datetime.now(timezone.utc).isoformat()
                    profile_data['first_seen_at'] = now_iso
                    profile_data['last_seen_at'] = now_iso
                    profile_data['last_refreshed_at'] = now_iso
                    profile_data['status'] = 'active'
                    
                    return profile_data
                else:
                    self.stats['total_skipped'] += 1
                    return None
                
            except Exception as e:
                self.stats['total_errors'] += 1
                self.failed_ids[creator_id] = str(e)
                if proxy:
                    await self.proxy_pool.report_failure(proxy)
                return None
            
            finally:
                try:
                    if page:
                        await page.close()
                except Exception:
                    pass  # Ignore errors when closing page
                try:
                    if context:
                        await context.close()
                except Exception:
                    pass  # Ignore errors when closing context
    
    async def save_profile(self, profile: Dict[str, Any]):
        """Save profile and snapshot to database"""
        if self.dry_run:
            print(f"✅ [DRY RUN] Would save: {profile.get('username')} (ID: {profile.get('id')})")
            return True
        
        # Upsert profile
        success = await self.db.upsert_profile(profile)
        
        if success:
            # Create snapshot with ALL profile fields for complete historical tracking
            # Copy entire profile dict and add creator_id
            snapshot = dict(profile)  # Copy all fields
            snapshot['creator_id'] = profile.get('id')
            
            # Remove fields that don't belong in snapshots (timestamps from main table)
            snapshot.pop('first_seen_at', None)
            snapshot.pop('last_seen_at', None)
            snapshot.pop('last_refreshed_at', None)
            snapshot.pop('next_refresh_at', None)
            snapshot.pop('status', None)
            
            await self.db.insert_snapshot(snapshot)
        
        return success
    
    async def run(self):
        """Main scan loop"""
        await self.setup()
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            
            try:
                # Progress bar
                pbar = tqdm(range(self.start_id, self.end_id + 1), 
                           desc="Scanning IDs",
                           unit="id")
                
                # Batch processing
                batch_size = 100
                current_batch = []
                
                for creator_id in pbar:
                    self.stats['total_attempted'] += 1
                    
                    # Scan ID
                    profile = await self.scan_id(browser, creator_id)
                    
                    # Save if valid
                    if profile:
                        await self.save_profile(profile)
                        current_batch.append(profile)
                    
                    # Update progress bar
                    pbar.set_postfix({
                        'found': self.stats['creators_found'],
                        'skipped': self.stats['total_skipped'],
                        'errors': self.stats['total_errors']
                    })
                    
                    # Periodic progress save
                    if creator_id % batch_size == 0:
                        if not self.dry_run:
                            await self.db.update_scan_progress(
                                creator_id, 
                                creator_id,
                                creators_delta=len(current_batch),
                                scanned_delta=batch_size
                            )
                        current_batch = []
                
                pbar.close()
                
            finally:
                await browser.close()
        
        # Final stats
        await self.print_summary()
    
    async def print_summary(self):
        """Print final summary"""
        print("\n" + "="*60)
        print("SCAN COMPLETE")
        print("="*60)
        print(f"Total attempted: {self.stats['total_attempted']}")
        print(f"Creators found: {self.stats['creators_found']}")
        print(f"Non-performers skipped: {self.stats['non_performers']}")
        print(f"Inactive creators skipped: {self.stats['inactive_creators']}")
        print(f"Deleted pages: {self.stats['deleted']}")
        print(f"Errors: {self.stats['total_errors']}")
        print(f"Success rate: {self.stats['total_success'] / max(self.stats['total_attempted'], 1) * 100:.1f}%")
        
        # Save failed IDs
        if self.failed_ids:
            failed_file = 'failed_ids_v2.json'
            with open(failed_file, 'w') as f:
                json.dump(self.failed_ids, f, indent=2)
            print(f"\n⚠️ Failed IDs saved to {failed_file}")
        
        # Update crawl run
        if not self.dry_run and self.run_id:
            await self.db.update_crawl_run(self.run_id, {
                'status': 'completed',
                'finished_at': datetime.now(timezone.utc).isoformat(),
                'total_attempted': self.stats['total_attempted'],
                'total_success': self.stats['total_success'],
                'total_skipped': self.stats['total_skipped'],
                'total_errors': self.stats['total_errors']
            })


# ============================================================================
# CLI
# ============================================================================

def main():
    parser = argparse.ArgumentParser(description='OnlyFans V2 Sequential ID Scanner')
    
    # Required
    parser.add_argument('--cookies', required=True, help='Path to cookies.json file')
    
    # ID range
    parser.add_argument('--start-id', type=int, default=1, help='Start ID (default: 1)')
    parser.add_argument('--end-id', type=int, default=1000000, help='End ID (default: 1000000)')
    
    # Performance
    parser.add_argument('--concurrency', type=int, default=3, help='Concurrent requests (default: 3)')
    parser.add_argument('--rate', type=float, default=1.0, help='Requests per second (default: 1.0)')
    
    # Proxies
    parser.add_argument('--proxies', nargs='+', help='Proxy URLs (http://user:pass@host:port)')
    
    # Options
    parser.add_argument('--dry-run', action='store_true', help='Dry run (no database writes)')
    parser.add_argument('--no-resume', action='store_true', help='Disable resume from last scan')
    
    args = parser.parse_args()
    
    # Environment variables
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_KEY')
    
    if not args.dry_run and (not supabase_url or not supabase_key):
        print("❌ Missing SUPABASE_URL or SUPABASE_KEY environment variables")
        sys.exit(1)
    
    # Create scanner
    scanner = IDScanner(
        supabase_url=supabase_url or '',
        supabase_key=supabase_key or '',
        cookies_file=args.cookies,
        start_id=args.start_id,
        end_id=args.end_id,
        concurrency=args.concurrency,
        rate=args.rate,
        proxies=args.proxies,
        dry_run=args.dry_run,
        resume=not args.no_resume
    )
    
    # Run
    asyncio.run(scanner.run())


if __name__ == '__main__':
    main()
