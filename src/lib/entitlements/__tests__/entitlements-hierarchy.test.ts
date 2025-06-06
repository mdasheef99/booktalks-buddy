import {
  hasPermissionThroughRoleHierarchy,
  hasPermissionThroughRoleHierarchyAsync,
  hasPermissionAdvanced,
  trackRoleActivity,
  getUserRoles,
  UserRole,
  ROLE_HIERARCHY
} from '../index';

describe('Role Hierarchy System', () => {
  describe('Role Hierarchy', () => {
    it('should define proper hierarchy for platform owner', () => {
      expect(ROLE_HIERARCHY.PLATFORM_OWNER).toContain('PLATFORM_OWNER');
      expect(ROLE_HIERARCHY.PLATFORM_OWNER).toContain('STORE_OWNER');
      expect(ROLE_HIERARCHY.PLATFORM_OWNER).toContain('STORE_MANAGER');
      expect(ROLE_HIERARCHY.PLATFORM_OWNER).toContain('CLUB_LEAD');
      expect(ROLE_HIERARCHY.PLATFORM_OWNER).toContain('CLUB_MODERATOR');
      expect(ROLE_HIERARCHY.PLATFORM_OWNER).toContain('PRIVILEGED_PLUS');
      expect(ROLE_HIERARCHY.PLATFORM_OWNER).toContain('PRIVILEGED');
      expect(ROLE_HIERARCHY.PLATFORM_OWNER).toContain('MEMBER');
    });

    it('should define proper hierarchy for store owner', () => {
      expect(ROLE_HIERARCHY.STORE_OWNER).toContain('STORE_OWNER');
      expect(ROLE_HIERARCHY.STORE_OWNER).toContain('STORE_MANAGER');
      expect(ROLE_HIERARCHY.STORE_OWNER).not.toContain('PLATFORM_OWNER');
    });

    it('should define proper hierarchy for club lead', () => {
      expect(ROLE_HIERARCHY.CLUB_LEAD).toContain('CLUB_LEAD');
      expect(ROLE_HIERARCHY.CLUB_LEAD).toContain('CLUB_MODERATOR');
      expect(ROLE_HIERARCHY.CLUB_LEAD).not.toContain('STORE_MANAGER');
    });

    it('should define proper hierarchy for membership tiers', () => {
      expect(ROLE_HIERARCHY.PRIVILEGED_PLUS).toContain('PRIVILEGED_PLUS');
      expect(ROLE_HIERARCHY.PRIVILEGED_PLUS).toContain('PRIVILEGED');
      expect(ROLE_HIERARCHY.PRIVILEGED_PLUS).toContain('MEMBER');

      expect(ROLE_HIERARCHY.PRIVILEGED).toContain('PRIVILEGED');
      expect(ROLE_HIERARCHY.PRIVILEGED).toContain('MEMBER');
      expect(ROLE_HIERARCHY.PRIVILEGED).not.toContain('PRIVILEGED_PLUS');

      expect(ROLE_HIERARCHY.MEMBER).toEqual(['MEMBER']);
    });
  });

  describe('hasPermissionThroughRoleHierarchy', () => {
    it('should grant permissions through role inheritance', () => {
      const userRoles: UserRole[] = [
        { role: 'CLUB_LEAD', contextId: 'club-123', contextType: 'club' }
      ];

      // Club leads should inherit moderator permissions
      expect(hasPermissionThroughRoleHierarchy(userRoles, 'CAN_MODERATE_DISCUSSIONS')).toBe(true);
      expect(hasPermissionThroughRoleHierarchy(userRoles, 'CAN_DELETE_POSTS')).toBe(true);
    });

    it('should respect context boundaries', () => {
      const userRoles: UserRole[] = [
        { role: 'CLUB_LEAD', contextId: 'club-123', contextType: 'club' }
      ];

      // Should have permissions in their club
      expect(hasPermissionThroughRoleHierarchy(userRoles, 'CAN_MODERATE_DISCUSSIONS', 'club-123')).toBe(true);

      // Should not have permissions in other clubs
      expect(hasPermissionThroughRoleHierarchy(userRoles, 'CAN_MODERATE_DISCUSSIONS', 'club-456')).toBe(false);
    });

    it('should prioritize higher-level roles', () => {
      const userRoles: UserRole[] = [
        { role: 'STORE_OWNER', contextId: 'store-1', contextType: 'store' },
        { role: 'CLUB_MODERATOR', contextId: 'club-123', contextType: 'club' }
      ];

      // Store owner permissions should take precedence
      expect(hasPermissionThroughRoleHierarchy(userRoles, 'CAN_MANAGE_STORE')).toBe(true);
      expect(hasPermissionThroughRoleHierarchy(userRoles, 'CAN_CREATE_CLUBS')).toBe(true);
    });

    it('should handle platform-wide roles', () => {
      const userRoles: UserRole[] = [
        { role: 'PLATFORM_OWNER', contextType: 'platform' }
      ];

      // Platform owner should have all permissions everywhere
      expect(hasPermissionThroughRoleHierarchy(userRoles, 'CAN_MANAGE_PLATFORM')).toBe(true);
      expect(hasPermissionThroughRoleHierarchy(userRoles, 'CAN_MANAGE_STORE', 'any-store')).toBe(true);
      expect(hasPermissionThroughRoleHierarchy(userRoles, 'CAN_MODERATE_DISCUSSIONS', 'any-club')).toBe(true);
    });

    it('should handle membership tier roles', () => {
      const userRoles: UserRole[] = [
        { role: 'PRIVILEGED_PLUS', contextType: 'platform' }
      ];

      expect(hasPermissionThroughRoleHierarchy(userRoles, 'CAN_CREATE_UNLIMITED_CLUBS')).toBe(true);
      expect(hasPermissionThroughRoleHierarchy(userRoles, 'CAN_SEND_DIRECT_MESSAGES')).toBe(true);
      // Should inherit from lower tiers
      expect(hasPermissionThroughRoleHierarchy(userRoles, 'CAN_CREATE_LIMITED_CLUBS')).toBe(true);
      expect(hasPermissionThroughRoleHierarchy(userRoles, 'CAN_VIEW_PUBLIC_CLUBS')).toBe(true);
    });

    it('should return false for roles without required permissions', () => {
      const userRoles: UserRole[] = [
        { role: 'MEMBER', contextType: 'platform' }
      ];

      expect(hasPermissionThroughRoleHierarchy(userRoles, 'CAN_CREATE_CLUBS')).toBe(false);
      expect(hasPermissionThroughRoleHierarchy(userRoles, 'CAN_MANAGE_STORE')).toBe(false);
      expect(hasPermissionThroughRoleHierarchy(userRoles, 'CAN_MODERATE_DISCUSSIONS')).toBe(false);
    });
  });

  describe('UserRole interface', () => {
    it('should properly structure role data', () => {
      const userRole: UserRole = {
        role: 'CLUB_LEAD',
        contextId: 'club-123',
        contextType: 'club'
      };

      expect(userRole.role).toBe('CLUB_LEAD');
      expect(userRole.contextId).toBe('club-123');
      expect(userRole.contextType).toBe('club');
    });

    it('should allow optional context fields', () => {
      const platformRole: UserRole = {
        role: 'PLATFORM_OWNER',
        contextType: 'platform'
      };

      expect(platformRole.role).toBe('PLATFORM_OWNER');
      expect(platformRole.contextId).toBeUndefined();
      expect(platformRole.contextType).toBe('platform');
    });
  });

  describe('Complex role scenarios', () => {
    it('should handle users with multiple roles across contexts', () => {
      const userRoles: UserRole[] = [
        { role: 'STORE_MANAGER', contextId: 'store-1', contextType: 'store' },
        { role: 'CLUB_LEAD', contextId: 'club-123', contextType: 'club' },
        { role: 'CLUB_MODERATOR', contextId: 'club-456', contextType: 'club' },
        { role: 'PRIVILEGED_PLUS', contextType: 'platform' }
      ];

      // Should have store manager permissions in store-1
      expect(hasPermissionThroughRoleHierarchy(userRoles, 'CAN_VIEW_ALL_MEMBERS')).toBe(true);

      // Should have club lead permissions in club-123
      expect(hasPermissionThroughRoleHierarchy(userRoles, 'CAN_MANAGE_CLUB', 'club-123')).toBe(true);

      // Should have moderator permissions in club-456
      expect(hasPermissionThroughRoleHierarchy(userRoles, 'CAN_MODERATE_DISCUSSIONS', 'club-456')).toBe(true);

      // Should have privileged plus permissions platform-wide
      expect(hasPermissionThroughRoleHierarchy(userRoles, 'CAN_CREATE_UNLIMITED_CLUBS')).toBe(true);
    });

    it('should handle role conflicts correctly', () => {
      const userRoles: UserRole[] = [
        { role: 'STORE_OWNER', contextId: 'store-1', contextType: 'store' },
        { role: 'CLUB_MODERATOR', contextId: 'club-123', contextType: 'club' }
      ];

      // Store owner permissions should override club moderator for broader permissions
      expect(hasPermissionThroughRoleHierarchy(userRoles, 'CAN_MANAGE_ALL_CLUBS')).toBe(true);
      expect(hasPermissionThroughRoleHierarchy(userRoles, 'CAN_CREATE_CLUBS')).toBe(true);
    });
  });
});
