/**
 * Book Metrics Card Component
 * 
 * Displays book-related analytics including current book,
 * reading progress, and book history.
 */

import React from 'react';
import { Book, BookOpen, Clock, Star, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface BookMetrics {
  currentBook: string | null;
  booksReadThisYear: number;
  averageReadingTime: number;
}

interface BookMetricsCardProps {
  metrics?: BookMetrics;
  loading?: boolean;
  detailed?: boolean;
}

const BookMetricsCard: React.FC<BookMetricsCardProps> = ({
  metrics,
  loading = false,
  detailed = false
}) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Book className="h-5 w-5" />
            Book Metrics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="animate-pulse space-y-3">
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentBook = metrics?.currentBook;
  const booksReadThisYear = metrics?.booksReadThisYear || 0;
  const averageReadingTime = metrics?.averageReadingTime || 0;

  // Calculate reading pace (books per month)
  const currentMonth = new Date().getMonth() + 1;
  const readingPace = currentMonth > 0 ? Math.round((booksReadThisYear / currentMonth) * 10) / 10 : 0;

  // Determine reading status
  const getReadingStatus = () => {
    if (readingPace >= 1) return { status: 'Excellent', color: 'text-green-600', bg: 'bg-green-50' };
    if (readingPace >= 0.5) return { status: 'Good', color: 'text-blue-600', bg: 'bg-blue-50' };
    if (readingPace > 0) return { status: 'Steady', color: 'text-yellow-600', bg: 'bg-yellow-50' };
    return { status: 'Getting Started', color: 'text-gray-600', bg: 'bg-gray-50' };
  };

  const readingStatus = getReadingStatus();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Book className="h-5 w-5" />
          Book Metrics
        </CardTitle>
        <CardDescription>
          Reading progress and book statistics
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Book */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Current Book</span>
            <BookOpen className="h-4 w-4 text-blue-600" />
          </div>
          <div className="p-3 bg-blue-50 rounded-lg">
            {currentBook ? (
              <div>
                <div className="font-medium text-blue-900 truncate">{currentBook}</div>
                <div className="text-sm text-blue-700 mt-1">Currently reading</div>
              </div>
            ) : (
              <div>
                <div className="font-medium text-gray-600">No current book</div>
                <div className="text-sm text-gray-500">Ready to select next book</div>
              </div>
            )}
          </div>
        </div>

        {/* Books Read This Year */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-gray-900">{booksReadThisYear}</div>
            <div className="text-sm text-gray-600">Books This Year</div>
          </div>
          <Badge variant="outline" className={`${readingStatus.bg} ${readingStatus.color} border-current`}>
            {readingStatus.status}
          </Badge>
        </div>

        {/* Reading Pace */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Reading Pace</span>
            <span className="text-sm font-bold text-green-600">{readingPace} books/month</span>
          </div>
          <Progress value={Math.min(100, readingPace * 50)} className="h-2" />
          <div className="text-xs text-gray-500">
            {readingPace >= 1 ? 'Great pace!' : 'Steady progress'}
          </div>
        </div>

        {/* Detailed View */}
        {detailed && (
          <div className="space-y-3 pt-4 border-t">
            <h4 className="font-semibold text-gray-900">Reading Statistics</h4>
            
            {/* Reading Progress (Placeholder for Phase 4) */}
            <div className="p-3 bg-purple-50 rounded-lg">
              <h5 className="font-medium text-purple-900 mb-2">📖 Reading Progress</h5>
              <div className="text-sm text-purple-800">
                <p>Individual reading progress tracking coming in Phase 4</p>
                <ul className="mt-1 space-y-1 text-xs">
                  <li>• Member reading status</li>
                  <li>• Progress percentages</li>
                  <li>• Reading completion rates</li>
                </ul>
              </div>
            </div>

            {/* Book History */}
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-green-600" />
                <h5 className="font-medium text-green-900">Book History</h5>
              </div>
              <div className="text-sm text-green-800">
                <p>Your club has read {booksReadThisYear} books this year</p>
                {booksReadThisYear > 0 && (
                  <p className="text-xs mt-1">
                    That's an average of {Math.round((365 / booksReadThisYear) * 10) / 10} days per book
                  </p>
                )}
              </div>
            </div>

            {/* Reading Insights */}
            <div className="p-3 bg-yellow-50 rounded-lg">
              <h5 className="font-medium text-yellow-900 mb-1">💡 Reading Insights</h5>
              <div className="text-sm text-yellow-800">
                {booksReadThisYear >= 6 && (
                  <p>Excellent reading pace! Your club is very active.</p>
                )}
                {booksReadThisYear >= 3 && booksReadThisYear < 6 && (
                  <p>Good reading progress. Consider shorter books to increase pace.</p>
                )}
                {booksReadThisYear > 0 && booksReadThisYear < 3 && (
                  <p>Steady start. Try setting monthly reading goals.</p>
                )}
                {booksReadThisYear === 0 && (
                  <p>Ready to start your reading journey! Select your first book.</p>
                )}
              </div>
            </div>

            {/* Genre Analysis (Placeholder for Week 4) */}
            <div className="p-3 bg-indigo-50 rounded-lg">
              <h5 className="font-medium text-indigo-900 mb-1">📚 Genre Analysis</h5>
              <div className="text-sm text-indigo-800">
                <p>Book genre preferences coming in Week 4</p>
                <ul className="mt-1 space-y-1 text-xs">
                  <li>• Most popular genres</li>
                  <li>• Reading diversity score</li>
                  <li>• Genre recommendations</li>
                </ul>
              </div>
            </div>

            {/* Reading Goals */}
            <div className="p-3 bg-orange-50 rounded-lg">
              <h5 className="font-medium text-orange-900 mb-1">🎯 Reading Goals</h5>
              <div className="text-sm text-orange-800">
                <p>Set and track reading goals for your club</p>
                <ul className="mt-1 space-y-1 text-xs">
                  <li>• Annual reading target: 12 books</li>
                  <li>• Current progress: {Math.round((booksReadThisYear / 12) * 100)}%</li>
                  <li>• Books remaining: {Math.max(0, 12 - booksReadThisYear)}</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions (for detailed view) */}
        {detailed && (
          <div className="pt-4 border-t">
            <h4 className="font-semibold text-gray-900 mb-3">Quick Actions</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <button className="p-2 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                <div className="font-medium text-gray-900">Select Book</div>
                <div className="text-gray-600">Choose next read</div>
              </button>
              <button className="p-2 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                <div className="font-medium text-gray-900">Book History</div>
                <div className="text-gray-600">View past books</div>
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BookMetricsCard;
