import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useParams, Navigate } from 'react-router-dom';

interface Props {
  children: React.ReactNode;
}

const MemberRouteGuard: React.FC<Props> = ({ children }) => {
  const { clubId } = useParams<{ clubId: string }>();
  const { isMember, fetchClubRoles, loading } = useAuth();

  useEffect(() => {
    fetchClubRoles();
  }, [fetchClubRoles]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!clubId || !isMember(clubId)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

export default MemberRouteGuard;