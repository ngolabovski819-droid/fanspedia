Local test harness

This repository contains a small Node/Express local test server that serves the static `index.html` and mounts the `api/search.js` Vercel-style function at `/api/search`.

Quick local run (PowerShell)

1. Install dependencies:

   npm install

2. Start the server with your Supabase env vars set (replace with your real values):

   $env:SUPABASE_URL = "https://sirudrqheimbgpkchtwi.supabase.co";
   $env:SUPABASE_ANON_KEY = "<your-anon-key>";
   npm start

3. In another PowerShell window, test the same request you provided earlier:

   curl.exe 'http://127.0.0.1:3000/api/search?q=skylar&verified=true&price=20&page=1&page_size=24'

Notes
- The local server runs on port 3000 by default. It proxies queries to Supabase using the same REST endpoint as your Flask app.
- If you want to test without hitting Supabase, set dummy values for the env vars but the function will return a 500 if Supabase rejects the request.

Deploying to Vercel (CI)

1. In GitHub, add the following repository secrets (Settings → Secrets):
   - VERCEL_TOKEN — a Vercel personal token (scopes: "Deployments")
   - VERCEL_ORG_ID — (optional) Vercel organization id
   - VERCEL_PROJECT_ID — (optional) Vercel project id

2. The included GitHub Actions workflow (.github/workflows/vercel-deploy.yml) will deploy to Vercel on push to `main` or `master`. The workflow uses `VERCEL_TOKEN` and optional org/project IDs.

3. In Vercel dashboard, add the same SUPABASE_URL and SUPABASE_ANON_KEY to Project Settings → Environment Variables so the serverless function can call Supabase.

