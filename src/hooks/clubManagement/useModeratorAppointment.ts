/**
 * Moderator Appointment Hook
 *
 * React hook for appointing club moderators with validation and error handling.
 */

import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  clubManagementService,
  ModeratorAppointmentRequest,
  ClubModerator
} from '@/lib/services/clubManagementService';
import { ClubManagementAPIError } from '@/lib/api/clubManagement';

// =====================================================
// Types
// =====================================================

interface UseModeratorAppointmentResult {
  appointing: boolean;
  error: string | null;
  appointModerator: (userId: string, clubId: string) => Promise<ClubModerator | null>;
  clearError: () => void;
}

interface DefaultPermissions {
  analytics_access: boolean;
  content_moderation_access: boolean;
  member_management_access: boolean;
  meeting_management_access: boolean;
  customization_access: boolean;
}

// =====================================================
// Default Permissions Configuration
// =====================================================

const DEFAULT_MODERATOR_PERMISSIONS: DefaultPermissions = {
  analytics_access: false,           // Disabled by default - can be enabled later
  content_moderation_access: true,   // Core moderator permission
  member_management_access: true,    // Core moderator permission
  meeting_management_access: false,  // Coming soon feature
  customization_access: false        // Coming soon feature
};

// =====================================================
// Moderator Appointment Hook
// =====================================================

export function useModeratorAppointment(): UseModeratorAppointmentResult {
  const [appointing, setAppointing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const appointModerator = useCallback(async (
    userId: string, 
    clubId: string
  ): Promise<ClubModerator | null> => {
    if (!user) {
      setError('You must be logged in to appoint moderators');
      return null;
    }

    if (!userId || !clubId) {
      setError('Invalid user or club information');
      return null;
    }

    setAppointing(true);
    setError(null);

    try {
      const request: ModeratorAppointmentRequest = {
        clubId,
        userId,
        appointedBy: user.id,
        defaultPermissions: DEFAULT_MODERATOR_PERMISSIONS
      };

      const newModerator = await clubManagementService.appointModerator(request);
      
      return newModerator;
    } catch (err) {
      console.error('Error appointing moderator:', err);
      
      // Handle specific error types with user-friendly messages
      if (err instanceof ClubManagementAPIError) {
        switch (err.code) {
          case 'NOT_CLUB_MEMBER':
            setError('Only existing club members can be appointed as moderators.');
            break;
          case 'ALREADY_MODERATOR':
            setError('This user is already a moderator of this club.');
            break;
          case 'INSUFFICIENT_PERMISSIONS':
            setError('You don\'t have permission to appoint moderators.');
            break;
          case 'MEMBERS_FETCH_ERROR':
            setError('Unable to verify club membership. Please try again.');
            break;
          case 'MODERATORS_FETCH_ERROR':
            setError('Unable to check existing moderators. Please try again.');
            break;
          default:
            setError(err.message || 'Failed to appoint moderator. Please try again.');
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
      
      return null;
    } finally {
      setAppointing(false);
    }
  }, [user]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    appointing,
    error,
    appointModerator,
    clearError
  };
}

// =====================================================
// Utility Functions
// =====================================================

/**
 * Get user-friendly error message for appointment errors
 */
export function getAppointmentErrorMessage(error: ClubManagementAPIError): string {
  switch (error.code) {
    case 'NOT_CLUB_MEMBER':
      return 'Only existing club members can be appointed as moderators.';
    case 'ALREADY_MODERATOR':
      return 'This user is already a moderator of this club.';
    case 'INSUFFICIENT_PERMISSIONS':
      return 'You don\'t have permission to appoint moderators.';
    case 'MAX_MODERATORS_REACHED':
      return 'Maximum number of moderators reached for this club.';
    case 'USER_NOT_FOUND':
      return 'User not found. Please check the selection.';
    default:
      return error.message || 'Failed to appoint moderator. Please try again.';
  }
}

/**
 * Validate appointment request before processing
 */
export function validateAppointmentRequest(
  userId: string,
  clubId: string,
  currentUserId?: string
): { valid: boolean; error?: string } {
  if (!userId) {
    return { valid: false, error: 'Please select a member to appoint.' };
  }

  if (!clubId) {
    return { valid: false, error: 'Club information is missing.' };
  }

  if (!currentUserId) {
    return { valid: false, error: 'You must be logged in to appoint moderators.' };
  }

  return { valid: true };
}
