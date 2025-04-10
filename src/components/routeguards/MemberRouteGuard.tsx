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
    if (clubId) {
      console.log('MemberRouteGuard: Fetching club roles for clubId:', clubId);
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
    console.error('MemberRouteGuard: Club ID is missing');
    return <div className="p-8 text-center">Error: Club ID is missing</div>;
  }

  // Check if the user is a member
  const userIsMember = isMember(clubId);
  console.log(`MemberRouteGuard: User is ${userIsMember ? '' : 'not '}a member of club ${clubId}`);

  if (!userIsMember) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

export default MemberRouteGuard;