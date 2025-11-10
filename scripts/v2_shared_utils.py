"""
Shared utilities for OnlyFans V2 scraper
- Supabase client for direct REST API upserts
- Rate limiter with token bucket algorithm
- Proxy pool with health scoring
- User-agent rotation
"""

import asyncio
import json
import time
import random
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta, timezone
import aiohttp

# ============================================================================
# Supabase Client
# ============================================================================

class SupabaseClient:
    """Direct Supabase REST API client for upserts and snapshots"""
    
    def __init__(self, url: str, key: str):
        self.url = url.rstrip('/')
        self.key = key
        self.headers = {
            'apikey': key,
            'Authorization': f'Bearer {key}',
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates'
        }
    
    async def upsert_profile(self, profile: Dict[str, Any]) -> bool:
        """
        Upsert profile to onlyfans_profiles table
        Returns True on success, False on failure
        """
        endpoint = f"{self.url}/rest/v1/onlyfans_profiles"
        
        # Clean data: convert NaN/inf to None
        cleaned = self._clean_data(profile)
        
        # Convert all keys to lowercase (PostgreSQL stores columns as lowercase)
        cleaned = {k.lower(): v for k, v in cleaned.items()}
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(endpoint, json=cleaned, headers=self.headers) as resp:
                    if resp.status in (200, 201, 204):
                        return True
                    else:
                        error_text = await resp.text()
                        print(f"⚠️ Upsert failed ({resp.status}): {error_text[:200]}")
                        return False
        except Exception as e:
            print(f"⚠️ Upsert exception: {e}")
            return False
    
    async def insert_snapshot(self, snapshot: Dict[str, Any]) -> bool:
        """Insert snapshot to onlyfans_profile_snapshots table"""
        endpoint = f"{self.url}/rest/v1/onlyfans_profile_snapshots"
        
        cleaned = self._clean_data(snapshot)
        
        # Convert all keys to lowercase (PostgreSQL stores columns as lowercase)
        cleaned = {k.lower(): v for k, v in cleaned.items()}
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(endpoint, json=cleaned, headers=self.headers) as resp:
                    if resp.status in (200, 201, 204):
                        return True
                    else:
                        error_text = await resp.text()
                        print(f"⚠️ Snapshot insert failed ({resp.status}): {error_text[:200]}")
                        return False
        except Exception as e:
            print(f"⚠️ Snapshot exception: {e}")
            return False
    
    async def update_scan_progress(self, last_id: int, max_id: int, 
                                   creators_delta: int = 0, scanned_delta: int = 1) -> bool:
        """Update scan_progress table via RPC function"""
        endpoint = f"{self.url}/rest/v1/rpc/update_scan_progress"
        
        payload = {
            'p_last_id': last_id,
            'p_max_id': max_id,
            'p_creators_delta': creators_delta,
            'p_scanned_delta': scanned_delta
        }
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(endpoint, json=payload, headers=self.headers) as resp:
                    return resp.status in (200, 201, 204)
        except Exception as e:
            print(f"⚠️ Progress update exception: {e}")
            return False
    
    async def get_scan_progress(self) -> Dict[str, Any]:
        """Get current scan progress"""
        endpoint = f"{self.url}/rest/v1/scan_progress?id=eq.1&select=*"
        
        try:
            async with aiohttp.ClientSession() as session:
                headers = {**self.headers, 'Prefer': 'return=representation'}
                async with session.get(endpoint, headers=headers) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        return data[0] if data else {}
                    return {}
        except Exception as e:
            print(f"⚠️ Get progress exception: {e}")
            return {}
    
    async def create_crawl_run(self, run_type: str = 'discovery', 
                              start_id: Optional[int] = None,
                              end_id: Optional[int] = None,
                              config: Optional[Dict] = None) -> Optional[str]:
        """Create new crawl run and return run_id"""
        endpoint = f"{self.url}/rest/v1/crawl_runs"
        
        payload = {
            'run_type': run_type,
            'status': 'running',
            'start_id': start_id,
            'end_id': end_id,
            'config_json': config or {}
        }
        
        try:
            async with aiohttp.ClientSession() as session:
                headers = {**self.headers, 'Prefer': 'return=representation'}
                async with session.post(endpoint, json=payload, headers=headers) as resp:
                    if resp.status in (200, 201):
                        data = await resp.json()
                        return data[0].get('run_id') if data else None
                    return None
        except Exception as e:
            print(f"⚠️ Create crawl run exception: {e}")
            return None
    
    async def update_crawl_run(self, run_id: str, stats: Dict[str, Any]) -> bool:
        """Update crawl run statistics"""
        endpoint = f"{self.url}/rest/v1/crawl_runs?run_id=eq.{run_id}"
        
        payload = {
            'updated_at': datetime.now(timezone.utc).isoformat(),
            **stats
        }
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.patch(endpoint, json=payload, headers=self.headers) as resp:
                    return resp.status in (200, 204)
        except Exception as e:
            print(f"⚠️ Update crawl run exception: {e}")
            return False
    
    def _clean_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Clean data for JSON serialization"""
        cleaned = {}
        for key, value in data.items():
            if value is None:
                cleaned[key] = None
            elif value == "":
                # Convert empty strings to None (prevents "invalid input syntax for type boolean")
                cleaned[key] = None
            elif isinstance(value, float):
                # Handle NaN and infinity
                if value != value:  # NaN check
                    cleaned[key] = None
                elif value == float('inf') or value == float('-inf'):
                    cleaned[key] = None
                else:
                    # Convert floats that are actually ints
                    if value.is_integer():
                        cleaned[key] = int(value)
                    else:
                        cleaned[key] = value
            else:
                cleaned[key] = value
        return cleaned


# ============================================================================
# Rate Limiter (Token Bucket Algorithm)
# ============================================================================

class RateLimiter:
    """Token bucket rate limiter with configurable rate and burst"""
    
    def __init__(self, rate: float = 1.0, burst: int = 5):
        """
        Args:
            rate: Requests per second (e.g., 1.0 = 1 req/sec)
            burst: Maximum burst size (tokens available immediately)
        """
        self.rate = rate
        self.burst = burst
        self.tokens = burst
        self.last_update = time.time()
        self.lock = asyncio.Lock()
    
    async def acquire(self):
        """Wait until a token is available"""
        async with self.lock:
            now = time.time()
            elapsed = now - self.last_update
            
            # Add tokens based on elapsed time
            self.tokens = min(self.burst, self.tokens + elapsed * self.rate)
            self.last_update = now
            
            # If no tokens available, wait
            if self.tokens < 1.0:
                wait_time = (1.0 - self.tokens) / self.rate
                await asyncio.sleep(wait_time)
                self.tokens = 0.0
            else:
                self.tokens -= 1.0


# ============================================================================
# Proxy Pool
# ============================================================================

class ProxyPool:
    """Manage proxy rotation with health scoring"""
    
    def __init__(self, proxies: List[str]):
        """
        Args:
            proxies: List of proxy URLs (e.g., ['http://user:pass@host:port'])
        """
        self.proxies = {proxy: {'score': 100, 'failures': 0, 'successes': 0, 'quarantine_until': None} 
                       for proxy in proxies}
        self.lock = asyncio.Lock()
        self.no_proxies = len(proxies) == 0
    
    async def get_proxy(self) -> Optional[str]:
        """Get next available proxy based on health score"""
        if self.no_proxies:
            return None
        
        async with self.lock:
            now = time.time()
            
            # Filter available proxies (not quarantined)
            available = {p: info for p, info in self.proxies.items()
                        if info['quarantine_until'] is None or info['quarantine_until'] < now}
            
            if not available:
                # All proxies quarantined, wait for first to recover
                min_quarantine = min(info['quarantine_until'] for info in self.proxies.values())
                wait_time = max(0, min_quarantine - now)
                print(f"⚠️ All proxies quarantined, waiting {wait_time:.1f}s")
                await asyncio.sleep(wait_time)
                return await self.get_proxy()
            
            # Select proxy with highest score
            best_proxy = max(available.items(), key=lambda x: x[1]['score'])[0]
            return best_proxy
    
    async def report_success(self, proxy: str):
        """Report successful use of proxy"""
        if proxy is None or self.no_proxies:
            return
        
        async with self.lock:
            if proxy in self.proxies:
                info = self.proxies[proxy]
                info['successes'] += 1
                info['score'] = min(100, info['score'] + 2)
                info['failures'] = max(0, info['failures'] - 1)
    
    async def report_failure(self, proxy: str, error_type: str = 'generic'):
        """Report failed use of proxy"""
        if proxy is None or self.no_proxies:
            return
        
        async with self.lock:
            if proxy in self.proxies:
                info = self.proxies[proxy]
                info['failures'] += 1
                info['score'] = max(0, info['score'] - 10)
                
                # Quarantine if too many failures
                if info['failures'] >= 3:
                    quarantine_duration = min(300, 30 * (2 ** (info['failures'] - 3)))
                    info['quarantine_until'] = time.time() + quarantine_duration
                    print(f"⚠️ Proxy {proxy} quarantined for {quarantine_duration}s")


# ============================================================================
# User-Agent Rotation
# ============================================================================

class UserAgentRotator:
    """Rotate user agents to avoid detection"""
    
    DESKTOP_AGENTS = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    ]
    
    MOBILE_AGENTS = [
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1',
        'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
        'Mozilla/5.0 (iPad; CPU OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1',
    ]
    
    def __init__(self, mobile_ratio: float = 0.3):
        """
        Args:
            mobile_ratio: Fraction of mobile vs desktop agents (0.0 to 1.0)
        """
        self.mobile_ratio = mobile_ratio
    
    def get_random_agent(self) -> str:
        """Get random user agent (weighted by mobile_ratio)"""
        if random.random() < self.mobile_ratio:
            return random.choice(self.MOBILE_AGENTS)
        else:
            return random.choice(self.DESKTOP_AGENTS)
