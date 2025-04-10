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
    if (clubId) {
      console.log('AdminRouteGuard: Fetching club roles for clubId:', clubId);
      fetchClubRoles();
    }
  }, [clubId, fetchClubRoles]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse">
          <div className="h-12 w-12 rounded-full bg-gray-300 mb-4"></div>
          <div className="h-4 w-32 bg-gray-300"></div>
        </div>
      </div>
    );
  }

  // Add more detailed error handling
  if (!clubId) {
    console.error('AdminRouteGuard: Club ID is missing');
    return <div className="p-8 text-center">Error: Club ID is missing</div>;
  }

  // Check if the user is an admin
  const userIsAdmin = isAdmin(clubId);
  console.log(`AdminRouteGuard: User is ${userIsAdmin ? '' : 'not '}an admin of club ${clubId}`);

  if (!userIsAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

export default AdminRouteGuard;