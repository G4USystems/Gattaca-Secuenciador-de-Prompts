-- Verification script to check if all required columns exist
-- Run this in Supabase SQL Editor to diagnose issues

-- Check ecp_campaigns table structure
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM
    information_schema.columns
WHERE
    table_name = 'ecp_campaigns'
ORDER BY
    ordinal_position;

-- Expected columns:
-- - id (uuid)
-- - project_id (uuid)
-- - ecp_name (text)
-- - problem_core (text)
-- - country (text)
-- - industry (text)
-- - status (text)
-- - step_outputs (jsonb) -- NEW
-- - current_step_id (text) -- NEW
-- - started_at (timestamptz) -- NEW
-- - completed_at (timestamptz) -- NEW
-- - created_at (timestamptz)
-- - updated_at (timestamptz)

-- If step_outputs, current_step_id, started_at, completed_at are missing,
-- you need to run the migration: 20250119000001_add_flow_config.sql
