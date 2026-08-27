-- Sponsor click tracking: rinayanami
-- Run once in the Supabase SQL Editor before deploying the placement.
--
-- Created with the full current click schema up front — base columns (002-004)
-- plus the integrity/geo columns the older tables gained via 005-007
-- (ip_hash / is_datacenter_ip, link_verified, ip_address / country / city) and
-- botid_flagged (network-wide 015 / local 009), since src/app/go/[username]/route.ts
-- and the client panel (findbyface src/lib/panelStats.ts) read all of them.

CREATE TABLE IF NOT EXISTS public.sponsor_clicks_rinayanami (
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
    city TEXT,
    botid_flagged BOOLEAN
);

CREATE INDEX IF NOT EXISTS idx_sponsor_clicks_rinayanami_clicked_at
ON public.sponsor_clicks_rinayanami (clicked_at);

CREATE INDEX IF NOT EXISTS idx_sponsor_clicks_rinayanami_ip_hash
ON public.sponsor_clicks_rinayanami (ip_hash);
