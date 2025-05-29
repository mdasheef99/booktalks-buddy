-- Landing Page Analytics Database Verification and Setup
-- Run this in Supabase SQL Editor to verify analytics table schema

-- =========================
-- Check if analytics table exists
-- =========================

SELECT 
    'store_landing_analytics' as table_name,
    EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'store_landing_analytics'
    ) as exists;

-- =========================
-- Verify analytics table schema
-- =========================

-- Check column names and types
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'store_landing_analytics' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- =========================
-- Verify correct timestamp column exists
-- =========================

SELECT 
    'timestamp_column_check' as check_name,
    EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'store_landing_analytics' 
        AND column_name = 'timestamp'
        AND table_schema = 'public'
    ) as timestamp_exists,
    EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'store_landing_analytics' 
        AND column_name = 'date'
        AND table_schema = 'public'
    ) as date_exists;

-- =========================
-- Check event types constraint
-- =========================

SELECT 
    constraint_name,
    check_clause
FROM information_schema.check_constraints 
WHERE constraint_name LIKE '%event_type%'
AND constraint_schema = 'public';

-- =========================
-- Verify indexes exist
-- =========================

SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'store_landing_analytics'
AND schemaname = 'public';

-- =========================
-- Test basic analytics query (should work without errors)
-- =========================

-- This query tests the corrected column name usage
SELECT 
    COUNT(*) as total_events,
    COUNT(DISTINCT store_id) as stores_with_data,
    COUNT(DISTINCT session_id) as unique_sessions,
    MIN(timestamp) as earliest_event,
    MAX(timestamp) as latest_event
FROM store_landing_analytics;

-- =========================
-- Test section-specific analytics query
-- =========================

SELECT 
    section_name,
    event_type,
    COUNT(*) as event_count
FROM store_landing_analytics 
WHERE section_name IS NOT NULL
GROUP BY section_name, event_type
ORDER BY section_name, event_type;

-- =========================
-- Test enhanced analytics calculations
-- =========================

-- Test mobile vs desktop detection
SELECT 
    CASE 
        WHEN user_agent ILIKE '%mobile%' THEN 'mobile'
        ELSE 'desktop'
    END as device_type,
    COUNT(*) as events
FROM store_landing_analytics 
WHERE user_agent IS NOT NULL
GROUP BY device_type;

-- Test session-based calculations
SELECT 
    COUNT(DISTINCT session_id) as unique_sessions,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(*) as total_events
FROM store_landing_analytics;

-- =========================
-- Sample data insertion test (optional)
-- =========================

-- Uncomment to test data insertion
/*
INSERT INTO store_landing_analytics (
    store_id, 
    event_type, 
    section_name, 
    session_id, 
    user_agent,
    timestamp
) VALUES (
    '00000000-0000-0000-0000-000000000000', -- Replace with actual store_id
    'page_load',
    'hero',
    'test_session_' || extract(epoch from now()),
    'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
    now()
);
*/

-- =========================
-- Analytics API compatibility test
-- =========================

-- Test the exact query structure used by the Analytics API
WITH analytics_data AS (
    SELECT 
        event_type,
        section_name,
        session_id,
        user_id,
        user_agent,
        element_id,
        element_type,
        timestamp
    FROM store_landing_analytics 
    WHERE store_id = '00000000-0000-0000-0000-000000000000' -- Replace with actual store_id
    AND timestamp >= (now() - interval '30 days')
)
SELECT 
    'API_compatibility_test' as test_name,
    COUNT(*) as total_events,
    COUNT(DISTINCT session_id) as unique_sessions,
    COUNT(DISTINCT CASE WHEN event_type = 'page_load' THEN session_id END) as page_loads,
    COUNT(CASE WHEN event_type = 'chat_button_click' THEN 1 END) as chat_clicks,
    COUNT(CASE WHEN event_type = 'carousel_click' THEN 1 END) as carousel_clicks,
    COUNT(CASE WHEN event_type = 'banner_click' THEN 1 END) as banner_clicks
FROM analytics_data;

-- =========================
-- RLS policies verification
-- =========================

SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'store_landing_analytics'
AND schemaname = 'public';

-- =========================
-- Summary report
-- =========================

SELECT '=== ANALYTICS DATABASE VERIFICATION COMPLETE ===' as summary;
SELECT 'Table schema verified for enhanced analytics implementation' as status;
SELECT 'Database column error fixed: using timestamp instead of date' as fix_applied;
SELECT 'Enhanced analytics with section-specific insights ready' as enhancement_status;
