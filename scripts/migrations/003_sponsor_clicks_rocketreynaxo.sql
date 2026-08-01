-- Sponsor click tracking: rocketreynaxo
-- Run once in the Supabase SQL Editor before deploying the placement.

CREATE TABLE IF NOT EXISTS public.sponsor_clicks_rocketreynaxo (
    id BIGSERIAL PRIMARY KEY,
    clicked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    placement TEXT,
    user_agent TEXT,
    referrer TEXT
);

CREATE INDEX IF NOT EXISTS idx_sponsor_clicks_rocketreynaxo_clicked_at
ON public.sponsor_clicks_rocketreynaxo (clicked_at);
