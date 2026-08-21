-- Adds botid_flagged to the two cosplaytsumiko click tables that were created AFTER the
-- network-wide 015_click_botid_flagged.sql run and so never received the column:
-- fanspedia's sponsor_clicks_cosplaytsumiko and onlyaussiefans' sponsor_clicks_oaussief_cosplaytsumiko
-- (findbyface's own _fbf table was created with it already). Without this, the panel's
-- activity feed (src/lib/panelStats.ts selects botid_flagged) gets a 400 from PostgREST for
-- those two sources and silently omits both sites.
--
-- Same shared Supabase project as every prior click migration — run ONCE in the SQL Editor,
-- copied into each affected site's own migrations folder for history. Safe to re-run.
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'sponsor_clicks_cosplaytsumiko',
    'sponsor_clicks_oaussief_cosplaytsumiko'
  ]
  LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t) THEN
      EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS botid_flagged boolean', t);
    END IF;
  END LOOP;
END $$;
