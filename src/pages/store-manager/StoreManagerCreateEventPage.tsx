import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import StoreManagerEventForm from '@/components/store-manager/events/StoreManagerEventForm';
import { useStoreManagerAccess } from '@/hooks/store-manager/useStoreManagerAccess';

/**
 * Store Manager Create Event Page Component
 * Allows Store Managers to create new events for their store
 */
const StoreManagerCreateEventPage: React.FC = () => {
  const navigate = useNavigate();
  const { isStoreManager, storeId, storeName, loading: storeAccessLoading } = useStoreManagerAccess();

  // Show loading state while checking store access
  if (storeAccessLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bookconnect-terracotta mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600">
            Verifying Store Manager access...
          </p>
        </div>
      </div>
    );
  }

  // Show error if not a store manager
  if (!isStoreManager || !storeId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">
            You don't have Store Manager access to create events.
          </p>
          <Button onClick={() => navigate('/dashboard')}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Button
        variant="ghost"
        onClick={() => navigate('/store-manager/events')}
        className="mb-4 flex items-center gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Events
      </Button>

      <div className="mb-8">
        <h1 className="text-3xl font-serif text-bookconnect-terracotta mb-2">Create New Event</h1>
        <p className="text-gray-600">
          Create a new event for {storeName || 'your store'}
        </p>
      </div>

      <StoreManagerEventForm />
    </div>
  );
};

export default StoreManagerCreateEventPage;
