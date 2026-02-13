import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

import searchHandler from './api/search.js';
// Use the catch-all SSR handler for local testing (matches Vercel's [...params] serverless function)
// creator profiles temporarily disabled; keep SSR handler code in repo but do not mount it

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

// Disable direct access to creator.html in local dev to mirror production
app.get('/creator.html', (req, res) => {
  res.redirect(302, '/');
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

// Handle /locations route (Vercel rewrite: "/locations" -> "/locations.html")
app.get('/locations', (req, res) => {
  res.sendFile(path.join(__dirname, 'locations.html'));
});

// Handle /country/united-states route (Vercel rewrite: "/country/united-states" -> "/united-states.html")
app.get('/country/united-states', (req, res) => {
  res.sendFile(path.join(__dirname, 'united-states.html'));
});

// Disable /creator route as well
app.get('/creator', (req, res) => {
  res.redirect(302, '/');
});

// Catch username-like paths locally and redirect home to mirror production pause
app.get('/:username([a-zA-Z0-9_.-]+)', (req, res, next) => {
  const username = req.params.username;
  if (username.match(/\.(js|css|png|jpg|jpeg|svg|ico|webp|map|json)$/i)) return next();
  if (["index", "category", "creator", "static", "config", "api", "public", "tests"].includes(username)) return next();
  return res.redirect(302, '/');
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
