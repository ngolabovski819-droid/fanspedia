import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

import searchHandler from './api/search.js';
// Use the catch-all SSR handler for local testing (matches Vercel's [...params] serverless function)
import creatorHandler from './api/creator/[...params].js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Mount the Vercel-style handler at /api/search
app.all('/api/search', async (req, res) => {
  try {
    await searchHandler(req, res);
  } catch (err) {
    console.error('local search handler error', err);
    res.status(500).json({ error: 'local_handler_error', message: String(err) });
  }
});

// Handle /creator.html with query param - redirect to clean URL (BEFORE static middleware)
app.get('/creator.html', (req, res) => {
  // Serve the static creator.html for client-side rendering when accessed with query params.
  // Avoid server-side redirect to /:username which can cause 404s for dotted usernames in local dev.
  res.sendFile(path.join(__dirname, 'creator.html'));
});

// Serve static files BEFORE the catch-all SSR route
// This ensures static assets (HTML, CSS, JS, images) are served first
app.use(express.static(path.join(__dirname)));

// Handle /categories route explicitly (Vercel rewrite: "/categories" -> "/categories.html")
app.get('/categories', (req, res) => {
  res.sendFile(path.join(__dirname, 'categories.html'));
});

// Handle /categories/:slug route (Vercel rewrite: "/categories/:slug" -> "/category.html")
app.get('/categories/:slug', (req, res) => {
  res.sendFile(path.join(__dirname, 'category.html'));
});

// Handle /creator route explicitly (serves creator.html for client-side rendering)
app.get('/creator', (req, res) => {
  res.sendFile(path.join(__dirname, 'creator.html'));
});

// Mount the SSR creator profile handler at /:username as LAST route
// This matches Vercel's rewrite: { "source": "/:username([a-zA-Z0-9_-]+)", "destination": "/api/creator/:username" }
// IMPORTANT: This must come AFTER static files to avoid intercepting /index.html, /categories.html, etc.
app.get('/:username([a-zA-Z0-9_.-]+)', async (req, res, next) => {
  const username = req.params.username;
  // Skip if the username matches a known static file extension (e.g., .js, .css, .png, etc.)
  if (username.match(/\.(js|css|png|jpg|jpeg|svg|ico|webp|map|json)$/i)) {
    return next();
  }
  // Skip known routes that should hit static files or other handlers
  if (["index", "category", "creator", "static", "config", "api", "public", "tests"].includes(username)) {
    return next();
  }
  try {
    req.query = req.query || {};
    req.query.params = [username]; // Emulate Vercel catch-all for SSR
    await creatorHandler(req, res);
  } catch (err) {
    console.error('local creator handler error', err);
    res.status(500).json({ error: 'local_handler_error', message: String(err) });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Local test server running on http://127.0.0.1:${PORT}`));
// Lightweight health endpoint for quick availability checks
app.get('/health', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({ status: 'ok', ts: new Date().toISOString() });
});

// Example endpoint to test Supabase integration
app.get('/supabase/test', async (req, res) => {
  try {
    const response = await fetch('https://your-supabase-url/rest/v1/onlyfans_profiles?username=ilike.*peyton.kinsly*&limit=1');
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('Supabase test error', err);
    res.status(500).json({ error: 'Supabase test error', message: String(err) });
  }
});
