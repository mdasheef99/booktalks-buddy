import {
  hasEntitlement,
  hasContextualEntitlement,
  canManageClub,
  canModerateClub,
  canManageStore,
  canManageUserTiers,
  hasPermission,
  getRoleEntitlements,
  MEMBER_ENTITLEMENTS,
  PRIVILEGED_ENTITLEMENTS,
  PRIVILEGED_PLUS_ENTITLEMENTS,
  CLUB_LEAD_ENTITLEMENTS,
  CLUB_MODERATOR_ENTITLEMENTS,
  STORE_MANAGER_ENTITLEMENTS,
  STORE_OWNER_ENTITLEMENTS,
  PLATFORM_OWNER_ENTITLEMENTS
} from '../index';

describe('Basic Entitlements', () => {
  describe('hasEntitlement', () => {
    it('should return true if the user has the entitlement', () => {
      const entitlements = ['CAN_CREATE_CLUB', 'CAN_JOIN_PUBLIC_CLUBS'];
      expect(hasEntitlement(entitlements, 'CAN_CREATE_CLUB')).toBe(true);
    });

    it('should return false if the user does not have the entitlement', () => {
      const entitlements = ['CAN_CREATE_CLUB', 'CAN_JOIN_PUBLIC_CLUBS'];
      expect(hasEntitlement(entitlements, 'CAN_MANAGE_STORE_SETTINGS')).toBe(false);
    });

    it('should return false if the entitlements array is empty', () => {
      const entitlements: string[] = [];
      expect(hasEntitlement(entitlements, 'CAN_CREATE_CLUB')).toBe(false);
    });
  });

  describe('hasContextualEntitlement', () => {
    it('should return true if the user has the contextual entitlement', () => {
      const entitlements = ['CLUB_LEAD_123', 'STORE_OWNER_456'];
      expect(hasContextualEntitlement(entitlements, 'CLUB_LEAD', '123')).toBe(true);
    });

    it('should return false if the user does not have the contextual entitlement', () => {
      const entitlements = ['CLUB_LEAD_123', 'STORE_OWNER_456'];
      expect(hasContextualEntitlement(entitlements, 'CLUB_LEAD', '789')).toBe(false);
    });

    it('should return false if the entitlements array is empty', () => {
      const entitlements: string[] = [];
      expect(hasContextualEntitlement(entitlements, 'CLUB_LEAD', '123')).toBe(false);
    });
  });

  describe('canManageClub', () => {
    it('should return true if the user has CAN_MANAGE_ALL_CLUBS', () => {
      const entitlements = ['CAN_MANAGE_ALL_CLUBS'];
      expect(canManageClub(entitlements, '123', '456')).toBe(true);
    });

    it('should return true if the user is the club lead', () => {
      const entitlements = ['CLUB_LEAD_123'];
      expect(canManageClub(entitlements, '123', '456')).toBe(true);
    });

    it('should return true if the user is a store owner', () => {
      const entitlements = ['STORE_OWNER_456'];
      expect(canManageClub(entitlements, '123', '456')).toBe(true);
    });

    it('should return true if the user is a store manager', () => {
      const entitlements = ['STORE_MANAGER_456'];
      expect(canManageClub(entitlements, '123', '456')).toBe(true);
    });

    it('should return false if the user has none of the required entitlements', () => {
      const entitlements = ['CAN_JOIN_PUBLIC_CLUBS'];
      expect(canManageClub(entitlements, '123', '456')).toBe(false);
    });
  });

  describe('canModerateClub', () => {
    it('should return true if the user can manage the club', () => {
      const entitlements = ['CAN_MANAGE_ALL_CLUBS'];
      expect(canModerateClub(entitlements, '123', '456')).toBe(true);
    });

    it('should return true if the user is a club moderator', () => {
      const entitlements = ['CLUB_MODERATOR_123'];
      expect(canModerateClub(entitlements, '123', '456')).toBe(true);
    });

    it('should return false if the user has none of the required entitlements', () => {
      const entitlements = ['CAN_JOIN_PUBLIC_CLUBS'];
      expect(canModerateClub(entitlements, '123', '456')).toBe(false);
    });
  });

  describe('canManageStore', () => {
    it('should return true if the user has CAN_MANAGE_STORE_SETTINGS and is a store owner', () => {
      const entitlements = ['CAN_MANAGE_STORE_SETTINGS', 'STORE_OWNER_123'];
      expect(canManageStore(entitlements, '123')).toBe(true);
    });

    it('should return false if the user has CAN_MANAGE_STORE_SETTINGS but is not a store owner', () => {
      const entitlements = ['CAN_MANAGE_STORE_SETTINGS', 'STORE_MANAGER_123'];
      expect(canManageStore(entitlements, '123')).toBe(false);
    });

    it('should return false if the user is a store owner but does not have CAN_MANAGE_STORE_SETTINGS', () => {
      const entitlements = ['STORE_OWNER_123'];
      expect(canManageStore(entitlements, '123')).toBe(false);
    });
  });

  describe('canManageUserTiers', () => {
    it('should return true if the user has CAN_MANAGE_USER_TIERS and is a store owner', () => {
      const entitlements = ['CAN_MANAGE_USER_TIERS', 'STORE_OWNER_123'];
      expect(canManageUserTiers(entitlements, '123')).toBe(true);
    });

    it('should return true if the user has CAN_MANAGE_USER_TIERS and is a store manager', () => {
      const entitlements = ['CAN_MANAGE_USER_TIERS', 'STORE_MANAGER_123'];
      expect(canManageUserTiers(entitlements, '123')).toBe(true);
    });

    it('should return false if the user has CAN_MANAGE_USER_TIERS but is not a store admin', () => {
      const entitlements = ['CAN_MANAGE_USER_TIERS'];
      expect(canManageUserTiers(entitlements, '123')).toBe(false);
    });

    it('should return false if the user is a store admin but does not have CAN_MANAGE_USER_TIERS', () => {
      const entitlements = ['STORE_OWNER_123'];
      expect(canManageUserTiers(entitlements, '123')).toBe(false);
    });

    it('should return false if the user has none of the required entitlements', () => {
      const entitlements = ['CAN_JOIN_PUBLIC_CLUBS'];
      expect(canManageUserTiers(entitlements, '123')).toBe(false);
    });
  });

  describe('hasPermission', () => {
    it('should return true for direct entitlements', () => {
      const entitlements = ['CAN_CREATE_CLUB'];
      expect(hasPermission(entitlements, 'CAN_CREATE_CLUB')).toBe(true);
    });

    it('should return true for contextual entitlements', () => {
      const entitlements = ['CLUB_LEAD_123'];
      expect(hasPermission(entitlements, 'CLUB_LEAD', '123')).toBe(true);
    });

    it('should return false for missing entitlements', () => {
      const entitlements = ['CAN_VIEW_PUBLIC_CLUBS'];
      expect(hasPermission(entitlements, 'CAN_MANAGE_PLATFORM')).toBe(false);
    });

    it('should return false for wrong context', () => {
      const entitlements = ['CLUB_LEAD_123'];
      expect(hasPermission(entitlements, 'CLUB_LEAD', '456')).toBe(false);
    });
  });

  describe('Membership Tier Entitlements', () => {
    it('should include basic entitlements in MEMBER_ENTITLEMENTS', () => {
      expect(MEMBER_ENTITLEMENTS).toContain('CAN_VIEW_PUBLIC_CLUBS');
      expect(MEMBER_ENTITLEMENTS).toContain('CAN_JOIN_LIMITED_CLUBS');
      expect(MEMBER_ENTITLEMENTS).toContain('CAN_PARTICIPATE_IN_DISCUSSIONS');
    });

    it('should include MEMBER_ENTITLEMENTS in PRIVILEGED_ENTITLEMENTS', () => {
      expect(PRIVILEGED_ENTITLEMENTS).toContain('CAN_CREATE_LIMITED_CLUBS');
      expect(PRIVILEGED_ENTITLEMENTS).toContain('CAN_JOIN_UNLIMITED_CLUBS');
      expect(PRIVILEGED_ENTITLEMENTS).toContain('CAN_NOMINATE_BOOKS');
      // Should inherit from MEMBER
      expect(PRIVILEGED_ENTITLEMENTS).toContain('CAN_VIEW_PUBLIC_CLUBS');
    });

    it('should include PRIVILEGED_ENTITLEMENTS in PRIVILEGED_PLUS_ENTITLEMENTS', () => {
      expect(PRIVILEGED_PLUS_ENTITLEMENTS).toContain('CAN_CREATE_UNLIMITED_CLUBS');
      expect(PRIVILEGED_PLUS_ENTITLEMENTS).toContain('CAN_SEND_DIRECT_MESSAGES');
      // Should inherit from PRIVILEGED
      expect(PRIVILEGED_PLUS_ENTITLEMENTS).toContain('CAN_CREATE_LIMITED_CLUBS');
      expect(PRIVILEGED_PLUS_ENTITLEMENTS).toContain('CAN_NOMINATE_BOOKS');
    });
  });

  describe('Role Hierarchy Entitlements', () => {
    it('should include proper entitlements for CLUB_MODERATOR', () => {
      expect(CLUB_MODERATOR_ENTITLEMENTS).toContain('CAN_MODERATE_DISCUSSIONS');
      expect(CLUB_MODERATOR_ENTITLEMENTS).toContain('CAN_LOCK_TOPICS');
      expect(CLUB_MODERATOR_ENTITLEMENTS).toContain('CAN_DELETE_POSTS');
    });

    it('should include CLUB_MODERATOR_ENTITLEMENTS in CLUB_LEAD_ENTITLEMENTS', () => {
      expect(CLUB_LEAD_ENTITLEMENTS).toContain('CAN_MANAGE_CLUB');
      expect(CLUB_LEAD_ENTITLEMENTS).toContain('CAN_APPOINT_MODERATORS');
      // Should inherit from moderator
      expect(CLUB_LEAD_ENTITLEMENTS).toContain('CAN_MODERATE_DISCUSSIONS');
      expect(CLUB_LEAD_ENTITLEMENTS).toContain('CAN_DELETE_POSTS');
    });

    it('should include STORE_MANAGER_ENTITLEMENTS in STORE_OWNER_ENTITLEMENTS', () => {
      expect(STORE_OWNER_ENTITLEMENTS).toContain('CAN_MANAGE_STORE');
      expect(STORE_OWNER_ENTITLEMENTS).toContain('CAN_CREATE_CLUBS');
      // Should inherit from manager
      expect(STORE_OWNER_ENTITLEMENTS).toContain('CAN_VIEW_ALL_MEMBERS');
      expect(STORE_OWNER_ENTITLEMENTS).toContain('CAN_MANAGE_EVENTS');
    });

    it('should include STORE_OWNER_ENTITLEMENTS in PLATFORM_OWNER_ENTITLEMENTS', () => {
      expect(PLATFORM_OWNER_ENTITLEMENTS).toContain('CAN_MANAGE_PLATFORM');
      expect(PLATFORM_OWNER_ENTITLEMENTS).toContain('CAN_VIEW_PLATFORM_ANALYTICS');
      // Should inherit from store owner
      expect(PLATFORM_OWNER_ENTITLEMENTS).toContain('CAN_MANAGE_STORE');
      expect(PLATFORM_OWNER_ENTITLEMENTS).toContain('CAN_VIEW_ALL_MEMBERS');
    });
  });

  describe('getRoleEntitlements', () => {
    it('should return correct entitlements for each role', () => {
      expect(getRoleEntitlements('MEMBER')).toEqual(MEMBER_ENTITLEMENTS);
      expect(getRoleEntitlements('PRIVILEGED')).toEqual(PRIVILEGED_ENTITLEMENTS);
      expect(getRoleEntitlements('PRIVILEGED_PLUS')).toEqual(PRIVILEGED_PLUS_ENTITLEMENTS);
      expect(getRoleEntitlements('CLUB_MODERATOR')).toEqual(CLUB_MODERATOR_ENTITLEMENTS);
      expect(getRoleEntitlements('CLUB_LEAD')).toEqual(CLUB_LEAD_ENTITLEMENTS);
      expect(getRoleEntitlements('STORE_MANAGER')).toEqual(STORE_MANAGER_ENTITLEMENTS);
      expect(getRoleEntitlements('STORE_OWNER')).toEqual(STORE_OWNER_ENTITLEMENTS);
      expect(getRoleEntitlements('PLATFORM_OWNER')).toEqual(PLATFORM_OWNER_ENTITLEMENTS);
    });

    it('should return empty array for unknown roles', () => {
      expect(getRoleEntitlements('UNKNOWN_ROLE')).toEqual([]);
    });
  });
});
