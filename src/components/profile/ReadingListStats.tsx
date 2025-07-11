/**
 * Reading List Stats Component
 * 
 * Displays summary statistics for a user's reading list
 * Shows total books, books by status, average rating, and recent activity
 * Follows BookConnect design system patterns
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, BookMarked, CheckCircle, Star, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ReadingListItem, ReadingStatus } from '@/services/books';

interface ReadingListStatsProps {
  readingList: ReadingListItem[];
  compact?: boolean;
  className?: string;
}

interface StatsData {
  totalBooks: number;
  statusCounts: Record<ReadingStatus, number>;
  averageRating: number;
  totalRatings: number;
  totalReviews: number;
  recentActivity: number; // Books added/updated in last 30 days
}

const ReadingListStats: React.FC<ReadingListStatsProps> = ({
  readingList,
  compact = false,
  className
}) => {
  // Calculate statistics
  const calculateStats = (): StatsData => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const stats: StatsData = {
      totalBooks: readingList.length,
      statusCounts: {
        want_to_read: 0,
        currently_reading: 0,
        completed: 0
      },
      averageRating: 0,
      totalRatings: 0,
      totalReviews: 0,
      recentActivity: 0
    };

    let totalRatingSum = 0;

    readingList.forEach(item => {
      // Count by status
      stats.statusCounts[item.status]++;

      // Count ratings
      if (item.rating) {
        stats.totalRatings++;
        totalRatingSum += item.rating;
      }

      // Count reviews
      if (item.review_text && item.review_is_public) {
        stats.totalReviews++;
      }

      // Count recent activity
      const updatedAt = new Date(item.updated_at);
      if (updatedAt >= thirtyDaysAgo) {
        stats.recentActivity++;
      }
    });

    // Calculate average rating
    if (stats.totalRatings > 0) {
      stats.averageRating = totalRatingSum / stats.totalRatings;
    }

    return stats;
  };

  const stats = calculateStats();

  const getStatusConfig = (status: ReadingStatus) => {
    switch (status) {
      case 'want_to_read':
        return {
          label: 'Want to Read',
          icon: BookMarked,
          color: 'bg-bookconnect-sage text-white'
        };
      case 'currently_reading':
        return {
          label: 'Reading',
          icon: BookOpen,
          color: 'bg-bookconnect-terracotta text-white'
        };
      case 'completed':
        return {
          label: 'Completed',
          icon: CheckCircle,
          color: 'bg-bookconnect-olive text-white'
        };
    }
  };

  if (stats.totalBooks === 0) {
    return null; // Don't show stats if no books
  }

  if (compact) {
    return (
      <div className={cn('flex flex-wrap gap-2', className)}>
        <Badge variant="outline" className="text-xs">
          <BookOpen className="h-3 w-3 mr-1" />
          {stats.totalBooks} books
        </Badge>
        {stats.averageRating > 0 && (
          <Badge variant="outline" className="text-xs">
            <Star className="h-3 w-3 mr-1" />
            {stats.averageRating.toFixed(1)} avg
          </Badge>
        )}
        {stats.recentActivity > 0 && (
          <Badge variant="outline" className="text-xs">
            <TrendingUp className="h-3 w-3 mr-1" />
            {stats.recentActivity} recent
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Total Books */}
          <div className="text-center">
            <div className="text-2xl font-bold text-bookconnect-brown">
              {stats.totalBooks}
            </div>
            <div className="text-sm text-bookconnect-brown/70">
              Total Books
            </div>
          </div>

          {/* Average Rating */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Star className="h-4 w-4 fill-bookconnect-terracotta text-bookconnect-terracotta" />
              <span className="text-2xl font-bold text-bookconnect-brown">
                {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '—'}
              </span>
            </div>
            <div className="text-sm text-bookconnect-brown/70">
              Avg Rating
            </div>
            {stats.totalRatings > 0 && (
              <div className="text-xs text-bookconnect-brown/50">
                {stats.totalRatings} rated
              </div>
            )}
          </div>

          {/* Reviews */}
          <div className="text-center">
            <div className="text-2xl font-bold text-bookconnect-brown">
              {stats.totalReviews}
            </div>
            <div className="text-sm text-bookconnect-brown/70">
              Reviews
            </div>
          </div>

          {/* Recent Activity */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="h-4 w-4 text-bookconnect-terracotta" />
              <span className="text-2xl font-bold text-bookconnect-brown">
                {stats.recentActivity}
              </span>
            </div>
            <div className="text-sm text-bookconnect-brown/70">
              Recent
            </div>
            <div className="text-xs text-bookconnect-brown/50">
              Last 30 days
            </div>
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="mt-4 pt-4 border-t border-bookconnect-brown/10">
          <div className="flex flex-wrap gap-2 justify-center">
            {(Object.keys(stats.statusCounts) as ReadingStatus[]).map(status => {
              const count = stats.statusCounts[status];
              if (count === 0) return null;

              const config = getStatusConfig(status);
              const Icon = config.icon;

              return (
                <Badge
                  key={status}
                  className={cn('flex items-center gap-1.5', config.color)}
                >
                  <Icon className="h-3 w-3" />
                  <span>{count} {config.label}</span>
                </Badge>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReadingListStats;
