import React, { useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useStoreManagerAccess } from '@/hooks/store-manager/useStoreManagerAccess';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldX } from 'lucide-react';

interface StoreManagerRouteGuardProps {
  children: React.ReactNode;
  fallbackPath?: string;
}

/**
 * Route guard component that ensures only Store Managers can access Store Manager features
 * Validates both authentication and Store Manager role/permissions
 */
export const StoreManagerRouteGuard: React.FC<StoreManagerRouteGuardProps> = ({
  children,
  fallbackPath = '/book-club'
}) => {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const {
    isStoreManager,
    storeId,
    storeName,
    loading: storeAccessLoading,
    error: storeAccessError,
    hasChecked
  } = useStoreManagerAccess();

  console.log('[Store Manager Route Guard] State:', {
    isStoreManager,
    storeId,
    storeName,
    loading: storeAccessLoading,
    error: storeAccessError,
    hasChecked,
    pathname: location.pathname
  });

  // Handle redirect after access check completes
  useEffect(() => {
    // Only proceed if auth loading is complete
    if (authLoading) {
      console.log('[Store Manager Route Guard] Auth still loading, waiting...');
      return;
    }

    // Check if user is authenticated
    if (!user) {
      console.log('[Store Manager Route Guard] No user, redirecting to login');
      navigate('/login', {
        state: { from: location.pathname },
        replace: true
      });
      return;
    }

    // Only proceed if store access check has completed (not just loading finished)
    if (!hasChecked) {
      console.log('[Store Manager Route Guard] Store access check not completed yet, waiting...');
      return;
    }

    // At this point, store access check is complete, check the result
    console.log('[Store Manager Route Guard] Store access check complete, checking result:', {
      isStoreManager,
      storeId,
      storeName,
      error: storeAccessError,
      hasChecked
    });

    // If there's an error, don't redirect - let the error display
    if (storeAccessError) {
      console.log('[Store Manager Route Guard] Store access error, showing error message');
      return;
    }

    // Check if user has Store Manager access
    if (!isStoreManager || !storeId) {
      console.log('[Store Manager Route Guard] Not a Store Manager, redirecting to fallback');
      navigate(fallbackPath, {
        state: {
          from: location.pathname,
          error: 'Store Manager access required for this feature'
        },
        replace: true
      });
      return;
    }

    console.log('[Store Manager Route Guard] Access granted, staying on Store Manager route');
  }, [authLoading, hasChecked, user, isStoreManager, storeId, storeAccessError, navigate, location.pathname, fallbackPath]);

  // Show loading state while checking authentication and permissions
  if (authLoading || storeAccessLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-sm text-gray-600">
            Verifying Store Manager access...
          </p>
        </div>
      </div>
    );
  }

  // Show error if there's an issue checking store access
  if (storeAccessError) {
    return (
      <div className="max-w-md mx-auto mt-8">
        <Alert variant="destructive">
          <ShieldX className="h-4 w-4" />
          <AlertDescription>
            Unable to verify Store Manager access. Please contact support if this issue persists.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // If not authenticated or not a Store Manager, show loading while redirect happens
  if (!user || !isStoreManager || !storeId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-sm text-gray-600">
            Redirecting...
          </p>
        </div>
      </div>
    );
  }

  // Render children with store context if all checks pass
  return (
    <StoreManagerContext.Provider value={{ storeId, storeName, isStoreManager: true }}>
      {children}
    </StoreManagerContext.Provider>
  );
};

/**
 * Context for providing store information to Store Manager components
 */
interface StoreManagerContextValue {
  storeId: string;
  storeName: string | null;
  isStoreManager: boolean;
}

const StoreManagerContext = React.createContext<StoreManagerContextValue | null>(null);

/**
 * Hook to access Store Manager context within protected routes
 */
export const useStoreManagerContext = (): StoreManagerContextValue => {
  const context = React.useContext(StoreManagerContext);

  if (!context) {
    throw new Error('useStoreManagerContext must be used within a StoreManagerRouteGuard');
  }

  return context;
};

/**
 * Higher-order component for wrapping Store Manager pages
 */
export const withStoreManagerAccess = <P extends object>(
  Component: React.ComponentType<P>
) => {
  const WrappedComponent = (props: P) => (
    <StoreManagerRouteGuard>
      <Component {...props} />
    </StoreManagerRouteGuard>
  );

  WrappedComponent.displayName = `withStoreManagerAccess(${Component.displayName || Component.name})`;

  return WrappedComponent;
};
