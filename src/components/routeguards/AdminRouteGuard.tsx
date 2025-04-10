import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useParams, Navigate } from 'react-router-dom';

interface Props {
  children: React.ReactNode;
}

const AdminRouteGuard: React.FC<Props> = ({ children }) => {
  const { clubId } = useParams<{ clubId: string }>();
  const { isAdmin, fetchClubRoles, loading } = useAuth();

  useEffect(() => {
    fetchClubRoles();
  }, [fetchClubRoles]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!clubId || !isAdmin(clubId)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

export default AdminRouteGuard;