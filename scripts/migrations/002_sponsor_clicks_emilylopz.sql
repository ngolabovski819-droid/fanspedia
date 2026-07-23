-- ============================================================================
-- Sponsor click tracking: emilylopz
-- ============================================================================
-- Purpose: One click-log table per paying client (per-client table naming is
--          intentional — keeps each client's delivered-click count trivially
--          isolated and easy to archive/drop when a campaign ends).
-- Run this in the Supabase SQL Editor once. The app writes to this table via
-- the /go/[username] route handler (src/app/go/[username]/route.ts), which
-- looks up the table name from src/config/sponsors.ts (`clickTable` field).
-- Date: 2026-07-23
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.sponsor_clicks_emilylopz (
    id BIGSERIAL PRIMARY KEY,
    clicked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    placement TEXT,       -- optional context (which page/scope), NULL for now
    user_agent TEXT,
    referrer TEXT
);

CREATE INDEX IF NOT EXISTS idx_sponsor_clicks_emilylopz_clicked_at
ON public.sponsor_clicks_emilylopz (clicked_at);

-- Handy queries:
-- Total delivered clicks:
--   SELECT COUNT(*) FROM sponsor_clicks_emilylopz;
-- Clicks per day:
--   SELECT DATE(clicked_at) AS day, COUNT(*) FROM sponsor_clicks_emilylopz
--   GROUP BY day ORDER BY day DESC;
