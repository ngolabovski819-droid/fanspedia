import time
from playwright.sync_api import sync_playwright

PROFILE = r"c:\\Users\\nickg\\fanspedia\\.playwright-profile"

def main():
    p = sync_playwright().start()
    ctx = p.chromium.launch_persistent_context(
        PROFILE,
        headless=False,
        slow_mo=100,
        viewport={"width": 1366, "height": 900},
        user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        locale="en-US",
        permissions=["clipboard-read","clipboard-write"]
    )
    page = ctx.new_page()
    page.goto("https://onlyfans.com", wait_until="domcontentloaded")
    # Dwell on homepage to let CF settle
    page.wait_for_timeout(3000)
    print("Playwright window open. Log in inside the browser, complete captcha/2FA, then close the window.")
    # Keep open until user closes window
    try:
        while ctx.pages:
            time.sleep(0.5)
    finally:
        ctx.close()
        p.stop()

if __name__ == "__main__":
    main()
