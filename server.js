import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

import searchHandler from './api/search.js';
import blogHandler from './api/blog.js';
import blogPostHandler from './api/blog-post.js';
import ssrCategoryHandler from './api/ssr/category.js';
import ssrCountryHandler from './api/ssr/country.js';

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

// Blog API routes
app.all('/api/blog', async (req, res) => {
  try { await blogHandler(req, res); } catch (err) { res.status(500).json({ error: String(err) }); }
});
app.all('/api/blog-post', async (req, res) => {
  try { await blogPostHandler(req, res); } catch (err) { res.status(500).json({ error: String(err) }); }
});

// Admin CMS panel
app.get(['/admin', '/admin/'], (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

// Blog routes
app.get(['/blog', '/blog/'], (req, res) => {
  res.sendFile(path.join(__dirname, 'blog.html'));
});
app.get('/blog/:slug', (req, res) => {
  res.sendFile(path.join(__dirname, 'blog-post.html'));
});
app.get('/blog/:slug/', (req, res) => {
  res.sendFile(path.join(__dirname, 'blog-post.html'));
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

// Handle /categories/:slug/:page route → SSR handler (paginated)
app.get(['/categories/:slug/:page', '/categories/:slug/:page/'], async (req, res) => {
  try {
    req.query.slug = req.params.slug;
    req.query.page = req.params.page;
    await ssrCategoryHandler(req, res);
  } catch (err) {
    console.error('ssr category paginated error', err);
    res.sendFile(path.join(__dirname, 'category.html'));
  }
});

// Handle /categories/:slug route → SSR handler (mirrors Vercel rewrite to /api/ssr/category)
app.get(['/categories/:slug', '/categories/:slug/'], async (req, res) => {
  try {
    req.query.slug = req.params.slug;
    await ssrCategoryHandler(req, res);
  } catch (err) {
    console.error('ssr category error', err);
    res.sendFile(path.join(__dirname, 'category.html'));
  }
});

// Handle /locations route (Vercel rewrite: "/locations" -> "/locations.html")
app.get('/locations', (req, res) => {
  res.sendFile(path.join(__dirname, 'locations.html'));
});

// Handle /country/:name/:page routes → SSR handler (paginated)
app.get(['/country/:name/:page', '/country/:name/:page/'], async (req, res) => {
  try {
    req.query.name = req.params.name;
    req.query.page = req.params.page;
    await ssrCountryHandler(req, res);
  } catch (err) {
    console.error('ssr country paginated error', err);
    const fallbacks = {
      'united-states': 'united-states.html', canada: 'canada.html',
      india: 'india.html', japan: 'japan.html',
    };
    const file = fallbacks[req.params.name];
    if (file) res.sendFile(path.join(__dirname, file));
    else res.redirect(302, '/');
  }
});

// Handle /country/:name routes → SSR handler (mirrors Vercel rewrite to /api/ssr/country)
app.get(['/country/:name', '/country/:name/'], async (req, res) => {
  try {
    req.query.name = req.params.name;
    await ssrCountryHandler(req, res);
  } catch (err) {
    console.error('ssr country error', err);
    const fallbacks = {
      'united-states': 'united-states.html', canada: 'canada.html',
      india: 'india.html', japan: 'japan.html',
    };
    const file = fallbacks[req.params.name];
    if (file) res.sendFile(path.join(__dirname, file));
    else res.redirect(302, '/');
  }
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
