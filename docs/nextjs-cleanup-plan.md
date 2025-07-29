# Next.js Cleanup Plan for BookTalks Buddy

## Executive Summary

BookTalks Buddy is a **Vite + React** application that contains significant Next.js artifacts causing console errors and broken functionality. Our investigation identified **15+ Next.js API route files**, authentication middleware, and frontend components making `/api/` calls that fail because Next.js API routes don't exist in Vite projects.

**Key Issues:**
- Book availability request form fails with JSON parsing errors
- Connection status monitoring fails with 404 errors  
- Debug components attempt to call non-existent API endpoints
- Authentication middleware designed for Next.js server-side rendering

**Impact:** HIGH - Core user functionality is broken, console is flooded with errors

**Solution:** Systematic removal of Next.js artifacts with migration to direct Supabase queries

---

## Detailed Inventory

### 🚨 **CRITICAL PRIORITY - Active Frontend Usage**

#### **1. Book Availability Request API**
- **Files:** `src/pages/api/book-availability-requests/index.ts`, `src/pages/api/book-availability-requests/[requestId].ts`
- **Used By:** `src/components/landing/BookAvailabilityRequestForm.tsx:127`
- **Risk Level:** **HIGH**
- **Impact:** Book request form completely broken - users cannot submit requests
- **Dependencies:** `BookRequestPage.tsx`, admin request management

#### **2. Connection Status API**
- **Files:** `/api/ping` endpoint (doesn't exist)
- **Used By:** `src/hooks/useConnectionStatus.ts:57`
- **Risk Level:** **MEDIUM**
- **Impact:** Network connectivity monitoring fails
- **Dependencies:** Global connection status throughout app

#### **3. Debug/Payment APIs**
- **Files:** 
  - `src/pages/api/users/payments-v2.ts`
  - `src/pages/api/users/test.ts`
  - `src/pages/api/debug/payment-records.ts`
- **Used By:** `src/components/debug/PaymentHistoryDebug.tsx:33-37`
- **Risk Level:** **LOW** (debug only)
- **Impact:** Debug functionality fails
- **Dependencies:** None (development only)

### ⚠️ **MODERATE PRIORITY - Backend Infrastructure**

#### **4. Authentication Middleware**
- **Files:** 
  - `src/lib/api/middleware/auth.ts`
  - `src/lib/entitlements/backend/middleware.ts`
  - `src/lib/entitlements/backend/types.ts`
- **Used By:** API routes only (which will be removed)
- **Risk Level:** **SAFE** (after API cleanup)
- **Impact:** None after API routes removed
- **Dependencies:** Must remove API routes first

#### **5. Unused API Routes (12+ files)**
- **Files:** 
  - `src/pages/api/books/search.ts`
  - `src/pages/api/clubs/create.ts`
  - `src/pages/api/books/collections/index.ts`
  - `src/pages/api/clubs/[clubId]/join-requests.ts`
  - `src/pages/api/bookclubs/[clubId].ts`
  - `src/pages/api/book-listings/index.ts`
  - `src/pages/api/book-listings/[listingId].ts`
  - `src/pages/api/clubs/[clubId]/questions/index.ts`
  - `src/pages/api/clubs/[clubId]/questions/[questionId].ts`
  - `src/pages/api/clubs/[clubId]/questions/reorder.ts`
  - `src/pages/api/books/reading-lists/index.ts`
  - `src/pages/api/users/payments-simple.ts`
  - `src/pages/api/users/payments-test.ts`
  - `src/pages/api/store/[storeId]/carousel/reorder.ts`
- **Used By:** None (frontend uses direct Supabase queries)
- **Risk Level:** **SAFE**
- **Impact:** None
- **Dependencies:** None

### 🧪 **LOW PRIORITY - Development/Testing**

#### **6. Test Files**
- **Files:** `src/test/test-api-endpoints.ts:71-75`
- **Used By:** Development testing only
- **Risk Level:** **SAFE**
- **Impact:** Tests fail (but they test non-existent endpoints anyway)
- **Dependencies:** None

### ✅ **COMPATIBLE - Keep As-Is**

#### **7. next-themes Package**
- **Files:** `src/components/ui/sonner.tsx:1`
- **Used By:** Toast notification theming
- **Risk Level:** **SAFE** (Vite compatible)
- **Impact:** Toast theming would break if removed
- **Dependencies:** Keep - works fine with Vite

---

## Removal Strategy

### **Phase 1: Critical Fixes (Do First)**

**Objective:** Fix broken user-facing functionality

#### **Step 1.1: Fix Book Availability Request Form**
```typescript
// File: src/components/landing/BookAvailabilityRequestForm.tsx
// Replace lines 127-136:

// OLD (broken):
const response = await fetch('/api/book-availability-requests', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ ...formData, store_id: storeId }),
});

// NEW (working):
import { createBookAvailabilityRequest } from '@/lib/services/bookAvailabilityRequestService';

const result = await createBookAvailabilityRequest({
  ...formData,
  store_id: storeId,
});
```

#### **Step 1.2: Fix Connection Status Hook**
```typescript
// File: src/hooks/useConnectionStatus.ts
// Replace lines 57-61:

// OLD (broken):
const response = await fetch('/api/ping', { 
  method: 'HEAD',
  cache: 'no-store',
  headers: { 'Cache-Control': 'no-cache' }
});

// NEW (working):
const { data, error } = await supabase
  .from('users')
  .select('count')
  .limit(1);

if (!error) {
  handleOnline();
  return true;
}
```

**Verification for Phase 1:**
- [ ] Book availability request form submits successfully
- [ ] No console errors on form submission
- [ ] Connection status monitoring works
- [ ] No `/api/` related errors in console

### **Phase 2: Infrastructure Cleanup (Do After Phase 1)**

**Objective:** Remove Next.js infrastructure and unused files

#### **Step 2.1: Remove API Routes Directory**
```bash
# Remove entire API directory
rm -rf src/pages/api/
```

#### **Step 2.2: Remove Authentication Middleware**
```bash
# Remove Next.js auth files
rm src/lib/api/middleware/auth.ts
rm src/lib/entitlements/backend/middleware.ts
rm src/lib/entitlements/backend/types.ts
```

#### **Step 2.3: Update Debug Components**
```typescript
// File: src/components/debug/PaymentHistoryDebug.tsx
// Replace API calls with direct Supabase queries:

// Remove these endpoints from the test array:
const endpoints = [
  // { name: 'Simple Test', url: '/api/users/test' },           // REMOVE
  // { name: 'Payment API v2', url: '/api/users/payments-v2' }, // REMOVE
  // { name: 'Debug Records', url: '/api/debug/payment-records' } // REMOVE
];

// Replace with direct Supabase calls for debugging
```

#### **Step 2.4: Clean Up Test Files**
```bash
# Remove or update test files
rm src/test/test-api-endpoints.ts
# OR update to remove API endpoint tests
```

**Verification for Phase 2:**
- [ ] No `src/pages/api/` directory exists
- [ ] No imports referencing removed middleware files
- [ ] Debug components work without API calls
- [ ] Application builds successfully
- [ ] No TypeScript errors

### **Phase 3: Final Verification (Do Last)**

**Objective:** Ensure complete cleanup and functionality

#### **Step 3.1: Comprehensive Testing**
- [ ] Book availability request form works end-to-end
- [ ] Connection status monitoring functions correctly
- [ ] Admin request management panel works
- [ ] No console errors related to `/api/` calls
- [ ] All existing functionality preserved

#### **Step 3.2: Code Quality Check**
- [ ] No unused imports remain
- [ ] No dead code from removed files
- [ ] TypeScript compilation successful
- [ ] ESLint passes without Next.js related warnings

#### **Step 3.3: Performance Verification**
- [ ] Application startup time not affected
- [ ] No failed network requests in browser dev tools
- [ ] Supabase queries perform adequately

---

## Verification Checklist

### **After Phase 1 (Critical Fixes):**
```bash
# Test book request functionality
1. Navigate to /book-request
2. Fill out and submit form
3. Verify success message appears
4. Check browser console for errors

# Test connection monitoring
1. Open browser dev tools
2. Go offline/online
3. Verify connection status updates
4. Check for failed /api/ping requests
```

### **After Phase 2 (Cleanup):**
```bash
# Build verification
npm run build
npm run preview

# File structure check
ls -la src/pages/  # Should not contain 'api' directory
grep -r "NextApiRequest" src/  # Should return no results
grep -r "/api/" src/  # Should only show legitimate external API calls
```

### **After Phase 3 (Final):**
```bash
# Full application test
npm run dev
# Test all major user flows
# Verify admin functionality
# Check all console logs are clean
```

---

## Rollback Plan

### **If Phase 1 Breaks Functionality:**
1. **Revert BookAvailabilityRequestForm.tsx:**
   ```bash
   git checkout HEAD~1 -- src/components/landing/BookAvailabilityRequestForm.tsx
   ```

2. **Revert useConnectionStatus.ts:**
   ```bash
   git checkout HEAD~1 -- src/hooks/useConnectionStatus.ts
   ```

3. **Restore API files temporarily:**
   ```bash
   git checkout HEAD~1 -- src/pages/api/book-availability-requests/
   ```

### **If Phase 2 Causes Build Issues:**
1. **Restore middleware files:**
   ```bash
   git checkout HEAD~1 -- src/lib/api/middleware/
   git checkout HEAD~1 -- src/lib/entitlements/backend/
   ```

2. **Check for missing imports:**
   ```bash
   npm run build 2>&1 | grep "Cannot resolve"
   ```

### **Emergency Full Rollback:**
```bash
# Revert all changes
git reset --hard HEAD~[number-of-commits]
# OR restore from backup
git stash
git checkout main
```

---

## Dependencies and Prerequisites

### **Before Starting:**
- [ ] Create backup branch: `git checkout -b nextjs-cleanup-backup`
- [ ] Ensure all tests pass: `npm run test`
- [ ] Verify Supabase connection works
- [ ] Document current functionality that works

### **Required Knowledge:**
- Understanding of Supabase client-side queries
- Familiarity with React hooks and context
- Basic knowledge of Vite build system

### **Tools Needed:**
- Git for version control and rollbacks
- Node.js and npm for building/testing
- Browser dev tools for verification

---

## Success Criteria

✅ **Cleanup Complete When:**
- No Next.js API routes exist in codebase
- No console errors related to `/api/` calls
- Book availability request form works perfectly
- Connection status monitoring functions
- All existing user functionality preserved
- Application builds and runs without errors
- No Next.js dependencies remain (except compatible ones like next-themes)

**Estimated Time:** 2-4 hours for complete cleanup
**Risk Level:** Medium (with proper testing and rollback plan)
**Business Impact:** High positive (eliminates user-facing errors)
