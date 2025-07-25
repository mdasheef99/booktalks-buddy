import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import type { TrendingBook } from '@/lib/api/store/bookClubAnalytics';

interface TrendingBooksSectionProps {
  trendingBooks: TrendingBook[];
  maxItems?: number;
}

/**
 * Trending Books Section component for Book Club Analytics
 * Displays books generating the most discussion activity recently
 */
export const TrendingBooksSection: React.FC<TrendingBooksSectionProps> = ({
  trendingBooks,
  maxItems = 5
}) => {
  const displayBooks = trendingBooks.slice(0, maxItems);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Trending Books
        </CardTitle>
        <CardDescription>
          Books generating the most discussion activity recently
        </CardDescription>
      </CardHeader>
      <CardContent>
        {displayBooks.length > 0 ? (
          <div className="space-y-4">
            {displayBooks.map((book, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{book.bookTitle}</h4>
                  <p className="text-sm text-gray-600">by {book.bookAuthor}</p>
                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                    <span>{book.discussionCount} discussions</span>
                    <span>{book.postCount} posts</span>
                    <span>{book.clubCount} clubs</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-bookconnect-brown">
                    {book.trendScore.toFixed(0)}
                  </div>
                  <div className="text-xs text-gray-500">trend score</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No trending books found</p>
            <p className="text-sm">Books will appear here as discussions increase</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
