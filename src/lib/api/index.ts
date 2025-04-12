/**
 * Main API module that re-exports all API functions
 * This maintains backward compatibility with existing imports
 */

// Re-export core API utilities
export * from './core';

// Re-export authentication helpers
export * from './auth';

// Re-export bookclub functions (except the ones that conflict with admin)
export * from './bookclubs/clubs';
export * from './bookclubs/books';
export * from './bookclubs/discussions';
export * from './bookclubs/discovery';
export * from './bookclubs/requests';

// Re-export members functions but handle the conflicting ones explicitly
export {
  joinClub,
  leaveClub,
  getClubMembers,
  addClubMember,
  updateMemberRole
} from './bookclubs/members';

// Re-export admin functions and use their version of the conflicting functions
export * from './admin/management';

// Re-export the conflicting functions from bookclubs/members with different names
export { removeMember as removeClubMember, inviteMember as inviteClubMember } from './bookclubs/members';

// Re-export profile functions
export * from './profile';
