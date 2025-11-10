"""
OnlyFans V2 Incremental Discovery - Find new creator registrations
Scans from highest known ID forward to discover new creators

Features:
- Query max(id) from existing profiles
- Scan forward from max_id to max_id + buffer
- Find new registrations
- Update next_refresh_at for discovered creators
- Can run daily to catch new sign-ups
"""

import asyncio
import argparse
import os
import sys
from datetime import datetime
from pathlib import Path

# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv()

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))
from v2_shared_utils import SupabaseClient
from v2_id_scanner import IDScanner


# ============================================================================
# Incremental Discovery
# ============================================================================

class IncrementalDiscovery:
    """Find new creator registrations by scanning forward from max ID"""
    
    def __init__(self,
                 supabase_url: str,
                 supabase_key: str,
                 buffer_size: int = 10000):
        
        self.db = SupabaseClient(supabase_url, supabase_key)
        self.buffer_size = buffer_size
    
    async def get_max_known_id(self) -> int:
        """Get highest creator ID currently in database"""
        endpoint = f"{self.db.url}/rest/v1/onlyfans_profiles"
        
        params = {
            'select': 'id',
            'order': 'id.desc',
            'limit': '1'
        }
        
        try:
            import aiohttp
            async with aiohttp.ClientSession() as session:
                headers = {**self.db.headers}
                async with session.get(endpoint, params=params, headers=headers) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        if data:
                            return data[0]['id']
                    return 0
        except Exception as e:
            print(f"⚠️ Error fetching max ID: {e}")
            return 0
    
    async def get_scan_progress_max_id(self) -> int:
        """Get max_id_seen from scan_progress table"""
        progress = await self.db.get_scan_progress()
        return progress.get('max_id_seen', 0) if progress else 0
    
    async def run(self, cookies_file: str, concurrency: int = 3, 
                  rate: float = 1.0, proxies=None, dry_run: bool = False):
        """Main discovery loop"""
        
        print("="*60)
        print("INCREMENTAL DISCOVERY - Finding New Creators")
        print("="*60)
        print()
        
        # Get current max ID
        print("📊 Checking database for highest known creator ID...")
        max_profile_id = await self.get_max_known_id()
        max_scan_id = await self.get_scan_progress_max_id()
        
        # Use the higher of the two
        max_id = max(max_profile_id, max_scan_id)
        
        print(f"📈 Highest creator ID in database: {max_profile_id}")
        print(f"📈 Highest scanned ID: {max_scan_id}")
        print(f"🎯 Starting discovery from ID: {max_id + 1}")
        print(f"🔍 Scan range: {max_id + 1} to {max_id + self.buffer_size}")
        print()
        
        if max_id == 0:
            print("⚠️ No existing profiles found. Run full ID scanner first!")
            return
        
        # Calculate scan range
        start_id = max_id + 1
        end_id = max_id + self.buffer_size
        
        # Create scanner for this range
        scanner = IDScanner(
            supabase_url=self.db.url,
            supabase_key=self.db.key,
            cookies_file=cookies_file,
            start_id=start_id,
            end_id=end_id,
            concurrency=concurrency,
            rate=rate,
            proxies=proxies,
            dry_run=dry_run,
            resume=False  # Don't resume for discovery
        )
        
        # Run scanner
        print("🚀 Starting incremental scan...\n")
        await scanner.run()
        
        # Summary
        print("\n" + "="*60)
        print("INCREMENTAL DISCOVERY COMPLETE")
        print("="*60)
        print(f"New creators discovered: {scanner.stats['creators_found']}")
        print(f"IDs scanned: {scanner.stats['total_attempted']}")
        print(f"Discovery rate: {scanner.stats['creators_found'] / max(scanner.stats['total_attempted'], 1) * 100:.1f}%")
        print("="*60)


# ============================================================================
# CLI
# ============================================================================

def main():
    parser = argparse.ArgumentParser(description='OnlyFans V2 Incremental Discovery')
    
    # Required
    parser.add_argument('--cookies', required=True, help='Path to cookies.json file')
    
    # Options
    parser.add_argument('--buffer-size', type=int, default=10000, 
                       help='Number of IDs to scan forward (default: 10000)')
    parser.add_argument('--concurrency', type=int, default=3, 
                       help='Concurrent requests (default: 3)')
    parser.add_argument('--rate', type=float, default=1.0, 
                       help='Requests per second (default: 1.0)')
    parser.add_argument('--proxies', nargs='+', help='Proxy URLs')
    parser.add_argument('--dry-run', action='store_true', 
                       help='Dry run (no database writes)')
    
    args = parser.parse_args()
    
    # Environment variables
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_KEY')
    
    if not args.dry_run and (not supabase_url or not supabase_key):
        print("❌ Missing SUPABASE_URL or SUPABASE_KEY environment variables")
        sys.exit(1)
    
    # Create discovery
    discovery = IncrementalDiscovery(
        supabase_url=supabase_url or '',
        supabase_key=supabase_key or '',
        buffer_size=args.buffer_size
    )
    
    # Run
    asyncio.run(discovery.run(
        cookies_file=args.cookies,
        concurrency=args.concurrency,
        rate=args.rate,
        proxies=args.proxies,
        dry_run=args.dry_run
    ))


if __name__ == '__main__':
    main()
