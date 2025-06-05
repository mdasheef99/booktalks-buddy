-- Migration: Optimize Community Metrics Performance
-- Date: 2025-01-25
-- Purpose: Create optimized database function for community metrics to replace multiple sequential queries

-- Create optimized function for community metrics
CREATE OR REPLACE FUNCTION get_community_metrics_optimized(
  p_store_id UUID,
  p_thirty_days_ago TIMESTAMP WITH TIME ZONE,
  p_first_of_month TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE (
  active_members BIGINT,
  total_clubs BIGINT,
  recent_discussions BIGINT,
  books_discussed_this_month BIGINT,
  new_members_this_month BIGINT
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH store_clubs AS (
    SELECT id as club_id
    FROM book_clubs 
    WHERE store_id = p_store_id
  ),
  metrics AS (
    SELECT 
      -- Active members count (distinct users across all store clubs)
      (SELECT COUNT(DISTINCT cm.user_id)
       FROM club_members cm
       INNER JOIN store_clubs sc ON cm.club_id = sc.club_id
      ) as active_members,
      
      -- Total clubs count
      (SELECT COUNT(*)
       FROM store_clubs
      ) as total_clubs,
      
      -- Recent discussions count (last 30 days)
      (SELECT COUNT(*)
       FROM discussion_topics dt
       INNER JOIN store_clubs sc ON dt.club_id = sc.club_id
       WHERE dt.created_at >= p_thirty_days_ago
      ) as recent_discussions,
      
      -- Books discussed this month
      (SELECT COUNT(*)
       FROM current_books cb
       INNER JOIN store_clubs sc ON cb.club_id = sc.club_id
       WHERE cb.set_at >= p_first_of_month
      ) as books_discussed_this_month,
      
      -- New members this month
      (SELECT COUNT(*)
       FROM club_members cm
       INNER JOIN store_clubs sc ON cm.club_id = sc.club_id
       WHERE cm.joined_at >= p_first_of_month
      ) as new_members_this_month
  )
  SELECT 
    m.active_members,
    m.total_clubs,
    m.recent_discussions,
    m.books_discussed_this_month,
    m.new_members_this_month
  FROM metrics m;
END;
$$;

-- Create indexes for performance optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_club_members_club_id_joined_at 
ON club_members (club_id, joined_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_discussion_topics_club_id_created_at 
ON discussion_topics (club_id, created_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_current_books_club_id_set_at 
ON current_books (club_id, set_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_book_clubs_store_id 
ON book_clubs (store_id);

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_community_metrics_optimized(UUID, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_community_metrics_optimized(UUID, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) TO anon;

-- Add comment for documentation
COMMENT ON FUNCTION get_community_metrics_optimized IS 'Optimized function to calculate community metrics for a store in a single query, replacing multiple sequential database calls for improved performance';

-- ===== QUOTES OPTIMIZATION =====

-- Create indexes for quotes performance optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_store_custom_quotes_active_dates
ON store_custom_quotes (store_id, is_active, start_date, end_date);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_store_custom_quotes_display_order
ON store_custom_quotes (store_id, display_order, created_at);

-- Add comment for quotes optimization
COMMENT ON INDEX idx_store_custom_quotes_active_dates IS 'Composite index for optimized active quotes filtering by store, active status, and date ranges';
COMMENT ON INDEX idx_store_custom_quotes_display_order IS 'Composite index for optimized quotes ordering by display order and creation date';
