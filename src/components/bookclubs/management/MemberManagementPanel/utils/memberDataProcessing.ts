/**
 * Member Data Processing Utilities
 * Extracted from MemberManagementPanel.tsx for reusability
 */

import type { Member, JoinRequest } from '../types/memberManagement';

/**
 * Process raw member data to ensure consistent format
 */
export function processMemberData(rawMembers: any[]): Member[] {
  return rawMembers.map(member => {
    // Create a default user object
    const userObj = {
      username: 'Unknown',
      email: '',
      display_name: 'Unknown User'
    };

    // Try to extract user data if available
    try {
      const userValue = member.user;
      if (typeof userValue === 'object' && userValue !== null) {
        // Use type assertion to handle the user object
        const userObject = userValue as any;
        if (userObject.username) userObj.username = userObject.username;
        if (userObject.email) userObj.email = userObject.email;
        if (userObject.display_name) userObj.display_name = userObject.display_name;
      }
    } catch (e) {
      console.error('Error processing user data:', e);
    }

    return {
      user_id: member.user_id,
      club_id: member.club_id,
      role: member.role,
      joined_at: member.joined_at,
      user: userObj
    };
  });
}

/**
 * Process raw join request data to ensure consistent format
 */
export function processJoinRequestData(rawRequests: any[]): JoinRequest[] {
  return rawRequests.map(request => {
    // Create a default user object
    const userObj = {
      username: 'Unknown',
      email: '',
      display_name: 'Unknown User'
    };

    // Try to extract user data if available
    try {
      const userValue = request.user;
      if (typeof userValue === 'object' && userValue !== null) {
        // Use type assertion to handle the user object
        const userObject = userValue as any;
        if (userObject.username) userObj.username = userObject.username;
        if (userObject.email) userObj.email = userObject.email;
        if (userObject.display_name) userObj.display_name = userObject.display_name;
      }
    } catch (e) {
      console.error('Error processing user data:', e);
    }

    return {
      user_id: request.user_id,
      club_id: request.club_id,
      requested_at: request.requested_at,
      status: request.status,
      user: userObj
    };
  });
}

/**
 * Filter members based on search query
 */
export function filterMembers(members: Member[], searchQuery: string): Member[] {
  if (searchQuery.trim() === '') {
    return members;
  }

  const query = searchQuery.toLowerCase();
  return members.filter(member =>
    member.user?.username?.toLowerCase().includes(query) ||
    member.user?.email?.toLowerCase().includes(query) ||
    member.user?.display_name?.toLowerCase().includes(query)
  );
}

/**
 * Filter join requests based on search query
 */
export function filterJoinRequests(requests: JoinRequest[], searchQuery: string): JoinRequest[] {
  if (searchQuery.trim() === '') {
    return requests;
  }

  const query = searchQuery.toLowerCase();
  return requests.filter(request =>
    request.user?.username?.toLowerCase().includes(query) ||
    request.user?.email?.toLowerCase().includes(query) ||
    request.user?.display_name?.toLowerCase().includes(query)
  );
}
