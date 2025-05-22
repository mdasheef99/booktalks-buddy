import React, { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCanManageClub } from '@/lib/entitlements/hooks';
import { supabase } from '@/lib/supabase';

interface Props {
  children: React.ReactNode;
}

/**
 * Route guard for club management routes
 * Allows access to club leads, store owners, and store managers
 */
const AdminRouteGuard: React.FC<Props> = ({ children }) => {
  const { clubId } = useParams<{ clubId: string }>();
  const { user, loading } = useAuth();

  // Get the store ID for the club dynamically
  const [storeId, setStoreId] = useState<string | null>(null);
  const [fetchingStoreId, setFetchingStoreId] = useState(true);

  useEffect(() => {
    const fetchStoreId = async () => {
      if (!clubId) {
        setFetchingStoreId(false);
        return;
      }

      try {
        const { data: club } = await supabase
          .from('book_clubs')
          .select('store_id')
          .eq('id', clubId)
          .single();

        setStoreId(club?.store_id || null);
      } catch (error) {
        console.error('Error fetching club store ID:', error);
        setStoreId(null);
      } finally {
        setFetchingStoreId(false);
      }
    };

    fetchStoreId();
  }, [clubId]);

  // Check if the user can manage this club using entitlements
  const { result: canManage, loading: loadingPermissions } = useCanManageClub(
    clubId || '',
    storeId || ''
  );

  const isLoading = loading || loadingPermissions || fetchingStoreId;

  // Show loading state while checking permissions
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse">
          <div className="h-12 w-12 rounded-full bg-gray-300 mb-4"></div>
          <div className="h-4 w-32 bg-gray-300"></div>
        </div>
      </div>
    );
  }

  // Redirect if not logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Handle missing club ID
  if (!clubId) {
    return <Navigate to="/book-club" replace />;
  }

  // Check if the user can manage this club
  if (!canManage) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

export default AdminRouteGuard;