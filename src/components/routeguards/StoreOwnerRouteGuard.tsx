import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useStoreOwnerAccess } from '@/hooks/useStoreOwnerAccess';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldX } from 'lucide-react';

interface StoreOwnerRouteGuardProps {
  children: React.ReactNode;
  fallbackPath?: string;
}

/**
 * Route guard component that ensures only Store Owners can access Store Management features
 * Validates both authentication and Store Owner role/permissions
 */
export const StoreOwnerRouteGuard: React.FC<StoreOwnerRouteGuardProps> = ({
  children,
  fallbackPath = '/admin'
}) => {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const {
    isStoreOwner,
    storeId,
    loading: storeAccessLoading,
    error: storeAccessError
  } = useStoreOwnerAccess();

  // Show loading state while checking authentication and permissions
  if (authLoading || storeAccessLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-sm text-gray-600">
            Verifying Store Owner access...
          </p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return (
      <Navigate
        to="/login"
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  // Show error if there's an issue checking store access
  if (storeAccessError) {
    return (
      <div className="max-w-md mx-auto mt-8">
        <Alert variant="destructive">
          <ShieldX className="h-4 w-4" />
          <AlertDescription>
            Unable to verify Store Owner access. Please contact support if this issue persists.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Redirect to admin panel if not a Store Owner
  if (!isStoreOwner || !storeId) {
    return (
      <Navigate
        to={fallbackPath}
        state={{
          from: location.pathname,
          error: 'Store Owner access required for this feature'
        }}
        replace
      />
    );
  }

  // Render children with store context if all checks pass
  return (
    <StoreOwnerContext.Provider value={{ storeId, isStoreOwner: true }}>
      {children}
    </StoreOwnerContext.Provider>
  );
};

/**
 * Context for providing store information to Store Management components
 */
interface StoreOwnerContextValue {
  storeId: string;
  isStoreOwner: boolean;
}

const StoreOwnerContext = React.createContext<StoreOwnerContextValue | null>(null);

/**
 * Hook to access Store Owner context within protected routes
 */
export const useStoreOwnerContext = (): StoreOwnerContextValue => {
  const context = React.useContext(StoreOwnerContext);

  if (!context) {
    throw new Error('useStoreOwnerContext must be used within a StoreOwnerRouteGuard');
  }

  return context;
};

/**
 * Higher-order component for wrapping Store Management pages
 */
export const withStoreOwnerAccess = <P extends object>(
  Component: React.ComponentType<P>
) => {
  const WrappedComponent = (props: P) => (
    <StoreOwnerRouteGuard>
      <Component {...props} />
    </StoreOwnerRouteGuard>
  );

  WrappedComponent.displayName = `withStoreOwnerAccess(${Component.displayName || Component.name})`;

  return WrappedComponent;
};
