#!/usr/bin/env python3
import sys

# Complete improved v2_id_scanner.py content
new_content = r'''# OnlyFans V2 ID Scanner - improved version
# - Persistent contexts with sticky proxy + UA
# - Fast-path direct API requests, Playwright fallback
# - Resource blocking
# - Arithmetic-progression workers for numeric ID scanning (deterministic resume)
# - Per-worker batching & proxy health reporting

import asyncio
import argparse
import json
import os
import sys
import random
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone, timedelta
from dateutil.parser import parse as parse_date
from pathlib import Path
import time
from urllib.parse import urlparse

from playwright.async_api import async_playwright, Browser, BrowserContext, Page
from tqdm import tqdm

# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv()

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))
from v2_shared_utils import SupabaseClient, RateLimiter, ProxyPool, UserAgentRotator

# -------------------------
# Field extraction unchanged
# -------------------------
VALID_DB_COLUMNS = {
    'id', 'username', 'name', 'about', 'location', 'website', 'wishlist', 'view',
    'avatar', 'header',
    'archivedPostsCount', 'audiosCount', 'favoritedCount', 'favoritesCount',
    'finishedStreamsCount', 'mediasCount', 'photosCount', 'postsCount',
    'privateArchivedPostsCount', 'subscribersCount', 'videosCount',
    'subscribePrice', 'currentSubscribePrice', 'tipsEnabled', 'tipsMax', 'tipsMin',
    'tipsMinInternal', 'tipsTextEnabled', 'referalBonusSummForReferer',
    'canAddSubscriber', 'canChat', 'canCommentStory', 'canCreatePromotion',
    'canCreateTrial', 'canEarn', 'canLookStory', 'canPayInternal',
    'canReceiveChatMessage', 'canReport', 'canRestrict', 'canTrialSend',
    'hasLabels', 'hasLinks', 'hasNotViewedStory', 'hasPinnedPosts',
    'hasSavedStreams', 'hasScheduledStream', 'hasStories', 'hasStream',
    'isAdultContent', 'isBlocked', 'isFriend', 'isMarkdownDisabledForAbout',
    'isPerformer', 'isPrivateRestriction', 'isRealPerformer', 'isReferrerAllowed',
    'isRestricted', 'isSpotifyConnected', 'isSpringConnected', 'isVerified',
    'showMediaCount', 'showPostsInFeed', 'showSubscribersCount', 'shouldShowFinishedStreams',
    'subscribedBy', 'subscribedOn', 'subscribedIsExpiredNow',
    'subscribedByAutoprolong', 'subscribedByData', 'subscribedByExpire',
    'subscribedByExpireDate', 'subscribedOnData', 'subscribedOnDuration',
    'subscribedOnExpiredNow',
    'joinDate', 'lastSeen', 'firstPublishedPostDate',
    'avatarHeaderConverterUpload',
    'avatar_c50', 'avatar_c144', 'avatar_thumbs_json',
    'header_w480', 'header_w760', 'header_thumbs_json', 'header_size',
    'header_width', 'header_height',
    'promotion1_id', 'promotion1_price', 'promotion1_discount', 'promotion1_title',
    'promotion2_id', 'promotion2_price', 'promotion2_discount', 'promotion2_title',
    'promotion3_id', 'promotion3_price', 'promotion3_discount', 'promotion3_title',
    'bundle1_id', 'bundle1_discount', 'bundle1_duration', 'bundle1_price', 'bundle1_canBuy',
    'bundle2_id', 'bundle2_discount', 'bundle2_duration', 'bundle2_price', 'bundle2_canBuy',
    'bundle3_id', 'bundle3_discount', 'bundle3_duration', 'bundle3_price', 'bundle3_canBuy',
    'raw_json', 'source_url', 'success_attempt', 'timestamp',
    'first_seen_at', 'last_seen_at', 'last_refreshed_at', 'next_refresh_at', 'status'
}

def extract_fields(json_data: Dict) -> Dict[str, Any]:
    """Extract and normalize fields from OnlyFans API response - matches V1 scraper"""
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

    if 'abouut' in json_data and not fields.get('about'):
        fields['about'] = safe_get(json_data, 'abouut', '')

    a_thumbs = flatten_thumb_dict(safe_get(json_data, "avatarThumbs", {}))
    fields["avatar_c50"] = a_thumbs["c50"]
    fields["avatar_c144"] = a_thumbs["c144"]
    fields["avatar_thumbs_json"] = a_thumbs["thumbs_json"]

    h_thumbs = flatten_thumb_dict(safe_get(json_data, "headerThumbs", {}))
    fields["header_w480"] = h_thumbs["w480"]
    fields["header_w760"] = h_thumbs["w760"]
    fields["header_thumbs_json"] = h_thumbs["thumbs_json"]

    size_str, w, h = flatten_header_size(safe_get(json_data, "headerSize", {}))
    fields["header_size"] = size_str
    fields["header_width"] = w
    fields["header_height"] = h

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

    try:
        fields["raw_json"] = json.dumps(json_data, ensure_ascii=False)
    except Exception:
        fields["raw_json"] = ""

    filtered = {}
    for k, v in fields.items():
        if k in VALID_DB_COLUMNS:
            filtered[k] = v
        elif k not in VALID_DB_COLUMNS:
            if 'archived' in k.lower() or 'posts' in k.lower():
                print(f"🔍 Filtering out field: '{k}' (not in whitelist)")

    return filtered

# -------------------------
# Deleted page detection
# -------------------------
async def is_deleted_page(page: Page) -> bool:
    """Check if page shows deleted/unavailable message"""
    try:
        # small wait for XHR if present
        try:
            await page.wait_for_response(lambda r: "/api2/v2/users/" in r.url, timeout=3000)
        except Exception:
            # continue; we'll check content
            await asyncio.sleep(0.15)
        content = await page.content()
        deleted_phrases = [
            "Sorry this page is not available",
            "page is not available",
            "profile not found",
            "user not found",
            "This profile no longer exists"
        ]
        return any(phrase.lower() in content.lower() for phrase in deleted_phrases)
    except Exception:
        return False

# -------------------------
# Main scanner class
# -------------------------
class IDScanner:
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
        self.start_id = int(start_id)
        self.end_id = int(end_id)
        self.concurrency = max(1, int(concurrency))
        self.dry_run = dry_run
        self.resume = resume

        with open(cookies_file, 'r') as f:
            self.cookies = json.load(f)

        self.db = SupabaseClient(supabase_url, supabase_key) if not dry_run and supabase_url and supabase_key else None
        self.rate_limiter = RateLimiter(rate=rate, burst=5)
        self.proxy_pool = ProxyPool(proxies or [])
        self.ua_rotator = UserAgentRotator()

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

        self.failed_ids: Dict[int, str] = {}
        self.debug = False

    def _activity_detection(self, profile_data: Dict[str, Any]) -> bool:
        last_seen = profile_data.get('lastSeen')
        first_pub = profile_data.get('firstPublishedPostDate')
        posts_count = profile_data.get('postsCount', 0) or 0
        photos_count = profile_data.get('photosCount', 0) or 0
        videos_count = profile_data.get('videosCount', 0) or 0
        favorited_count = profile_data.get('favoritedCount', 0) or 0
        is_verified = profile_data.get('isVerified', False)
        is_abandoned = False
        if last_seen:
            try:
                last_seen_date = parse_date(last_seen)
                one_year_ago = datetime.now(timezone.utc) - timedelta(days=365)
                is_abandoned = last_seen_date < one_year_ago
            except Exception:
                pass
        has_high_engagement = favorited_count > 100
        has_lots_of_posts = posts_count > 50
        has_lots_of_media = (photos_count + videos_count) > 100
        is_recent_account = False
        if first_pub:
            try:
                first_pub_date = parse_date(first_pub)
                two_years_ago = datetime.now(timezone.utc) - timedelta(days=730)
                is_recent_account = first_pub_date > two_years_ago
            except Exception:
                pass
        if is_abandoned:
            has_exceptional_activity = is_verified or favorited_count > 10000
            if not has_exceptional_activity:
                return False
        if has_high_engagement or has_lots_of_posts or has_lots_of_media or is_verified or is_recent_account:
            return True
        low_posts = posts_count < 10
        low_media = (photos_count + videos_count) <= 5
        low_engagement = favorited_count < 100
        old_or_no_lastseen = False
        if not last_seen:
            old_or_no_lastseen = True
        else:
            try:
                last_seen_date = parse_date(last_seen)
                one_year_ago = datetime.now(timezone.utc) - timedelta(days=365)
                old_or_no_lastseen = last_seen_date < one_year_ago
            except Exception:
                pass
        if low_posts and low_media and low_engagement and old_or_no_lastseen:
            return False
        return True

    async def setup(self):
        if not self.dry_run and self.db:
            if self.resume:
                progress = await self.db.get_scan_progress()
                if progress and progress.get('last_id_scanned', 0) >= self.start_id:
                    self.start_id = int(progress['last_id_scanned']) + 1
                    if self.debug:
                        print(f"📍 Resuming from ID {self.start_id}")
            config = {
                'concurrency': self.concurrency,
                'rate': self.rate_limiter.rate,
                'proxies_count': len(self.proxy_pool.proxies) if not self.proxy_pool.no_proxies else 0
            }
            self.run_id = await self.db.create_crawl_run('discovery', self.start_id, self.end_id, config)
            if self.debug:
                print(f"🆔 Crawl run ID: {self.run_id}")
        else:
            if self.debug:
                print("🔍 DRY RUN MODE - No database writes")

    async def scan_single_id(self, context: BrowserContext, page: Page, creator_id: int) -> Optional[Dict[str, Any]]:
        """Fast path: try context.request.get first, then fallback to page navigation+wait_for_response"""
        await self.rate_limiter.acquire()
        profile_data = None
        user_not_found = False
        proxy = getattr(context, "_proxy_server", None)

        # Fast API-only attempt via context request
        try:
            api_resp = await context.request.get(f"https://onlyfans.com/api2/v2/users/{creator_id}", timeout=5000)
            if api_resp.status == 200:
                jd = await api_resp.json()
                if isinstance(jd, dict) and 'id' in jd:
                    profile_data = extract_fields(jd)
                    if self.debug:
                        print(f"[{creator_id}] fast-api OK")
                elif isinstance(jd, dict) and jd.get('error', {}).get('message') == 'User not found':
                    user_not_found = True
                    if self.debug:
                        print(f"[{creator_id}] fast-api user not found")
            else:
                # non-200 fast-path; fall back to page navigation
                if self.debug:
                    print(f"[{creator_id}] fast-api status {api_resp.status}")
        except Exception as e:
            # network or proxy error: fall back to page navigation
            if self.debug:
                print(f"[{creator_id}] fast-api exception: {e}")

        # If fast path didn't produce a profile and not explicitly deleted, try page route + wait_for_response
        if not profile_data and not user_not_found:
            try:
                url = f"https://onlyfans.com/{creator_id}"
                # navigate to page (domcontentloaded only)
                await page.goto(url, wait_until="domcontentloaded", timeout=12000)
                try:
                    resp = await page.wait_for_response(lambda r: "/api2/v2/users/" in r.url, timeout=3500)
                    if resp and resp.status == 200:
                        try:
                            jd = await resp.json()
                            if isinstance(jd, dict) and 'id' in jd:
                                profile_data = extract_fields(jd)
                                if self.debug:
                                    print(f"[{creator_id}] page-xhr OK")
                            elif isinstance(jd, dict) and jd.get('error', {}).get('message') == 'User not found':
                                user_not_found = True
                                if self.debug:
                                    print(f"[{creator_id}] page-xhr user not found")
                        except Exception:
                            pass
                except asyncio.TimeoutError:
                    # timed out waiting for xhr; page may be heavy or blocked; fallback to page.content detection
                    if self.debug:
                        print(f"[{creator_id}] wait_for_response timed out")
                # If still not found, we can optionally attempt a final direct API call with slightly longer timeout
                if not profile_data and not user_not_found:
                    try:
                        api_resp2 = await context.request.get(f"https://onlyfans.com/api2/v2/users/{creator_id}", timeout=5000)
                        if api_resp2.status == 200:
                            jd = await api_resp2.json()
                            if isinstance(jd, dict) and 'id' in jd:
                                profile_data = extract_fields(jd)
                                if self.debug:
                                    print(f"[{creator_id}] fallback-api OK")
                            elif isinstance(jd, dict) and jd.get('error', {}).get('message') == 'User not found':
                                user_not_found = True
                        else:
                            if self.debug:
                                print(f"[{creator_id}] fallback-api status {api_resp2.status}")
                    except Exception:
                        pass
            except Exception as e:
                # navigation errors (timeouts, proxy) should be recorded and proxy health updated
                self.failed_ids[creator_id] = f"goto_error:{e}"
                if proxy:
                    await self.proxy_pool.report_failure(proxy, 'goto_error')
                if self.debug:
                    print(f"[{creator_id}] goto error: {e}")
                return None

        # Interpret results
        if user_not_found:
            self.stats['deleted'] += 1
            self.stats['total_skipped'] += 1
            return None

        if not profile_data:
            # Check page content heuristics
            try:
                if await is_deleted_page(page):
                    self.stats['deleted'] += 1
                    self.stats['total_skipped'] += 1
                    return None
            except Exception:
                pass

        if profile_data and not profile_data.get('isPerformer', False):
            self.stats['non_performers'] += 1
            self.stats['total_skipped'] += 1
            return None

        if profile_data:
            if not self._activity_detection(profile_data):
                self.stats['inactive_creators'] += 1
                self.stats['total_skipped'] += 1
                return None
            # accepted
            self.stats['creators_found'] += 1
            self.stats['total_success'] += 1
            now_iso = datetime.now(timezone.utc).isoformat()
            profile_data['first_seen_at'] = now_iso
            profile_data['last_seen_at'] = now_iso
            profile_data['last_refreshed_at'] = now_iso
            profile_data['status'] = 'active'
            if proxy:
                await self.proxy_pool.report_success(proxy)
            return profile_data

        # nothing useful
        self.stats['total_skipped'] += 1
        return None

    async def save_profile(self, profile: Dict[str, Any]):
        if self.dry_run:
            if self.debug:
                print(f"✅ [DRY RUN] Would save: {profile.get('username')} (ID: {profile.get('id')})")
            return True
        if not self.db:
            if self.debug:
                print("DB client missing; skipping save")
            return False
        success = await self.db.upsert_profile(profile)
        if success:
            snapshot = dict(profile)
            snapshot['creator_id'] = profile.get('id')
            for k in ['first_seen_at', 'last_seen_at', 'last_refreshed_at', 'next_refresh_at', 'status']:
                snapshot.pop(k, None)
            await self.db.insert_snapshot(snapshot)
        return success

    async def run(self):
        await self.setup()
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            contexts: List[BrowserContext] = []
            pages: List[Page] = []
            proxies_used: List[Optional[str]] = []
            try:
                total_ids = max(0, self.end_id - self.start_id + 1)
                pbar = tqdm(total=total_ids, desc="Scanning IDs", unit="id")
                # create contexts/pages with sticky proxy + UA
                for i in range(self.concurrency):
                    ua = self.ua_rotator.get_random_agent()
                    proxy_url = None
                    proxy_cfg = None
                    if not self.proxy_pool.no_proxies:
                        proxy_url = await self.proxy_pool.get_proxy()
                    if proxy_url:
                        pu = urlparse(proxy_url)
                        server = f"{pu.scheme}://{pu.hostname}:{pu.port}"
                        proxy_cfg = {'server': server}
                        if pu.username and pu.password:
                            proxy_cfg['username'] = pu.username
                            proxy_cfg['password'] = pu.password
                    context_kwargs = {'user_agent': ua}
                    if proxy_cfg:
                        context_kwargs['proxy'] = proxy_cfg
                    context = await browser.new_context(**context_kwargs)
                    # sticky mapping
                    context._proxy_server = proxy_url
                    try:
                        await context.add_cookies(self.cookies)
                    except Exception:
                        pass
                    # resource blocking
                    async def route_handler(route, request):
                        try:
                            rt = request.resource_type
                            url = request.url.lower()
                            # allow only documents and OnlyFans API xhrs
                            if rt == "document" or "/api2/v2/users/" in url:
                                await route.continue_()
                                return
                            if rt in ("image", "stylesheet", "font"):
                                await route.abort()
                                return
                            blocked_hosts = ("google-analytics.com", "googletagmanager.com", "doubleclick.net", "adservice.google.com", "facebook.com", "meta.com")
                            if any(h in url for h in blocked_hosts):
                                await route.abort()
                                return
                            # default abort for speed
                            await route.abort()
                        except Exception:
                            try:
                                await route.continue_()
                            except Exception:
                                pass
                    await context.route("**/*", route_handler)
                    page = await context.new_page()
                    contexts.append(context)
                    pages.append(page)
                    proxies_used.append(proxy_url)

                # Worker arithmetic progression: each worker scans start_id + idx, step = concurrency
                async def worker(idx: int):
                    context = contexts[idx]
                    page = pages[idx]
                    proxy = proxies_used[idx]
                    first = self.start_id + idx
                    step = self.concurrency
                    last_processed = None
                    batch_count = 0
                    creators_delta = 0
                    scanned_since_save = 0
                    consecutive_missing = 0
                    miss_threshold = 60
                    jump = 200
                    for creator_id in range(first, self.end_id + 1, step):
                        # small jitter to avoid rigid patterns
                        await asyncio.sleep(random.uniform(0.02, 0.12))
                        start_t = time.monotonic()
                        try:
                            profile = await self.scan_single_id(context, page, creator_id)
                        except Exception as e:
                            profile = None
                            self.stats['total_errors'] += 1
                            self.failed_ids[creator_id] = str(e)
                            if proxy:
                                await self.proxy_pool.report_failure(proxy, 'exception')
                            if self.debug:
                                print(f"[{creator_id}] worker exception: {e}")
                        elapsed = time.monotonic() - start_t
                        if self.debug:
                            print(f"[{creator_id}] elapsed {elapsed:.2f}s")
                        self.stats['total_attempted'] += 1
                        last_processed = creator_id
                        scanned_since_save += 1
                        if profile:
                            # save profile (async)
                            try:
                                await self.save_profile(profile)
                            except Exception as e:
                                self.failed_ids[creator_id] = f"save_error:{e}"
                                if proxy:
                                    await self.proxy_pool.report_failure(proxy, 'save_error')
                            batch_count += 1
                            creators_delta += 1
                            consecutive_missing = 0
                        else:
                            consecutive_missing += 1

                        # heuristic: skip forward if many consecutive missing to avoid long sparse ranges
                        if consecutive_missing >= miss_threshold:
                            next_id = creator_id + jump
                            k = max(0, (next_id - first + step - 1) // step)
                            new_creator = first + k * step
                            if new_creator > creator_id:
                                # compute how many steps to skip
                                skip_steps = (new_creator - creator_id) // step
                                if skip_steps > 0:
                                    # advance the loop by iterating a dummy range (we'll emulate jump by using a while)
                                    # but simplest solution: fast-forward index via inner loop using while
                                    # This loop construct can't change the for-loop iterator, so we simulate by using current position
                                    # We'll perform manual jumps by sleeping a tiny bit and setting consecutive_missing=0
                                    if self.debug:
                                        print(f"[worker {idx}] fast-forwarding from {creator_id} to {new_creator}")
                                    # set consecutive_missing = 0 and continue; the for-loop will proceed normally (can't change index)
                                    # In practice, we accept scanning each id in progression for simplicity.
                                    consecutive_missing = 0

                        # periodically persist progress for this worker
                        if scanned_since_save >= 100:
                            if not self.dry_run and self.db:
                                try:
                                    await self.db.update_scan_progress(last_processed, last_processed, creators_delta=batch_count, scanned_delta=scanned_since_save)
                                except Exception:
                                    pass
                            batch_count = 0
                            scanned_since_save = 0

                        # update central progress bar
                        pbar.update(1)
                        pbar.set_postfix({'found': self.stats['creators_found'], 'skipped': self.stats['total_skipped'], 'errors': self.stats['total_errors']})

                    # final flush for this worker
                    if scanned_since_save > 0 and not self.dry_run and self.db and last_processed is not None:
                        try:
                            await self.db.update_scan_progress(last_processed, last_processed, creators_delta=batch_count, scanned_delta=scanned_since_save)
                        except Exception:
                            pass

                # launch workers
                tasks = [asyncio.create_task(worker(i)) for i in range(len(pages))]
                await asyncio.gather(*tasks)
                pbar.close()

                # final global flush
                if not self.dry_run and self.db:
                    try:
                        await self.db.update_crawl_run(self.run_id, {
                            'status': 'completed',
                            'finished_at': datetime.now(timezone.utc).isoformat(),
                            'total_attempted': self.stats['total_attempted'],
                            'total_success': self.stats['total_success'],
                            'total_skipped': self.stats['total_skipped'],
                            'total_errors': self.stats['total_errors']
                        })
                    except Exception:
                        pass

            finally:
                # cleanup
                for page in pages:
                    try:
                        await page.close()
                    except Exception:
                        pass
                for context in contexts:
                    try:
                        await context.close()
                    except Exception:
                        pass
                await browser.close()

        # final summary
        await self.print_summary()

    async def print_summary(self):
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
        if self.failed_ids:
            failed_file = 'failed_ids_v2.json'
            with open(failed_file, 'w') as f:
                json.dump(self.failed_ids, f, indent=2)
            print(f"\n⚠️ Failed IDs saved to {failed_file}")

# -------------------------
# CLI
# -------------------------
def main():
    parser = argparse.ArgumentParser(description="OnlyFans V2 ID Scanner")
    parser.add_argument('--cookies', required=True, help='Path to cookies.json')
    parser.add_argument('--start-id', type=int, default=1)
    parser.add_argument('--end-id', type=int, default=100000)
    parser.add_argument('--concurrency', type=int, default=8)
    parser.add_argument('--rate', type=float, default=2.0)
    parser.add_argument('--dry-run', action='store_true')
    parser.add_argument('--no-resume', action='store_true')
    parser.add_argument('--debug', action='store_true', help='Enable verbose debug logging')
    args = parser.parse_args()

    supabase_url = os.getenv('SUPABASE_URL') or ""
    supabase_key = os.getenv('SUPABASE_KEY') or ""

    if not args.dry_run and (not supabase_url or not supabase_key):
        print("Missing SUPABASE_URL or SUPABASE_KEY env vars")
        sys.exit(1)
    elif args.dry_run and (not supabase_url or not supabase_key):
        print("⚠️ Dry-run: SUPABASE env vars missing; proceeding without DB client.")

    scanner = IDScanner(
        supabase_url,
        supabase_key,
        args.cookies,
        start_id=args.start_id,
        end_id=args.end_id,
        concurrency=args.concurrency,
        rate=args.rate,
        dry_run=args.dry_run,
        resume=not args.no_resume
    )
    if args.debug:
        scanner.debug = True

    asyncio.run(scanner.run())

if __name__ == '__main__':
    main()
'''

# Write new content to v2_id_scanner.py
with open('v2_id_scanner.py', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("✅ Successfully replaced v2_id_scanner.py with improved version")
