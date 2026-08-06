-- Adds link_verified to every sponsor_clicks_* table across the whole network. Same shared
-- Supabase project as 013_click_ip_hash_and_datacenter_flag.sql — run once, copied into each
-- site's own migrations folder for that repo's history. Safe to re-run.
--
-- link_verified: true when the click carried a valid, unexpired, signed token
-- (src/lib/clickToken.ts / CLICK_TOKEN_SECRET) that client-side JS fetched, on demand, from an
-- always-uncached endpoint (src/pages/api/click-token.ts) after the page had already loaded in
-- a real browser — i.e. the request wasn't just a script guessing the /go/<username> URL cold,
-- which is the exact pattern behind every confirmed bot hit audited so far. Not proof against a
-- deliberate actor who replicates the token-minting call directly — see the caveats in
-- click-token.ts. false/null means no such token was present. This does NOT gate logging (see
-- the route) — it's a reporting signal for now, not a block, so a real click is never silently
-- dropped due to a token-coverage gap in this rollout.
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
      EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS link_verified boolean', t);
    END IF;
  END LOOP;
END $$;
