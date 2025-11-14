# AI Coding Assistant Documentation

This folder contains comprehensive documentation to help AI coding assistants (like GitHub Copilot, Cursor, Cline, etc.) understand and work effectively with this codebase.

## 📚 Documentation Files

### 🎯 [copilot-instructions.md](./copilot-instructions.md) - **START HERE**
Complete reference for the project architecture, patterns, and conventions. Read this first to understand the codebase structure.

### 🚀 [QUICKSTART.md](./QUICKSTART.md)
Fast-track guide for common development tasks:
- First-time setup
- Adding categories
- Running scrapers
- Deploying to production

### 🔍 [PATTERNS.md](./PATTERNS.md)
Code pattern reference with copy-paste examples:
- Frontend JavaScript patterns
- Backend API patterns
- Python scraping patterns
- Testing patterns

### 🏗️ [ARCHITECTURE.md](./ARCHITECTURE.md)
Explains architectural decisions and trade-offs:
- Why no build step?
- Why direct Supabase REST?
- Why Playwright vs Selenium?
- Design rationales

### ✅ [CHECKLISTS.md](./CHECKLISTS.md)
Step-by-step checklists for:
- Adding new categories
- Scraping profiles
- Deploying changes
- Debugging issues
- Security audits
- SEO optimization

## 🤖 For AI Assistants

When working with this codebase:

1. **Read `copilot-instructions.md`** first - It has the complete architecture overview
2. **Reference `PATTERNS.md`** for code examples when implementing features
3. **Use `CHECKLISTS.md`** to ensure you don't miss critical steps
4. **Consult `ARCHITECTURE.md`** to understand design decisions before making changes
5. **Follow `QUICKSTART.md`** for common tasks

## 🎓 For Human Developers

This documentation is optimized for AI assistants but is equally useful for human developers:

- **New to the project?** Read the files in order: copilot-instructions → QUICKSTART → PATTERNS
- **Implementing a feature?** Check PATTERNS.md for similar code
- **Debugging?** Use CHECKLISTS.md debugging section
- **Making architectural changes?** Review ARCHITECTURE.md first

## 📝 Maintenance

When making significant changes to the project:

1. **Update copilot-instructions.md** with new patterns or conventions
2. **Add code examples to PATTERNS.md** for reusable patterns
3. **Create checklists in CHECKLISTS.md** for new workflows
4. **Document decisions in ARCHITECTURE.md** when changing design

## 🔧 Quick Reference

### Common Commands
```powershell
# Local development
npm start

# Add category (after editing config)
node scripts/build-sitemaps.cjs

# Scrape profiles
python scripts/mega_onlyfans_scraper_full.py --urls urls.txt --output temp.csv --cookies cookies.json

# Upload to database
python scripts/load_csv_to_supabase.py --csv temp.csv --table onlyfans_profiles --batch-size 200 --upsert --on-conflict id --exclude-columns raw_json,timestamp
```

### Critical Files Never to Commit
- `.env` - Environment variables
- `cookies.json` - Authentication cookies
- `*.csv` - Scraped data
- `failed_batch.json` - Error logs
- `progress_urls.json` - Scraper state

### Version Control for Categories
When editing `config/categories.js`, **always** increment version in:
- `index.html` → `?v=20251107-1`
- `category.html` → `?v=20251107-1`
- `categories.html` → `?v=20251107-1`

## 🆘 Getting Help

1. **Search issues** in the existing documentation
2. **Check error logs** in Vercel dashboard or console
3. **Test locally** with `npm start` before deploying
4. **Use checklists** to ensure all steps completed

## 📊 Project Stats

- **Frontend**: Vanilla JS, 3 HTML pages, ~2600 lines per file
- **Backend**: Node.js serverless (4 API routes)
- **Scraping**: Python async Playwright (4 scraper variants)
- **Database**: Supabase PostgreSQL (9,500+ rows)
- **Categories**: 60+ categories with synonym system
- **Deployment**: Vercel with GitHub Actions CI/CD

---

**Last Updated**: November 7, 2025

_These docs are living documents. Keep them updated as the project evolves._
