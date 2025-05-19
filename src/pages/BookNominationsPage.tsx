import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useNominations } from '@/components/bookclubs/nominations/useNominations';
import NominationsHeader from '@/components/bookclubs/nominations/NominationsHeader';
import NominationsControls from '@/components/bookclubs/nominations/NominationsControls';
import NominationsContent from '@/components/bookclubs/nominations/NominationsContent';
import NominationsAccessDenied from '@/components/bookclubs/nominations/NominationsAccessDenied';

/**
 * Book Nominations Page
 *
 * This page displays all book nominations for a book club.
 * Users can filter, sort, and view nominations in different layouts.
 * Club admins can manage nominations and set the current book.
 */
const BookNominationsPage: React.FC = () => {
  const { clubId } = useParams<{ clubId: string }>();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');

  // Use the custom hook to manage nominations data and operations
  const {
    nominations,
    loading,
    error,
    status,
    sortOrder,
    isMember,
    isAdmin,
    clubName,
    fetchNominations,
    handleSortOrderChange,
    handleStatusChange
  } = useNominations({ clubId: clubId || '' });

  const handleOpenNominationForm = () => {
    navigate(`/book-club/${clubId}/nominations/new`);
  };

  // If user is not a member and not loading, show access denied
  if (!isMember && !loading) {
    return <NominationsAccessDenied clubId={clubId || ''} />;
  }

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      {/* Header with back button and nomination button */}
      <NominationsHeader
        clubId={clubId || ''}
        clubName={clubName}
        onOpenSearchModal={handleOpenNominationForm}
      />

      {/* Controls for filtering, sorting, and view mode */}
      <NominationsControls
        status={status}
        sortOrder={sortOrder}
        viewMode={viewMode}
        onStatusChange={handleStatusChange}
        onSortOrderChange={handleSortOrderChange}
        onViewModeChange={setViewMode}
      />

      {/* Main content area with conditional rendering */}
      <NominationsContent
        nominations={nominations}
        loading={loading}
        error={error}
        viewMode={viewMode}
        isAdmin={isAdmin}
        clubId={clubId || ''}
        onRefresh={fetchNominations}
        onOpenSearchModal={handleOpenNominationForm}
      />
    </div>
  );
};

export default BookNominationsPage;
