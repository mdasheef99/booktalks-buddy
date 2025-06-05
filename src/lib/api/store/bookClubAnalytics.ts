import { supabase } from '@/lib/supabase';

/**
 * Book Club Analytics API for Store Management
 * Provides insights about book club activities and book discussion trends
 */

// =========================
// TypeScript Interfaces
// =========================

export interface BookClubAnalyticsSummary {
  currentBooksCount: number;
  activeClubsCount: number;
  totalDiscussionsCount: number;
  totalPostsCount: number;
  avgPostsPerDiscussion: number;
  publicClubsCount: number;
  totalMembersCount: number;
  period: string;
}

export interface CurrentBookDiscussion {
  bookTitle: string;
  bookAuthor: string;
  bookId: string | null;
  clubCount: number;
  totalDiscussions: number;
  latestActivity: string;
  clubs: Array<{
    id: string;
    name: string;
    discussionCount: number;
  }>;
}

export interface TrendingBook {
  bookTitle: string;
  bookAuthor: string;
  bookId: string | null;
  discussionCount: number;
  postCount: number;
  clubCount: number;
  trendScore: number;
}

export interface ClubActivityMetrics {
  clubId: string;
  clubName: string;
  memberCount: number;
  discussionCount: number;
  postCount: number;
  currentBookTitle: string | null;
  currentBookAuthor: string | null;
  activityScore: number;
  lastActivity: string | null;
}

// =========================
// Book Club Analytics API Class
// =========================

export class BookClubAnalyticsAPI {
  /**
   * Validate store ownership before making analytics calls
   * This should be called by all public methods to ensure security
   */
  private static async validateStoreOwnership(storeId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Check if user has store ownership or management permissions
      // This will be validated by the database functions as well
      const { data: store, error } = await supabase
        .from('stores')
        .select('id')
        .eq('id', storeId)
        .single();

      if (error || !store) {
        throw new Error('Store not found or access denied');
      }
    } catch (error) {
      console.error('Store ownership validation failed:', error);
      throw new Error('Unauthorized access to store analytics');
    }
  }

  /**
   * Get comprehensive analytics summary for a store's book clubs
   */
  static async getBookClubAnalyticsSummary(
    storeId: string, 
    daysBack: number = 30
  ): Promise<BookClubAnalyticsSummary> {
    try {
      await this.validateStoreOwnership(storeId);

      const { data, error } = await supabase
        .rpc('get_store_book_club_analytics', {
          p_store_id: storeId,
          p_days_back: daysBack
        });

      if (error) {
        console.error('Error fetching book club analytics summary:', error);
        throw error;
      }

      const result = data?.[0] || {
        current_books_count: 0,
        active_clubs_count: 0,
        total_discussions_count: 0,
        total_posts_count: 0,
        avg_posts_per_discussion: 0,
        public_clubs_count: 0,
        total_members_count: 0
      };

      return {
        currentBooksCount: result.current_books_count,
        activeClubsCount: result.active_clubs_count,
        totalDiscussionsCount: result.total_discussions_count,
        totalPostsCount: result.total_posts_count,
        avgPostsPerDiscussion: parseFloat(result.avg_posts_per_discussion) || 0,
        publicClubsCount: result.public_clubs_count,
        totalMembersCount: result.total_members_count,
        period: `${daysBack} days`
      };
    } catch (error) {
      console.error('Error in getBookClubAnalyticsSummary:', error);
      // Return empty summary on error to prevent UI crashes
      return {
        currentBooksCount: 0,
        activeClubsCount: 0,
        totalDiscussionsCount: 0,
        totalPostsCount: 0,
        avgPostsPerDiscussion: 0,
        publicClubsCount: 0,
        totalMembersCount: 0,
        period: `${daysBack} days`
      };
    }
  }

  /**
   * Get all books currently being discussed in store's clubs
   */
  static async getCurrentBookDiscussions(storeId: string): Promise<CurrentBookDiscussion[]> {
    try {
      await this.validateStoreOwnership(storeId);

      const { data, error } = await supabase
        .rpc('get_current_book_discussions', {
          p_store_id: storeId
        });

      if (error) {
        console.error('Error fetching current book discussions:', error);
        throw error;
      }

      return (data || []).map((item: any) => ({
        bookTitle: item.book_title,
        bookAuthor: item.book_author,
        bookId: item.book_id,
        clubCount: item.club_count,
        totalDiscussions: item.total_discussions,
        latestActivity: item.latest_activity,
        clubs: item.clubs || []
      }));
    } catch (error) {
      console.error('Error in getCurrentBookDiscussions:', error);
      return [];
    }
  }

  /**
   * Get trending books based on recent discussion activity
   */
  static async getTrendingBooks(
    storeId: string, 
    daysBack: number = 7
  ): Promise<TrendingBook[]> {
    try {
      await this.validateStoreOwnership(storeId);

      const { data, error } = await supabase
        .rpc('get_trending_books', {
          p_store_id: storeId,
          p_days_back: daysBack
        });

      if (error) {
        console.error('Error fetching trending books:', error);
        throw error;
      }

      return (data || []).map((item: any) => ({
        bookTitle: item.book_title,
        bookAuthor: item.book_author,
        bookId: item.book_id,
        discussionCount: item.discussion_count,
        postCount: item.post_count,
        clubCount: item.club_count,
        trendScore: parseFloat(item.trend_score) || 0
      }));
    } catch (error) {
      console.error('Error in getTrendingBooks:', error);
      return [];
    }
  }

  /**
   * Get activity metrics for individual clubs in the store
   */
  static async getClubActivityMetrics(
    storeId: string, 
    daysBack: number = 30
  ): Promise<ClubActivityMetrics[]> {
    try {
      await this.validateStoreOwnership(storeId);

      const { data, error } = await supabase
        .rpc('get_club_activity_metrics', {
          p_store_id: storeId,
          p_days_back: daysBack
        });

      if (error) {
        console.error('Error fetching club activity metrics:', error);
        throw error;
      }

      return (data || []).map((item: any) => ({
        clubId: item.club_id,
        clubName: item.club_name,
        memberCount: item.member_count,
        discussionCount: item.discussion_count,
        postCount: item.post_count,
        currentBookTitle: item.current_book_title,
        currentBookAuthor: item.current_book_author,
        activityScore: parseFloat(item.activity_score) || 0,
        lastActivity: item.last_activity
      }));
    } catch (error) {
      console.error('Error in getClubActivityMetrics:', error);
      return [];
    }
  }

  /**
   * Check if store has any book club data
   */
  static async hasBookClubData(storeId: string): Promise<boolean> {
    try {
      await this.validateStoreOwnership(storeId);

      const { data, error } = await supabase
        .from('book_clubs')
        .select('id')
        .eq('store_id', storeId)
        .eq('privacy', 'public')
        .limit(1);

      if (error) {
        console.error('Error checking book club data:', error);
        return false;
      }

      return (data?.length || 0) > 0;
    } catch (error) {
      console.error('Error in hasBookClubData:', error);
      return false;
    }
  }

  /**
   * Get simple metrics for dashboard display
   */
  static async getSimpleMetrics(storeId: string): Promise<{
    activeClubs: number;
    currentBooks: number;
    totalDiscussions: number;
    hasData: boolean;
  }> {
    try {
      const summary = await this.getBookClubAnalyticsSummary(storeId, 7); // Last 7 days

      return {
        activeClubs: summary.activeClubsCount,
        currentBooks: summary.currentBooksCount,
        totalDiscussions: summary.totalDiscussionsCount,
        hasData: summary.publicClubsCount > 0
      };
    } catch (error) {
      console.error('Error fetching simple metrics:', error);
      return {
        activeClubs: 0,
        currentBooks: 0,
        totalDiscussions: 0,
        hasData: false
      };
    }
  }

  /**
   * Get comprehensive analytics data for the main dashboard
   */
  static async getComprehensiveAnalytics(
    storeId: string,
    daysBack: number = 30
  ): Promise<{
    summary: BookClubAnalyticsSummary;
    currentBooks: CurrentBookDiscussion[];
    trendingBooks: TrendingBook[];
    clubActivity: ClubActivityMetrics[];
  }> {
    try {
      const [summary, currentBooks, trendingBooks, clubActivity] = await Promise.all([
        this.getBookClubAnalyticsSummary(storeId, daysBack),
        this.getCurrentBookDiscussions(storeId),
        this.getTrendingBooks(storeId, Math.min(daysBack, 14)), // Trending for shorter period
        this.getClubActivityMetrics(storeId, daysBack)
      ]);

      return {
        summary,
        currentBooks,
        trendingBooks,
        clubActivity
      };
    } catch (error) {
      console.error('Error fetching comprehensive analytics:', error);
      throw error;
    }
  }

  /**
   * Get analytics insights and recommendations
   */
  static async getAnalyticsInsights(storeId: string): Promise<{
    insights: string[];
    recommendations: string[];
  }> {
    try {
      const summary = await this.getBookClubAnalyticsSummary(storeId, 30);
      const trendingBooks = await this.getTrendingBooks(storeId, 7);

      const insights: string[] = [];
      const recommendations: string[] = [];

      // Generate insights based on data
      if (summary.publicClubsCount === 0) {
        insights.push('No public book clubs found for analytics');
        recommendations.push('Consider creating public book clubs to generate community engagement');
      } else {
        if (summary.currentBooksCount > 0) {
          insights.push(`${summary.currentBooksCount} books are currently being discussed across your clubs`);
        }

        if (summary.activeClubsCount > 0) {
          insights.push(`${summary.activeClubsCount} clubs have been active in the past 30 days`);
        }

        if (summary.avgPostsPerDiscussion > 5) {
          insights.push('High engagement: Your discussions are generating good participation');
        } else if (summary.avgPostsPerDiscussion > 0) {
          recommendations.push('Consider encouraging more discussion participation in your book clubs');
        }

        if (trendingBooks.length > 0) {
          insights.push(`"${trendingBooks[0].bookTitle}" is your most trending book this week`);
        }

        if (summary.totalMembersCount > 20) {
          insights.push('Strong community: You have a good base of active book club members');
        }

        // Recommendations based on activity levels
        if (summary.activeClubsCount < summary.publicClubsCount / 2) {
          recommendations.push('Some clubs appear inactive - consider organizing events to boost engagement');
        }

        if (summary.currentBooksCount < summary.publicClubsCount) {
          recommendations.push('Not all clubs have current books set - encourage clubs to select their next reads');
        }
      }

      return { insights, recommendations };
    } catch (error) {
      console.error('Error generating analytics insights:', error);
      return {
        insights: ['Unable to generate insights at this time'],
        recommendations: ['Please try refreshing the page']
      };
    }
  }

  /**
   * Export analytics data for external use
   */
  static async exportAnalyticsData(
    storeId: string,
    format: 'json' | 'csv' = 'json'
  ): Promise<string> {
    try {
      const data = await this.getComprehensiveAnalytics(storeId, 30);

      if (format === 'json') {
        return JSON.stringify(data, null, 2);
      } else {
        // Simple CSV export for summary data
        const csvData = [
          'Metric,Value',
          `Active Clubs,${data.summary.activeClubsCount}`,
          `Current Books,${data.summary.currentBooksCount}`,
          `Total Discussions,${data.summary.totalDiscussionsCount}`,
          `Total Posts,${data.summary.totalPostsCount}`,
          `Average Posts per Discussion,${data.summary.avgPostsPerDiscussion}`,
          `Total Members,${data.summary.totalMembersCount}`
        ].join('\n');

        return csvData;
      }
    } catch (error) {
      console.error('Error exporting analytics data:', error);
      throw error;
    }
  }
}
