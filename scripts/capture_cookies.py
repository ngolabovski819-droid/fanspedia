#!/usr/bin/env python3
"""
Interactive Cookie Capture for OnlyFans
Opens a browser, lets you log in, and automatically saves cookies to cookies.json
"""
import asyncio
import json
import sys
from pathlib import Path
from playwright.async_api import async_playwright

async def capture_cookies(output_file: str = "cookies.json", timeout_seconds: int = 300):
    """
    Open a browser to OnlyFans, wait for user to log in, then save cookies.
    
    Args:
        output_file: Path to save cookies JSON
        timeout_seconds: How long to wait for login (default 5 minutes)
    """
    print("\n" + "="*60)
    print("OnlyFans Cookie Capture")
    print("="*60)
    print(f"\n📋 Instructions:")
    print("1. A browser window will open to OnlyFans")
    print("2. Log in with your credentials")
    print("3. Complete any 2FA/verification steps")
    print("4. Once logged in, this script will auto-detect and save cookies")
    print(f"5. Timeout: {timeout_seconds} seconds\n")
    
    async with async_playwright() as p:
        # Launch visible browser
        browser = await p.chromium.launch(
            headless=False,
            args=[
                "--disable-blink-features=AutomationControlled",
            ]
        )
        
        context = await browser.new_context(
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        )
        
        page = await context.new_page()
        
        try:
            print("🌐 Opening OnlyFans...")
            await page.goto("https://onlyfans.com/", wait_until="domcontentloaded", timeout=30000)
            
            print("⏳ Waiting for you to log in...")
            print("   (Script will auto-detect when you're logged in)\n")
            
            # Poll /api2/v2/users/me until it returns 200 (logged in)
            logged_in = False
            start_time = asyncio.get_event_loop().time()
            
            while not logged_in and (asyncio.get_event_loop().time() - start_time) < timeout_seconds:
                try:
                    # Check if logged in by calling users/me API
                    status = await page.evaluate(
                        """
                        async () => {
                          try {
                            const resp = await fetch('/api2/v2/users/me', { 
                              credentials: 'include' 
                            });
                            return resp.status;
                          } catch (e) {
                            return -1;
                          }
                        }
                        """
                    )
                    
                    if status == 200:
                        logged_in = True
                        print("✅ Login detected!")
                        break
                    elif status in [400, 401, 403]:
                        # Still not logged in, continue waiting
                        pass
                    
                except Exception as e:
                    # Page might be navigating, continue
                    pass
                
                # Wait 2 seconds before checking again
                await asyncio.sleep(2)
            
            if not logged_in:
                print(f"❌ Timeout: No login detected after {timeout_seconds} seconds")
                print("   Please try running again and complete login faster.")
                return False
            
            # Give the page a moment to stabilize
            await asyncio.sleep(1)
            
            # Extract cookies
            print("🍪 Extracting cookies...")
            cookies = await context.cookies()
            
            # Filter to OnlyFans cookies only
            of_cookies = [c for c in cookies if 'onlyfans.com' in c.get('domain', '')]
            
            if not of_cookies:
                print("⚠️  No OnlyFans cookies found!")
                return False
            
            # Format cookies for our scanner (ensure all required fields)
            formatted_cookies = []
            for c in of_cookies:
                formatted_cookies.append({
                    'name': c.get('name'),
                    'value': c.get('value'),
                    'domain': c.get('domain'),
                    'path': c.get('path', '/'),
                    'expires': c.get('expires', -1),
                    'httpOnly': c.get('httpOnly', False),
                    'secure': c.get('secure', True),
                    'sameSite': c.get('sameSite', 'Lax')
                })
            
            # Save to file
            output_path = Path(output_file)
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(formatted_cookies, f, indent=2)
            
            print(f"✅ Saved {len(formatted_cookies)} cookies to: {output_path.absolute()}")
            
            # Show key cookies captured
            cookie_names = {c['name'] for c in formatted_cookies}
            essential = {'sess', 'auth_id', 'csrf', 'auth_hash', 'st'}
            found_essential = essential.intersection(cookie_names)
            
            print(f"\n📋 Cookie Summary:")
            print(f"   Total cookies: {len(formatted_cookies)}")
            print(f"   Essential auth cookies found: {', '.join(sorted(found_essential))}")
            
            if len(found_essential) < 3:
                print("   ⚠️  Warning: Missing some essential auth cookies")
            
            print("\n✅ Success! You can now run the scanner with these cookies.")
            return True
            
        except Exception as e:
            print(f"❌ Error: {e}")
            return False
            
        finally:
            print("\n🔒 Closing browser...")
            await page.close()
            await context.close()
            await browser.close()

def main():
    import argparse
    parser = argparse.ArgumentParser(
        description="Capture OnlyFans cookies interactively",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python capture_cookies.py
  python capture_cookies.py --output my_cookies.json
  python capture_cookies.py --timeout 600
        """
    )
    parser.add_argument(
        '--output', '-o',
        default='cookies.json',
        help='Output file path (default: cookies.json)'
    )
    parser.add_argument(
        '--timeout', '-t',
        type=int,
        default=300,
        help='Login timeout in seconds (default: 300)'
    )
    
    args = parser.parse_args()
    
    try:
        success = asyncio.run(capture_cookies(args.output, args.timeout))
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n⚠️  Interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Fatal error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
