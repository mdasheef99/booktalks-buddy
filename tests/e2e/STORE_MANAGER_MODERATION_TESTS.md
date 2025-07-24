# Store Manager Moderation Interface - E2E Test Suite

## Overview

This document describes the comprehensive end-to-end test suite for the Store Manager Moderation Interface. The tests validate all aspects of the Store Manager Moderation functionality including access control, store-scoped report management, user management integration, and moderation dashboard interactions.

## Test Architecture

### Test Files Structure

```
tests/e2e/
├── store-manager-moderation.spec.ts           # Main moderation functionality tests
├── page-objects/
│   └── StoreManagerModerationPage.ts          # Page Object Model for moderation interface
├── helpers/
│   └── store-manager-helpers.ts               # Shared Store Manager test utilities
├── run-store-manager-moderation-tests.ts      # Custom test runner
└── STORE_MANAGER_MODERATION_TESTS.md          # This documentation file
```

### Test Categories

#### 1. **Core Functionality Tests** (`store-manager-moderation.spec.ts`)
- **Access Control**: Store Manager authentication and moderation route access
- **Dashboard Display**: Moderation interface layout, tabs, and navigation
- **Store Scoping**: Verify reports are filtered by Store Manager's assigned store
- **User Management**: Integration with user account management functionality
- **Tab Navigation**: All moderation tabs (Pending, Under Review, High Priority, Resolved, User Management)
- **Responsive Design**: Cross-device compatibility and UI responsiveness

#### 2. **Page Object Model Tests** (Advanced scenarios using POM)
- **Structured Testing**: Reusable page object methods for consistent testing
- **Visual Regression**: Screenshot capture for UI consistency validation
- **Complex Workflows**: Multi-step moderation scenarios and user interactions
- **Error Handling**: Loading states, error conditions, and recovery testing

#### 3. **Integration Tests** (Store Manager ecosystem integration)
- **Navigation Integration**: Seamless integration with Store Manager interface
- **Session Persistence**: Store Manager context maintenance across navigation
- **Permission Validation**: Store Manager specific access and functionality verification

## Test Configuration

### Environment Setup

```bash
# Required environment variables
BASE_URL=http://localhost:5173                    # Application base URL
STORE_MANAGER_PASSWORD=kafka                      # Store Manager test account password

# Test account credentials
STORE_MANAGER_EMAIL=kafka@bookconnect.com         # Store Manager test account
STORE_MANAGER_USERNAME=kafka                      # Store Manager username
EXPECTED_STORE_ID=ce76b99a-5f1a-481a-af85-862e584465e1  # Expected store ID
EXPECTED_STORE_NAME=Default Store                 # Expected store name
```

### Test Data

```javascript
// Store Manager test credentials
const TEST_CONFIG = {
  storeManager: {
    email: 'kafka@bookconnect.com',
    username: 'kafka',
    password: 'kafka'
  },
  expectedStore: {
    storeId: 'ce76b99a-5f1a-481a-af85-862e584465e1',
    storeName: 'Default Store'
  }
};
```

## Running Tests

### Quick Start

```bash
# Install dependencies
npm install

# Run basic moderation tests
npm run test:store-manager:moderation

# Run with visible browser
npm run test:store-manager:moderation basic --headed

# Run specific test pattern
npm run test:store-manager:moderation --grep="user management"
```

### Test Suites

```bash
# Basic moderation functionality
npm run test:store-manager:moderation basic

# Integration tests (moderation + access control)
npm run test:store-manager:moderation integration

# All moderation-related tests
npm run test:store-manager:moderation all
```

### Advanced Options

```bash
# Debug mode
npm run test:store-manager:moderation --debug

# Custom base URL
BASE_URL=https://staging.bookconnect.com npm run test:store-manager:moderation

# Specific test pattern
npm run test:store-manager:moderation --grep="responsive design"
```

## Test Scenarios

### 1. Authentication & Access Control

#### Test: Store Manager Moderation Access
- **Objective**: Verify Store Manager can access moderation interface
- **Steps**:
  1. Login as Store Manager (`kafka@bookconnect.com`)
  2. Navigate to `/store-manager/moderation`
  3. Verify page loads with proper Store Manager context
  4. Verify store-scoped moderation dashboard display

#### Test: Unauthorized Access Protection
- **Objective**: Ensure non-Store Manager users cannot access moderation interface
- **Steps**:
  1. Access `/store-manager/moderation` without authentication
  2. Verify redirect to login page or access denied
  3. Login as regular user
  4. Verify access is properly blocked

### 2. Moderation Dashboard Interface

#### Test: Complete Dashboard Display
- **Objective**: Verify all moderation dashboard components are present
- **Validation Points**:
  - Page title: "Moderation"
  - Store context: "Content moderation for Default Store"
  - All moderation tabs: Pending, Under Review, High Priority, Resolved, User Management
  - Back to Dashboard navigation button
  - Store-scoped report filtering

#### Test: Tab Navigation Functionality
- **Objective**: Verify all moderation tabs are functional
- **Steps**:
  1. Navigate to each moderation tab
  2. Verify tab content loads properly
  3. Verify tab switching works smoothly
  4. Verify store context is maintained across tabs

### 3. Store Scoping Validation

#### Test: Store-Scoped Report Access
- **Objective**: Confirm only assigned store reports are visible
- **Validation Points**:
  - Reports filtered by Store Manager's assigned store
  - "Store-wide reports" context indicator displayed
  - No reports from other stores visible
  - Store context maintained across all tabs

#### Test: User Management Store Scoping
- **Objective**: Verify user management actions are store-scoped
- **Steps**:
  1. Navigate to User Management tab
  2. Verify user list is filtered by store
  3. Verify user actions (suspend, delete) are store-scoped
  4. Verify audit trail includes store context

### 4. User Management Integration

#### Test: User Account Management Actions
- **Objective**: Verify Store Manager can perform user management actions
- **Available Actions**:
  - User suspension with duration options
  - User account deletion (soft/hard delete)
  - User account activation
  - Warning issuance
- **Validation**: Actions are properly logged in audit trail

#### Test: Moderation Action Audit Trail
- **Objective**: Verify all moderation actions are properly logged
- **Steps**:
  1. Perform user management action
  2. Verify action is logged in `moderation_actions` table
  3. Verify Store Manager context is recorded
  4. Verify action details are complete and accurate

### 5. Navigation & UI Components

#### Test: Back Navigation to Dashboard
- **Objective**: Verify seamless navigation back to Store Manager dashboard
- **Steps**:
  1. Click "Back to Dashboard" button
  2. Verify navigation to `/store-manager/dashboard`
  3. Verify Store Manager context is maintained

#### Test: Responsive Design Validation
- **Objective**: Verify moderation interface works across different screen sizes
- **Viewports Tested**:
  - Desktop: 1920x1080
  - Tablet: 1024x768
  - Mobile: 375x667
- **Validation**: All elements remain accessible and functional

### 6. Loading States & Error Handling

#### Test: Loading State Management
- **Objective**: Verify graceful handling of loading states
- **Scenarios**:
  - Initial page load with store access verification
  - Tab switching with data loading
  - User management action processing
- **Validation**: Loading indicators display and disappear appropriately

#### Test: Error Condition Handling
- **Objective**: Verify proper error handling and recovery
- **Scenarios**:
  - Network connectivity issues
  - Store access verification failures
  - Invalid user management actions
- **Validation**: Error messages are clear and recovery options are provided

## Page Object Model

### StoreManagerModerationPage Class

The `StoreManagerModerationPage` class provides a structured approach to testing the moderation interface:

```typescript
// Key methods
await moderationPage.navigate();                    // Navigate to moderation page
await moderationPage.verifyPageStructure();         // Verify all page elements
await moderationPage.verifyStoreContext();          // Verify store context display
await moderationPage.testAllTabNavigation();        // Test all tab navigation
await moderationPage.verifyUserManagementActions(); // Test user management functionality
await moderationPage.navigateBackToDashboard();     // Test back navigation
await moderationPage.testResponsiveDesign();        // Test responsive design
```

## Test Reports & Debugging

### Generated Reports

Tests generate comprehensive reports in multiple formats:

- **HTML Report**: `tests/e2e/test-results/store-manager-moderation/reports/html/index.html`
- **JSON Report**: `tests/e2e/test-results/store-manager-moderation/reports/results.json`
- **JUnit Report**: `tests/e2e/test-results/store-manager-moderation/reports/results.xml`

### Screenshots & Visual Regression

- **Failure Screenshots**: Automatically captured on test failures
- **Visual Regression**: Screenshots captured for each moderation tab
- **Debug Screenshots**: Manual screenshot capture for debugging

### Debugging Tips

```bash
# Run with visible browser for debugging
npm run test:store-manager:moderation --headed

# Run in debug mode with breakpoints
npm run test:store-manager:moderation --debug

# Run specific failing test
npm run test:store-manager:moderation --grep="specific test name"

# Check console logs
# Tests include comprehensive console logging for debugging
```

## Maintenance & Updates

### Adding New Tests

1. **Basic Tests**: Add to `store-manager-moderation.spec.ts`
2. **Page Object Methods**: Update `StoreManagerModerationPage.ts`
3. **Test Helpers**: Add reusable functions to `store-manager-helpers.ts`

### Updating Test Data

- Update test credentials in `TEST_CONFIG` if Store Manager account changes
- Update expected store information if store context changes
- Update UI selectors if moderation interface changes

### Performance Considerations

- Tests run with single worker to avoid Store Manager session conflicts
- Comprehensive cleanup after each test to maintain test isolation
- Optimized waiting strategies to minimize test execution time

## Integration with CI/CD

### GitHub Actions Integration

```yaml
# Example GitHub Actions workflow
- name: Run Store Manager Moderation Tests
  run: |
    npm run test:store-manager:moderation
  env:
    BASE_URL: ${{ secrets.STAGING_URL }}
    STORE_MANAGER_PASSWORD: ${{ secrets.STORE_MANAGER_PASSWORD }}
```

### Test Results Integration

- JUnit reports compatible with CI/CD systems
- JSON reports for custom analysis and metrics
- HTML reports for detailed test result visualization

## Success Criteria

### Test Coverage Requirements

- ✅ **Authentication**: 100% Store Manager access scenarios covered
- ✅ **Dashboard**: All moderation interface components tested
- ✅ **Store Scoping**: Complete store-scoped data access validation
- ✅ **User Management**: All user management actions tested
- ✅ **Navigation**: Complete navigation flow validation
- ✅ **Responsive Design**: All major viewport sizes tested
- ✅ **Error Handling**: Loading states and error conditions covered

### Performance Benchmarks

- Page load time: < 3 seconds
- Tab switching: < 1 second
- User action processing: < 5 seconds
- Store access verification: < 2 seconds

### Quality Gates

- All tests must pass before deployment
- No accessibility violations in moderation interface
- Visual regression tests must pass
- Performance benchmarks must be met
