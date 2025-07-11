import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2, Store } from 'lucide-react';
import { useStoreOwnerAccess } from '@/hooks/useStoreOwnerAccess';
import { supabase } from '@/lib/supabase';

// Import our extracted components and hooks
import { RequestCard } from './components/RequestCard';
import { RequestDetailDialog } from './components/RequestDetailDialog';
import { RequestFilters } from './components/RequestFilters';
import { RequestTabs } from './components/RequestTabs';
import { RequestStats } from './components/RequestStats';
import { useRequestManagement } from './hooks/useRequestManagement';
import { useStoreRequests } from './hooks/useStoreRequests';
import { useRequestFilters } from './hooks/useRequestFilters';
import { RequestTab } from './types/requestManagement';
import { BookAvailabilityRequestData } from '@/types/bookAvailabilityRequests';

interface BookAvailabilityRequestsManagementProps {}

export const BookAvailabilityRequestsManagement: React.FC<BookAvailabilityRequestsManagementProps> = () => {
  const { storeId: ownerStoreId, isValidOwner, loading: storeAccessLoading } = useStoreOwnerAccess();
  const [storeId, setStoreId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<RequestTab>('all');
  const [selectedRequest, setSelectedRequest] = useState<BookAvailabilityRequestData | null>(null);

  // Initialize store ID
  useEffect(() => {
    const getStoreId = async () => {
      if (storeAccessLoading) return;

      if (ownerStoreId) {
        console.log('Using owner store ID:', ownerStoreId);
        setStoreId(ownerStoreId);
      } else {
        console.log('No owner store ID, fetching first available store...');
        // Fallback: get first available store for admin access
        try {
          const { data: stores, error } = await supabase
            .from('stores')
            .select('id, name')
            .limit(1);

          console.log('Stores query result:', { stores, error });

          if (!error && stores && stores.length > 0) {
            console.log('Using fallback store:', stores[0]);
            setStoreId(stores[0].id);
          } else {
            console.error('No stores found or error:', error);
          }
        } catch (error) {
          console.error('Error fetching stores:', error);
        }
      }
    };

    if (!storeAccessLoading) {
      getStoreId();
    }
  }, [ownerStoreId, storeAccessLoading]);

  // Use our custom hooks
  const { requests, loading, error, getRequestCounts, updateRequests, retryFetch } = useStoreRequests({
    storeId,
    activeTab
  });

  const { updating, deleting, updateRequestStatus, deleteRequest } = useRequestManagement({
    storeId,
    onRequestsUpdate: updateRequests
  });

  const {
    searchTerm,
    setSearchTerm,
    filteredRequests,
    clearSearch,
    getSearchResultsCount,
    isSearchActive
  } = useRequestFilters({
    requests,
    activeTab
  });

  // Loading state
  if (storeAccessLoading || loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-bookconnect-brown" />
          <span className="ml-2 text-bookconnect-brown">Loading requests...</span>
        </div>
      </div>
    );
  }

  // Show warning if not store owner but still allow access
  const showStoreOwnerWarning = !isValidOwner && !storeAccessLoading;

  // Error state
  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
        <Button 
          onClick={retryFetch} 
          className="mt-4"
          variant="outline"
        >
          Try Again
        </Button>
      </div>
    );
  }

  const counts = getRequestCounts();

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Store className="h-8 w-8 text-bookconnect-brown" />
        <div>
          <h1 className="text-3xl font-serif text-bookconnect-brown">
            Book Availability Requests
          </h1>
          <p className="text-bookconnect-brown/70">
            Manage customer book availability requests for your store
          </p>
        </div>
      </div>

      {/* Store Owner Warning */}
      {showStoreOwnerWarning && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            You are not registered as a store owner, but you have admin access to view requests.
          </AlertDescription>
        </Alert>
      )}

      {/* Request Statistics */}
      <RequestStats requests={requests} />

      {/* Search and Filters */}
      <RequestFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onClearSearch={clearSearch}
        isSearchActive={isSearchActive}
        resultsCount={getSearchResultsCount()}
        totalCount={requests.length}
      />

      {/* Tabs */}
      <RequestTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        counts={counts}
      />

      {/* Request Content */}
      <Tabs value={activeTab} className="w-full">
        <TabsContent value={activeTab} className="mt-6">
          {filteredRequests.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-bookconnect-brown/60">
                  <Store className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No requests found</h3>
                  <p>
                    {isSearchActive 
                      ? "No requests match your search criteria. Try adjusting your search terms."
                      : "There are no book availability requests at this time."
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredRequests.map((request) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  onView={() => setSelectedRequest(request)}
                  onUpdateStatus={updateRequestStatus}
                  onDelete={deleteRequest}
                  isUpdating={updating === request.id}
                  isDeleting={deleting === request.id}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Request Detail Dialog */}
      {selectedRequest && (
        <RequestDetailDialog
          request={selectedRequest}
          isOpen={!!selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onUpdateStatus={updateRequestStatus}
          onDelete={deleteRequest}
          isUpdating={updating === selectedRequest.id}
          isDeleting={deleting === selectedRequest.id}
        />
      )}
    </div>
  );
};
