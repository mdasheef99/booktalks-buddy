import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCanManageClub } from '@/lib/entitlements/hooks';

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

  // Get the store ID for the club
  // Note: In a real implementation, you would fetch this from the database
  // For now, we'll use a default store ID since we're transitioning to the new system
  const storeId = '00000000-0000-0000-0000-000000000000'; // Default store ID

  // Check if the user can manage this club using entitlements
  const { result: canManage, loading: loadingPermissions } = useCanManageClub(
    clubId || '',
    storeId
  );

  // Show loading state while checking permissions
  if (loading || loadingPermissions) {
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