/**
 * DEPRECATED - All functionality has been moved to the modular API structure
 * See src/lib/api/index.ts for the new implementation
 *
 * This file is kept for backward compatibility only
 */

// Re-export from the new modular structure to maintain backward compatibility
export * from './api/index';

// Re-export the conflicting functions from bookclubs/members with different names
export { removeMember as removeClubMember, inviteMember as inviteClubMember } from './api/bookclubs/members';

// Re-export rejectJoinRequest as denyJoinRequest for backward compatibility
export { rejectJoinRequest as denyJoinRequest } from './api/bookclubs/requests';