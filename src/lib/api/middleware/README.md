# Authentication Patterns for BookTalks Buddy

## Overview
This document defines the standard authentication patterns used throughout the BookTalks Buddy application to ensure consistency, security, and maintainability.

## Core Principles

### 1. Row Level Security (RLS) First
All data access must respect Supabase Row Level Security policies. Never bypass RLS with service role keys in client-accessible code.

### 2. Consistent Error Handling
All authentication failures should return standardized error responses with appropriate HTTP status codes.

### 3. Clear Separation of Concerns
- **API Routes**: Use server-side authentication middleware
- **Client Components**: Use client-side Supabase with RLS
- **Public Access**: Use public middleware with RLS enforcement

## Standard Authentication Patterns

### Pattern 1: API Routes with Authentication Required

**Use Case**: API endpoints that require user authentication (POST, PUT, DELETE operations)

**Implementation**:
```typescript
import { withAuth } from '@/lib/api/middleware/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authResult = await withAuth(req, res);
  if (!authResult) return; // Auth middleware handles response
  
  const { supabase, user } = authResult;
  // Continue with authenticated operations using RLS-enabled client
}
```

**Security Features**:
- Validates user session from request headers
- Provides RLS-enabled Supabase client
- Returns 401 for invalid/missing authentication
- Returns 500 for authentication system errors

### Pattern 2: API Routes with Public Access

**Use Case**: API endpoints that allow public access but still need RLS enforcement (GET operations for discovery)

**Implementation**:
```typescript
import { withPublicAccess } from '@/lib/api/middleware/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { supabase } = await withPublicAccess(req, res);
  // Use supabase client with RLS enforcement for public data
}
```

**Security Features**:
- Provides RLS-enabled Supabase client without requiring authentication
- RLS policies control data visibility
- No authentication required but security still enforced

### Pattern 3: Client Components

**Use Case**: React components that need to access data or perform operations

**Implementation**:
```typescript
import { supabase } from '@/integrations/supabase/client';

// In component or hook
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('some_field', value);
```

**Security Features**:
- Uses client-side Supabase instance
- RLS policies automatically enforced
- User session managed by Supabase auth helpers
- No manual token handling required

### Pattern 4: Club Lead Authorization

**Use Case**: Operations that require club leadership verification

**Implementation**:
```typescript
import { withAuth, validateClubLead } from '@/lib/api/middleware/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authResult = await withAuth(req, res);
  if (!authResult) return;
  
  const { supabase, user } = authResult;
  
  const isClubLead = await validateClubLead(supabase, clubId, user.id);
  if (!isClubLead) {
    return res.status(403).json({
      success: false,
      error: 'Only club leads can perform this action'
    });
  }
  
  // Continue with club lead operations
}
```

**Security Features**:
- Combines authentication with authorization
- Uses RLS-enabled queries for club lead verification
- Returns 403 for insufficient permissions

## Error Response Standards

### Authentication Errors (401)
```json
{
  "success": false,
  "error": "Authentication required",
  "details": "No valid session found"
}
```

### Authorization Errors (403)
```json
{
  "success": false,
  "error": "Only club leads can manage questions"
}
```

### Validation Errors (400)
```json
{
  "success": false,
  "error": "Club ID is required"
}
```

### System Errors (500)
```json
{
  "success": false,
  "error": "Authentication system error",
  "details": "Internal authentication error"
}
```

## Security Guidelines

### DO Use
- `withAuth()` for authenticated API endpoints
- `withPublicAccess()` for public API endpoints
- `validateClubLead()` for club leadership verification
- Client-side Supabase for component data access
- RLS policies for all data access control

### DO NOT Use
- Service role keys in client-accessible code
- Manual token parsing in API routes
- Direct database access bypassing RLS
- Hardcoded user IDs or permissions
- Mixed authentication patterns in the same endpoint

## Migration Guidelines

### From Service Role Key Pattern
**Old Pattern (INSECURE)**:
```typescript
const supabase = createClient(url, serviceRoleKey);
```

**New Pattern (SECURE)**:
```typescript
const authResult = await withAuth(req, res);
const { supabase } = authResult; // RLS-enabled client
```

### From Manual Token Handling
**Old Pattern (INCONSISTENT)**:
```typescript
const token = req.headers.authorization?.substring(7);
const { user } = await supabase.auth.getUser(token);
```

**New Pattern (STANDARDIZED)**:
```typescript
const authResult = await withAuth(req, res);
const { user } = authResult; // Properly validated user
```

## Testing Authentication Patterns

### Unit Testing
- Mock `withAuth()` and `withPublicAccess()` functions
- Test both success and failure scenarios
- Verify proper error response formats

### Integration Testing
- Test complete authentication flows
- Verify RLS policy enforcement
- Test club lead authorization workflows

### Security Testing
- Attempt unauthorized access to protected endpoints
- Verify that RLS policies prevent data leakage
- Test session validation and expiration

## Troubleshooting

### Common Issues
1. **401 Errors**: Check session validity and token format
2. **403 Errors**: Verify user permissions and club membership
3. **500 Errors**: Check environment variables and Supabase configuration
4. **RLS Violations**: Ensure proper policies are in place and enabled

### Debug Steps
1. Verify authentication middleware is properly imported
2. Check that RLS policies exist for the affected tables
3. Validate user session in browser developer tools
4. Review server logs for detailed error messages

## Maintenance

### Regular Reviews
- Audit authentication patterns quarterly
- Update documentation when patterns change
- Review and update RLS policies as needed
- Monitor authentication error rates

### Version Updates
- Test authentication patterns after Supabase updates
- Update middleware when auth helpers change
- Maintain backward compatibility during transitions
