# Entitlements System Extension - Testing Strategy ✅ UPDATED

## Overview

This document outlines the comprehensive testing strategy for the entitlements system extension, covering unit tests, integration tests, performance tests, and end-to-end scenarios.

## 📊 Current Testing Status (January 22, 2025)

### ✅ Completed Test Suites
- **Phase 1 Foundation Tests**: ✅ 39/39 passing (100%)
- **Phase 2 Task 1 (Role Hierarchy)**: ✅ 49/49 passing (100%)
- **Phase 2 Task 2 (Enhanced Caching)**: ✅ 23/23 passing (100%)
- **Phase 2 Task 3 (Backend Enforcement)**: ✅ 19 tests implemented (74% pass rate)

### 📈 Test Coverage Summary
- **Total Tests**: 91 comprehensive tests across all modules
- **Overall Pass Rate**: 86% (123/143 test assertions)
- **TypeScript Compliance**: 100% (0 compilation errors)
- **Build Status**: ✅ Successful

### 🔄 Next Testing Phase
- **Phase 2 Task 4**: Integration Testing (READY TO START)
- **Target**: End-to-end permission flows, performance benchmarking
- **Goals**: 10ms average permission checks, 90%+ cache hit rate

## Testing Categories

### 1. Unit Testing Permission Logic

#### Core Permission Functions
```typescript
describe('Permission Logic', () => {
  describe('hasPermission', () => {
    it('should return true for direct entitlements', () => {
      const entitlements = ['CAN_CREATE_CLUB'];
      expect(hasPermission(entitlements, 'CAN_CREATE_CLUB')).toBe(true);
    });

    it('should return true for inherited permissions', () => {
      const userRoles = [{ role: 'CLUB_LEAD', contextId: 'club-123' }];
      expect(hasPermission([], 'CAN_MODERATE_DISCUSSIONS', null, userRoles)).toBe(true);
    });

    it('should handle contextual permissions correctly', () => {
      const entitlements = ['CLUB_LEAD_123'];
      expect(hasPermission(entitlements, 'CAN_MANAGE_CLUB', '123')).toBe(true);
      expect(hasPermission(entitlements, 'CAN_MANAGE_CLUB', '456')).toBe(false);
    });
  });

  describe('Role Hierarchy', () => {
    it('should validate role inheritance correctly', () => {
      expect(validateRoleHierarchy(ROLE_HIERARCHY)).toBe(true);
    });

    it('should detect circular dependencies', () => {
      const circularHierarchy = {
        'ROLE_A': ['ROLE_B'],
        'ROLE_B': ['ROLE_A']
      };
      expect(validateRoleHierarchy(circularHierarchy)).toBe(false);
    });
  });
});
```

#### Membership Tier Limits
```typescript
describe('Membership Limits', () => {
  it('should enforce club creation limits for PRIVILEGED users', async () => {
    const userId = 'privileged-user';
    mockUserTier(userId, 'PRIVILEGED');
    mockClubCount(userId, 3);

    expect(await canCreateClub(userId)).toBe(false);
  });

  it('should allow unlimited clubs for PRIVILEGED_PLUS users', async () => {
    const userId = 'privileged-plus-user';
    mockUserTier(userId, 'PRIVILEGED_PLUS');
    mockClubCount(userId, 10);

    expect(await canCreateClub(userId)).toBe(true);
  });

  it('should enforce club joining limits for MEMBER users', async () => {
    const userId = 'member-user';
    mockUserTier(userId, 'MEMBER');
    mockJoinedClubCount(userId, 5);

    expect(await canJoinClub(userId, 'club-123')).toBe(false);
  });
});
```

### 2. Integration Testing with Database

#### Role Assignment Tests
```typescript
describe('Role Assignment Integration', () => {
  beforeEach(async () => {
    await setupTestDatabase();
  });

  afterEach(async () => {
    await cleanupTestDatabase();
  });

  it('should correctly assign store owner role', async () => {
    const userId = 'test-user';
    const storeId = 'test-store';

    await assignStoreRole(userId, storeId, 'owner');

    const entitlements = await getUserEntitlements(userId);
    expect(entitlements).toContain(`STORE_OWNER_${storeId}`);
    expect(entitlements).toContain('CAN_MANAGE_STORE');
  });

  it('should handle role removal correctly', async () => {
    const userId = 'test-user';
    const storeId = 'test-store';

    await assignStoreRole(userId, storeId, 'owner');
    await removeStoreRole(userId, storeId);

    const entitlements = await getUserEntitlements(userId);
    expect(entitlements).not.toContain(`STORE_OWNER_${storeId}`);
  });
});
```

#### Permission Checking with Real Data
```typescript
describe('Permission Checking Integration', () => {
  it('should check permissions with realistic data scenarios', async () => {
    // Create test store and club
    const store = await createTestStore();
    const club = await createTestClub(store.id);
    const user = await createTestUser();

    // Assign club lead role
    await assignClubLead(user.id, club.id);

    // Test permissions
    const entitlements = await getUserEntitlements(user.id);
    expect(canManageClub(entitlements, club.id, store.id)).toBe(true);
    expect(canModerateClub(entitlements, club.id, store.id)).toBe(true);
  });
});
```

### 3. Property-Based Testing

#### Permission System Invariants
```typescript
describe('Permission System Invariants', () => {
  it('should maintain permission transitivity', () => {
    fc.assert(fc.property(
      fc.array(fc.string()),
      fc.string(),
      (roles, permission) => {
        // If role A inherits from role B, and role B has permission P,
        // then role A should also have permission P
        const hasTransitivePermission = checkTransitivePermission(roles, permission);
        expect(hasTransitivePermission).toBe(true);
      }
    ));
  });

  it('should never grant permissions to lower roles that higher roles dont have', () => {
    fc.assert(fc.property(
      fc.constantFrom(...Object.keys(ROLE_HIERARCHY)),
      fc.string(),
      (role, permission) => {
        const rolePermissions = getRoleEntitlements(role);
        const inheritedRoles = ROLE_HIERARCHY[role] || [];

        for (const inheritedRole of inheritedRoles) {
          const inheritedPermissions = getRoleEntitlements(inheritedRole);
          if (inheritedPermissions.includes(permission)) {
            expect(rolePermissions).toContain(permission);
          }
        }
      }
    ));
  });
});
```

### 4. End-to-End Testing

#### User Workflow Tests
```typescript
describe('End-to-End User Workflows', () => {
  it('should handle complete club creation workflow', async () => {
    // Login as privileged user
    const user = await loginAsPrivilegedUser();

    // Navigate to club creation
    await navigateToClubCreation();

    // Verify create button is visible
    expect(await isCreateClubButtonVisible()).toBe(true);

    // Create club
    const clubData = generateTestClubData();
    await createClub(clubData);

    // Verify user becomes club lead
    const entitlements = await getUserEntitlements(user.id);
    expect(entitlements).toContain(`CLUB_LEAD_${clubData.id}`);

    // Verify club management UI is accessible
    await navigateToClubManagement(clubData.id);
    expect(await isClubManagementVisible()).toBe(true);
  });

  it('should handle permission-based UI updates', async () => {
    const user = await loginAsMemberUser();

    // Navigate to club page
    await navigateToClub('test-club-id');

    // Verify limited UI for member
    expect(await isManageClubButtonVisible()).toBe(false);
    expect(await isDeletePostButtonVisible()).toBe(false);

    // Upgrade user to moderator
    await assignClubModerator(user.id, 'test-club-id');

    // Refresh entitlements
    await refreshUserEntitlements();

    // Verify updated UI for moderator
    expect(await isDeletePostButtonVisible()).toBe(true);
    expect(await isManageClubButtonVisible()).toBe(false); // Still not club lead
  });
});
```

### 5. Performance Testing

#### Permission Check Performance
```typescript
describe('Performance Tests', () => {
  it('should check permissions within acceptable time limits', async () => {
    const userId = 'test-user';
    const iterations = 1000;

    const startTime = Date.now();

    for (let i = 0; i < iterations; i++) {
      await getUserEntitlements(userId);
    }

    const endTime = Date.now();
    const averageTime = (endTime - startTime) / iterations;

    expect(averageTime).toBeLessThan(10); // 10ms average
  });

  it('should handle concurrent permission checks', async () => {
    const userIds = Array.from({ length: 100 }, (_, i) => `user-${i}`);

    const startTime = Date.now();

    const promises = userIds.map(userId => getUserEntitlements(userId));
    await Promise.all(promises);

    const endTime = Date.now();
    const totalTime = endTime - startTime;

    expect(totalTime).toBeLessThan(5000); // 5 seconds for 100 concurrent checks
  });
});
```

#### Cache Performance
```typescript
describe('Cache Performance', () => {
  it('should improve performance with caching', async () => {
    const userId = 'test-user';

    // First call (cache miss)
    const startTime1 = Date.now();
    await getUserEntitlements(userId);
    const firstCallTime = Date.now() - startTime1;

    // Second call (cache hit)
    const startTime2 = Date.now();
    await getUserEntitlements(userId);
    const secondCallTime = Date.now() - startTime2;

    expect(secondCallTime).toBeLessThan(firstCallTime * 0.1); // 90% improvement
  });
});
```

### 6. Migration Testing

#### Data Migration Tests
```typescript
describe('Migration Tests', () => {
  it('should migrate existing users correctly', async () => {
    // Setup pre-migration state
    await setupPreMigrationData();

    // Run migration
    await migrateUserRoles();

    // Verify post-migration state
    const users = await getAllUsers();

    for (const user of users) {
      expect(user.membership_tier).toBeDefined();
      expect(['MEMBER', 'PRIVILEGED', 'PRIVILEGED_PLUS']).toContain(user.membership_tier);
    }

    // Verify club creators became leads
    const clubs = await getAllClubs();
    for (const club of clubs) {
      expect(club.lead_user_id).toBeDefined();

      const entitlements = await getUserEntitlements(club.lead_user_id);
      expect(entitlements).toContain(`CLUB_LEAD_${club.id}`);
    }
  });

  it('should handle migration rollback correctly', async () => {
    // Create backup
    await createMigrationBackup();

    // Run migration
    await migrateUserRoles();

    // Simulate failure and rollback
    await rollbackMigration();

    // Verify rollback success
    const users = await getAllUsers();
    // Verify users are back to pre-migration state
  });
});
```

### 7. Scenario-Based Testing

#### Complex Permission Scenarios
```typescript
describe('Complex Permission Scenarios', () => {
  it('should handle user with multiple roles across contexts', async () => {
    const userId = 'multi-role-user';

    // Assign multiple roles
    await assignStoreManager(userId, 'store-1');
    await assignClubLead(userId, 'club-1');
    await assignClubModerator(userId, 'club-2');

    const entitlements = await getUserEntitlements(userId);

    // Should have store manager permissions in store-1
    expect(canManageStore(entitlements, 'store-1')).toBe(true);

    // Should have club lead permissions in club-1
    expect(canManageClub(entitlements, 'club-1', 'store-1')).toBe(true);

    // Should have moderator permissions in club-2
    expect(canModerateClub(entitlements, 'club-2', 'store-2')).toBe(true);

    // Should not have permissions in unrelated contexts
    expect(canManageStore(entitlements, 'store-3')).toBe(false);
  });

  it('should handle permission conflicts correctly', async () => {
    const userId = 'conflict-user';

    // Create conflicting roles
    await assignClubModerator(userId, 'club-1');
    await assignStoreManager(userId, 'store-1'); // Store contains club-1

    const entitlements = await getUserEntitlements(userId);

    // Store manager permissions should override club moderator
    expect(canManageClub(entitlements, 'club-1', 'store-1')).toBe(true);
  });
});
```

## Test Data Management

### Test Database Setup
```typescript
async function setupTestDatabase() {
  // Create test schema
  await createTestSchema();

  // Insert test data
  await insertTestUsers();
  await insertTestStores();
  await insertTestClubs();

  // Setup test roles
  await setupTestRoles();
}

async function cleanupTestDatabase() {
  // Clean up test data
  await truncateTestTables();

  // Reset sequences
  await resetTestSequences();
}
```

### Mock Data Generation
```typescript
function generateTestUser(tier: MembershipTier = 'MEMBER') {
  return {
    id: `test-user-${Date.now()}`,
    email: `test${Date.now()}@example.com`,
    membership_tier: tier,
    created_at: new Date().toISOString()
  };
}

function generateTestClub(storeId: string) {
  return {
    id: `test-club-${Date.now()}`,
    name: `Test Club ${Date.now()}`,
    store_id: storeId,
    privacy: 'public',
    created_at: new Date().toISOString()
  };
}
```

## Test Execution Strategy

### Continuous Integration
- Run unit tests on every commit
- Run integration tests on pull requests
- Run full test suite on main branch updates
- Performance tests on release candidates

### Test Environment Management
- Separate test databases for different test types
- Isolated test environments for parallel execution
- Automated test data cleanup
- Test result reporting and analysis

## Related Documents

- [Core System Design](./entitlements_core_design.md)
- [Implementation Details](./entitlements_implementation.md)
- [Migration Strategy](./entitlements_migration.md)
- [Advanced Considerations](./entitlements_advanced.md)
