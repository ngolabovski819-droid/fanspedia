# mega_onlyfans_from_urls.py
"""
Scrape OnlyFans creators from a URL list (resumable, safe pacing).

Input file (default): onlyfans_urls.txt  (one URL or username per line)
Supported inputs:
  - https://onlyfans.com/<username>
  - https://onlyfans.com/api2/v2/users/list?r[]=<id>...
  - https://fansmetrics.com/en/onlyfans/<username>  (auto-normalized)
  - <username>  (plain handle; auto-normalized to https://onlyfans.com/<username>)

Run (single-IP friendly):
  python mega_onlyfans_from_urls.py --input onlyfans_urls.txt --concurrent 1 --wait 20 --jitter 4 --cookies cookies.json
"""

import os, csv, json, time, datetime, asyncio, argparse, random, signal, shutil, re
from typing import List, Tuple, Any, Dict
from urllib.parse import urlparse, unquote
from playwright.async_api import async_playwright

ONLYFANS_DOMAIN = "onlyfans.com"

# --------- helpers ----------
def safe_get(d, k, default=""):
    return d.get(k, default) if isinstance(d, dict) else default

def flatten_thumb_dict(d: Dict[str, Any]) -> Dict[str, Any]:
    out = {"c50": "", "c144": "", "w480": "", "w760": "", "thumbs_json": ""}
    if not isinstance(d, dict):
        return out
    for k in ("c50", "c144", "w480", "w760"):
        out[k] = safe_get(d, k, "")
    try:
        out["thumbs_json"] = json.dumps(d, ensure_ascii=False)
    except Exception:
        out["thumbs_json"] = ""
    return out

def flatten_header_size(hs: Dict[str, Any]):
    if not isinstance(hs, dict):
        return ("", 0, 0)
    w = safe_get(hs, "width", 0) or 0
    h = safe_get(hs, "height", 0) or 0
    try:
        w = int(w)
    except Exception:
        w = 0
    try:
        h = int(h)
    except Exception:
        h = 0
    return (f"{w}x{h}" if w and h else "", w, h)

def extract_promotions(promos: Any, max_promos=3) -> Dict[str, Any]:
    out = {}
    if not isinstance(promos, list):
        promos = []
    for i in range(max_promos):
        pref = f"promotion{i+1}"
        if i < len(promos) and isinstance(promos[i], dict):
            p = promos[i]
            out[f"{pref}_id"] = safe_get(p, "id", "")
            out[f"{pref}_price"] = safe_get(p, "price", "")
            out[f"{pref}_discount"] = safe_get(p, "discount", "")
            out[f"{pref}_title"] = safe_get(p, "title", "")
        else:
            out[f"{pref}_id"] = ""
            out[f"{pref}_price"] = ""
            out[f"{pref}_discount"] = ""
            out[f"{pref}_title"] = ""
    return out

def extract_bundles(bundles: Any, max_bundles=3) -> Dict[str, Any]:
    out = {}
    if not isinstance(bundles, list):
        bundles = []
    for i in range(max_bundles):
        pref = f"bundle{i+1}"
        if i < len(bundles) and isinstance(bundles[i], dict):
            b = bundles[i]
            out[f"{pref}_id"] = safe_get(b, "id", "")
            out[f"{pref}_discount"] = safe_get(b, "discount", "")
            out[f"{pref}_duration"] = safe_get(b, "duration", "")
            out[f"{pref}_price"] = safe_get(b, "price", "")
            out[f"{pref}_canBuy"] = safe_get(b, "canBuy", "")
        else:
            out[f"{pref}_id"] = ""
            out[f"{pref}_discount"] = ""
            out[f"{pref}_duration"] = ""
            out[f"{pref}_price"] = ""
            out[f"{pref}_canBuy"] = ""
    return out

def normalize_row_full(raw):
    # Scalars (from your example list)
    scalar_fields = [
        "about","archivedPostsCount","audiosCount","avatar","avatarHeaderConverterUpload",
        "canAddSubscriber","canChat","canCommentStory","canCreatePromotion","canCreateTrial",
        "canEarn","canLookStory","canPayInternal","canReceiveChatMessage","canReport","canRestrict",
        "canTrialSend","currentSubscribePrice","favoritedCount","favoritesCount","finishedStreamsCount",
        "firstPublishedPostDate","hasLabels","hasLinks","hasNotViewedStory","hasPinnedPosts",
        "hasSavedStreams","hasScheduledStream","hasStories","hasStream","header","id","isAdultContent",
        "isBlocked","isFriend","isMarkdownDisabledForAbout","isPerformer","isPrivateRestriction",
        "isRealPerformer","isReferrerAllowed","isRestricted","isSpotifyConnected","isSpringConnected",
        "isVerified","joinDate","lastSeen","location","mediasCount","name","photosCount","postsCount",
        "privateArchivedPostsCount","referalBonusSummForReferer","shouldShowFinishedStreams",
        "showMediaCount","showPostsInFeed","showSubscribersCount","subscribePrice","subscribedBy",
        "subscribedByAutoprolong","subscribedByData","subscribedByExpire","subscribedByExpireDate",
        "subscribedIsExpiredNow","subscribedOn","subscribedOnData","subscribedOnDuration",
        "subscribedOnExpiredNow","subscribersCount","tipsEnabled","tipsMax","tipsMin","tipsMinInternal",
        "tipsTextEnabled","username","videosCount","view","website","wishlist"
    ]
    r = {}
    for f in scalar_fields:
        v = safe_get(raw, f, "")
        if isinstance(v, (dict, list)):
            try:
                r[f] = json.dumps(v, ensure_ascii=False)
            except Exception:
                r[f] = str(v)
        else:
            r[f] = v

    # Avatar thumbs
    a_thumbs = flatten_thumb_dict(safe_get(raw, "avatarThumbs", {}))
    r["avatar_c50"] = a_thumbs["c50"]
    r["avatar_c144"] = a_thumbs["c144"]
    r["avatar_thumbs_json"] = a_thumbs["thumbs_json"]

    # Header thumbs + size
    h_thumbs = flatten_thumb_dict(safe_get(raw, "headerThumbs", {}))
    r["header_w480"] = h_thumbs["w480"]
    r["header_w760"] = h_thumbs["w760"]
    r["header_thumbs_json"] = h_thumbs["thumbs_json"]

    size_str, w, h = flatten_header_size(safe_get(raw, "headerSize", {}))
    r["header_size"] = size_str
    r["header_width"] = w
    r["header_height"] = h

    # Promotions & bundles
    r.update(extract_promotions(safe_get(raw, "promotions", []), max_promos=3))
    r.update(extract_bundles(safe_get(raw, "subscriptionBundles", []), max_bundles=3))

    # Raw JSON (for debugging)
    try:
        r["raw_json"] = json.dumps(raw, ensure_ascii=False)
    except Exception:
        r["raw_json"] = ""

    return r

# Columns to write
BASE_FIELDS = [
    "id","username","name","about","archivedPostsCount","audiosCount","avatar","avatarHeaderConverterUpload",
    "canAddSubscriber","canChat","canCommentStory","canCreatePromotion","canCreateTrial","canEarn","canLookStory",
    "canPayInternal","canReceiveChatMessage","canReport","canRestrict","canTrialSend","currentSubscribePrice",
    "favoritedCount","favoritesCount","finishedStreamsCount","firstPublishedPostDate","hasLabels","hasLinks",
    "hasNotViewedStory","hasPinnedPosts","hasSavedStreams","hasScheduledStream","hasStories","hasStream","header",
    "isAdultContent","isBlocked","isFriend","isMarkdownDisabledForAbout","isPerformer","isPrivateRestriction",
    "isRealPerformer","isReferrerAllowed","isRestricted","isSpotifyConnected","isSpringConnected","isVerified",
    "joinDate","lastSeen","location","mediasCount","photosCount","postsCount","privateArchivedPostsCount",
    "referalBonusSummForReferer","shouldShowFinishedStreams","showMediaCount","showPostsInFeed","showSubscribersCount",
    "subscribePrice","subscribedBy","subscribedByAutoprolong","subscribedByData","subscribedByExpire",
    "subscribedByExpireDate","subscribedIsExpiredNow","subscribedOn","subscribedOnData","subscribedOnDuration",
    "subscribedOnExpiredNow","subscribersCount","tipsEnabled","tipsMax","tipsMin","tipsMinInternal","tipsTextEnabled",
    "videosCount","view","website","wishlist",
    # thumbs & sizes
    "avatar_c50","avatar_c144","avatar_thumbs_json","header_w480","header_w760","header_thumbs_json",
    "header_size","header_width","header_height",
    # extra debug json
    "raw_json"
]
PROMO_FIELDS = [f"promotion{i}_{k}" for i in range(1,4) for k in ("id","price","discount","title")]
BUNDLE_FIELDS = [f"bundle{i}_{k}" for i in range(1,4) for k in ("id","discount","duration","price","canBuy")]
META_FIELDS = ["source_url","success_attempt","timestamp"]

CSV_FIELDS = BASE_FIELDS + PROMO_FIELDS + BUNDLE_FIELDS + META_FIELDS

# graceful stop
_cancelled = False
def _handle_signal(sig, frame):
    global _cancelled
    _cancelled = True
signal.signal(signal.SIGINT, _handle_signal)
signal.signal(signal.SIGTERM, _handle_signal)

# --------- input normalization ----------
USERNAME_RE = re.compile(r"^[A-Za-z0-9_.]+$")

def extract_username_from_fansmetrics(url: str) -> str:
    try:
        p = urlparse(url)
        path = unquote(p.path or "")
        segs = [s for s in path.split("/") if s]
        if not segs: return ""
        username = segs[-1].split("?")[0].split("#")[0]
        return username if USERNAME_RE.match(username) else ""
    except Exception:
        return ""

def canonicalize(u: str) -> Tuple[str, bool]:
    s = u.strip()
    if not s:
        return ("", False)
    if "://" not in s and "/" not in s and USERNAME_RE.match(s):
        return (f"https://{ONLYFANS_DOMAIN}/{s}", True)
    try:
        p = urlparse(s)
        host = (p.netloc or "").lower()
        if host.endswith(ONLYFANS_DOMAIN):
            return (s, False)
        if "fansmetrics.com" in host:
            uname = extract_username_from_fansmetrics(s)
            return (f"https://{ONLYFANS_DOMAIN}/{uname}", True) if uname else ("", False)
        return ("", False)
    except Exception:
        return ("", False)

def is_onlyfans_url(u: str) -> bool:
    try:
        return urlparse(u).netloc.lower().endswith(ONLYFANS_DOMAIN)
    except Exception:
        return False

# --------- core scraping ----------
async def fetch_url(context, url: str, fieldnames: List[str],
                    scraped_keys:set, total_saved: List[int],
                    failed_urls: List[str], wait: float, retries: int):
    if not is_onlyfans_url(url):
        print(f"⛔ Skipping non-OnlyFans URL after normalization: {url}")
        return False

    attempt = 0
    while attempt < retries:
        page = None
        try:
            page = await context.new_page()
            captured = []

            async def handle_response(response):
                try:
                    rurl = response.url
                    if ONLYFANS_DOMAIN not in rurl or "/api2/v2/users/" not in rurl:
                        return
                    j = None
                    try:
                        j = await response.json()
                    except Exception:
                        txt = ""
                        try:
                            txt = await response.text()
                        except Exception:
                            txt = ""
                        if txt and txt.strip().startswith("{"):
                            try:
                                j = json.loads(txt)
                            except Exception:
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
                        captured.append(candidate)
                except Exception as e:
                    print("response handler error:", e)

            page.on("response", handle_response)
            await page.goto(url, wait_until="networkidle", timeout=60000)
            await asyncio.sleep(max(0.1, wait/2))
            try:
                await page.close()
            except Exception:
                pass

            if not captured:
                return False

            candidate = captured[0]
            if not safe_get(candidate, "isPerformer", False):
                return False

            row = normalize_row_full(candidate)
            key = str(row.get("id") or row.get("username") or "")
            if key and key in scraped_keys:
                return False

            out = {k: row.get(k, "") for k in fieldnames if k not in ("source_url","success_attempt","timestamp")}
            out["source_url"] = url
            out["success_attempt"] = attempt + 1
            out["timestamp"] = datetime.datetime.now(datetime.UTC).isoformat()

            with open("temp.csv", "a", newline='', encoding="utf-8") as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writerow(out)

            scraped_keys.add(key or url)
            total_saved[0] += 1
            print(f"✅ Saved performer: {row.get('username')} ({row.get('id')}) | total={total_saved[0]}")
            return True

        except Exception as e:
            attempt += 1
            print(f"❌ URL attempt {attempt}/{retries} failed: {url} | {e}")
            try:
                if page and not page.is_closed():
                    await page.close()
            except Exception:
                pass
            backoff = min(10.0, wait * (2 ** attempt)) + random.uniform(0,1.0)
            await asyncio.sleep(backoff)

    failed_urls.append(url)
    return None

async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", default="onlyfans_urls.txt")
    parser.add_argument("--output", default="onlyfans_profiles.csv")
    parser.add_argument("--concurrent", type=int, default=1)
    parser.add_argument("--wait", type=float, default=20.0)
    parser.add_argument("--jitter", type=float, default=4.0)
    parser.add_argument("--retries", type=int, default=3)
    parser.add_argument("--cookies", default="cookies.json")
    parser.add_argument("--headless", default=True, type=bool)
    parser.add_argument("--reset", action="store_true", help="Ignore saved progress and start from the first URL")
    args = parser.parse_args()

    # load & normalize
    if not os.path.exists(args.input):
        print("Input file not found:", args.input); return
    raw_lines = [ln.strip() for ln in open(args.input, "r", encoding="utf-8") if ln.strip()]
    urls, normalized, skipped = [], 0, 0
    for ln in raw_lines:
        norm, changed = canonicalize(ln)
        if norm: urls.append(norm); normalized += int(changed)
        else: skipped += 1
    print(f"Loaded {len(raw_lines)} lines → usable: {len(urls)} | normalized: {normalized} | skipped: {skipped}")
    if not urls: print("No usable OnlyFans targets after normalization."); return

    # ensure temp header
    if not os.path.exists("temp.csv"):
        with open("temp.csv", "w", newline='', encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=CSV_FIELDS)
            writer.writeheader()

    # resume info
    scraped_keys, total_saved = set(), [0]
    if os.path.exists(args.output):
        try:
            with open(args.output, "r", encoding="utf-8") as f:
                for row in csv.DictReader(f):
                    key = row.get("id") or row.get("username") or row.get("source_url")
                    if key: scraped_keys.add(str(key)); total_saved[0] += 1
        except Exception: pass

    start_index = 0
    prog_file = "progress_urls.json"
    if os.path.exists(prog_file) and not args.reset:
        try:
            with open(prog_file, "r", encoding="utf-8") as pf:
                prog = json.load(pf)
                start_index = int(prog.get("next_index", 0))
                print("▶ Resuming from URL index:", start_index)
        except Exception:
            start_index = 0
    if args.reset or start_index >= len(urls):
        if start_index >= len(urls):
            print(f"Saved progress index ({start_index}) >= input size ({len(urls)}). Resetting to 0.")
        start_index = 0

    failed_urls = []
    concurrent = max(1, args.concurrent)
    wait = max(0.1, args.wait)
    jitter = max(0.0, args.jitter)
    retries = max(1, args.retries)

    global _cancelled
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=args.headless)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121 Safari/537.36"
        )
        if args.cookies and os.path.exists(args.cookies):
            try:
                cookies = json.load(open(args.cookies, "r", encoding="utf-8"))
                await context.add_cookies(cookies)
                print(f"🔑 Loaded cookies: {args.cookies}")
            except Exception as e:
                print("Could not load cookies:", e)

        sem = asyncio.Semaphore(concurrent)
        async def worker(u):
            async with sem:
                await asyncio.sleep(random.uniform(0, jitter))
                return await fetch_url(context, u, CSV_FIELDS, scraped_keys, total_saved, failed_urls, wait, retries)

        for idx in range(start_index, len(urls)):
            if _cancelled:
                print("⚠️ Stop signal received. Saving progress and exiting…")
                break
            u = urls[idx]
            await worker(u)
            with open(prog_file, "w", encoding="utf-8") as pf:
                json.dump({"next_index": idx + 1, "timestamp": time.time(), "total_saved": total_saved[0]}, pf)

        await context.close()
        await browser.close()

    # finalize CSV
    try:
        if os.path.exists(args.output):
            os.remove(args.output)
        shutil.move("temp.csv", args.output)
    except Exception as e:
        print("⚠️ Could not move temp.csv to output:", e)
        print("Close the CSV if it’s open and re-run.")

    if failed_urls:
        with open("failed_urls.txt", "w", encoding="utf-8") as f:
            for u in failed_urls: f.write(u + "\n")
        print(f"Saved failed URLs: {len(failed_urls)} → failed_urls.txt")
    else:
        if os.path.exists("failed_urls.txt"): os.remove("failed_urls.txt")

    print(f"✅ Done. Total performers saved: {total_saved[0]}")
    print(f"Output: {args.output}")
    print("You can stop & resume any time; state is in progress_urls.json")

if __name__ == "__main__":
    asyncio.run(main())
