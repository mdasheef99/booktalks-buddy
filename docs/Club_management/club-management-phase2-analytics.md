# Phase 2: Analytics Dashboard (Weeks 3-4)

## Overview

This document provides detailed implementation guidance for Phase 2 of the Club-Level Management Features in BookConnect. Phase 2 implements the club analytics dashboard with moderator permission controls.

**Reference Documents:**
- [Implementation Overview](./club-management-implementation-phases.md)
- [Phase 1: Foundation](./club-management-phase1-foundation.md)
- [Phase 3: Events](./club-management-phase3-events.md)
- [Progress Tracking](./club-management-progress-tracking.md)

**Phase Duration:** Weeks 3-4  
**Status:** ⏳ PENDING (Awaiting Phase 1 completion)  
**Prerequisites:** Phase 1 completion

---

## Objectives
- Implement basic club analytics dashboard
- Add moderator permission toggle system
- Establish data collection and visualization foundation
- Provide immediate value to club leads

---

## Week 3: Basic Analytics Implementation

### Primary Tasks
1. **Analytics Data Collection**
   - Implement daily snapshot creation
   - Create real-time metric calculations
   - Set up data aggregation functions

2. **Basic Dashboard UI**
   - Member count and growth metrics
   - Discussion activity overview
   - Current book progress summary
   - Simple data visualizations

3. **Permission System**
   - Moderator analytics access toggle
   - Permission-based UI rendering
   - Access control implementation

### Technical Requirements

#### Analytics Data Structure
```typescript
interface BasicClubAnalytics {
  memberMetrics: {
    totalMembers: number;
    activeMembersThisWeek: number;
    newMembersThisMonth: number;
    memberGrowthTrend: number[];
  };
  
  discussionMetrics: {
    totalTopics: number;
    totalPosts: number;
    postsThisWeek: number;
    averagePostsPerTopic: number;
  };
  
  bookMetrics: {
    currentBook: string | null;
    booksReadThisYear: number;
    averageReadingTime: number;
  };
  
  moderatorAccess: {
    analyticsEnabled: boolean;
  };
}
```

#### API Contracts
```typescript
// Analytics API endpoints
interface AnalyticsAPI {
  // GET /api/clubs/:clubId/analytics/summary
  getAnalyticsSummary: (clubId: string) => Promise<BasicClubAnalytics>;
  
  // GET /api/clubs/:clubId/analytics/trends?period=week|month|year
  getAnalyticsTrends: (clubId: string, period: string) => Promise<TrendData>;
  
  // POST /api/clubs/:clubId/moderators/:moderatorId/analytics-access
  toggleModeratorAnalytics: (clubId: string, moderatorId: string, enabled: boolean) => Promise<void>;
  
  // GET /api/clubs/:clubId/analytics/export?format=pdf|csv
  exportAnalytics: (clubId: string, format: string) => Promise<Blob>;
}
```

#### Database Functions
```sql
-- Optimized analytics summary function
CREATE OR REPLACE FUNCTION get_club_analytics_summary(p_club_id UUID)
RETURNS TABLE (
  member_count INTEGER,
  active_members_week INTEGER,
  discussion_count INTEGER,
  reading_completion_rate DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM club_members WHERE club_id = p_club_id AND role != 'pending')::INTEGER,
    (SELECT COUNT(DISTINCT user_id) FROM discussion_posts dp 
     JOIN discussion_topics dt ON dp.topic_id = dt.id 
     WHERE dt.club_id = p_club_id AND dp.created_at > NOW() - INTERVAL '7 days')::INTEGER,
    (SELECT COUNT(*) FROM discussion_topics WHERE club_id = p_club_id)::INTEGER,
    (SELECT COALESCE(AVG(CASE WHEN status = 'finished' THEN 100.0 ELSE 0.0 END), 0.0)
     FROM member_reading_progress WHERE club_id = p_club_id)::DECIMAL;
END;
$$ LANGUAGE plpgsql;
```

### Success Criteria
- [ ] Analytics data displays correctly
- [ ] Moderator permission toggle works
- [ ] Performance meets requirements (<2s load time)
- [ ] Mobile responsive design
- [ ] Error handling for missing data

---

## Week 4: Enhanced Analytics & Optimization

### Primary Tasks
1. **Advanced Metrics**
   - Reading completion rates
   - Member engagement scores
   - Activity trend analysis
   - Comparative period analysis

2. **Performance Optimization**
   - Implement caching strategy
   - Optimize database queries
   - Add loading states and skeletons

3. **Data Export & Sharing**
   - Export analytics to PDF/CSV
   - Shareable analytics summaries
   - Historical data access

### Technical Requirements

#### Enhanced Analytics
```typescript
interface EnhancedAnalytics extends BasicClubAnalytics {
  engagementMetrics: {
    memberEngagementScore: number;
    discussionParticipationRate: number;
    readingCompletionRate: number;
    meetingAttendanceRate: number;
  };
  
  trendAnalysis: {
    memberGrowthTrend: 'growing' | 'stable' | 'declining';
    activityTrend: 'increasing' | 'stable' | 'decreasing';
    engagementTrend: 'improving' | 'stable' | 'declining';
  };
  
  comparativePeriods: {
    previousWeek: AnalyticsSummary;
    previousMonth: AnalyticsSummary;
    yearOverYear: AnalyticsSummary;
  };
}
```

#### Performance Optimization
```typescript
// Caching strategy
interface AnalyticsCaching {
  snapshotCache: Map<string, AnalyticsSnapshot>;
  realTimeCache: Map<string, BasicClubAnalytics>;
  cacheExpiry: number; // 5 minutes for real-time data
  snapshotExpiry: number; // 24 hours for snapshot data
}

// Loading states
interface AnalyticsLoadingStates {
  loadingBasicMetrics: boolean;
  loadingTrends: boolean;
  loadingExport: boolean;
  error: string | null;
}
```

### Success Criteria
- [ ] All analytics features functional
- [ ] Performance optimized
- [ ] Export functionality working
- [ ] Historical data accessible
- [ ] User feedback positive

### Dependencies
- Phase 1 completion
- Database analytics functions
- Permission system

### Risk Mitigation
- **Risk:** Analytics queries impacting performance
- **Mitigation:** Snapshot-based calculations, query optimization
- **Fallback:** Simplified metrics with better performance

---

## Implementation Notes

### Data Collection Strategy
1. **Daily Snapshots:** Automated job creates daily analytics snapshots
2. **Real-time Calculations:** Current day metrics calculated on-demand
3. **Caching:** Aggressive caching for frequently accessed data
4. **Lazy Loading:** Load analytics only when analytics tab is accessed

### UI/UX Considerations
1. **Progressive Disclosure:** Show basic metrics first, advanced on demand
2. **Mobile Optimization:** Responsive charts and tables
3. **Loading States:** Skeleton loaders for better perceived performance
4. **Error Handling:** Graceful degradation when data unavailable

### Security Considerations
1. **Permission Checks:** Server-side validation for all analytics access
2. **Data Isolation:** Club-scoped queries only
3. **Rate Limiting:** Prevent abuse of analytics endpoints
4. **Export Security:** Secure file generation and download

---

## Next Steps

1. **Complete Phase 1:** Ensure foundation is solid before beginning analytics
2. **Database Setup:** Execute analytics table migrations
3. **API Development:** Implement analytics endpoints
4. **UI Implementation:** Create analytics dashboard components
5. **Testing:** Comprehensive testing of analytics features

---

*This document is part of the living implementation guide and will be updated with progress and learnings throughout Phase 2 development.*
