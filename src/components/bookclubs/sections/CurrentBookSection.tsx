import React, { useState, useEffect } from 'react';
import { Book, Calendar, ExternalLink, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Database } from '@/integrations/supabase/types';
import { supabase } from '@/lib/supabase';
import { getNominationById } from '@/lib/api/bookclubs/nominations';
import { useAuth } from '@/contexts/AuthContext';
import {
  ProgressUpdateModal,
  ProgressIndicator,
  ProgressToggleControl,
  ReadingProgress,
  useProgressRealtime,
  ClubProgressDetailsModal
} from '@/components/bookclubs/progress';
import {
  getClubProgressStats
} from '@/lib/api/bookclubs/progress';

type CurrentBook = Database['public']['Tables']['current_books']['Row'];

interface CurrentBookSectionProps {
  currentBook: CurrentBook | null;
  clubId: string;
  isMember: boolean;
  canManageClub: boolean;
}

const CurrentBookSection: React.FC<CurrentBookSectionProps> = ({
  currentBook,
  clubId,
  isMember,
  canManageClub
}) => {
  const { user } = useAuth();
  const [bookDetails, setBookDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Progress tracking state
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showProgressDetailsModal, setShowProgressDetailsModal] = useState(false);
  const [clubStats, setClubStats] = useState<any>(null);

  // Real-time progress tracking
  const {
    userProgress,
    progressTrackingEnabled,
    loading: progressLoading,
    refetch: refetchProgress
  } = useProgressRealtime({
    clubId,
    userId: user?.id || '',
    enabled: isMember && !!user?.id,
    showToasts: true,
    onProgressUpdate: (progress) => {
      // Progress is automatically updated via the hook
    },
    onStatsUpdate: (stats) => {
      setClubStats(stats);
    },
    onFeatureToggle: (enabled) => {
      // Feature toggle is automatically handled via the hook
    }
  });

  useEffect(() => {
    const fetchBookDetails = async () => {
      if (!currentBook || !user?.id) return;

      setLoading(true);
      try {
        // If we have a nomination_id, fetch the nomination details
        if (currentBook.nomination_id) {
          const nomination = await getNominationById(currentBook.nomination_id, user.id);
          setBookDetails({
            title: nomination.book.title,
            author: nomination.book.author,
            cover_url: nomination.book.cover_url,
            description: nomination.book.description,
            google_books_id: nomination.book.google_books_id,
            nominated_at: nomination.nominated_at,
            nominated_by: nomination.nominated_by
          });
        }
        // If we have a book_id but no nomination_id, fetch the book details directly
        else if (currentBook.book_id) {
          const { data: book, error } = await supabase
            .from('books')
            .select('*')
            .eq('id', currentBook.book_id)
            .single();

          if (!error && book) {
            setBookDetails({
              title: book.title,
              author: book.author,
              cover_url: book.cover_url,
              description: book.description,
              google_books_id: book.google_books_id,
              set_at: currentBook.set_at
            });
          }
        }
        // Otherwise, just use the basic info from current_books
        else {
          setBookDetails({
            title: currentBook.title,
            author: currentBook.author,
            set_at: currentBook.set_at
          });
        }
      } catch (error) {
        console.error('Error fetching book details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookDetails();
  }, [currentBook, user?.id]);

  // Fetch club statistics when progress tracking is enabled
  useEffect(() => {
    const fetchClubStats = async () => {
      if (!clubId || !progressTrackingEnabled || !user?.id) return;

      try {
        const stats = await getClubProgressStats(user.id, clubId);
        setClubStats(stats);
      } catch (error) {
        console.error('Error fetching club stats:', error);
      }
    };

    fetchClubStats();
  }, [clubId, progressTrackingEnabled, user?.id]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Progress tracking handlers
  const handleProgressUpdated = async (progress: ReadingProgress) => {
    // Progress will be automatically updated via real-time subscription
    // Optionally refetch to ensure consistency
    await refetchProgress();
  };

  const handleProgressToggle = async (enabled: boolean) => {
    // Feature toggle will be automatically handled via real-time subscription
    // Optionally refetch to ensure consistency
    await refetchProgress();
  };

  const handleStatsClick = () => {
    setShowProgressDetailsModal(true);
  };

  const getProgressDisplay = (progress: ReadingProgress | null) => {
    if (!progress) return 'Not Started';

    if (progress.status === 'not_started') return 'Not Started';
    if (progress.status === 'finished') return 'Finished';

    if (progress.progress_type === 'percentage' && progress.progress_percentage !== null) {
      return `${progress.progress_percentage}%`;
    } else if (progress.progress_type === 'chapter' && progress.current_progress && progress.total_progress) {
      return `Chapter ${progress.current_progress}/${progress.total_progress}`;
    } else if (progress.progress_type === 'page' && progress.current_progress && progress.total_progress) {
      return `Page ${progress.current_progress}/${progress.total_progress}`;
    }

    return 'Reading';
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Book className="h-5 w-5 text-bookconnect-terracotta" />
          Current Book
        </h2>
        {/* Progress tracking toggle for club leads */}
        {canManageClub && (
          <ProgressToggleControl
            clubId={clubId}
            enabled={progressTrackingEnabled}
            onToggle={handleProgressToggle}
            canManage={canManageClub}
            loading={progressLoading}
          />
        )}
      </div>

      {currentBook && bookDetails ? (
        <div className="flex flex-col md:flex-row gap-4">
          {/* Book Cover */}
          <div className="flex-shrink-0">
            {bookDetails.cover_url ? (
              <img
                src={bookDetails.cover_url}
                alt={`Cover of ${bookDetails.title}`}
                className="w-32 h-48 object-cover rounded shadow"
              />
            ) : (
              <div className="w-32 h-48 bg-gray-200 rounded flex items-center justify-center">
                <Book className="h-12 w-12 text-gray-400" />
              </div>
            )}
          </div>

          {/* Book Details */}
          <div className="flex-1">
            <h3 className="text-xl font-medium">{bookDetails.title}</h3>
            <p className="text-gray-600 mb-2">by {bookDetails.author}</p>

            <div className="flex items-center text-xs text-gray-500 mb-3">
              <Calendar className="h-3 w-3 mr-1" />
              <span>
                Selected on {formatDate(bookDetails.set_at || currentBook.set_at)}
              </span>
            </div>

            {bookDetails.description && (
              <p className="text-sm text-gray-700 mb-4 line-clamp-3">
                {bookDetails.description}
              </p>
            )}

            <div className="flex flex-wrap gap-2 mt-4">
              {bookDetails.google_books_id && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`https://books.google.com/books?id=${bookDetails.google_books_id}`, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View on Google Books
                </Button>
              )}

              {/* Progress update button for members when tracking is enabled */}
              {isMember && progressTrackingEnabled && (
                <Button
                  size="sm"
                  onClick={() => setShowProgressModal(true)}
                  className="bg-bookconnect-terracotta hover:bg-bookconnect-terracotta/90"
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Update My Progress
                </Button>
              )}
            </div>

            {/* User's current progress display */}
            {isMember && progressTrackingEnabled && (
              <div className="mt-4 space-y-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ProgressIndicator
                        status={userProgress?.status || 'not_started'}
                        progressDisplay={getProgressDisplay(userProgress)}
                        isPrivate={userProgress?.is_private || false}
                        size="md"
                        lastUpdated={userProgress?.last_updated}
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Your Progress: {getProgressDisplay(userProgress)}
                        </p>
                        {userProgress?.notes && (
                          <p className="text-xs text-gray-600 mt-1">
                            "{userProgress.notes}"
                          </p>
                        )}
                      </div>
                    </div>
                    {userProgress?.is_private && (
                      <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                        Private
                      </span>
                    )}
                  </div>
                </div>

                {/* Club reading statistics */}
                {clubStats && (
                  <div
                    className="p-3 bg-bookconnect-terracotta/5 rounded-lg border border-bookconnect-terracotta/20 cursor-pointer hover:bg-bookconnect-terracotta/10 hover:border-bookconnect-terracotta/30 transition-colors"
                    onClick={handleStatsClick}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleStatsClick();
                      }
                    }}
                    aria-label="View detailed member progress"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-900">Club Reading Progress</h4>
                      <TrendingUp className="h-4 w-4 text-bookconnect-terracotta" />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="text-center p-2 sm:p-0">
                        <div className="font-semibold text-bookconnect-terracotta text-lg sm:text-base">{clubStats.total_members}</div>
                        <div className="text-gray-600 text-xs">Total Members</div>
                      </div>
                      <div className="text-center p-2 sm:p-0">
                        <div className="font-semibold text-green-600 text-lg sm:text-base">{clubStats.finished_count}</div>
                        <div className="text-gray-600 text-xs">Finished</div>
                      </div>
                      <div className="text-center p-2 sm:p-0">
                        <div className="font-semibold text-blue-600 text-lg sm:text-base">{clubStats.reading_count}</div>
                        <div className="text-gray-600 text-xs">Reading</div>
                      </div>
                      <div className="text-center p-2 sm:p-0">
                        <div className="font-semibold text-bookconnect-terracotta text-lg sm:text-base">{clubStats.completion_percentage}%</div>
                        <div className="text-gray-600 text-xs">Completion</div>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-500 text-center">
                      Click to view detailed member progress
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <Book className="h-12 w-12 mx-auto text-gray-300 mb-2" />
          <p className="text-gray-600 mb-1">No book currently selected</p>
          <p className="text-sm text-gray-500">
            Club members can nominate books for the club to read next.
          </p>
        </div>
      )}

      {/* Progress Update Modal */}
      {isMember && progressTrackingEnabled && (
        <ProgressUpdateModal
          isOpen={showProgressModal}
          onClose={() => setShowProgressModal(false)}
          clubId={clubId}
          bookId={currentBook?.book_id || undefined}
          currentProgress={userProgress}
          onProgressUpdated={handleProgressUpdated}
        />
      )}

      {/* Club Progress Details Modal */}
      {isMember && progressTrackingEnabled && (
        <ClubProgressDetailsModal
          isOpen={showProgressDetailsModal}
          onClose={() => setShowProgressDetailsModal(false)}
          clubId={clubId}
          bookId={currentBook?.book_id || undefined}
          clubStats={clubStats}
        />
      )}
    </>
  );
};

export default CurrentBookSection;
