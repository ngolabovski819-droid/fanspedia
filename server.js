import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

import searchHandler from './api/search.js';
import creatorHandler from './api/creator/[username].js';

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
app.get('/:username([a-zA-Z0-9_-]+)', async (req, res, next) => {
  const username = req.params.username;
  
  // Skip if this looks like a file extension (static asset)
  if (username.includes('.')) {
    return next();
  }
  
  // Skip known routes that should hit static files or other handlers
  if (['index', 'category', 'creator', 'static', 'config', 'api', 'public', 'tests'].includes(username)) {
    return next();
  }
  
  try {
    // Transform Express params to match Vercel's query structure
    req.query = req.query || {};
    req.query.username = username;
    await creatorHandler(req, res);
  } catch (err) {
    console.error('local creator handler error', err);
    res.status(500).json({ error: 'local_handler_error', message: String(err) });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Local test server running on http://127.0.0.1:${PORT}`));
