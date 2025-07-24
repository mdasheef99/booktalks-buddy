import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStoreManagerAccess } from '@/hooks/store-manager/useStoreManagerAccess';
import { ModerationDashboard } from '@/components/moderation/ModerationDashboard';

/**
 * Store Manager Moderation Page
 *
 * Provides store-scoped content moderation interface for Store Managers.
 * Uses the existing ModerationDashboard component with store filtering.
 *
 * Features:
 * - Store-scoped report management (only reports from assigned store)
 * - User account management with Store Manager permissions
 * - Tabbed interface for different report statuses
 * - Integration with existing moderation infrastructure
 */
const StoreManagerModerationPage: React.FC = () => {
  const navigate = useNavigate();
  const { isStoreManager, storeId, storeName, loading: storeAccessLoading } = useStoreManagerAccess();

  // Show loading state while verifying store access
  if (storeAccessLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Moderation</h1>
            <p className="text-gray-600 mt-1">Loading store context...</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state while checking access
  if (storeAccessLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Moderation</h1>
            <p className="text-gray-600 mt-1">Loading store context...</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header with Store Manager Context */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Moderation</h1>
          <p className="text-gray-600 mt-1">
            Content moderation for {storeName || 'Store'}
          </p>
        </div>

        {/* Navigation Back Button */}
        <Button
          onClick={() => navigate('/store-manager/dashboard')}
          variant="outline"
          className="inline-flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>

      {/* Store Manager Moderation Dashboard */}
      <div className="bg-white rounded-lg shadow">
        <ModerationDashboard
          storeId={storeId}
        />
      </div>
    </div>
  );
};

export default StoreManagerModerationPage;
