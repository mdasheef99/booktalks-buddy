# Developer Onboarding: Permission System

**Version**: 1.0  
**Date**: January 25, 2025  
**Audience**: New developers joining BookConnect  

## 🎯 Overview

BookConnect uses an **Enhanced Entitlements System** for all permission checking. This system provides consistent, secure, and maintainable authorization across the entire application.

## 🚨 CRITICAL: What NOT to Use

### ❌ NEVER Use These Legacy Functions
```typescript
// ❌ DEPRECATED - DO NOT USE
import { isClubAdmin } from '@/lib/api/auth';
import { isClubLead } from '@/lib/api/bookclubs/permissions';

// These will trigger ESLint errors and code review failures
```

### ❌ NEVER Use These Patterns
```typescript
// ❌ BAD - Legacy AuthContext pattern
const { isAdmin } = useAuth();
const canManage = isAdmin(clubId);

// ❌ BAD - Hardcoded store IDs
const storeId = '00000000-0000-0000-0000-000000000000';
```

## ✅ CORRECT: Entitlements System Usage

### API Functions (Backend)
```typescript
import { getUserEntitlements } from '@/lib/entitlements/cache';
import { canManageClub } from '@/lib/entitlements/permissions';

export async function myFunction(userId: string, clubId: string) {
  // 1. Get user entitlements
  const entitlements = await getUserEntitlements(userId);

  // 2. Get club's store ID dynamically
  const { data: club } = await supabase
    .from('book_clubs')
    .select('store_id')
    .eq('id', clubId)
    .single();

  // 3. Check permission with context
  const canManage = canManageClub(entitlements, clubId, club.store_id);

  if (!canManage) {
    throw new Error('Unauthorized: Only club administrators can perform this action');
  }

  // 4. Proceed with authorized action
}
```

### React Components (Frontend)
```typescript
import { useCanManageClub } from '@/lib/entitlements/hooks';

function MyComponent({ clubId }: { clubId: string }) {
  // 1. Get store ID dynamically
  const [storeId, setStoreId] = useState('');
  
  useEffect(() => {
    fetchStoreId(clubId).then(setStoreId);
  }, [clubId]);

  // 2. Use entitlements hook
  const { result: canManage, loading } = useCanManageClub(clubId, storeId);

  // 3. Conditional rendering
  if (loading) return <Spinner />;

  return (
    <div>
      {canManage && (
        <Button onClick={handleAdminAction}>
          Admin Action
        </Button>
      )}
    </div>
  );
}
```

## 🔑 Available Permission Functions

### Core Functions
- `getUserEntitlements(userId)` - Get user's entitlements
- `canManageClub(entitlements, clubId, storeId)` - Club management permission
- `canModerateClub(entitlements, clubId, storeId)` - Club moderation permission
- `hasContextualEntitlement(entitlements, type, contextId)` - Specific entitlement check

### React Hooks
- `useCanManageClub(clubId, storeId)` - Club management hook
- `useCanModerateClub(clubId, storeId)` - Club moderation hook
- `useUserEntitlements()` - Get current user's entitlements

## 🏗️ Common Patterns

### Pattern 1: API Route Protection
```typescript
// pages/api/clubs/[clubId]/books.ts
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { clubId } = req.query;
  const userId = req.user.id; // From auth middleware

  const entitlements = await getUserEntitlements(userId);
  const { data: club } = await supabase
    .from('book_clubs')
    .select('store_id')
    .eq('id', clubId)
    .single();

  if (!canManageClub(entitlements, clubId, club.store_id)) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  // Handle request...
}
```

### Pattern 2: Conditional UI Rendering
```typescript
function ClubManagementPanel({ clubId }: { clubId: string }) {
  const [storeId, setStoreId] = useState('');
  const { result: canManage } = useCanManageClub(clubId, storeId);

  return (
    <div>
      <h2>Club: {clubName}</h2>
      {canManage && (
        <div className="admin-panel">
          <Button>Edit Club</Button>
          <Button>Manage Members</Button>
        </div>
      )}
    </div>
  );
}
```

### Pattern 3: Error Handling
```typescript
try {
  const entitlements = await getUserEntitlements(userId);
  const canManage = canManageClub(entitlements, clubId, storeId);
  
  if (!canManage) {
    console.log('🚨 Permission denied for user:', userId);
    console.log('📍 Club ID:', clubId);
    console.log('🔑 User entitlements:', entitlements);
    throw new Error('Unauthorized: Only club administrators can perform this action');
  }
} catch (error) {
  console.error('Permission check failed:', error);
  // Handle error appropriately
}
```

## 🛡️ Security Best Practices

### 1. Always Check Permissions First
```typescript
// ✅ GOOD - Permission check before data access
const canManage = canManageClub(entitlements, clubId, storeId);
if (!canManage) throw new Error('Unauthorized');

const data = await fetchSensitiveData(clubId);
```

### 2. Use Dynamic Store IDs
```typescript
// ✅ GOOD - Dynamic store ID fetching
const { data: club } = await supabase
  .from('book_clubs')
  .select('store_id')
  .eq('id', clubId)
  .single();

const canManage = canManageClub(entitlements, clubId, club.store_id);
```

### 3. Handle Loading States
```typescript
// ✅ GOOD - Proper loading state handling
const { result: canManage, loading } = useCanManageClub(clubId, storeId);

if (loading) return <Spinner />;
if (!canManage) return <AccessDenied />;
```

## 🚀 Quick Start Checklist

For new features involving permissions:

- [ ] Use `getUserEntitlements()` for permission checking
- [ ] Fetch store IDs dynamically, never hardcode
- [ ] Use appropriate entitlements hooks in React components
- [ ] Add proper error handling and logging
- [ ] Test with different user roles
- [ ] Follow code review guidelines

## 📞 Getting Help

- **Code Review**: All permission-related changes require security review
- **Documentation**: See `docs/code-review-guidelines-permissions.md`
- **Examples**: Check migrated files in `src/lib/api/bookclubs/books.ts`
- **Testing**: Use existing test patterns in `src/lib/entitlements/__tests__/`

## 🎉 Welcome to the Team!

The entitlements system ensures BookConnect remains secure and maintainable. When in doubt, ask for help rather than using legacy patterns!
