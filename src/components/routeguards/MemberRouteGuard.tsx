import React, { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useHasContextualEntitlement } from '@/lib/entitlements/hooks';
import { isClubMember } from '@/lib/api/auth';

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
  const [isRegularMember, setIsRegularMember] = useState<boolean>(false);
  const [checkingMembership, setCheckingMembership] = useState<boolean>(true);

  // Check if the user is a club lead or moderator (which implies membership)
  const { result: isClubLead, loading: loadingLead } = useHasContextualEntitlement('CLUB_LEAD', clubId || '');
  const { result: isClubModerator, loading: loadingModerator } = useHasContextualEntitlement('CLUB_MODERATOR', clubId || '');

  // Check for regular membership
  useEffect(() => {
    async function checkMembership() {
      if (!user || !clubId) {
        setIsRegularMember(false);
        setCheckingMembership(false);
        return;
      }

      try {
        const membershipResult = await isClubMember(user.id, clubId);
        setIsRegularMember(membershipResult);
      } catch (error) {
        console.error('Error checking club membership:', error);
        setIsRegularMember(false);
      } finally {
        setCheckingMembership(false);
      }
    }

    checkMembership();
  }, [user, clubId]);

  // Combine all membership checks
  const isMember = isClubLead || isClubModerator || isRegularMember;

  // Debug logging
  console.log(`MemberRouteGuard for club ${clubId}:`, {
    isClubLead,
    isClubModerator,
    isRegularMember,
    isMember
  });

  // Show loading state while checking permissions
  if (loading || loadingLead || loadingModerator || checkingMembership) {
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