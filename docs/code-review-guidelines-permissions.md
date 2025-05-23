# Code Review Guidelines: Permission System

**Version**: 1.0  
**Date**: January 25, 2025  
**Scope**: All permission-related code changes  

## 🚨 MANDATORY CHECKS

### Permission System Usage
- [ ] **NO legacy functions**: Verify no usage of `isClubAdmin`, `isClubLead` 
- [ ] **Entitlements only**: All permission checks use `getUserEntitlements`, `canManageClub`, `canModerateClub`
- [ ] **Store ID handling**: Dynamic store ID fetching, no hardcoded values
- [ ] **Error handling**: Proper error messages and fallback behavior

### Security Review
- [ ] **Authorization first**: Permission checks before any data access
- [ ] **Context validation**: Proper club/store context validation
- [ ] **Multi-tenant isolation**: Users can only access their store's data
- [ ] **Input validation**: All user inputs validated before permission checks

### Code Quality
- [ ] **TypeScript types**: Proper typing for all permission-related functions
- [ ] **Error logging**: Appropriate error logging for debugging
- [ ] **Performance**: No N+1 queries, proper caching usage
- [ ] **Testing**: Unit tests for permission logic

## 🔍 REVIEW CHECKLIST BY FILE TYPE

### API Routes (`src/lib/api/**/*.ts`)
```typescript
// ✅ GOOD - Entitlements system usage
const entitlements = await getUserEntitlements(userId);
const canManage = canManageClub(entitlements, clubId, storeId);

// ❌ BAD - Legacy function usage  
const isAdmin = await isClubAdmin(userId, clubId);
```

### React Components (`src/components/**/*.tsx`)
```typescript
// ✅ GOOD - Entitlements hook usage
const { result: canManage } = useCanManageClub(clubId, storeId);

// ❌ BAD - Legacy context usage
const { isAdmin } = useAuth();
const canManage = isAdmin(clubId);
```

### Hooks (`src/hooks/**/*.ts`)
```typescript
// ✅ GOOD - Dynamic store ID fetching
const [storeId, setStoreId] = useState('');
useEffect(() => {
  fetchStoreId(clubId).then(setStoreId);
}, [clubId]);

// ❌ BAD - Hardcoded store ID
const storeId = '00000000-0000-0000-0000-000000000000';
```

## 🛡️ SECURITY FOCUS AREAS

### High-Risk Changes
- Any changes to permission checking logic
- New API endpoints with authorization
- UI components that show/hide features based on permissions
- Database queries involving user roles or club access

### Required Security Review
- Changes affecting multiple user roles
- Store-level permission modifications  
- Club management functionality
- User data access patterns

## 📋 APPROVAL REQUIREMENTS

### Standard Permission Changes
- **Reviewer**: Any senior developer familiar with entitlements system
- **Tests**: Unit tests required
- **Documentation**: Update if API changes

### High-Risk Permission Changes  
- **Reviewers**: 2 senior developers + security review
- **Tests**: Unit + integration tests required
- **Documentation**: Full documentation update
- **Staging**: Must test in staging environment

## 🚀 DEPLOYMENT CHECKLIST

### Pre-Deployment
- [ ] All tests passing
- [ ] Security review completed
- [ ] Performance impact assessed
- [ ] Error handling verified

### Post-Deployment Monitoring
- [ ] Monitor permission check performance
- [ ] Watch for authorization errors
- [ ] Verify user role functionality
- [ ] Check multi-tenant isolation

## 📞 ESCALATION

### When to Escalate
- Permission bypass discovered
- Multi-tenant isolation failure
- Performance degradation >50%
- User data access violations

### Escalation Process
1. **Immediate**: Stop deployment if in progress
2. **Notify**: Security team and tech lead
3. **Document**: Create incident report
4. **Fix**: Implement fix with expedited review
5. **Verify**: Comprehensive testing before re-deployment

---

**Remember**: Permission system changes affect user security and data access. When in doubt, err on the side of caution and request additional review.
