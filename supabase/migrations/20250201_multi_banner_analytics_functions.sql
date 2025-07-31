-- Multi-Banner Analytics Database Functions (CORRECTED)
-- Migration: 20250201_multi_banner_analytics_functions.sql
-- Purpose: Add comprehensive multi-banner analytics functions for BookTalks Buddy
-- Fixed: UUID/TEXT casting issues, timestamp type mismatches, and function deployment issues

-- =========================
-- Multi-Banner Analytics Summary Function
-- =========================
CREATE OR REPLACE FUNCTION get_multi_banner_analytics_summary(
  p_store_id UUID,
  p_days_back INTEGER DEFAULT 30
) RETURNS TABLE (
  total_impressions BIGINT,
  total_clicks BIGINT,
  overall_ctr DECIMAL,
  active_banners_count BIGINT,
  top_performing_banner_id TEXT,
  worst_performing_banner_id TEXT,
  avg_ctr_all_banners DECIMAL,
  total_sessions BIGINT,
  unique_visitors BIGINT
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  WITH banner_stats AS (
    SELECT
      element_id as banner_id,
      COUNT(CASE WHEN event_type = 'banner_view' THEN 1 END) as impressions,
      COUNT(CASE WHEN event_type = 'banner_click' THEN 1 END) as clicks,
      COUNT(DISTINCT session_id) as sessions,
      COUNT(DISTINCT user_id) as unique_users
    FROM store_landing_analytics
    WHERE store_id = p_store_id
      AND section_name = 'banners'
      AND timestamp >= NOW() - INTERVAL '1 day' * p_days_back
      AND element_id IS NOT NULL
    GROUP BY element_id
  ),
  banner_ctr AS (
    SELECT
      banner_id,
      impressions,
      clicks,
      sessions,
      unique_users,
      CASE
        WHEN impressions > 0 THEN ROUND((clicks::DECIMAL / impressions::DECIMAL) * 100, 2)
        ELSE 0
      END as ctr
    FROM banner_stats
  ),
  summary_stats AS (
    SELECT
      SUM(impressions) as total_imp,
      SUM(clicks) as total_cl,
      SUM(sessions) as total_sess,
      SUM(unique_users) as total_users,
      COUNT(*) as banner_count,
      AVG(ctr) as avg_ctr
    FROM banner_ctr
  ),
  top_banner AS (
    SELECT banner_id as top_id
    FROM banner_ctr
    ORDER BY ctr DESC, clicks DESC
    LIMIT 1
  ),
  worst_banner AS (
    SELECT banner_id as worst_id
    FROM banner_ctr
    ORDER BY ctr ASC, clicks ASC
    LIMIT 1
  )
  SELECT
    COALESCE(s.total_imp, 0) as total_impressions,
    COALESCE(s.total_cl, 0) as total_clicks,
    CASE
      WHEN s.total_imp > 0 THEN ROUND((s.total_cl::DECIMAL / s.total_imp::DECIMAL) * 100, 2)
      ELSE 0
    END as overall_ctr,
    COALESCE(s.banner_count, 0) as active_banners_count,
    COALESCE(t.top_id, 'None') as top_performing_banner_id,
    COALESCE(w.worst_id, 'None') as worst_performing_banner_id,
    COALESCE(ROUND(s.avg_ctr, 2), 0) as avg_ctr_all_banners,
    COALESCE(s.total_sess, 0) as total_sessions,
    COALESCE(s.total_users, 0) as unique_visitors
  FROM summary_stats s
  CROSS JOIN top_banner t
  CROSS JOIN worst_banner w;
END;
$$;

-- =========================
-- Individual Banner Performance with Ranking Function (FIXED UUID CASTING)
-- =========================
CREATE OR REPLACE FUNCTION get_banner_performance_with_ranking(
  p_store_id UUID,
  p_days_back INTEGER DEFAULT 30
) RETURNS TABLE (
  banner_id TEXT,
  banner_title TEXT,
  impressions BIGINT,
  clicks BIGINT,
  ctr DECIMAL,
  performance_rank INTEGER,
  performance_percentile DECIMAL,
  sessions BIGINT,
  unique_visitors BIGINT,
  avg_view_duration DECIMAL,
  device_breakdown JSONB
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  WITH banner_stats AS (
    SELECT
      sla.element_id as banner_id,
      spb.title as banner_title,
      COUNT(CASE WHEN sla.event_type = 'banner_view' THEN 1 END) as impressions,
      COUNT(CASE WHEN sla.event_type = 'banner_click' THEN 1 END) as clicks,
      COUNT(DISTINCT sla.session_id) as sessions,
      COUNT(DISTINCT sla.user_id) as unique_users,
      AVG(
        CASE
          WHEN sla.interaction_data->>'viewDuration' IS NOT NULL
          THEN (sla.interaction_data->>'viewDuration')::DECIMAL
          ELSE 0
        END
      ) as avg_duration,
      jsonb_build_object(
        'mobile', COUNT(CASE WHEN sla.interaction_data->>'deviceType' = 'mobile' THEN 1 END),
        'desktop', COUNT(CASE WHEN sla.interaction_data->>'deviceType' = 'desktop' THEN 1 END),
        'tablet', COUNT(CASE WHEN sla.interaction_data->>'deviceType' = 'tablet' THEN 1 END)
      ) as device_breakdown
    FROM store_landing_analytics sla
    LEFT JOIN store_promotional_banners spb ON spb.id::TEXT = sla.element_id
    WHERE sla.store_id = p_store_id
      AND sla.section_name = 'banners'
      AND sla.timestamp >= NOW() - INTERVAL '1 day' * p_days_back
      AND sla.element_id IS NOT NULL
    GROUP BY sla.element_id, spb.title
  ),
  banner_ctr AS (
    SELECT 
      banner_id,
      banner_title,
      impressions,
      clicks,
      sessions,
      unique_users,
      avg_duration,
      device_breakdown,
      CASE 
        WHEN impressions > 0 THEN ROUND((clicks::DECIMAL / impressions::DECIMAL) * 100, 2)
        ELSE 0 
      END as ctr
    FROM banner_stats
  ),
  ranked_banners AS (
    SELECT 
      *,
      ROW_NUMBER() OVER (ORDER BY ctr DESC, clicks DESC) as rank,
      ROUND(
        (ROW_NUMBER() OVER (ORDER BY ctr DESC, clicks DESC) - 1)::DECIMAL / 
        GREATEST(COUNT(*) OVER () - 1, 1)::DECIMAL * 100, 
        2
      ) as percentile
    FROM banner_ctr
  )
  SELECT 
    rb.banner_id,
    COALESCE(rb.banner_title, 'Unknown Banner') as banner_title,
    rb.impressions,
    rb.clicks,
    rb.ctr,
    rb.rank::INTEGER as performance_rank,
    rb.percentile as performance_percentile,
    rb.sessions,
    rb.unique_users,
    COALESCE(ROUND(rb.avg_duration, 2), 0) as avg_view_duration,
    rb.device_breakdown
  FROM ranked_banners rb
  ORDER BY rb.rank;
END;
$$;

-- =========================
-- Banner Time Series Data Function (FIXED TIMESTAMP TYPE)
-- =========================
CREATE OR REPLACE FUNCTION get_banner_time_series_data(
  p_store_id UUID,
  p_days_back INTEGER DEFAULT 30,
  p_interval_type TEXT DEFAULT 'day'
) RETURNS TABLE (
  time_period TIMESTAMP WITH TIME ZONE,
  banner_id TEXT,
  impressions BIGINT,
  clicks BIGINT,
  ctr DECIMAL,
  unique_sessions BIGINT
) LANGUAGE plpgsql AS $$
DECLARE
  interval_format TEXT;
BEGIN
  -- Set interval format based on type
  CASE p_interval_type
    WHEN 'hour' THEN interval_format := 'YYYY-MM-DD HH24:00:00';
    WHEN 'day' THEN interval_format := 'YYYY-MM-DD 00:00:00';
    WHEN 'week' THEN interval_format := 'IYYY-IW';
    ELSE interval_format := 'YYYY-MM-DD 00:00:00';
  END CASE;

  RETURN QUERY
  WITH time_series AS (
    SELECT
      DATE_TRUNC(p_interval_type, timestamp) as period,
      element_id as banner_id,
      COUNT(CASE WHEN event_type = 'banner_view' THEN 1 END) as impressions,
      COUNT(CASE WHEN event_type = 'banner_click' THEN 1 END) as clicks,
      COUNT(DISTINCT session_id) as sessions
    FROM store_landing_analytics
    WHERE store_id = p_store_id
      AND section_name = 'banners'
      AND timestamp >= NOW() - INTERVAL '1 day' * p_days_back
      AND element_id IS NOT NULL
    GROUP BY DATE_TRUNC(p_interval_type, timestamp), element_id
  )
  SELECT
    ts.period as time_period,
    ts.banner_id,
    ts.impressions,
    ts.clicks,
    CASE
      WHEN ts.impressions > 0 THEN ROUND((ts.clicks::DECIMAL / ts.impressions::DECIMAL) * 100, 2)
      ELSE 0
    END as ctr,
    ts.sessions as unique_sessions
  FROM time_series ts
  ORDER BY ts.period DESC, ts.banner_id;
END;
$$;

-- =========================
-- Banner Comparison Data Function (FIXED UUID CASTING)
-- =========================
CREATE OR REPLACE FUNCTION get_banner_comparison_data(
  p_store_id UUID,
  p_banner_ids TEXT[],
  p_days_back INTEGER DEFAULT 30
) RETURNS TABLE (
  banner_id TEXT,
  banner_title TEXT,
  impressions BIGINT,
  clicks BIGINT,
  ctr DECIMAL,
  performance_score DECIMAL,
  engagement_rate DECIMAL,
  conversion_rate DECIMAL
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  WITH banner_metrics AS (
    SELECT
      sla.element_id as banner_id,
      spb.title as banner_title,
      COUNT(CASE WHEN sla.event_type = 'banner_view' THEN 1 END) as impressions,
      COUNT(CASE WHEN sla.event_type = 'banner_click' THEN 1 END) as clicks,
      COUNT(CASE WHEN sla.event_type = 'banner_detail_view' THEN 1 END) as detail_views,
      COUNT(DISTINCT sla.session_id) as sessions
    FROM store_landing_analytics sla
    LEFT JOIN store_promotional_banners spb ON spb.id::TEXT = sla.element_id
    WHERE sla.store_id = p_store_id
      AND sla.section_name = 'banners'
      AND sla.timestamp >= NOW() - INTERVAL '1 day' * p_days_back
      AND (p_banner_ids IS NULL OR sla.element_id = ANY(p_banner_ids))
      AND sla.element_id IS NOT NULL
    GROUP BY sla.element_id, spb.title
  )
  SELECT 
    bm.banner_id,
    COALESCE(bm.banner_title, 'Unknown Banner') as banner_title,
    bm.impressions,
    bm.clicks,
    CASE 
      WHEN bm.impressions > 0 THEN ROUND((bm.clicks::DECIMAL / bm.impressions::DECIMAL) * 100, 2)
      ELSE 0 
    END as ctr,
    -- Performance score (weighted combination of CTR and engagement)
    CASE 
      WHEN bm.impressions > 0 THEN 
        ROUND(
          ((bm.clicks::DECIMAL / bm.impressions::DECIMAL) * 70) + 
          ((bm.detail_views::DECIMAL / GREATEST(bm.clicks, 1)::DECIMAL) * 30), 
          2
        )
      ELSE 0 
    END as performance_score,
    -- Engagement rate (clicks + detail views / impressions)
    CASE 
      WHEN bm.impressions > 0 THEN 
        ROUND(((bm.clicks + bm.detail_views)::DECIMAL / bm.impressions::DECIMAL) * 100, 2)
      ELSE 0 
    END as engagement_rate,
    -- Conversion rate (detail views / clicks)
    CASE 
      WHEN bm.clicks > 0 THEN ROUND((bm.detail_views::DECIMAL / bm.clicks::DECIMAL) * 100, 2)
      ELSE 0 
    END as conversion_rate
  FROM banner_metrics bm
  ORDER BY performance_score DESC;
END;
$$;

-- =========================
-- Create Indexes for Performance Optimization
-- =========================

-- Index for banner analytics queries
CREATE INDEX IF NOT EXISTS idx_store_landing_analytics_banner_queries 
ON store_landing_analytics (store_id, section_name, element_id, timestamp) 
WHERE section_name = 'banners';

-- Index for time-series queries
CREATE INDEX IF NOT EXISTS idx_store_landing_analytics_banner_timeseries 
ON store_landing_analytics (store_id, section_name, timestamp, element_id) 
WHERE section_name = 'banners';

-- Index for session-based queries
CREATE INDEX IF NOT EXISTS idx_store_landing_analytics_banner_sessions 
ON store_landing_analytics (store_id, section_name, session_id, timestamp) 
WHERE section_name = 'banners';

-- =========================
-- Grant Permissions
-- =========================

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_multi_banner_analytics_summary(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_banner_performance_with_ranking(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_banner_time_series_data(UUID, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_banner_comparison_data(UUID, TEXT[], INTEGER) TO authenticated;

-- Add RLS policies for the functions (they inherit from table policies)
-- The functions will automatically respect existing RLS policies on store_landing_analytics table
