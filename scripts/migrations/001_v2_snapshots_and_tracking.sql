-- ============================================================================
-- OnlyFans Scraper V2 Migration: Snapshot & Progress Tracking
-- ============================================================================
-- Purpose: Add historical snapshots, crawl metadata, and progress tracking
-- Safety: All changes are ADDITIVE (ALTER TABLE ADD COLUMN IF NOT EXISTS)
-- Date: 2025-11-10
-- ============================================================================

-- 1. Extend existing onlyfans_profiles table with tracking columns
-- ============================================================================
ALTER TABLE onlyfans_profiles 
ADD COLUMN IF NOT EXISTS first_seen_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS last_refreshed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS next_refresh_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Add index for scheduling refreshes
CREATE INDEX IF NOT EXISTS idx_profiles_next_refresh 
ON onlyfans_profiles(next_refresh_at) 
WHERE next_refresh_at IS NOT NULL;

-- Add index for status filtering
CREATE INDEX IF NOT EXISTS idx_profiles_status 
ON onlyfans_profiles(status);

-- Add partial index for active performers
CREATE INDEX IF NOT EXISTS idx_profiles_active_performers 
ON onlyfans_profiles(id) 
WHERE status = 'active' AND isverified = true;

-- Add comment documenting status values
COMMENT ON COLUMN onlyfans_profiles.status IS 'Enum: active | inactive | deleted | private | non_performer | unknown';

-- 2. Create snapshots table for longitudinal metrics
-- ============================================================================
CREATE TABLE IF NOT EXISTS onlyfans_profile_snapshots (
    snapshot_id BIGSERIAL PRIMARY KEY,
    creator_id BIGINT NOT NULL,
    captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Core metrics for growth tracking
    subscribeprice NUMERIC(10,2),
    favoritedcount BIGINT,
    subscriberscount BIGINT,
    postscount BIGINT,
    photoscount BIGINT,
    videoscount BIGINT,
    audioscount BIGINT,
    
    -- Verification and promotion
    isverified BOOLEAN,
    canpromotion BOOLEAN,
    haspinnedposts BOOLEAN,
    hasstories BOOLEAN,
    hasstreamlive BOOLEAN,
    
    -- Bundles and discounts
    bundle1_price NUMERIC(10,2),
    bundle2_price NUMERIC(10,2),
    bundle3_price NUMERIC(10,2),
    promotion1_price NUMERIC(10,2),
    promotion1_discount INTEGER,
    
    -- Optional raw JSON for future field expansion
    raw_json JSONB,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for querying snapshots by creator
CREATE INDEX IF NOT EXISTS idx_snapshots_creator_time 
ON onlyfans_profile_snapshots(creator_id, captured_at DESC);

-- Index for time-series queries
CREATE INDEX IF NOT EXISTS idx_snapshots_captured_at 
ON onlyfans_profile_snapshots(captured_at DESC);

-- Optional GIN index for raw_json queries
CREATE INDEX IF NOT EXISTS idx_snapshots_raw_json 
ON onlyfans_profile_snapshots USING GIN(raw_json);

-- Unique constraint to prevent duplicate snapshots same day (optional)
-- Uncomment if you want daily compression:
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_snapshots_creator_day 
-- ON onlyfans_profile_snapshots(creator_id, DATE(captured_at));

-- Add foreign key constraint (if onlyfans_profiles has PK on id)
-- ALTER TABLE onlyfans_profile_snapshots 
-- ADD CONSTRAINT fk_snapshots_creator 
-- FOREIGN KEY (creator_id) REFERENCES onlyfans_profiles(id) 
-- ON DELETE CASCADE;

-- 3. Create crawl_runs table for execution tracking
-- ============================================================================
CREATE TABLE IF NOT EXISTS crawl_runs (
    run_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_type TEXT NOT NULL, -- 'discovery' | 'refresh' | 'manual'
    
    -- Time tracking
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at TIMESTAMPTZ,
    duration_seconds INTEGER GENERATED ALWAYS AS (
        EXTRACT(EPOCH FROM (finished_at - started_at))::INTEGER
    ) STORED,
    
    -- Stats
    total_attempted INTEGER DEFAULT 0,
    total_success INTEGER DEFAULT 0,
    total_skipped INTEGER DEFAULT 0,
    total_errors INTEGER DEFAULT 0,
    
    -- ID range scanned
    start_id BIGINT,
    end_id BIGINT,
    
    -- Status
    status TEXT DEFAULT 'running', -- 'running' | 'completed' | 'failed' | 'partial'
    error_message TEXT,
    
    -- Config snapshot
    config_json JSONB,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for recent runs
CREATE INDEX IF NOT EXISTS idx_crawl_runs_started 
ON crawl_runs(started_at DESC);

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_crawl_runs_status 
ON crawl_runs(status);

-- Add comment
COMMENT ON COLUMN crawl_runs.run_type IS 'Type: discovery (ID scan) | refresh (re-scrape existing) | manual (ad-hoc)';
COMMENT ON COLUMN crawl_runs.status IS 'Status: running | completed | failed | partial';

-- 4. Create scan_progress table for resume capability
-- ============================================================================
CREATE TABLE IF NOT EXISTS scan_progress (
    id SERIAL PRIMARY KEY,
    last_id_scanned BIGINT NOT NULL DEFAULT 0,
    max_id_seen BIGINT NOT NULL DEFAULT 0,
    total_creators_found BIGINT DEFAULT 0,
    total_scanned BIGINT DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Single-row enforcement
    CONSTRAINT only_one_row CHECK (id = 1)
);

-- Initialize with default row if table is empty
INSERT INTO scan_progress (id, last_id_scanned, max_id_seen, updated_at)
VALUES (1, 0, 0, NOW())
ON CONFLICT (id) DO NOTHING;

-- Index (though single-row table doesn't strictly need it)
CREATE INDEX IF NOT EXISTS idx_scan_progress_updated 
ON scan_progress(updated_at DESC);

-- 5. Create crawl_jobs table (optional, for sharding/parallelization)
-- ============================================================================
CREATE TABLE IF NOT EXISTS crawl_jobs (
    job_id BIGSERIAL PRIMARY KEY,
    run_id UUID REFERENCES crawl_runs(run_id) ON DELETE CASCADE,
    
    -- Job range
    start_id BIGINT NOT NULL,
    end_id BIGINT NOT NULL,
    
    -- Progress
    current_id BIGINT,
    completed_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    
    -- Status
    status TEXT DEFAULT 'pending', -- 'pending' | 'running' | 'completed' | 'failed'
    
    -- Worker assignment (for distributed scraping)
    worker_id TEXT,
    assigned_at TIMESTAMPTZ,
    
    -- Timestamps
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for job queue
CREATE INDEX IF NOT EXISTS idx_crawl_jobs_run 
ON crawl_jobs(run_id, status);

CREATE INDEX IF NOT EXISTS idx_crawl_jobs_status 
ON crawl_jobs(status) 
WHERE status IN ('pending', 'running');

CREATE INDEX IF NOT EXISTS idx_crawl_jobs_worker 
ON crawl_jobs(worker_id) 
WHERE worker_id IS NOT NULL;

-- ============================================================================
-- Materialized View: Daily Aggregated Metrics (Optional Performance Boost)
-- ============================================================================
-- Uncomment to create a pre-aggregated daily view for faster dashboard queries

/*
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_creator_metrics AS
SELECT 
    creator_id,
    DATE(captured_at) AS metric_date,
    MAX(favoritedcount) AS max_favoritedcount,
    MAX(subscriberscount) AS max_subscriberscount,
    MAX(postscount) AS max_postscount,
    MAX(subscribeprice) AS max_subscribeprice,
    COUNT(*) AS snapshot_count
FROM onlyfans_profile_snapshots
GROUP BY creator_id, DATE(captured_at);

-- Index for efficient lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_metrics_creator_date 
ON daily_creator_metrics(creator_id, metric_date DESC);

-- Refresh command (run daily via cron):
-- REFRESH MATERIALIZED VIEW CONCURRENTLY daily_creator_metrics;
*/

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Function to update scan progress atomically
CREATE OR REPLACE FUNCTION update_scan_progress(
    p_last_id BIGINT,
    p_max_id BIGINT,
    p_creators_delta BIGINT DEFAULT 0,
    p_scanned_delta BIGINT DEFAULT 1
)
RETURNS void AS $$
BEGIN
    UPDATE scan_progress
    SET 
        last_id_scanned = GREATEST(last_id_scanned, p_last_id),
        max_id_seen = GREATEST(max_id_seen, p_max_id),
        total_creators_found = total_creators_found + p_creators_delta,
        total_scanned = total_scanned + p_scanned_delta,
        updated_at = NOW()
    WHERE id = 1;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate next refresh time based on status
CREATE OR REPLACE FUNCTION calculate_next_refresh(
    p_status TEXT,
    p_last_refreshed TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TIMESTAMPTZ AS $$
BEGIN
    RETURN CASE p_status
        WHEN 'active' THEN p_last_refreshed + INTERVAL '7 days'
        WHEN 'inactive' THEN p_last_refreshed + INTERVAL '14 days'
        WHEN 'deleted' THEN p_last_refreshed + INTERVAL '30 days'
        WHEN 'private' THEN p_last_refreshed + INTERVAL '14 days'
        WHEN 'non_performer' THEN NULL -- Don't refresh
        ELSE p_last_refreshed + INTERVAL '7 days'
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- Grants (adjust roles as needed for your Supabase setup)
-- ============================================================================
-- Example for service_role:
-- GRANT ALL ON TABLE onlyfans_profile_snapshots TO service_role;
-- GRANT ALL ON TABLE crawl_runs TO service_role;
-- GRANT ALL ON TABLE scan_progress TO service_role;
-- GRANT ALL ON TABLE crawl_jobs TO service_role;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- ============================================================================
-- Migration Complete
-- ============================================================================
-- To apply this migration:
-- 1. Connect to Supabase SQL Editor
-- 2. Copy and paste this entire file
-- 3. Execute
-- 4. Verify tables created: SELECT * FROM scan_progress;
-- ============================================================================

SELECT id, username, name, status, first_seen_at, last_seen_at
FROM onlyfans_profiles
ORDER BY first_seen_at DESC
LIMIT 10;
