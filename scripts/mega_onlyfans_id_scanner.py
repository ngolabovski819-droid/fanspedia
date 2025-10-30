# mega_onlyfans_id_scanner.py
"""
ID-scanning OnlyFans scraper (resumable, conservative defaults).

Usage example:
python mega_onlyfans_id_scanner.py --start-id 150000000 --end-id 200000000 \
  --concurrent 1 --wait 30 --jitter 5 --consecutive-nonexist 1000 --cookies cookies.json

Recommended conservative defaults for single-IP:
  --concurrent 1 --wait 30 --jitter 5  (roughly ~1 request / 30s)

This script uses the API endpoint:
  https://onlyfans.com/api2/v2/users/list?r[]={id}

It only writes rows where isPerformer == True.
"""

import os, csv, json, time, datetime, asyncio, argparse, random
from typing import List
from playwright.async_api import async_playwright
from tqdm.asyncio import tqdm_asyncio

# Reuse normalize_row from earlier master script (simplified - include fields you want)
# I'll include a compact normalize function that returns a row with the core fields
def safe_get(d, k, default=""):
    return d.get(k, default) if isinstance(d, dict) else default

def normalize_row_minimal(raw):
    # Return dict of fields we'll store. Add more fields here as needed
    r = {}
    r["id"] = safe_get(raw, "id", "")
    r["username"] = safe_get(raw, "username", "")
    r["name"] = safe_get(raw, "name", "")
    r["isPerformer"] = safe_get(raw, "isPerformer", False)
    r["isVerified"] = safe_get(raw, "isVerified", False)
    r["joinDate"] = safe_get(raw, "joinDate", "")
    r["lastSeen"] = safe_get(raw, "lastSeen", "")
    r["location"] = safe_get(raw, "location", "")
    r["subscribersCount"] = safe_get(raw, "subscribersCount", "")
    r["subscribersCount_public"] = safe_get(raw, "showSubscribersCount", "")
    r["postsCount"] = safe_get(raw, "postsCount", "")
    r["mediasCount"] = safe_get(raw, "mediasCount", "")
    r["favoritedCount"] = safe_get(raw, "favoritedCount", "")
    r["subscribePrice"] = safe_get(raw, "subscribePrice", "")
    r["website"] = safe_get(raw, "website", "")
    # media fields
    r["avatar"] = safe_get(raw, "avatar", "")
    r["header"] = safe_get(raw, "header", "")
    # nested: promotions/bundles are optional - we'll save raw_json for full details
    try:
        r["raw_json"] = json.dumps(raw, ensure_ascii=False)
    except:
        r["raw_json"] = ""
    return r

# CSV header for the minimal normalized row (you can expand based on your master columns)
CSV_FIELDS = [
    "id","username","name","isPerformer","isVerified","joinDate","lastSeen","location",
    "subscribersCount","subscribersCount_public","postsCount","mediasCount","favoritedCount",
    "subscribePrice","website","avatar","header","raw_json","source_id","success_attempt","timestamp"
]

async def fetch_id(context, id_num: int, fieldnames: List[str],
                   scraped_ids:set, total_saved: List[int],
                   failed_ids: List[int], wait:float, retries:int):
    """
    Visit the API URL for this numeric id and, if performer, save it.
    Returns True if any data saved, False if not saved, None for outright failure.
    """
    url_api = f"https://onlyfans.com/api2/v2/users/list?r[]={id_num}"
    attempt = 0
    while attempt < retries:
        page = None
        try:
            page = await context.new_page()
            captured = []
            async def handle_response(response):
                try:
                    u = response.url
                    if "/api2/v2/users/" in u:
                        # try parse json
                        j = None
                        try:
                            j = await response.json()
                        except Exception:
                            txt = ""
                            try:
                                txt = await response.text()
                            except:
                                txt = ""
                            if txt and txt.strip().startswith("{"):
                                try:
                                    j = json.loads(txt)
                                except:
                                    return
                        if not j or not isinstance(j, dict):
                            return
                        # heuristics: find user object
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
                            captured.append(candidate)
                except Exception as e:
                    print("response handler error:", e)

            page.on("response", handle_response)
            await page.goto(url_api, wait_until="networkidle", timeout=45000)
            await asyncio.sleep(wait/2)  # small extra wait for XHRs
            # close page
            try:
                await page.close()
            except:
                pass

            if not captured:
                # no JSON user payload arrived
                return False

            # process the first candidate (usually one)
            candidate = captured[0]
            is_performer = safe_get(candidate, "isPerformer", False)
            if not is_performer:
                return False  # skip non-performers

            # normalized row
            row = normalize_row_minimal(candidate)
            key = str(row.get("id") or row.get("username") or id_num)
            if key in scraped_ids:
                return False  # already saved

            # write to temp.csv immediately
            out = {k: row.get(k, "") for k in fieldnames}
            out["source_id"] = id_num
            out["success_attempt"] = attempt + 1
            out["timestamp"] = datetime.datetime.utcnow().isoformat()
            with open("temp.csv", "a", newline='', encoding="utf-8") as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames + ["source_id","success_attempt","timestamp"])
                writer.writerow(out)

            scraped_ids.add(key)
            total_saved[0] += 1
            print(f"✅ Saved performer id={id_num} username={row.get('username')} total_saved={total_saved[0]}")
            return True

        except Exception as e:
            attempt += 1
            print(f"❌ id={id_num} attempt {attempt}/{retries} error: {e}")
            try:
                if page and not page.is_closed():
                    await page.close()
            except:
                pass
            # backoff
            await asyncio.sleep(min(10, wait * (2 ** attempt)) + random.uniform(0,1))
    # all retries failed
    failed_ids.append(id_num)
    return None

async def id_scanner(start_id:int, end_id:int,
                     start_resume:int,
                     context,
                     fieldnames:List[str],
                     scraped_ids:set,
                     total_saved:List[int],
                     failed_ids:List[int],
                     concurrent:int, wait:float, jitter:float, retries:int,
                     consecutive_nonexist_limit:int):
    """
    Streams numeric IDs from start_resume to end_id or until consecutive_nonexist_limit misses.
    """
    sem = asyncio.Semaphore(concurrent)
    id_gen = start_resume if start_resume is not None else start_id
    consecutive_nonexist = 0
    last_processed = id_gen - 1

    # create tasks in a streaming fashion to avoid huge task lists
    async def worker_task(id_val):
        async with sem:
            # random jitter before request
            await asyncio.sleep(random.uniform(0, jitter))
            return await fetch_id(context, id_val, fieldnames, scraped_ids, total_saved, failed_ids, wait, retries)

    while True:
        if end_id and id_gen > end_id:
            break

        # submit one id at a time (streaming)
        print(f"Scanning id: {id_gen}…")  # ✅ shows progress for every ID
        task = asyncio.create_task(worker_task(id_gen))
        res = await task  # serial-by-default; concurrency controlled by semaphore
        last_processed = id_gen

        # save progress after each id
        prog = {"last_id": last_processed, "timestamp": time.time(), "total_saved": total_saved[0]}
        with open("progress.json", "w", encoding="utf-8") as pf:
            json.dump(prog, pf)

        # interpret result
        if res is True:
            consecutive_nonexist = 0
        elif res is False:
            # either non-performer or not-existent JSON
            consecutive_nonexist += 1
        else:
            # None == outright failures; treat conservatively as a nonexistence but also log
            consecutive_nonexist += 1

        # break if consecutive limit reached
        if consecutive_nonexist >= consecutive_nonexist_limit:
            print(f"Reached {consecutive_nonexist_limit} consecutive non-exist/non-performer responses. Stopping at id {id_gen}.")
            break

        id_gen += 1
        # small sleep to pace loop; we also use wait inside fetch
        await asyncio.sleep(random.uniform(0, jitter))

    return last_processed

async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--start-id", type=int, default=150000000, help="ID to start scanning from")
    parser.add_argument("--end-id", type=int, default=0, help="Optional end ID (0 means open-ended)")
    parser.add_argument("--concurrent", type=int, default=1)
    parser.add_argument("--wait", type=float, default=30.0, help="Base wait in seconds between requests")
    parser.add_argument("--jitter", type=float, default=5.0, help="Random jitter in seconds")
    parser.add_argument("--retries", type=int, default=3)
    parser.add_argument("--consecutive-nonexist", type=int, default=1000,
                        help="Stop after this many consecutive non-performer/non-existent responses")
    parser.add_argument("--cookies", default="cookies.json")
    parser.add_argument("--headless", default=True, type=bool)
    args = parser.parse_args()

    start_id = args.start_id
    end_id = args.end_id if args.end_id > 0 else None
    concurrent = max(1, args.concurrent)
    wait = max(0.1, args.wait)
    jitter = max(0.0, args.jitter)
    retries = max(1, args.retries)
    consecutive_nonexist_limit = max(1, args.consecutive_nonexist)

    # ensure temp.csv header exists
    if not os.path.exists("temp.csv"):
        with open("temp.csv", "w", newline='', encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=CSV_FIELDS + ["source_id","success_attempt","timestamp"])
            writer.writeheader()

    scraped_ids = set()
    total_saved = [0]
    # load existing output to resume
    if os.path.exists("onlyfans_profiles.csv"):
        try:
            with open("onlyfans_profiles.csv", "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    key = row.get("id") or row.get("username")
                    if key:
                        scraped_ids.add(str(key))
                        total_saved[0] += 1
        except:
            pass

    # resume last_id if progress.json exists
    start_resume = None
    if os.path.exists("progress.json"):
        try:
            with open("progress.json", "r", encoding="utf-8") as pf:
                prog = json.load(pf)
                last_id = prog.get("last_id", None)
                if isinstance(last_id, int):
                    start_resume = last_id + 1
                    print("Resuming from last_id+1:", start_resume)
        except:
            start_resume = None

    failed_ids = []

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=args.headless)
        context = await browser.new_context(user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64)")

        # load cookies if provided
        if args.cookies and os.path.exists(args.cookies):
            try:
                cookies = json.load(open(args.cookies, "r", encoding="utf-8"))
                await context.add_cookies(cookies)
                print("Loaded cookies:", args.cookies)
            except Exception as e:
                print("Could not load cookies:", e)

        last = await id_scanner(start_id, end_id, start_resume, context,
                                CSV_FIELDS, scraped_ids, total_saved, failed_ids,
                                concurrent, wait, jitter, retries, consecutive_nonexist_limit)

        await context.close()
        await browser.close()

    # merge/move temp.csv -> onlyfans_profiles.csv safely
    import shutil
    try:
        if os.path.exists("onlyfans_profiles.csv"):
            os.remove("onlyfans_profiles.csv")
        shutil.move("temp.csv", "onlyfans_profiles.csv")
    except Exception as e:
        print("Warning moving temp.csv to output:", e)

    # save failed IDs
    if failed_ids:
        with open("failed_ids.txt", "w", encoding="utf-8") as f:
            for idn in failed_ids:
                f.write(str(idn) + "\n")
        print("Saved failed ids to failed_ids.txt")

    print(f"Done. Last processed id: {last}. Total saved performers: {total_saved[0]}")

if __name__ == "__main__":
    asyncio.run(main())
