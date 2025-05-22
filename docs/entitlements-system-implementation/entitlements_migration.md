# Entitlements System Extension - Migration Strategy

## Overview

This document outlines the comprehensive strategy for migrating existing users and data to the new entitlements system while ensuring minimal disruption to the platform.

## Migration Phases

### Phase 1: Database Schema Preparation
1. Create new tables (`store_administrators`, `role_activity`)
2. Add new columns to existing tables
3. Create indexes and constraints
4. Validate schema changes

### Phase 2: Data Migration
1. Assign default membership tiers
2. Migrate club creators to Club Lead roles
3. Migrate store administrators
4. Validate data integrity

### Phase 3: System Cutover
1. Deploy new entitlements logic
2. Update client-side caching
3. Monitor system performance
4. Handle edge cases

### Phase 4: Cleanup and Optimization
1. Remove deprecated code
2. Optimize performance
3. Update documentation
4. Send user notifications

## User Transition Strategy

### Default Tier Assignment

All existing users will be transitioned as follows:

1. **Default Assignment**: All users start as "MEMBER" tier
2. **Club Creator Upgrade**: Users with existing clubs upgrade to "PRIVILEGED"
3. **Manual Review**: Special cases reviewed individually

```typescript
async function assignDefaultMembershipTiers() {
  // Step 1: Set all users to MEMBER by default
  await supabase
    .from('users')
    .update({ membership_tier: 'MEMBER' })
    .is('membership_tier', null);

  // Step 2: Identify club creators
  const { data: clubCreators } = await supabase
    .from('book_clubs')
    .select('created_by')
    .is('deleted_at', null);

  const creatorIds = [...new Set(clubCreators.map(c => c.created_by))];

  // Step 3: Upgrade club creators to PRIVILEGED
  if (creatorIds.length > 0) {
    await supabase
      .from('users')
      .update({ membership_tier: 'PRIVILEGED' })
      .in('id', creatorIds);
  }
}
```

### Role Migration

#### Club Leadership Migration
```typescript
async function migrateClubCreatorsToLeads() {
  // Get all clubs with their creators
  const { data: clubs } = await supabase
    .from('book_clubs')
    .select('id, created_by')
    .is('deleted_at', null);

  // Update lead_user_id for each club
  for (const club of clubs) {
    await supabase
      .from('book_clubs')
      .update({ lead_user_id: club.created_by })
      .eq('id', club.id);
  }
}
```

#### Store Administrator Migration
```typescript
async function migrateStoreAdmins() {
  // Identify existing store administrators from legacy system
  const { data: legacyAdmins } = await supabase
    .from('legacy_store_admins')
    .select('*');

  // Migrate to new store_administrators table
  for (const admin of legacyAdmins) {
    await supabase
      .from('store_administrators')
      .insert({
        store_id: admin.store_id,
        user_id: admin.user_id,
        role: admin.is_owner ? 'owner' : 'manager',
        assigned_by: admin.assigned_by,
        assigned_at: admin.created_at
      });
  }
}
```

## Migration Scripts

### Main Migration Function
```typescript
export async function migrateUserRoles() {
  console.log('Starting entitlements system migration...');
  
  try {
    // Step 1: Assign default membership tiers
    console.log('Assigning default membership tiers...');
    await assignDefaultMembershipTiers();
    
    // Step 2: Migrate club creators to leads
    console.log('Migrating club creators to leads...');
    await migrateClubCreatorsToLeads();
    
    // Step 3: Migrate store administrators
    console.log('Migrating store administrators...');
    await migrateStoreAdmins();
    
    // Step 4: Validate migration
    console.log('Validating migration...');
    await validateMigration();
    
    // Step 5: Send notifications
    console.log('Sending user notifications...');
    await sendRoleMigrationNotifications();
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}
```

### Migration Validation
```typescript
async function validateMigration() {
  // Check that all users have membership tiers
  const { count: usersWithoutTiers } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .is('membership_tier', null);

  if (usersWithoutTiers > 0) {
    throw new Error(`${usersWithoutTiers} users still without membership tiers`);
  }

  // Check that all clubs have lead users
  const { count: clubsWithoutLeads } = await supabase
    .from('book_clubs')
    .select('*', { count: 'exact', head: true })
    .is('lead_user_id', null)
    .is('deleted_at', null);

  if (clubsWithoutLeads > 0) {
    throw new Error(`${clubsWithoutLeads} clubs still without lead users`);
  }

  console.log('Migration validation passed!');
}
```

## Rollback Strategy

### Rollback Preparation
```typescript
async function createMigrationBackup() {
  // Backup current user data
  const { data: users } = await supabase
    .from('users')
    .select('*');

  // Store backup in temporary table
  await supabase
    .from('migration_backup_users')
    .insert(users);

  // Backup club data
  const { data: clubs } = await supabase
    .from('book_clubs')
    .select('*');

  await supabase
    .from('migration_backup_clubs')
    .insert(clubs);
}
```

### Rollback Execution
```typescript
async function rollbackMigration() {
  console.log('Starting migration rollback...');
  
  try {
    // Restore user data
    const { data: backupUsers } = await supabase
      .from('migration_backup_users')
      .select('*');

    for (const user of backupUsers) {
      await supabase
        .from('users')
        .update(user)
        .eq('id', user.id);
    }

    // Restore club data
    const { data: backupClubs } = await supabase
      .from('migration_backup_clubs')
      .select('*');

    for (const club of backupClubs) {
      await supabase
        .from('book_clubs')
        .update(club)
        .eq('id', club.id);
    }

    console.log('Rollback completed successfully!');
  } catch (error) {
    console.error('Rollback failed:', error);
    throw error;
  }
}
```

## User Communication

### Notification System
```typescript
async function sendRoleMigrationNotifications() {
  // Get all users with their new roles
  const { data: users } = await supabase
    .from('users')
    .select('id, email, username, membership_tier');

  for (const user of users) {
    const userRoles = await getUserRoles(user.id);
    await sendRoleNotification(user, userRoles);
  }
}

async function sendRoleNotification(user: any, roles: any[]) {
  const notification = {
    user_id: user.id,
    type: 'role_migration',
    title: 'Your BookConnect Roles Have Been Updated',
    message: generateRoleMessage(user.membership_tier, roles),
    created_at: new Date().toISOString()
  };

  await supabase
    .from('notifications')
    .insert(notification);
}
```

### User Documentation
Create comprehensive documentation explaining:
1. New role system overview
2. What each role can do
3. How to request role changes
4. Support contact information

## Monitoring and Support

### Migration Monitoring
- Track migration progress in real-time
- Monitor system performance during migration
- Set up alerts for migration failures
- Log all migration activities

### Post-Migration Support
- Dedicated support channel for role-related questions
- FAQ document for common issues
- Process for handling role adjustment requests
- Regular review of role assignments

## Testing Strategy

### Pre-Migration Testing
1. Test migration scripts on staging environment
2. Validate rollback procedures
3. Performance testing with production data volume
4. User acceptance testing of new role system

### Post-Migration Validation
1. Verify all users have correct roles
2. Test permission enforcement
3. Validate caching system
4. Monitor system performance

## Timeline

### Week 1: Preparation
- Create migration scripts
- Set up monitoring
- Prepare user communications
- Test on staging environment

### Week 2: Execution
- Execute migration in production
- Monitor system closely
- Handle immediate issues
- Send user notifications

### Week 3: Stabilization
- Address any remaining issues
- Optimize performance
- Gather user feedback
- Document lessons learned

## Related Documents

- [Core System Design](./entitlements_core_design.md)
- [Implementation Details](./entitlements_implementation.md)
- [Advanced Considerations](./entitlements_advanced.md)
- [Testing Strategy](./entitlements_testing.md)
