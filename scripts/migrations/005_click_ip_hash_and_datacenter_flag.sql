-- Adds click-integrity columns to every sponsor_clicks_* table across the whole network.
-- All 4 sites (findbyface, fanspedia.net, onlyamericanfans.com, onlyaussiefans.com) share ONE
-- Supabase project, so this only needs to be run ONCE against that shared DB — it's copied
-- into each site's own migrations folder for that repo's own history/documentation, not
-- because it needs to run 4 times. Safe to re-run (IF NOT EXISTS everywhere) in case it ever
-- does get run from more than one place.
--
-- ip_hash: SHA-256("<CLICK_IP_SALT>:<client ip>"), computed in application code from the
-- x-forwarded-for header — never the raw IP itself. A salted hash still lets a query find
-- "how many rows share this exact IP in the last N seconds" (for rate-limiting) without this
-- table ever holding anything that identifies a real address at rest.
--
-- is_datacenter_ip: best-effort flag — the raw IP is checked in application code against a
-- small curated list of well-known budget-VPS provider ranges (DigitalOcean/Hetzner/OVH/
-- Linode/Vultr — deliberately not AWS/GCP/Azure, whose allocations are too large and
-- fragmented to hand-maintain reliably) and only the boolean result is stored here, never the
-- IP. This is informational for now (surfaced in reporting), not wired into the block/skip
-- decision — the curated range list is a heuristic, not an authoritative IP-intelligence
-- source, so it isn't trusted to silently drop a click on its own yet.
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'sponsor_clicks_emilylopz_fbf', 'sponsor_clicks_rocketreynaxo_fbf', 'sponsor_clicks_hannazuki_fbf',
    'sponsor_clicks_emilylopz', 'sponsor_clicks_rocketreynaxo', 'sponsor_clicks_hannazuki',
    'sponsor_clicks_emilylopz_oaf', 'sponsor_clicks_rocketreynaxo_oaf', 'sponsor_clicks_hannazuki_oaf',
    'sponsor_clicks_oaussief_emilylopz', 'sponsor_clicks_oaussief_rocketreynaxo', 'sponsor_clicks_oaussief_hannazuki'
  ]
  LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t) THEN
      EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS ip_hash text', t);
      EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS is_datacenter_ip boolean', t);
      EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_ip_hash ON public.%I (ip_hash)', t, t);
    END IF;
  END LOOP;
END $$;
