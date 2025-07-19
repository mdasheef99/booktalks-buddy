/**
 * Entitlements Debug Page
 * 
 * Temporary debug page to test entitlements for the admin user
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserEntitlements } from '@/lib/entitlements';
import { useCanManageUserTiers } from '@/lib/entitlements/hooks';

export default function EntitlementsDebug() {
  const { user } = useAuth();
  const [entitlements, setEntitlements] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Test the hook
  const { result: canManageUserTiers, loading: hookLoading } = useCanManageUserTiers('ce76b99a-5f1a-481a-af85-862e584465e1');

  useEffect(() => {
    const loadEntitlements = async () => {
      if (!user?.id) return;
      
      try {
        setLoading(true);
        setError(null);
        console.log('Loading entitlements for user:', user.id);
        
        const userEntitlements = await getUserEntitlements(user.id, true); // Force refresh
        console.log('Loaded entitlements:', userEntitlements);
        
        setEntitlements(userEntitlements);
      } catch (err) {
        console.error('Error loading entitlements:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadEntitlements();
  }, [user?.id]);

  if (!user) {
    return <div>Not logged in</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Entitlements Debug</h1>
      
      <div className="mb-4">
        <h2 className="text-lg font-semibold">User Info:</h2>
        <p>ID: {user.id}</p>
        <p>Email: {user.email}</p>
      </div>

      <div className="mb-4">
        <h2 className="text-lg font-semibold">Hook Test:</h2>
        <p>Can Manage User Tiers: {hookLoading ? 'Loading...' : canManageUserTiers ? 'YES' : 'NO'}</p>
      </div>

      <div className="mb-4">
        <h2 className="text-lg font-semibold">Direct Entitlements:</h2>
        {loading && <p>Loading entitlements...</p>}
        {error && <p className="text-red-600">Error: {error}</p>}
        {!loading && !error && (
          <div>
            <p>Total entitlements: {entitlements.length}</p>
            <ul className="list-disc list-inside">
              {entitlements.map((entitlement, index) => (
                <li key={index} className={entitlement.includes('CAN_MANAGE_USER_TIERS') ? 'font-bold text-green-600' : ''}>
                  {entitlement}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
