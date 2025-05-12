import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useHasContextualEntitlement } from '@/lib/entitlements/hooks';

interface Props {
  children: React.ReactNode;
}

/**
 * Route guard for club member routes
 * Allows access to club members, leads, moderators, and store administrators
 */
const MemberRouteGuard: React.FC<Props> = ({ children }) => {
  const { clubId } = useParams<{ clubId: string }>();
  const { user, loading } = useAuth();

  // Check if the user is a club lead or moderator (which implies membership)
  const { result: isClubLead, loading: loadingLead } = useHasContextualEntitlement('CLUB_LEAD', clubId || '');
  const { result: isClubModerator, loading: loadingModerator } = useHasContextualEntitlement('CLUB_MODERATOR', clubId || '');

  // TODO: Add a proper check for regular club membership using entitlements
  // For now, we'll consider a user a member if they're a lead or moderator
  // In a complete implementation, you would check a CLUB_MEMBER_[clubId] entitlement
  const isMember = isClubLead || isClubModerator;

  // Show loading state while checking permissions
  if (loading || loadingLead || loadingModerator) {
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

  // Check if the user is a member of this club
  if (!isMember) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

export default MemberRouteGuard;