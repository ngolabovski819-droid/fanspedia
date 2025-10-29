import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

import handler from './api/search.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Serve static files (index.html at root, static/ directory)
app.use(express.static(path.join(__dirname)));

// Mount the Vercel-style handler at /api/search
app.all('/api/search', async (req, res) => {
  try {
    // The handler expects (req, res)-style objects similar to Express
    await handler(req, res);
  } catch (err) {
    console.error('local handler error', err);
    res.status(500).json({ error: 'local_handler_error', message: String(err) });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Local test server running on http://127.0.0.1:${PORT}`));
