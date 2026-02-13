import json
from playwright.sync_api import sync_playwright

cookies_path = r"c:\Users\nickg\fanspedia\cookies.json"
persistent_dir = r"c:\Users\nickg\fanspedia\.playwright-profile"

with open(cookies_path, "r", encoding="utf-8") as f:
    cookies = json.load(f)

with sync_playwright() as p:
    browser = p.chromium.launch_persistent_context(persistent_dir, headless=False)
    page = browser.new_page()
    page.goto("https://onlyfans.com/", wait_until="domcontentloaded")

    norm = []
    for c in cookies:
        norm.append({
            "name": c["name"],
            "value": c["value"],
            "domain": c.get("domain", "onlyfans.com"),
            "path": c.get("path", "/"),
            "httpOnly": bool(c.get("httpOnly", False)),
            "secure": True,
            "sameSite": c.get("sameSite") or "Lax",
            "expires": int(c.get("expirationDate", 0)) if c.get("expirationDate") else -1
        })
    browser.add_cookies(norm)

    page.goto("https://onlyfans.com/", wait_until="networkidle")
    r = page.request.get("https://onlyfans.com/api2/v2/users/me")
    print("users/me status:", r.status)
    try:
        me = r.json()
        print("auth_id:", me.get("id"), "username:", me.get("username"))
    except Exception as e:
        print("Failed to parse users/me:", e)

    page.wait_for_timeout(3000)
    browser.close()
