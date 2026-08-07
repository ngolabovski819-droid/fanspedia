-- Adds ip_address, country, and city to every sponsor_clicks_* table across the whole network.
-- Same shared Supabase project as prior click-integrity migrations — run once, copied into
-- each site's own migrations folder for that repo's history. Safe to re-run.
--
-- ip_address: the raw client IP, captured alongside the existing salted ip_hash (never
-- reversed FROM the hash — this is a separate, deliberate capture). Admin-panel-only display
-- (src/lib/panelStats.ts gates this on session.role === 'admin') — never shown to a guest/
-- client login. Exists specifically so the account owner can spot "the same visitor clicked
-- our sponsored placement N times" patterns that a hash alone can't be visually scanned for.
--
-- country / city: sourced from Vercel's edge network geolocation headers
-- (x-vercel-ip-country / x-vercel-ip-city) at click time — no third-party GeoIP service, no
-- extra network call, no cost. Coarse location only, shown to every panel role (client and
-- admin alike) — this is the same level of detail ad platforms like Google/Meta show
-- advertisers, not raw-IP-level.
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
      EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS ip_address text', t);
      EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS country text', t);
      EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS city text', t);
    END IF;
  END LOOP;
END $$;
