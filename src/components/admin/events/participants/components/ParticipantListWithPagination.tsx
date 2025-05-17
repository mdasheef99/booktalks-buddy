import React, { useCallback, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Users } from 'lucide-react';
import { ParticipantListWithPaginationProps } from '../types';

/**
 * A component that displays a paginated list of participants
 */
const ParticipantListWithPagination: React.FC<ParticipantListWithPaginationProps> = React.memo(({
  participants,
  currentPage,
  setCurrentPage,
  itemsPerPage,
  loading = false
}) => {
  // Calculate pagination values
  const totalPages = Math.max(1, Math.ceil(participants.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = participants.slice(startIndex, endIndex);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, [setCurrentPage]);

  // Handle previous page
  const handlePrevPage = useCallback(() => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  }, [setCurrentPage]);

  // Handle next page
  const handleNextPage = useCallback(() => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  }, [setCurrentPage, totalPages]);

  // Calculate visible page numbers
  const getVisiblePageNumbers = useMemo(() => {
    // For small number of pages, show all
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    // For large number of pages, show a window around current page
    let pages = [1];

    // Calculate start and end of the window
    let startPage = Math.max(2, currentPage - 2);
    let endPage = Math.min(totalPages - 1, currentPage + 2);

    // Add ellipsis if needed
    if (startPage > 2) {
      pages.push(-1); // -1 represents ellipsis
    }

    // Add pages in the window
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    // Add ellipsis if needed
    if (endPage < totalPages - 1) {
      pages.push(-2); // -2 represents ellipsis
    }

    // Add last page
    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  }, [currentPage, totalPages]);

  // Loading state
  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  // Empty state
  if (participants.length === 0) {
    return (
      <div className="text-center py-8">
        <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p className="text-gray-500">No participants match your filters</p>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-2 mb-4">
        {currentItems.map((participant) => (
          <div
            key={participant.user_id}
            className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors rounded-lg"
          >
            <div>
              <p className="font-medium">{participant.user.username || 'Anonymous'}</p>
              <p className="text-sm text-gray-600">{participant.user.email}</p>
            </div>
            <div className="flex items-center">
              <Badge
                className={
                  participant.rsvp_status === 'going'
                    ? 'bg-green-100 text-green-800'
                    : participant.rsvp_status === 'maybe'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }
              >
                {participant.rsvp_status === 'going'
                  ? 'Going'
                  : participant.rsvp_status === 'maybe'
                  ? 'Maybe'
                  : 'Not Going'}
              </Badge>
              <span className="text-xs text-gray-500 ml-2">
                {new Date(participant.rsvp_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t">
          <div className="text-sm text-gray-500 order-2 sm:order-1">
            Showing {startIndex + 1}-{Math.min(endIndex, participants.length)} of {participants.length}
          </div>
          <div className="flex gap-1 order-1 sm:order-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0"
              aria-label="Previous page"
            >
              &lt;
            </Button>

            {getVisiblePageNumbers.map((page, index) =>
              page < 0 ? (
                // Render ellipsis
                <span key={`ellipsis-${index}`} className="flex items-center justify-center h-8 w-8">
                  &hellip;
                </span>
              ) : (
                // Render page button
                <Button
                  key={`page-${page}`}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(page)}
                  className="h-8 w-8 p-0"
                  aria-label={`Page ${page}`}
                  aria-current={currentPage === page ? "page" : undefined}
                >
                  {page}
                </Button>
              )
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="h-8 w-8 p-0"
              aria-label="Next page"
            >
              &gt;
            </Button>
          </div>
        </div>
      )}
    </div>
  );
});

ParticipantListWithPagination.displayName = 'ParticipantListWithPagination';

export default ParticipantListWithPagination;
