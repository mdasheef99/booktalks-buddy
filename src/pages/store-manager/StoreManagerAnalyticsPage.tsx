import React from 'react';
import { useStoreManagerAccess } from '@/hooks/store-manager/useStoreManagerAccess';

const StoreManagerAnalyticsPage: React.FC = () => {
  const { isStoreManager, storeId, storeName, loading } = useStoreManagerAccess();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bookconnect-brown mx-auto mb-4"></div>
          <p className="text-gray-600">Loading store analytics...</p>
        </div>
      </div>
    );
  }

  if (!isStoreManager || !storeId) {
    return (
      <div className="max-w-md mx-auto mt-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Store Manager access required to view analytics.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Store Analytics</h1>
        <p className="text-gray-600">
          Analytics for {storeName} - Store ID: {storeId}
        </p>
      </div>

      {/* Placeholder Content */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Welcome to Store Analytics Interface
        </h2>
        <p className="text-gray-600 mb-6">
          This is a placeholder for the Store Manager Analytics page. The complete implementation 
          will be added in Phase 2 after all foundation components are tested and verified.
        </p>

        {/* Store Context Verification */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-green-900 mb-3">Store Context Verified</h3>
          <ul className="space-y-2 text-green-800">
            <li>✅ Store Manager access confirmed</li>
            <li>✅ Store ID: {storeId}</li>
            <li>✅ Store Name: {storeName}</li>
            <li>✅ Route guard protection active</li>
          </ul>
        </div>

        {/* Future Features Preview */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-blue-900 mb-3">Planned Analytics Features</h3>
          <ul className="space-y-2 text-blue-800">
            <li>📊 Store-specific book club metrics</li>
            <li>👥 Store member engagement analytics</li>
            <li>📚 Popular books and reading trends</li>
            <li>🎯 Event attendance and participation</li>
            <li>📈 Growth and retention insights</li>
            <li>🔍 Content moderation statistics</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default StoreManagerAnalyticsPage;
