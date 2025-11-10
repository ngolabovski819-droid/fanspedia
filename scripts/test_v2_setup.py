"""
Quick validation test for V2 scraper setup
Tests:
1. Database migration applied correctly
2. Supabase connection works
3. Cookies file is valid
4. Import dependencies work
"""

import sys
import os
from pathlib import Path

# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv()

# Colors for output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
RESET = '\033[0m'

def print_test(name, passed, message=""):
    status = f"{GREEN}✓{RESET}" if passed else f"{RED}✗{RESET}"
    print(f"{status} {name}")
    if message:
        print(f"  → {message}")

def main():
    print("="*60)
    print("OnlyFans V2 Scraper - Setup Validation")
    print("="*60)
    print()
    
    all_passed = True
    
    # Test 1: Check Python version
    print("1. Checking Python version...")
    py_version = sys.version_info
    passed = py_version >= (3, 7)
    print_test(
        "Python 3.7+",
        passed,
        f"Current: {py_version.major}.{py_version.minor}.{py_version.micro}"
    )
    all_passed &= passed
    print()
    
    # Test 2: Check dependencies
    print("2. Checking Python dependencies...")
    
    deps = {
        'playwright': 'Playwright',
        'aiohttp': 'Aiohttp',
        'tqdm': 'TQDM',
        'pandas': 'Pandas'
    }
    
    for module, name in deps.items():
        try:
            __import__(module)
            print_test(name, True, "installed")
        except ImportError:
            print_test(name, False, f"missing (install: pip install {module})")
            all_passed = False
    print()
    
    # Test 3: Check environment variables
    print("3. Checking environment variables...")
    
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_KEY')
    
    print_test(
        "SUPABASE_URL",
        bool(supabase_url),
        supabase_url[:50] + "..." if supabase_url else "not set"
    )
    print_test(
        "SUPABASE_KEY",
        bool(supabase_key),
        "***" + supabase_key[-10:] if supabase_key else "not set"
    )
    all_passed &= bool(supabase_url and supabase_key)
    print()
    
    # Test 4: Check cookies.json exists
    print("4. Checking cookies.json...")
    cookies_path = Path(__file__).parent.parent / 'cookies.json'
    exists = cookies_path.exists()
    print_test(
        "cookies.json exists",
        exists,
        str(cookies_path) if exists else "not found"
    )
    
    if exists:
        try:
            import json
            with open(cookies_path, 'r') as f:
                cookies = json.load(f)
            valid = isinstance(cookies, list) and len(cookies) > 0
            print_test(
                "cookies.json valid format",
                valid,
                f"{len(cookies)} cookies found" if valid else "invalid format (should be array)"
            )
            all_passed &= valid
        except Exception as e:
            print_test("cookies.json valid format", False, str(e))
            all_passed = False
    else:
        all_passed = False
    print()
    
    # Test 5: Check migration file exists
    print("5. Checking migration files...")
    migration_path = Path(__file__).parent / 'migrations' / '001_v2_snapshots_and_tracking.sql'
    exists = migration_path.exists()
    print_test(
        "Migration SQL exists",
        exists,
        str(migration_path) if exists else "not found"
    )
    all_passed &= exists
    print()
    
    # Test 6: Test Supabase connection (if env vars set)
    if supabase_url and supabase_key:
        print("6. Testing Supabase connection...")
        try:
            import asyncio
            sys.path.insert(0, str(Path(__file__).parent))
            from v2_shared_utils import SupabaseClient
            
            async def test_connection():
                client = SupabaseClient(supabase_url, supabase_key)
                progress = await client.get_scan_progress()
                return progress is not None
            
            connected = asyncio.run(test_connection())
            print_test(
                "Supabase REST API",
                connected,
                "connected" if connected else "connection failed"
            )
            all_passed &= connected
        except Exception as e:
            print_test("Supabase REST API", False, str(e))
            all_passed = False
    else:
        print("6. Skipping Supabase connection test (env vars not set)")
    print()
    
    # Test 7: Check V2 scripts exist
    print("7. Checking V2 script files...")
    scripts = {
        'v2_shared_utils.py': 'Shared utilities',
        'v2_id_scanner.py': 'ID scanner'
    }
    
    for script, desc in scripts.items():
        path = Path(__file__).parent / script
        exists = path.exists()
        print_test(desc, exists, str(path) if exists else "not found")
        all_passed &= exists
    print()
    
    # Final summary
    print("="*60)
    if all_passed:
        print(f"{GREEN}✓ All checks passed! Ready to run V2 scanner.{RESET}")
        print()
        print("Next steps:")
        print("1. Apply migration: scripts/migrations/001_v2_snapshots_and_tracking.sql")
        print("2. Test run: python scripts/v2_id_scanner.py --cookies cookies.json --start-id 1 --end-id 10 --dry-run")
    else:
        print(f"{RED}✗ Some checks failed. Fix issues above before running.{RESET}")
        print()
        print("Common fixes:")
        print("- Install missing deps: pip install -r requirements.txt")
        print("- Set env vars in .env file or PowerShell")
        print("- Export cookies from browser to cookies.json")
    print("="*60)

if __name__ == '__main__':
    main()
