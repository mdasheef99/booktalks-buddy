import React from 'react';
import { useStoreManagerContext } from '@/components/routeguards/StoreManagerRouteGuard';

/**
 * Store Manager Dashboard Page - Placeholder
 * Will be implemented in Phase 2 after foundation components are complete
 */
const StoreManagerDashboardPage: React.FC = () => {
  const { storeId, storeName } = useStoreManagerContext();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Store Manager Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Managing {storeName || 'Store'} - Store ID: {storeId}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Welcome to Store Manager Interface</h2>
        <p className="text-gray-600 mb-4">
          This is a placeholder for the Store Manager Dashboard. The complete implementation 
          will be added in Phase 2 after all foundation components are tested and verified.
        </p>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">Store Context Verified</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✅ Store Manager access confirmed</li>
            <li>✅ Store ID: {storeId}</li>
            <li>✅ Store Name: {storeName || 'Not available'}</li>
            <li>✅ Route guard protection active</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default StoreManagerDashboardPage;
