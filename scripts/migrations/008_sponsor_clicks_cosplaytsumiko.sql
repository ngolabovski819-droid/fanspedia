-- Sponsor click tracking: cosplaytsumiko
-- Run once in the Supabase SQL Editor before deploying the placement.
--
-- Created with the full current click schema up front — base columns (002-004)
-- plus the integrity/geo columns the older tables gained via 005-007
-- (ip_hash / is_datacenter_ip, link_verified, ip_address / country / city),
-- since src/app/go/[username]/route.ts inserts all of them.

CREATE TABLE IF NOT EXISTS public.sponsor_clicks_cosplaytsumiko (
    id BIGSERIAL PRIMARY KEY,
    clicked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    placement TEXT,
    user_agent TEXT,
    referrer TEXT,
    ip_hash TEXT,
    is_datacenter_ip BOOLEAN,
    link_verified BOOLEAN,
    ip_address TEXT,
    country TEXT,
    city TEXT
);

CREATE INDEX IF NOT EXISTS idx_sponsor_clicks_cosplaytsumiko_clicked_at
ON public.sponsor_clicks_cosplaytsumiko (clicked_at);

CREATE INDEX IF NOT EXISTS idx_sponsor_clicks_cosplaytsumiko_ip_hash
ON public.sponsor_clicks_cosplaytsumiko (ip_hash);
