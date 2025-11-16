# OnlyFans Scraper & Search Platform

A full-stack web application for scraping OnlyFans creator profiles and providing a searchable database with infinite scroll and advanced filtering.

## 🚀 Features

- **Web Scraping**: Automated Playwright-based scraper for OnlyFans creator data
- **Modern Search UI**: Fast, responsive search interface with infinite scroll
- **Advanced Filtering**: Filter by verification status, subscription price
- **Database Integration**: Supabase PostgreSQL backend with 9,500+ creator profiles
- **Serverless Deployment**: Zero-config Vercel deployment with API routes
- **Local Development**: Express.js test server for local API testing

## 📁 Project Structure

```
onlyfans-scraper/
├── api/                          # Vercel serverless functions
│   ├── search.js                 # Main search API endpoint
│   ├── health.js                 # Health check & diagnostics
│   └── img.js                    # Image proxy (unused)
├── scripts/                      # Python scraping & data tools
│   ├── mega_onlyfans_scraper_full.py      # Main scraper (Playwright)
│   ├── mega_onlyfans_scraper_retry.py     # Retry failed URLs
│   ├── mega_onlyfans_from_urls.py         # Scrape from URL list
│   ├── mega_onlyfans_id_scanner.py        # ID-based scanner
│   ├── load_csv_to_supabase.py            # CSV → Supabase uploader
│   ├── load_csv_to_pg.py                  # CSV → PostgreSQL uploader
│   ├── generate_supabase_schema.py        # Schema generator
│   └── find_missing_columns.py            # Data validation
├── static/                       # Static assets
│   └── no-image.png             # Fallback image
├── index.html                    # Main frontend (production)
├── vercel.json                   # Vercel configuration
├── server.js                     # Local Express test server
├── package.json                  # Node.js dependencies
├── requirements.txt              # Python dependencies
├── .env                          # Environment variables (DO NOT COMMIT)
└── README.md                     # This file
```

## 🛠️ Tech Stack

**Frontend:**
- HTML5, CSS3, JavaScript (ES6+)
- Bootstrap 5.3.0
- Infinite scroll pagination

**Backend:**
- Node.js (serverless functions)
- Python 3.x (scraping scripts)
- Express.js (local dev server)

**Database:**
- Supabase (PostgreSQL)
- REST API with Row Level Security

**Scraping:**
- Playwright (async browser automation)
- Pandas (data processing)
- Requests (HTTP client)

**Deployment:**
- Vercel (frontend + serverless APIs)
- GitHub Actions (CI/CD)

## 🔧 Setup

### Prerequisites

- Node.js 18+ and npm
- Python 3.8+ and pip
- Supabase account (free tier works)
- Vercel account (optional, for deployment)

### 1. Clone Repository

```bash
git clone https://github.com/ngolabovski819-droid/congenial-octo-umbrella.git
cd congenial-octo-umbrella
```

### 2. Install Dependencies

**Node.js:**
```bash
npm install
```

**Python:**
```bash
pip install -r requirements.txt
```

### 3. Environment Variables

Create a `.env` file in the project root:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key-here

# Database
TABLE_NAME=onlyfans_profiles

# CSV Data (for scraping)
CSV_PATH=onlyfans_profiles.csv
```

**⚠️ Security Note:** Never commit `.env` to version control. The service role key has admin access.

### 4. Database Setup

**Option A: Use existing Supabase project**

The project is configured to use:
```
SUPABASE_URL=https://sirudrqheimbgpkchtwi.supabase.co
```

**Option B: Create your own Supabase project**

1. Create a new project at [supabase.com](https://supabase.com)
2. Run the schema creation:
   ```bash
   python scripts/generate_supabase_schema.py
   ```
3. Copy the SQL output and run in Supabase SQL Editor
4. Load data:
   ```bash
   python scripts/load_csv_to_supabase.py --csv onlyfans_profiles.csv --table onlyfans_profiles --upsert --on-conflict id
   ```

## 🚀 Local Development

### Start Local Server

**PowerShell:**
```powershell
$env:SUPABASE_URL = "https://sirudrqheimbgpkchtwi.supabase.co"
$env:SUPABASE_KEY = "your-service-role-key"
npm start
```

**Bash/Linux:**
```bash
export SUPABASE_URL="https://sirudrqheimbgpkchtwi.supabase.co"
export SUPABASE_KEY="your-service-role-key"
npm start
```

Server runs at `http://localhost:3000`

### Test API Endpoints

**Search:**
```bash
curl "http://localhost:3000/api/search?q=skylar&verified=true&price=20&page=1&page_size=50"
```

**Health Check:**
```bash
curl "http://localhost:3000/api/health"
```

## 📤 Deployment

### Deploy to Vercel

**Option 1: Vercel CLI**
```bash
npm install -g vercel
vercel --prod
```

**Option 2: GitHub Integration**
1. Connect repository to Vercel
2. Add environment variables in Vercel Dashboard:
   - `SUPABASE_URL`
   - `SUPABASE_KEY` (service role key)
3. Push to `main` branch - auto-deploys

### GitHub Actions (CI/CD)

The workflow at `.github/workflows/vercel-deploy.yml` auto-deploys on push to `main`.

**Required GitHub Secrets:**
- `VERCEL_TOKEN` - Vercel API token
- `VERCEL_ORG_ID` - Vercel organization ID
- `VERCEL_PROJECT_ID` - Vercel project ID

## 📊 Scraping Data

### Basic Scraping

**From URL list:**
```bash
python scripts/mega_onlyfans_from_urls.py --input onlyfans_urls.txt --output scraped_data.csv
```

**From user IDs:**
```bash
python scripts/mega_onlyfans_id_scanner.py --start-id 1 --end-id 10000 --output profiles.csv
```

### Retry Failed Scrapes

```bash
python scripts/mega_onlyfans_scraper_retry.py --failed-urls failed_urls.txt
```

### Upload to Database

```bash
python scripts/load_csv_to_supabase.py \
  --csv onlyfans_profiles.csv \
  --table onlyfans_profiles \
  --batch-size 200 \
  --upsert \
  --on-conflict id
```

## 🎨 Frontend Features

- **Infinite Scroll**: Loads 50 results at a time, auto-fetches more on scroll
- **Real-time Search**: Debounced search with 400ms delay
- **Price Slider**: Filter by max subscription price (0-50+)
- **Verified Filter**: Toggle to show only verified creators
- **Responsive Grid**: Bootstrap grid adapts to screen size
- **Image Handling**: 
  - Loads full-quality avatars
  - Fallback for broken images
  - Removes 1x1 tracking pixels
  - No-referrer policy for hotlink protection

## 🔒 Security Best Practices

1. **Never commit sensitive files:**
   - `.env`
   - `cookies.json`
   - `*.csv` with scraped data
   - `*.log` files

2. **Use service role key only server-side:**
   - Vercel environment variables
   - Local `.env` file
   - Never in frontend code

3. **Enable Row Level Security (RLS):**
   - Configure policies in Supabase
   - Restrict public access as needed

## 🐛 Troubleshooting

### Search returns empty results

**Issue:** API returns `[]` despite data in database

**Solution:** 
1. Check Vercel environment variables have `SUPABASE_KEY` (service role)
2. Verify RLS policies allow reads
3. Check `/api/health` shows `"key_role": "service_role"`

### Images not loading

**Issue:** Broken image icons or 403 errors

**Solution:**
- Ensure `referrerpolicy="no-referrer"` on `<img>` tags
- Use `avatar` field instead of thumbnails for quality
- Check OnlyFans CDN is accessible

### Only 24 results showing

**Issue:** Hard limit on results despite pagination

**Solution:**
1. Check `pageSize` in `index.html` (should be 50)
2. Verify API `page_size` default is 50 in `api/search.js`
3. Clear browser cache (Ctrl+Shift+R)
4. Redeploy to Vercel to clear CDN cache

## 📝 API Reference

### `GET /api/search`

Search and filter OnlyFans creator profiles.

**Query Parameters:**
- `q` (string): Search query (username, name, location, about)
- `verified` (boolean): Filter by verification status
- `price` (number): Max subscription price (0-50+)
- `page` (number): Page number (default: 1)
- `page_size` (number): Results per page (default: 50, max: 1000)

**Response:**
```json
[
  {
    "id": 123456,
    "username": "creator_name",
    "name": "Display Name",
    "location": "City, Country",
    "avatar": "https://cdn.onlyfans.com/...",
    "isVerified": true,
    "subscribePrice": 9.99,
    "favoritedCount": 5000
  }
]
```

### `GET /api/health`

Health check and diagnostic endpoint.

**Response:**
```json
{
  "status": "healthy",
  "key_role": "service_role",
  "env_keys": ["SUPABASE_URL", "SUPABASE_KEY"],
  "timestamp": "2025-10-30T12:00:00Z"
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is for educational purposes only. Respect OnlyFans Terms of Service and robots.txt when scraping.

## ⚠️ Legal Disclaimer

This tool is provided for educational and research purposes only. Users are responsible for:
- Complying with OnlyFans Terms of Service
- Respecting rate limits and robots.txt
- Not distributing scraped data without permission
- Following all applicable laws and regulations

The authors assume no liability for misuse of this software.

## 🔗 Links

- **Production Site**: https://congenial-octo-umbrella.vercel.app/
- **Repository**: https://github.com/ngolabovski819-droid/congenial-octo-umbrella
- **Supabase Dashboard**: https://supabase.com/dashboard/project/sirudrqheimbgpkchtwi

## 📞 Support

For issues, questions, or contributions, please open an issue on GitHub.

<!-- Deploy trigger 2025-11-16 13:13:46 -->
