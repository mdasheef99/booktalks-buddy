# Self-Deletion Request System Tests

This document describes the test suite for the self-deletion request system in BookTalks Buddy.

## Test Structure

### 📁 Test Files

```
src/
├── lib/api/admin/__tests__/
│   └── selfDeletionRequests.test.ts     # API layer tests
├── components/admin/__tests__/
│   └── SelfDeletionRequests.test.tsx    # Component tests
├── __tests__/
│   ├── integration/
│   │   └── selfDeletionFlow.test.ts     # Integration tests
│   └── setup/
│       └── selfDeletionTests.setup.ts   # Test utilities
└── scripts/
    └── test-self-deletion.sh            # Test runner
```

## Test Categories

### 1. API Layer Tests (`selfDeletionRequests.test.ts`)

Tests the core API functionality:

#### **createSelfDeletionRequest**
- ✅ Creates deletion request successfully
- ✅ Handles club fetch errors
- ✅ Handles insertion errors
- ✅ Validates input parameters

#### **getSelfDeletionRequests**
- ✅ Fetches deletion requests successfully
- ✅ Handles fetch errors
- ✅ Handles missing user data gracefully
- ✅ Transforms data correctly

#### **checkUserClubOwnership**
- ✅ Returns true when user owns clubs
- ✅ Returns false when user owns no clubs
- ✅ Handles database errors

#### **processSelfDeletionRequest**
- ✅ Processes deletion successfully when user owns no clubs
- ✅ Fails when user still owns clubs
- ✅ Handles missing request
- ✅ Calls deleteUser with correct parameters

#### **deleteSelfDeletionRequest**
- ✅ Deletes request successfully
- ✅ Handles deletion errors

### 2. Component Tests (`SelfDeletionRequests.test.tsx`)

Tests the React admin interface:

#### **Component Rendering**
- ✅ Renders loading state initially
- ✅ Renders store access loading state
- ✅ Renders empty state when no requests
- ✅ Renders requests when data is available
- ✅ Displays store name in title

#### **Request Display**
- ✅ Displays user information correctly
- ✅ Displays club ownership information
- ✅ Displays deletion reasons
- ✅ Shows warning for users with clubs

#### **Action Handling**
- ✅ Handles reject request action
- ✅ Handles delete account action
- ✅ Disables buttons during processing

#### **Error Handling**
- ✅ Handles API errors gracefully
- ✅ Handles action errors
- ✅ Shows appropriate error messages

### 3. Integration Tests (`selfDeletionFlow.test.ts`)

Tests the complete end-to-end flow:

#### **Complete User Flow**
- ✅ User with clubs requesting deletion
- ✅ User without clubs requesting deletion
- ✅ Club ownership transfer workflow

#### **Club Ownership Validation**
- ✅ Correctly identifies users with clubs
- ✅ Correctly identifies users without clubs
- ✅ Handles database errors gracefully

#### **Admin Request Management**
- ✅ Fetches all deletion requests for admin
- ✅ Handles empty request list

#### **Error Scenarios**
- ✅ Handles request creation failures
- ✅ Handles processing non-existent requests
- ✅ Handles account deletion failures

## Running Tests

### Run All Self-Deletion Tests
```bash
# Using the test runner script
chmod +x scripts/test-self-deletion.sh
./scripts/test-self-deletion.sh
```

### Run Individual Test Suites
```bash
# API tests
npm run test src/lib/api/admin/__tests__/selfDeletionRequests.test.ts

# Component tests  
npm run test src/components/admin/__tests__/SelfDeletionRequests.test.tsx

# Integration tests
npm run test src/__tests__/integration/selfDeletionFlow.test.ts
```

### Run with Coverage
```bash
npm run test:coverage -- src/lib/api/admin/__tests__/selfDeletionRequests.test.ts
```

## Test Utilities

The `selfDeletionTests.setup.ts` file provides:

### Mock Factories
- `createMockUser()` - Creates mock user objects
- `createMockAdmin()` - Creates mock admin objects
- `createMockClub()` - Creates mock club objects
- `createMockDeletionRequest()` - Creates mock deletion requests

### Test Scenarios
- `testScenarios.userWithClubs` - User who owns clubs
- `testScenarios.userWithoutClubs` - User who owns no clubs
- `testScenarios.adminUser` - Admin/store owner user

### Database Mocking
- `MockDatabase` class - In-memory database for integration tests
- `mockDatabase` singleton - Shared database instance
- Database manipulation helpers

### Assertion Helpers
- `expectSuccessResult()` - Assert successful API responses
- `expectErrorResult()` - Assert error API responses
- `expectToastCalled()` - Assert toast notifications

## Test Coverage Goals

### Current Coverage
- **API Layer**: ~95% coverage
- **Component Layer**: ~90% coverage  
- **Integration**: ~85% coverage

### Coverage Areas
- ✅ Happy path scenarios
- ✅ Error handling
- ✅ Edge cases
- ✅ User interactions
- ✅ Database operations
- ✅ Security policies
- ✅ Loading states
- ✅ Empty states

## Manual Testing Checklist

After automated tests pass, verify manually:

### User Flow
- [ ] User can access Profile → Delete Account
- [ ] Password validation works (6+ characters)
- [ ] Club ownership check works
- [ ] Request creation succeeds
- [ ] Success message appears

### Admin Flow
- [ ] Admin can access `/admin/delete-requests`
- [ ] Requests appear in admin panel
- [ ] User information displays correctly
- [ ] Club ownership warnings show
- [ ] Reject request works
- [ ] Delete account works (after club transfer)
- [ ] Real-time validation works

### Security
- [ ] Regular users cannot access admin panel
- [ ] Users can only see their own requests
- [ ] Store owners can only see their store's requests
- [ ] RLS policies work correctly

### Error Scenarios
- [ ] Network errors handled gracefully
- [ ] Invalid data handled properly
- [ ] Permission errors show appropriate messages
- [ ] Database errors don't crash the app

## Continuous Integration

Tests should be run:
- ✅ On every commit
- ✅ Before merging PRs
- ✅ In staging environment
- ✅ Before production deployment

## Troubleshooting

### Common Issues

#### Tests fail with "Cannot find module"
```bash
# Install dependencies
npm install

# Check test setup
npm run test:setup
```

#### Mock errors
```bash
# Clear test cache
npm run test:clear-cache

# Restart test runner
npm run test:watch
```

#### Database connection errors
- Check Supabase configuration
- Verify test environment variables
- Ensure test database is accessible

### Debug Mode
```bash
# Run tests in debug mode
npm run test:debug src/lib/api/admin/__tests__/selfDeletionRequests.test.ts
```

## Future Improvements

### Planned Test Enhancements
- [ ] E2E tests with Playwright
- [ ] Performance testing
- [ ] Load testing for admin panel
- [ ] Accessibility testing
- [ ] Mobile responsiveness tests

### Test Automation
- [ ] Automated test reporting
- [ ] Test result notifications
- [ ] Performance regression detection
- [ ] Visual regression testing
