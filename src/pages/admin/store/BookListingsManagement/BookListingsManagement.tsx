/**
 * BookListingsManagement Component
 * 
 * Main component for managing customer book submissions in the store admin panel.
 * Provides functionality to view, approve, reject, and manage book listings.
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, BookOpen, AlertCircle, Clock, Check, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useStoreOwnerAccess } from '@/hooks/useStoreOwnerAccess';
import { BookListingCard } from './components/BookListingCard';
import { BookListingDetailDialog } from './components/BookListingDetailDialog';
import { DeleteConfirmationDialog } from './components/DeleteConfirmationDialog';
import { ListingFilters } from './components/ListingFilters';
import { ListingTabs } from './components/ListingTabs';
import { useBookListings } from './hooks/useBookListings';
import { useListingActions } from './hooks/useListingActions';
import { getTabCounts } from './utils/listingUtils';
import type { BookListingData, TabValue } from './types';

const BookListingsManagement: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isStoreOwner, storeId, loading: storeAccessLoading } = useStoreOwnerAccess();
  
  // Local state
  const [selectedListing, setSelectedListing] = useState<BookListingData | null>(null);
  const [listingToDelete, setListingToDelete] = useState<BookListingData | null>(null);
  const [activeTab, setActiveTab] = useState<TabValue>('pending');
  const [searchTerm, setSearchTerm] = useState('');

  // Custom hooks
  const {
    listings,
    loading,
    error,
    loadListings,
    filteredListings
  } = useBookListings({
    storeId,
    activeTab,
    searchTerm,
    storeAccessLoading
  });

  const { updateListingStatus, deleteListing, updating, deleting } = useListingActions({
    userId: user?.id || '',
    onSuccess: loadListings,
    onListingClose: () => {
      setSelectedListing(null);
      setListingToDelete(null);
    }
  });

  // Memoize tab counts to prevent unnecessary recalculations
  const tabCounts = useMemo(() => getTabCounts(listings), [listings]);

  // Delete handlers
  const handleDeleteRequest = (listingId: string) => {
    const listing = listings.find(l => l.id === listingId);
    if (listing) {
      setListingToDelete(listing);
    }
  };

  const handleDeleteConfirm = async () => {
    if (listingToDelete) {
      await deleteListing(listingToDelete.id);
    }
  };

  const handleDeleteCancel = () => {
    setListingToDelete(null);
  };

  // Loading state
  if (storeAccessLoading || loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4" data-testid="loading-skeleton">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // Access denied
  if (!isStoreOwner) {
    return (
      <div className="p-8 text-center">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to access book listings management.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={loadListings} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/admin/store-management')}
          className="mb-4 flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Store Management
        </Button>

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-serif text-bookconnect-brown mb-2">
              Book Listings Management
            </h1>
            <p className="text-bookconnect-brown/70">
              Review and manage customer book submissions
            </p>
          </div>

          <ListingFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>Pending</span> <span>({tabCounts.pending})</span>
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex items-center gap-2">
            <Check className="h-4 w-4" />
            <span>Approved</span> <span>({tabCounts.approved})</span>
          </TabsTrigger>
          <TabsTrigger value="rejected" className="flex items-center gap-2">
            <X className="h-4 w-4" />
            <span>Rejected</span> <span>({tabCounts.rejected})</span>
          </TabsTrigger>
          <TabsTrigger value="all" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span>All</span> <span>({tabCounts.all})</span>
          </TabsTrigger>
        </TabsList>

        {/* Content */}
        <TabsContent value={activeTab} className="mt-6">
        {filteredListings.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                No listings found
              </h3>
              <p className="text-gray-500">
                {searchTerm 
                  ? 'No listings match your search criteria.' 
                  : `No ${activeTab === 'all' ? '' : activeTab} listings at this time.`
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredListings.map((listing) => (
              <BookListingCard
                key={listing.id}
                listing={listing}
                onView={() => setSelectedListing(listing)}
                onUpdateStatus={updateListingStatus}
                onDelete={handleDeleteRequest}
                isUpdating={updating}
                isDeleting={deleting}
              />
            ))}
          </div>
        )}
        </TabsContent>
      </Tabs>

      {/* Listing Detail Dialog */}
      {selectedListing && (
        <BookListingDetailDialog
          listing={selectedListing}
          open={!!selectedListing}
          onClose={() => setSelectedListing(null)}
          onUpdateStatus={updateListingStatus}
          onDelete={handleDeleteRequest}
          isUpdating={updating}
          isDeleting={deleting}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        listing={listingToDelete}
        open={!!listingToDelete}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        isDeleting={deleting}
      />
    </div>
  );
};

export default BookListingsManagement;
