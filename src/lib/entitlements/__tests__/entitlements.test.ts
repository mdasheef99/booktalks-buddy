import { 
  hasEntitlement, 
  hasContextualEntitlement,
  canManageClub,
  canModerateClub,
  canManageStore,
  canManageUserTiers
} from '../index';

describe('Entitlements', () => {
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
  });
});
