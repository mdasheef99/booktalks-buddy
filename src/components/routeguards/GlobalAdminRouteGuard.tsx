import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface Props {
  children: React.ReactNode;
}

const GlobalAdminRouteGuard: React.FC<Props> = ({ children }) => {
  const { user, loading, clubRoles } = useAuth();
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
        // Check if the user has any admin roles in their clubRoles
        const hasAdminRole = Object.values(clubRoles).includes('admin');
        setIsGlobalAdmin(hasAdminRole);
      } catch (error) {
        setIsGlobalAdmin(false);
      } finally {
        setCheckingAdmin(false);
      }
    };

    checkGlobalAdminStatus();
  }, [user, clubRoles]);

  if (loading || checkingAdmin) {
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
