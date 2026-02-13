import asyncio
import json
import sys
from pathlib import Path

from playwright.async_api import async_playwright


async def main():
    import argparse
    p = argparse.ArgumentParser(description="Import cookies into a persistent profile and verify OnlyFans login via /users/me")
    p.add_argument("--cookies", required=True, help="Path to cookies.json export")
    p.add_argument("--persistent-dir", required=True, help="Path to Playwright persistent profile directory")
    p.add_argument("--user-agent", default=None, help="Optional custom User-Agent string")
    p.add_argument("--browser", default="chromium", choices=["chromium", "webkit", "firefox"], help="Browser engine to use")
    args = p.parse_args()

    cookies_path = Path(args.cookies)
    if not cookies_path.exists():
        print(f"[error] cookies file not found: {cookies_path}")
        sys.exit(1)

    # Load exported cookies
    try:
        exported = json.loads(cookies_path.read_text(encoding="utf-8"))
        if not isinstance(exported, list):
            raise ValueError("cookies.json must be a list of cookie dicts")
    except Exception as e:
        print(f"[error] failed to parse cookies.json: {e}")
        sys.exit(1)

    # Normalize cookies for Playwright
    # Playwright expects: name,value,domain,path,secure,httpOnly,expires(optional)
    cookies_for_playwright = []
    for c in exported:
        domain = c.get("domain") or "onlyfans.com"
        path = c.get("path") or "/"
        name = c.get("name")
        value = c.get("value")
        if not name or value is None:
            continue
        item = {
            "name": name,
            "value": value,
            "domain": domain,
            "path": path,
            "secure": bool(c.get("secure", True)),
            "httpOnly": bool(c.get("httpOnly", False)),
        }
        # Map expirationDate (seconds) to expires (int seconds)
        exp = c.get("expirationDate")
        if isinstance(exp, (int, float)):
            item["expires"] = int(exp)
        cookies_for_playwright.append(item)

    async with async_playwright() as pw:
        browser_type = getattr(pw, args.browser)
        # Launch persistent context
        context = await browser_type.launch_persistent_context(
            args.persistent_dir,
            headless=False,
            user_agent=args.user_agent,
        )
        page = await context.new_page()

        # Set cookies for both host-only and dot-domain
        await context.add_cookies(cookies_for_playwright)

        # Hit homepage to bind cookies
        await page.goto("https://onlyfans.com/", wait_until="domcontentloaded")

        # Verify via API
        # Use page.evaluate to fetch with current session
        js = """
        async function checkMe() {
          try {
            const r = await fetch('https://onlyfans.com/api2/v2/users/me');
            const status = r.status;
            let body = null;
            try { body = await r.json(); } catch(e) {}
            return { status, body };
          } catch (e) {
            return { status: -1, body: null, error: String(e) };
          }
        }
        checkMe();
        """
        result = await page.evaluate(js)
        status = result.get("status")
        body = result.get("body")
        print(f"[verify] users/me status={status} username={body.get('username') if isinstance(body, dict) else None}")

        if status != 200:
            print("[hint] If not logged in, complete native login in this window (not Google SSO). After login, press Enter here.")
            input()
            result = await page.evaluate(js)
            status = result.get("status")
            body = result.get("body")
            print(f"[verify] users/me status={status} username={body.get('username') if isinstance(body, dict) else None}")

        await page.close()
        await context.close()

if __name__ == "__main__":
    asyncio.run(main())
