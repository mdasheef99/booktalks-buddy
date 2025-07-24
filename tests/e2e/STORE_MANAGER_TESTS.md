# Store Manager Interface E2E Tests

Comprehensive end-to-end tests for the Store Manager Interface using Playwright.

## 🎯 Test Objectives

This test suite validates the complete Store Manager Interface implementation from Phase 1, including:

- **Authentication Flow**: Login with Store Manager credentials (`kafka@bookconnect.com`)
- **Access Control**: Route protection and permission validation
- **Navigation**: Store Manager Panel layout with terracotta theme
- **Store Context**: Store information display and context provision
- **Error Handling**: Graceful handling of errors and edge cases
- **Responsiveness**: Interface behavior across different screen sizes

## 📁 Test Files Structure

```
tests/e2e/
├── store-manager-access.spec.ts           # Basic authentication and access flow
├── store-manager-error-handling.spec.ts   # Error scenarios and edge cases  
├── store-manager-comprehensive.spec.ts    # Complete user flow validation
├── helpers/
│   └── store-manager-helpers.ts           # Reusable test utilities
├── global-setup.ts                        # Global test environment setup
├── global-teardown.ts                     # Test cleanup and reporting
└── screenshots/                           # Test failure screenshots
```

## 🚀 Quick Start

### Prerequisites
1. **Application Running**: `npm run dev` (accessible at http://localhost:5173)
2. **Store Manager Account**: `kafka@bookconnect.com` with access to "Default Store"
3. **Playwright Installed**: `npm install -D @playwright/test && npx playwright install`

### Run All Store Manager Tests
```bash
# Run all Store Manager E2E tests
npx playwright test tests/e2e/store-manager-*.spec.ts

# Run with UI mode for debugging
npx playwright test tests/e2e/store-manager-*.spec.ts --ui

# Run in headed mode (visible browser)
npx playwright test tests/e2e/store-manager-*.spec.ts --headed
```

## 🧪 Test Scenarios Coverage

### ✅ Authentication Flow Tests
- Store Manager login with valid credentials
- Redirect to Store Manager interface after login  
- Unauthenticated user redirect to login page
- Session persistence across page refreshes
- Logout flow validation

### ✅ Access Control Tests
- Store Manager route protection (`/store-manager/*`)
- Non-Store Manager user access denial
- Direct URL access prevention
- Store context validation and display

### ✅ Navigation and Layout Tests
- Store Manager Panel display with correct title
- Terracotta theme application (`bg-bookconnect-terracotta`)
- Navigation items visibility:
  - **Core**: Dashboard, Users, Clubs (always visible)
  - **Optional**: Analytics, Moderation, Events (permission-based)
- Store context information display ("Default Store Management")

### ✅ Page Access Tests
- **Dashboard**: Store context verification and placeholder content
- **Users**: Store-scoped user management placeholder
- **Clubs**: Store-scoped club management placeholder  
- **Moderation**: Content moderation tools (if permissions allow)
- **Events**: Event management interface (if permissions allow)

### ✅ Error Handling Tests
- Network error graceful handling
- Database connection failure recovery
- Missing store context handling
- Loading state display during access verification
- Unauthorized access attempt handling

### ✅ Responsiveness Tests
- Desktop viewport (1920x1080)
- Tablet viewport (1024x768)  
- Mobile viewport (375x667)
- Navigation accessibility across screen sizes

## 🔧 Configuration

### Test Configuration (`helpers/store-manager-helpers.ts`)
```typescript
export const TEST_CONFIG = {
  baseUrl: 'http://localhost:5173',
  storeManager: {
    email: 'kafka@bookconnect.com',
    username: 'kafka',
    password: process.env.STORE_MANAGER_PASSWORD || 'test-password'
  },
  expectedStore: {
    storeId: 'ce76b99a-5f1a-481a-af85-862e584465e1',
    storeName: 'Default Store'
  }
};
```

### Environment Variables
```bash
# Optional: Set custom base URL
export BASE_URL=http://localhost:5173

# Optional: Set Store Manager password
export STORE_MANAGER_PASSWORD=your-password
```

## 🎮 Running Specific Tests

### Individual Test Suites
```bash
# Authentication and access tests
npx playwright test tests/e2e/store-manager-access.spec.ts

# Error handling tests  
npx playwright test tests/e2e/store-manager-error-handling.spec.ts

# Comprehensive flow tests
npx playwright test tests/e2e/store-manager-comprehensive.spec.ts
```

### Different Browsers
```bash
# Chrome (default)
npx playwright test --project=chromium

# Firefox
npx playwright test --project=firefox

# Safari  
npx playwright test --project=webkit

# Store Manager specific Chrome config
npx playwright test --project=store-manager-chrome
```

### Debug Mode
```bash
# Interactive debugging
npx playwright test --debug

# Specific test with debug
npx playwright test tests/e2e/store-manager-access.spec.ts --debug

# Slow motion for observation
npx playwright test --slowMo=1000
```

## 📊 Test Reports

### View HTML Report
```bash
npx playwright show-report
```

### Test Artifacts
- **Screenshots**: `tests/e2e/screenshots/` (failure captures)
- **Videos**: `test-results/` (failure recordings)
- **JSON Report**: `test-results/results.json`
- **Traces**: Available on retry for debugging

## 🔍 Helper Functions

The test suite includes comprehensive helper functions:

```typescript
// Authentication
await loginAsStoreManager(page);
await logout(page);

// Navigation  
await navigateToStoreManager(page, '/dashboard');
await verifyStoreManagerPanel(page);

// Validation
await verifyStoreContext(page);
await verifyNavigation(page);
await verifyPageContent(page, 'Dashboard');

// Testing
await testRouteAccess(page, '/store-manager/users', true);
await waitForLoadingComplete(page);
await captureScreenshot(page, 'test-name');
```

## 🐛 Troubleshooting

### Common Issues

**Application Not Running**
```
Error: connect ECONNREFUSED 127.0.0.1:5173
Solution: npm run dev
```

**Store Manager Login Failed**  
```
Error: Store Manager access verification failed
Solution: Verify kafka@bookconnect.com account exists and has Store Manager role
```

**Timeout Errors**
```
Error: Test timeout of 60000ms exceeded  
Solution: Check network connectivity and application performance
```

**Browser Not Found**
```
Error: Executable doesn't exist
Solution: npx playwright install
```

### Debug Tips
1. **UI Mode**: `--ui` for interactive debugging
2. **Headed Mode**: `--headed` to see browser actions  
3. **Console Logs**: Check browser console in debug mode
4. **Screenshots**: Review failure screenshots for visual debugging
5. **Slow Motion**: `--slowMo=1000` to observe actions

## 🎯 Validation Checklist

Before considering Phase 1 Store Manager Interface complete, verify:

- [ ] ✅ Store Manager can login and access interface
- [ ] ✅ Store Manager Panel displays with terracotta theme
- [ ] ✅ Store context shows "Default Store Management"  
- [ ] ✅ All 6 navigation sections are present
- [ ] ✅ Permission-based navigation works correctly
- [ ] ✅ All placeholder pages display store context
- [ ] ✅ Unauthorized users are properly redirected
- [ ] ✅ Error scenarios are handled gracefully
- [ ] ✅ Interface is responsive across screen sizes
- [ ] ✅ Session persistence works across refreshes

## 🚀 CI/CD Integration

Example GitHub Actions workflow:
```yaml
- name: Run Store Manager E2E Tests
  run: |
    npm run dev &
    sleep 10
    npx playwright test tests/e2e/store-manager-*.spec.ts --reporter=github
    kill %1
```

## 📈 Success Criteria

**Phase 1 Store Manager Interface is considered successfully implemented when:**

1. **All E2E tests pass** with the actual Store Manager account
2. **Complete access flow works** from login to Store Manager interface
3. **Store context is properly displayed** throughout the interface  
4. **Permission-based navigation** shows/hides sections correctly
5. **Error handling** gracefully manages all failure scenarios
6. **Responsive design** works across desktop, tablet, and mobile
7. **Route protection** prevents unauthorized access

**Ready for Phase 2 implementation** once all tests consistently pass! 🎉
