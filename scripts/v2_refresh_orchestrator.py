"""
OnlyFans V2 Refresh Orchestrator - Weekly profile refresh
Re-scrapes existing creators to update metrics and create new snapshots

Features:
- Query profiles due for refresh (next_refresh_at < NOW)
- Adaptive refresh schedule based on status
- Priority tiers (verified creators refresh more often)
- Snapshot creation for growth tracking
- Status detection (active → inactive → deleted)
"""

import asyncio
import argparse
import json
import os
import sys
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from pathlib import Path

from playwright.async_api import async_playwright, Browser
from tqdm import tqdm

# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv()

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))
from v2_shared_utils import SupabaseClient, RateLimiter, ProxyPool, UserAgentRotator
from v2_id_scanner import extract_fields, is_deleted_page


# ============================================================================
# Refresh Orchestrator
# ============================================================================

class RefreshOrchestrator:
    """Re-scrape existing creators to update metrics and snapshots"""
    
    def __init__(self,
                 supabase_url: str,
                 supabase_key: str,
                 cookies_file: str,
                 batch_size: int = 100,
                 concurrency: int = 3,
                 rate: float = 1.0,
                 proxies: Optional[List[str]] = None,
                 dry_run: bool = False,
                 priority_only: bool = False):
        
        self.batch_size = batch_size
        self.concurrency = concurrency
        self.dry_run = dry_run
        self.priority_only = priority_only
        
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
            'total_errors': 0,
            'status_changes': {
                'active_to_inactive': 0,
                'active_to_deleted': 0,
                'inactive_to_active': 0,
                'inactive_to_deleted': 0
            }
        }
        
        # Semaphore for concurrency control
        self.semaphore = asyncio.Semaphore(concurrency)
        
        # Failed profiles
        self.failed_profiles: Dict[int, str] = {}
    
    async def get_profiles_due_for_refresh(self) -> List[Dict[str, Any]]:
        """Query profiles that need refreshing"""
        if self.dry_run:
            # Return dummy data for testing
            return [
                {'id': 123456, 'username': 'test_user1', 'status': 'active'},
                {'id': 789012, 'username': 'test_user2', 'status': 'active'}
            ]
        
        # Query Supabase for profiles due for refresh
        endpoint = f"{self.db.url}/rest/v1/onlyfans_profiles"
        
        # Build query
        params = {
            'select': 'id,username,status,isverified,next_refresh_at',
            'order': 'next_refresh_at.asc.nullsfirst',
            'limit': str(self.batch_size)
        }
        
        # Filter by priority if requested
        if self.priority_only:
            params['isverified'] = 'eq.true'
        
        # Only profiles due for refresh or never refreshed
        now = datetime.utcnow().isoformat()
        params['or'] = f'(next_refresh_at.lt.{now},next_refresh_at.is.null)'
        
        try:
            import aiohttp
            async with aiohttp.ClientSession() as session:
                headers = {**self.db.headers, 'Prefer': 'return=representation'}
                async with session.get(endpoint, params=params, headers=headers) as resp:
                    if resp.status == 200:
                        return await resp.json()
                    else:
                        print(f"⚠️ Failed to fetch profiles: {resp.status}")
                        return []
        except Exception as e:
            print(f"⚠️ Error fetching profiles: {e}")
            return []
    
    async def refresh_profile(self, browser: Browser, profile: Dict[str, Any]) -> bool:
        """Refresh single profile and update metrics"""
        async with self.semaphore:
            # Rate limiting
            await self.rate_limiter.acquire()
            
            creator_id = profile['id']
            username = profile.get('username', 'unknown')
            old_status = profile.get('status', 'unknown')
            
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
                await context.add_cookies(self.cookies)
                page = await context.new_page()
                
                # Setup response interception
                profile_data = None
                
                async def handle_response(response):
                    nonlocal profile_data
                    try:
                        if "/api2/v2/users/" in response.url and response.status == 200:
                            json_data = await response.json()
                            profile_data = extract_fields(json_data)
                    except Exception:
                        pass
                
                page.on("response", handle_response)
                
                # Visit page
                url = f"https://onlyfans.com/{username}"
                await page.goto(url, wait_until="networkidle", timeout=30000)
                await asyncio.sleep(1)
                
                # Determine new status
                new_status = old_status
                
                if not profile_data:
                    # Check if deleted
                    is_deleted = await is_deleted_page(page)
                    if is_deleted:
                        new_status = 'deleted'
                        self.stats['status_changes'][f'{old_status}_to_deleted'] = \
                            self.stats['status_changes'].get(f'{old_status}_to_deleted', 0) + 1
                else:
                    # Check if still performer
                    if not profile_data.get('isperformer', False):
                        new_status = 'non_performer'
                    else:
                        # Check activity level
                        posts_count = profile_data.get('postscount', 0)
                        if posts_count == 0 or profile_data.get('isprivate', False):
                            new_status = 'inactive'
                            if old_status == 'active':
                                self.stats['status_changes']['active_to_inactive'] += 1
                        else:
                            new_status = 'active'
                            if old_status == 'inactive':
                                self.stats['status_changes']['inactive_to_active'] += 1
                
                # Calculate next refresh time
                next_refresh = self._calculate_next_refresh(new_status, profile.get('isverified', False))
                
                if profile_data:
                    # Update profile
                    profile_data['last_seen_at'] = datetime.utcnow().isoformat()
                    profile_data['last_refreshed_at'] = datetime.utcnow().isoformat()
                    profile_data['next_refresh_at'] = next_refresh.isoformat()
                    profile_data['status'] = new_status
                    
                    if self.dry_run:
                        print(f"✅ [DRY RUN] Would refresh: {username} (ID: {creator_id}, status: {old_status} → {new_status})")
                    else:
                        # Upsert profile
                        success = await self.db.upsert_profile(profile_data)
                        
                        if success:
                            # Create snapshot
                            snapshot = {
                                'creator_id': creator_id,
                                'subscribeprice': profile_data.get('subscribeprice'),
                                'favoritedcount': profile_data.get('favoritedcount'),
                                'subscriberscount': profile_data.get('subscriberscount'),
                                'postscount': profile_data.get('postscount'),
                                'photoscount': profile_data.get('photoscount'),
                                'videoscount': profile_data.get('videoscount'),
                                'audioscount': profile_data.get('audioscount'),
                                'isverified': profile_data.get('isverified'),
                                'bundle1_price': profile_data.get('bundle1_price'),
                                'promotion1_price': profile_data.get('promotion1_price'),
                            }
                            await self.db.insert_snapshot(snapshot)
                            
                            self.stats['total_success'] += 1
                        else:
                            self.failed_profiles[creator_id] = "Upsert failed"
                            self.stats['total_errors'] += 1
                else:
                    # Profile not accessible, update status only
                    if not self.dry_run:
                        update_data = {
                            'id': creator_id,
                            'status': new_status,
                            'last_refreshed_at': datetime.utcnow().isoformat(),
                            'next_refresh_at': next_refresh.isoformat()
                        }
                        await self.db.upsert_profile(update_data)
                    
                    self.stats['total_success'] += 1
                
                if proxy:
                    await self.proxy_pool.report_success(proxy)
                
                return True
                
            except Exception as e:
                self.stats['total_errors'] += 1
                self.failed_profiles[creator_id] = str(e)
                if proxy:
                    await self.proxy_pool.report_failure(proxy)
                return False
            
            finally:
                if page:
                    await page.close()
                if context:
                    await context.close()
    
    def _calculate_next_refresh(self, status: str, is_verified: bool) -> datetime:
        """Calculate next refresh time based on status and verification"""
        now = datetime.utcnow()
        
        # Priority creators (verified) refresh more frequently
        if is_verified:
            if status == 'active':
                return now + timedelta(days=3)  # Every 3 days
            elif status == 'inactive':
                return now + timedelta(days=7)  # Weekly
            elif status == 'deleted':
                return now + timedelta(days=30)  # Monthly check if resurrected
        else:
            # Regular creators
            if status == 'active':
                return now + timedelta(days=7)  # Weekly
            elif status == 'inactive':
                return now + timedelta(days=14)  # Bi-weekly
            elif status == 'deleted':
                return now + timedelta(days=30)  # Monthly
        
        # Default: weekly
        return now + timedelta(days=7)
    
    async def run(self):
        """Main refresh loop"""
        if not self.dry_run:
            # Create crawl run
            config = {
                'batch_size': self.batch_size,
                'concurrency': self.concurrency,
                'priority_only': self.priority_only
            }
            self.run_id = await self.db.create_crawl_run('refresh', config=config)
            print(f"🆔 Crawl run ID: {self.run_id}")
        else:
            print("🔍 DRY RUN MODE - No database writes")
        
        # Fetch profiles due for refresh
        print(f"\n📥 Fetching profiles due for refresh...")
        profiles = await self.get_profiles_due_for_refresh()
        
        if not profiles:
            print("✅ No profiles due for refresh!")
            return
        
        print(f"📋 Found {len(profiles)} profiles to refresh\n")
        
        # Refresh profiles
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            
            try:
                pbar = tqdm(profiles, desc="Refreshing profiles", unit="profile")
                
                for profile in pbar:
                    self.stats['total_attempted'] += 1
                    await self.refresh_profile(browser, profile)
                    
                    # Update progress bar
                    pbar.set_postfix({
                        'success': self.stats['total_success'],
                        'errors': self.stats['total_errors']
                    })
                
                pbar.close()
                
            finally:
                await browser.close()
        
        # Print summary
        await self.print_summary()
    
    async def print_summary(self):
        """Print final summary"""
        print("\n" + "="*60)
        print("REFRESH COMPLETE")
        print("="*60)
        print(f"Total attempted: {self.stats['total_attempted']}")
        print(f"Successful refreshes: {self.stats['total_success']}")
        print(f"Errors: {self.stats['total_errors']}")
        print(f"Success rate: {self.stats['total_success'] / max(self.stats['total_attempted'], 1) * 100:.1f}%")
        
        # Status changes
        if any(self.stats['status_changes'].values()):
            print("\nStatus Changes:")
            for change, count in self.stats['status_changes'].items():
                if count > 0:
                    print(f"  {change}: {count}")
        
        # Save failed profiles
        if self.failed_profiles:
            failed_file = 'failed_refresh_v2.json'
            with open(failed_file, 'w') as f:
                json.dump(self.failed_profiles, f, indent=2)
            print(f"\n⚠️ Failed profiles saved to {failed_file}")
        
        # Update crawl run
        if not self.dry_run and hasattr(self, 'run_id'):
            await self.db.update_crawl_run(self.run_id, {
                'status': 'completed',
                'finished_at': datetime.utcnow().isoformat(),
                'total_attempted': self.stats['total_attempted'],
                'total_success': self.stats['total_success'],
                'total_errors': self.stats['total_errors']
            })


# ============================================================================
# CLI
# ============================================================================

def main():
    parser = argparse.ArgumentParser(description='OnlyFans V2 Refresh Orchestrator')
    
    # Required
    parser.add_argument('--cookies', required=True, help='Path to cookies.json file')
    
    # Options
    parser.add_argument('--batch-size', type=int, default=100, help='Profiles per batch (default: 100)')
    parser.add_argument('--concurrency', type=int, default=3, help='Concurrent requests (default: 3)')
    parser.add_argument('--rate', type=float, default=1.0, help='Requests per second (default: 1.0)')
    parser.add_argument('--proxies', nargs='+', help='Proxy URLs')
    parser.add_argument('--priority-only', action='store_true', help='Only refresh verified creators')
    parser.add_argument('--dry-run', action='store_true', help='Dry run (no database writes)')
    
    args = parser.parse_args()
    
    # Environment variables
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_KEY')
    
    if not args.dry_run and (not supabase_url or not supabase_key):
        print("❌ Missing SUPABASE_URL or SUPABASE_KEY environment variables")
        sys.exit(1)
    
    # Create orchestrator
    orchestrator = RefreshOrchestrator(
        supabase_url=supabase_url or '',
        supabase_key=supabase_key or '',
        cookies_file=args.cookies,
        batch_size=args.batch_size,
        concurrency=args.concurrency,
        rate=args.rate,
        proxies=args.proxies,
        dry_run=args.dry_run,
        priority_only=args.priority_only
    )
    
    # Run
    asyncio.run(orchestrator.run())


if __name__ == '__main__':
    main()
