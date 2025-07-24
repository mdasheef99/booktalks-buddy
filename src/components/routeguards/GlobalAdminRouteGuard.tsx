import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useHasEntitlement, useIsPlatformOwner } from '@/lib/entitlements/hooks';

interface Props {
  children: React.ReactNode;
}

const GlobalAdminRouteGuard: React.FC<Props> = ({ children }) => {
  const { user, loading } = useAuth();
  const { result: canManageUserTiers, loading: loadingUserTiers } = useHasEntitlement('CAN_MANAGE_USER_TIERS');
  const { result: canManageAllClubs, loading: loadingClubs } = useHasEntitlement('CAN_MANAGE_ALL_CLUBS');
  const { result: canManageStoreSettings, loading: loadingStoreSettings } = useHasEntitlement('CAN_MANAGE_STORE_SETTINGS');
  const { result: isPlatformOwner, loading: loadingPlatformOwner } = useIsPlatformOwner();

  const [isGlobalAdmin, setIsGlobalAdmin] = useState<boolean | null>(null);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  useEffect(() => {
    const checkGlobalAdminStatus = async () => {
      if (!user) {
        setIsGlobalAdmin(false);
        setCheckingAdmin(false);
        return;
      }

      try {
        // Check if the user has any admin entitlements
        // User is admin if they are a platform owner, store owner, or store manager
        const hasAdminEntitlements = isPlatformOwner ||
                                    canManageStoreSettings ||
                                    canManageUserTiers ||
                                    canManageAllClubs;

        // Debug logging removed for production

        setIsGlobalAdmin(hasAdminEntitlements);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsGlobalAdmin(false);
      } finally {
        setCheckingAdmin(false);
      }
    };

    // Only check admin status when all entitlement checks are complete
    if (!loadingUserTiers && !loadingClubs && !loadingStoreSettings && !loadingPlatformOwner) {
      checkGlobalAdminStatus();
    }
  }, [user, canManageUserTiers, canManageAllClubs, canManageStoreSettings, isPlatformOwner,
      loadingUserTiers, loadingClubs, loadingStoreSettings, loadingPlatformOwner]);

  // Show loading state if any of the required data is still loading
  if (loading || checkingAdmin || loadingUserTiers || loadingClubs || loadingStoreSettings || loadingPlatformOwner) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse">
          <div className="h-12 w-12 rounded-full bg-gray-300 mb-4"></div>
          <div className="h-4 w-32 bg-gray-300"></div>
        </div>
      </div>
    );
  }

  if (!isGlobalAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

export default GlobalAdminRouteGuard;
