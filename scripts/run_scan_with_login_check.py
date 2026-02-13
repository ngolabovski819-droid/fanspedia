import json
import os
import subprocess
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

COOKIES_PATH = Path(r"c:\Users\nickg\fanspedia\cookies.json")
PERSISTENT_DIR = Path(r"c:\Users\nickg\fanspedia\.playwright-profile")
SCANNER_PATH = Path(r"c:\Users\nickg\fanspedia\scripts\v2_id_scanner.py")

def normalize_cookie(c):
    return {
        "name": c.get("name"),
        "value": c.get("value"),
        "domain": c.get("domain") or "onlyfans.com",
        "path": c.get("path") or "/",
        "httpOnly": bool(c.get("httpOnly", False)),
        "secure": True,
        "sameSite": c.get("sameSite") or "Lax",
        "expires": int(c.get("expirationDate", 0)) if c.get("expirationDate") else -1,
    }

def preflight_login():
    if not COOKIES_PATH.exists():
        print(f"[error] cookies.json not found at {COOKIES_PATH}")
        return False
    with COOKIES_PATH.open("r", encoding="utf-8") as f:
        cookies = json.load(f)
    PERSISTENT_DIR.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        ctx = p.chromium.launch_persistent_context(str(PERSISTENT_DIR), headless=False)
        page = ctx.new_page()
        page.goto("https://onlyfans.com/", wait_until="domcontentloaded")
        ctx.add_cookies([normalize_cookie(c) for c in cookies])
        page.goto("https://onlyfans.com/", wait_until="networkidle")
        result = page.evaluate(
            """
            async () => {
              try {
                const r = await fetch('https://onlyfans.com/api2/v2/users/me', {
                  method: 'GET', credentials: 'include',
                  headers: { 'Accept': 'application/json, text/plain, */*', 'X-Requested-With': 'XMLHttpRequest' }
                });
                const txt = await r.text();
                let json = null; try { json = JSON.parse(txt); } catch(e) {}
                return { status: r.status, body: json || null };
              } catch (e) {
                return { status: 0, body: String(e) };
              }
            }
            """
        )
        status = result.get("status")
        body = result.get("body") or {}
        print(f"[preflight] users/me status={status} id={body.get('id')} username={body.get('username')}")
        ok = status == 200 and body.get("id")
        page.wait_for_timeout(1000)
        ctx.close()
        return ok

def run_scan(argv):
    cmd = [sys.executable, str(SCANNER_PATH)] + argv
    print("[run]", " ".join(cmd))
    # Ensure the scanner uses the same persistent dir
    # Also set a guard env to avoid overwriting stories unless valid
    env = os.environ.copy()
    env["PLAYWRIGHT_PERSISTENT_DIR"] = str(PERSISTENT_DIR)
    env["STORIES_WRITE_GUARD"] = "1"
    return subprocess.call(cmd, env=env)

if __name__ == "__main__":
    # Pass through scanner args like: --cookies ... --start-id ... --end-id ...
    if not preflight_login():
        print("[abort] Not logged in. Open the persistent window and log in, then re-run.")
        sys.exit(1)
    rc = run_scan(sys.argv[1:])
    sys.exit(rc)
