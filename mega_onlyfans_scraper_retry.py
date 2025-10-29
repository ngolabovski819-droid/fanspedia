# mega_onlyfans_scraper_retry.py
import os, csv, json, time, datetime, asyncio, argparse
from playwright.async_api import async_playwright
from tqdm.asyncio import tqdm_asyncio

# -------------------- Functions --------------------
def extract_common_fields(json_obj):
    d = {}
    d['id'] = json_obj.get('id') or json_obj.get('userId') or None
    d['username'] = json_obj.get('username') or json_obj.get('url') or None
    d['name'] = json_obj.get('name') or json_obj.get('displayName') or None
    d['bio'] = json_obj.get('about') or json_obj.get('bio') or json_obj.get('description') or ""
    d['avatar'] = json_obj.get('avatar') or json_obj.get('avatarThumb') or json_obj.get('avatarUrl') or ""
    d['header'] = json_obj.get('header') or json_obj.get('headerImage') or json_obj.get('headerImageUrl') or ""
    d['postsCount'] = json_obj.get('postsCount') or json_obj.get('postCount') or ""
    d['mediaCount'] = json_obj.get('mediaCount') or json_obj.get('media') or ""
    d['followersCount'] = json_obj.get('subscribersCount') or json_obj.get('followers') or ""
    d['isVerified'] = json_obj.get('isVerified') or json_obj.get('verified') or False
    d['joinedDate'] = json_obj.get('joinedDate') or ""
    d['location'] = json_obj.get('location') or ""
    return d

async def scrape_url(context, url, fieldnames, scraped_keys, total_saved, failed_urls, wait=0.5, retries=3):
    attempt = 0
    while attempt < retries:
        try:
            page = await context.new_page()
            rows = []

            async def handle_response(response):
                try:
                    u = response.url
                    if "/api2/v2/users/" in u:
                        j = None
                        try:
                            j = await response.json()
                        except:
                            text = await response.text()
                            if text and text.strip().startswith("{"):
                                try:
                                    j = json.loads(text)
                                except:
                                    return
                        if not j or not isinstance(j, dict):
                            return
                        candidate = None
                        if 'id' in j and ('username' in j or 'name' in j):
                            candidate = j
                        else:
                            for k in ('user','users','model','profile'):
                                if k in j:
                                    val = j[k]
                                    if isinstance(val, dict) and 'id' in val:
                                        candidate = val
                                        break
                                    elif isinstance(val, list) and val and isinstance(val[0], dict) and 'id' in val[0]:
                                        candidate = val[0]
                                        break
                        if candidate:
                            row = extract_common_fields(candidate)
                            key = str(row.get('id') or row.get('username'))
                            if key not in scraped_keys:
                                scraped_keys.add(key)
                                rows.append(row)
                                print(f"✅ Captured: {row['username']} ({row['id']})")
                except Exception as e:
                    print("Response handler error:", e)

            page.on("response", handle_response)
            await page.goto(url, wait_until="networkidle", timeout=60000)
            await asyncio.sleep(wait)
            await page.close()

            if rows:
                with open("temp.csv", "a", newline='', encoding="utf-8") as csvf:
                    writer = csv.DictWriter(csvf, fieldnames=fieldnames)
                    for r in rows:
                        writer.writerow({k: r.get(k) for k in fieldnames})
                total_saved[0] += len(rows)

            return  # success, exit retries

        except Exception as e:
            attempt += 1
            print(f"❌ Attempt {attempt}/{retries} failed for URL: {url} | {e}")
            await asyncio.sleep(wait * 2)  # backoff

    # if all retries failed
    failed_urls.append(url)

# -------------------- Main --------------------
async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", default="onlyfans_urls.txt")
    parser.add_argument("--output", default="onlyfans_profiles.csv")
    parser.add_argument("--headless", default=True, type=bool)
    parser.add_argument("--cookies", default=None)
    parser.add_argument("--proxy", default=None)
    parser.add_argument("--concurrent", default=5, type=int)
    parser.add_argument("--wait", default=0.5, type=float)
    parser.add_argument("--retries", default=3, type=int)
    args = parser.parse_args()

    INPUT_FILE = args.input
    OUTPUT_FILE = args.output
    CONCURRENT = args.concurrent
    WAIT = args.wait
    RETRIES = args.retries

    if os.path.exists(INPUT_FILE):
        with open(INPUT_FILE, "r", encoding="utf-8") as f:
            urls = [line.strip() for line in f if line.strip()]
    else:
        print("No input file found.")
        return
    if not urls:
        print("No URLs to scrape.")
        return

    scraped_keys = set()
    total_saved = [0]
    fieldnames = ['id','username','name','bio','avatar','header','postsCount','mediaCount','followersCount','isVerified','joinedDate','location']

    if os.path.exists(OUTPUT_FILE):
        with open(OUTPUT_FILE, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                key = row.get('id') or row.get('username')
                if key:
                    scraped_keys.add(str(key))
                    total_saved[0] += 1

    if not os.path.exists("temp.csv"):
        with open("temp.csv", "w", newline='', encoding="utf-8") as csvf:
            writer = csv.DictWriter(csvf, fieldnames=fieldnames)
            writer.writeheader()

    failed_urls = []
    start_time = time.time()

    async with async_playwright() as p:
        launch_args = {"headless": args.headless}
        if args.proxy:
            launch_args["proxy"] = {"server": args.proxy}
        browser = await p.chromium.launch(**launch_args)
        context = await browser.new_context(user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64)")

        if args.cookies and os.path.exists(args.cookies):
            cookies = json.load(open(args.cookies, "r", encoding="utf-8"))
            await context.add_cookies(cookies)
            print(f"🔑 Loaded cookies from {args.cookies}")

        sem = asyncio.Semaphore(CONCURRENT)
        async def bound_scrape(url):
            async with sem:
                await scrape_url(context, url, fieldnames, scraped_keys, total_saved, failed_urls, wait=WAIT, retries=RETRIES)

        tasks = [asyncio.create_task(bound_scrape(url)) for url in urls]
        for f in tqdm_asyncio.as_completed(tasks, total=len(tasks), desc="Scraping URLs"):
            await f

        await context.close()
        await browser.close()

    import shutil
    if os.path.exists(OUTPUT_FILE):
        os.remove(OUTPUT_FILE)
    shutil.move("temp.csv", OUTPUT_FILE)

    if failed_urls:
        with open("failed_urls.txt", "w", encoding="utf-8") as f:
            for u in failed_urls:
                f.write(u + "\n")
        print(f"{len(failed_urls)} URLs failed. Saved to failed_urls.txt")
    else:
        if os.path.exists("failed_urls.txt"):
            os.remove("failed_urls.txt")

    elapsed = str(datetime.timedelta(seconds=int(time.time() - start_time)))
    print(f"🎉 Scraping completed! Total profiles saved: {total_saved[0]} | Elapsed: {elapsed}")

# -------------------- Run --------------------
if __name__ == "__main__":
    asyncio.run(main())
