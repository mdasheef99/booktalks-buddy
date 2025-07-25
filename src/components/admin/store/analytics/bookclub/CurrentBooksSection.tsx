import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, MessageSquare, Clock } from 'lucide-react';
import type { CurrentBookDiscussion } from '@/lib/api/store/bookClubAnalytics';

interface CurrentBooksSectionProps {
  currentBooks: CurrentBookDiscussion[];
}

/**
 * Current Books Section component for Book Club Analytics
 * Displays books currently being discussed across book clubs
 */
export const CurrentBooksSection: React.FC<CurrentBooksSectionProps> = ({
  currentBooks
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Current Book Discussions
        </CardTitle>
        <CardDescription>
          Books currently being discussed across your book clubs
        </CardDescription>
      </CardHeader>
      <CardContent>
        {currentBooks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentBooks.map((book, index) => (
              <div 
                key={index} 
                className="p-4 border rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 line-clamp-2">
                      {book.bookTitle}
                    </h4>
                    <p className="text-sm text-gray-600">by {book.bookAuthor}</p>
                  </div>
                  <Badge variant="secondary" className="ml-2">
                    {book.clubCount} club{book.clubCount !== 1 ? 's' : ''}
                  </Badge>
                </div>
                <div className="space-y-1 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    <span>{book.totalDiscussions} discussions</span>
                  </div>
                  {book.latestActivity && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>
                        Last activity: {new Date(book.latestActivity).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No books are currently being discussed</p>
            <p className="text-sm">Encourage your book clubs to select their current reads</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
