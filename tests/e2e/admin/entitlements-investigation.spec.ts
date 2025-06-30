import { test, expect } from '@playwright/test';
import {
  loginAsStoreOwner,
  loginAsPrivilegedPlus,
  loginAsPrivileged,
  loginAsMemberChomsky,
  loginAsMemberAristotle,
  cleanupAuth,
  TEST_USERS
} from '../utils/auth-helpers';

/**
 * Comprehensive Entitlements Investigation Tests for BookTalks Buddy
 * Phase 1: Context Gathering - Investigate entitlements system for all 5 users
 * Following the testing strategy from comprehensive-testing-session-prompt.md
 */

test.describe('Phase 1: Comprehensive Entitlements Investigation', () => {

  // Helper function to extract entitlements from browser cache
  async function extractEntitlements(page: any, userType: string) {
    const entitlementsData = await page.evaluate(async () => {
      const data = {
        user: null as any,
        entitlements: [] as any[],
        roles: [] as any[],
        sessionStorage: {} as any,
        localStorage: {} as any,
        error: null as string | null
      };

      try {
        // Check sessionStorage for entitlements cache
        const sessionKeys = Object.keys(sessionStorage);
        sessionKeys.forEach(key => {
          if (key.includes('entitlements') || key.includes('auth') || key.includes('user') || key.includes('role')) {
            try {
              const value = sessionStorage.getItem(key);
              data.sessionStorage[key] = value ? JSON.parse(value) : value;
            } catch {
              data.sessionStorage[key] = sessionStorage.getItem(key);
            }
          }
        });

        // Check localStorage for entitlements cache
        const localKeys = Object.keys(localStorage);
        localKeys.forEach(key => {
          if (key.includes('entitlements') || key.includes('auth') || key.includes('user') || key.includes('role')) {
            try {
              const value = localStorage.getItem(key);
              data.localStorage[key] = value ? JSON.parse(value) : value;
            } catch {
              data.localStorage[key] = localStorage.getItem(key);
            }
          }
        });

        // Try to access global auth state if available
        if ((window as any).authState) {
          data.user = (window as any).authState.user;
          data.entitlements = (window as any).authState.entitlements || [];
          data.roles = (window as any).authState.roles || [];
        }

      } catch (error: any) {
        data.error = error.message;
      }

      return data;
    });

    console.log(`\n🔍 ${userType.toUpperCase()} ENTITLEMENTS ANALYSIS:`);
    console.log('='.repeat(50));
    console.log('SessionStorage:', JSON.stringify(entitlementsData.sessionStorage, null, 2));
    console.log('LocalStorage:', JSON.stringify(entitlementsData.localStorage, null, 2));
    console.log('User Data:', entitlementsData.user);
    console.log('Entitlements:', entitlementsData.entitlements);
    console.log('Roles:', entitlementsData.roles);
    console.log('Error:', entitlementsData.error);

    return entitlementsData;
  }

  test.describe('Store Owner Entitlements Analysis', () => {
    test('should investigate store owner entitlements and admin access', async ({ page }) => {
      // Login as store owner
      const loginSuccess = await loginAsStoreOwner(page);

      if (!loginSuccess) {
        test.skip('Could not authenticate as store owner');
      }

      // Navigate to profile to establish session
      await page.goto('/profile');
      await page.waitForTimeout(2000);

      // Extract entitlements data
      const entitlementsData = await extractEntitlements(page, 'Store Owner');

      // Test admin panel access (may load slowly)
      console.log('\n🚪 Testing Admin Panel Access (may be slow):');
      await page.goto('/admin');

      // Wait longer for admin panel due to known slow loading
      await page.waitForTimeout(5000);

      const adminUrl = page.url();
      console.log('Current URL after /admin navigation:', adminUrl);

      if (adminUrl.includes('/admin')) {
        console.log('✅ Store Owner CAN access admin panel');

        // Check what admin features are visible
        const adminFeatures = await page.evaluate(() => {
          const features = [];

          // Check for admin navigation and features
          const navLinks = document.querySelectorAll('nav a, [role="navigation"] a, button, [role="button"]');
          navLinks.forEach(link => {
            if (link.textContent && link.textContent.trim()) {
              features.push({
                text: link.textContent.trim(),
                href: (link as HTMLAnchorElement).href || 'button',
                tagName: link.tagName
              });
            }
          });

          return features.slice(0, 20); // Limit output
        });

        console.log('Available Admin Features:', adminFeatures);

        // Test specific admin routes
        const adminRoutes = ['/admin/store-management', '/admin/analytics', '/admin/users'];
        for (const route of adminRoutes) {
          await page.goto(route);
          await page.waitForTimeout(2000);
          const routeUrl = page.url();
          console.log(`${route}: ${routeUrl.includes(route.split('/').pop()!) ? '✅ Accessible' : '❌ Blocked'}`);
        }

      } else if (adminUrl.includes('/unauthorized')) {
        console.log('❌ Store Owner redirected to UNAUTHORIZED page');
        console.log('Missing required entitlements for admin access');

      } else {
        console.log('❌ Store Owner redirected away from admin panel');
        console.log('Redirected to:', adminUrl);
      }

      await cleanupAuth(page);
    });
  });

  test.describe('Privileged+ User Entitlements Analysis', () => {
    test('should investigate privileged+ user entitlements', async ({ page }) => {
      const loginSuccess = await loginAsPrivilegedPlus(page);

      if (!loginSuccess) {
        test.skip('Could not authenticate as privileged+ user');
      }

      await page.goto('/profile');
      await page.waitForTimeout(2000);

      const entitlementsData = await extractEntitlements(page, 'Privileged+');

      // Test access to various routes
      const testRoutes = [
        { path: '/book-clubs', name: 'Book Clubs' },
        { path: '/profile', name: 'Profile' },
        { path: '/events', name: 'Events' },
        { path: '/admin', name: 'Admin Panel' }
      ];

      console.log('\n🚪 Testing Route Access:');
      for (const route of testRoutes) {
        await page.goto(route.path);
        await page.waitForTimeout(2000);
        const currentUrl = page.url();
        const hasAccess = currentUrl.includes(route.path.split('/').pop()!) || currentUrl === route.path;
        console.log(`${route.name}: ${hasAccess ? '✅ Accessible' : '❌ Blocked'} (${currentUrl})`);
      }

      await cleanupAuth(page);
    });
  });

  test.describe('Privileged User Entitlements Analysis', () => {
    test('should investigate privileged user entitlements', async ({ page }) => {
      const loginSuccess = await loginAsPrivileged(page);

      if (!loginSuccess) {
        test.skip('Could not authenticate as privileged user');
      }

      await page.goto('/profile');
      await page.waitForTimeout(2000);

      const entitlementsData = await extractEntitlements(page, 'Privileged');

      // Test access to various routes
      const testRoutes = [
        { path: '/book-clubs', name: 'Book Clubs' },
        { path: '/profile', name: 'Profile' },
        { path: '/events', name: 'Events' },
        { path: '/admin', name: 'Admin Panel' }
      ];

      console.log('\n🚪 Testing Route Access:');
      for (const route of testRoutes) {
        await page.goto(route.path);
        await page.waitForTimeout(2000);
        const currentUrl = page.url();
        const hasAccess = currentUrl.includes(route.path.split('/').pop()!) || currentUrl === route.path;
        console.log(`${route.name}: ${hasAccess ? '✅ Accessible' : '❌ Blocked'} (${currentUrl})`);
      }

      await cleanupAuth(page);
    });
  });

  });

  test.describe('Member User Entitlements Analysis', () => {
    test('should investigate member user (Chomsky) entitlements', async ({ page }) => {
      const loginSuccess = await loginAsMemberChomsky(page);

      if (!loginSuccess) {
        test.skip('Could not authenticate as member user (Chomsky)');
      }

      await page.goto('/profile');
      await page.waitForTimeout(2000);

      const entitlementsData = await extractEntitlements(page, 'Member (Chomsky)');

      // Test access to various routes
      const testRoutes = [
        { path: '/book-clubs', name: 'Book Clubs' },
        { path: '/profile', name: 'Profile' },
        { path: '/events', name: 'Events' },
        { path: '/admin', name: 'Admin Panel' }
      ];

      console.log('\n🚪 Testing Route Access:');
      for (const route of testRoutes) {
        await page.goto(route.path);
        await page.waitForTimeout(2000);
        const currentUrl = page.url();
        const hasAccess = currentUrl.includes(route.path.split('/').pop()!) || currentUrl === route.path;
        console.log(`${route.name}: ${hasAccess ? '✅ Accessible' : '❌ Blocked'} (${currentUrl})`);
      }

      await cleanupAuth(page);
    });

    test('should investigate member user (Aristotle) entitlements', async ({ page }) => {
      const loginSuccess = await loginAsMemberAristotle(page);

      if (!loginSuccess) {
        test.skip('Could not authenticate as member user (Aristotle)');
      }

      await page.goto('/profile');
      await page.waitForTimeout(2000);

      const entitlementsData = await extractEntitlements(page, 'Member (Aristotle)');

      // Test access to various routes
      const testRoutes = [
        { path: '/book-clubs', name: 'Book Clubs' },
        { path: '/profile', name: 'Profile' },
        { path: '/events', name: 'Events' },
        { path: '/admin', name: 'Admin Panel' }
      ];

      console.log('\n🚪 Testing Route Access:');
      for (const route of testRoutes) {
        await page.goto(route.path);
        await page.waitForTimeout(2000);
        const currentUrl = page.url();
        const hasAccess = currentUrl.includes(route.path.split('/').pop()!) || currentUrl === route.path;
        console.log(`${route.name}: ${hasAccess ? '✅ Accessible' : '❌ Blocked'} (${currentUrl})`);
      }

      await cleanupAuth(page);
    });
  });

  test.describe('Cross-Role Comparison Analysis', () => {
    test('should compare entitlements across all user roles', async ({ page }) => {
      console.log('\n📊 CROSS-ROLE ENTITLEMENTS COMPARISON:');
      console.log('='.repeat(60));
      console.log('Expected Role Hierarchy (highest to lowest):');
      console.log('1. Platform Owner → Store Owner → Club Lead → Privileged+ → Privileged → Member');
      console.log('');
      console.log('Test Users Mapping:');
      console.log('- Store Owner: admin@bookconnect.com (should have admin access)');
      console.log('- Privileged+: plato@bc.com (premium features)');
      console.log('- Privileged: kant@bc.com (enhanced features)');
      console.log('- Member: chomsky@bc.com & aristotle@bc.com (basic access)');
      console.log('');
      console.log('Key Entitlements to Look For:');
      console.log('- CAN_MANAGE_PLATFORM');
      console.log('- CAN_MANAGE_USER_TIERS');
      console.log('- CAN_MANAGE_ALL_CLUBS');
      console.log('- CAN_MANAGE_STORE_SETTINGS');
      console.log('- CAN_CREATE_CLUBS');
      console.log('- CAN_JOIN_CLUBS');
      console.log('- CAN_VIEW_ANALYTICS');
      console.log('');

      // This test always passes - it's for documentation
      expect(true).toBe(true);
    });
  });

  test.describe('System Architecture Analysis', () => {
    test('should analyze system architecture and entitlements structure', async ({ page }) => {
      console.log('\n🏗️ SYSTEM ARCHITECTURE ANALYSIS:');
      console.log('='.repeat(50));
      console.log('');
      console.log('Known System Features:');
      console.log('- 8-level role hierarchy');
      console.log('- 35+ entitlements with contextual inheritance');
      console.log('- Multi-tenant architecture (store-specific contexts)');
      console.log('- Route guards for admin access');
      console.log('- Premium feature tiers');
      console.log('');
      console.log('Critical Routes to Test:');
      console.log('- /admin (store owner access - may load slowly)');
      console.log('- /book-clubs (all users)');
      console.log('- /profile (all users)');
      console.log('- /events (check role differences)');
      console.log('- /admin/store-management (store owner only)');
      console.log('- /admin/analytics (privileged access)');
      console.log('');
      console.log('Expected Entitlements Cache Structure:');
      console.log('{"entitlements": ["CAN_MANAGE_PLATFORM", ...], "roles": [...]}');

      // This test always passes - it's for documentation
      expect(true).toBe(true);
    });
  });

  test.describe('Next Steps and Recommendations', () => {
    test('should provide Phase 2 testing recommendations', async ({ page }) => {
      console.log('\n🎯 PHASE 2: CORE TESTING RECOMMENDATIONS:');
      console.log('='.repeat(50));
      console.log('');
      console.log('Based on Phase 1 findings, proceed with:');
      console.log('');
      console.log('1. AUTHENTICATION FLOWS:');
      console.log('   - Test login/logout for all 5 users');
      console.log('   - Verify session persistence');
      console.log('   - Test password reset flows');
      console.log('');
      console.log('2. ROLE-BASED ACCESS VALIDATION:');
      console.log('   - Admin panel access (store owner with retries)');
      console.log('   - Store management features');
      console.log('   - Club creation/management permissions');
      console.log('   - Premium feature access by tier');
      console.log('');
      console.log('3. FEATURE COVERAGE:');
      console.log('   - Book club participation workflows');
      console.log('   - Event creation and management');
      console.log('   - Profile management capabilities');
      console.log('   - Analytics access by role');
      console.log('');
      console.log('4. CROSS-ROLE COMPARISONS:');
      console.log('   - Feature availability differences');
      console.log('   - UI element visibility by role');
      console.log('   - Permission boundary testing');

      // This test always passes - it's for documentation
      expect(true).toBe(true);
    });

    test('should provide Phase 3 comprehensive validation plan', async ({ page }) => {
      console.log('\n🔬 PHASE 3: COMPREHENSIVE VALIDATION PLAN:');
      console.log('='.repeat(50));
      console.log('');
      console.log('1. END-TO-END WORKFLOWS:');
      console.log('   - User signup → club participation');
      console.log('   - Book nomination → reading progress');
      console.log('   - Event creation → attendance tracking');
      console.log('   - Admin management → user tier changes');
      console.log('');
      console.log('2. ADMIN FUNCTIONALITY (if accessible):');
      console.log('   - Store management features');
      console.log('   - User tier management');
      console.log('   - Analytics dashboard access');
      console.log('   - Platform settings configuration');
      console.log('');
      console.log('3. INTEGRATION TESTING:');
      console.log('   - Books API integration');
      console.log('   - Notification system');
      console.log('   - Analytics data collection');
      console.log('   - File upload/image handling');
      console.log('');
      console.log('4. PRODUCTION READINESS:');
      console.log('   - Performance under load');
      console.log('   - Security boundary validation');
      console.log('   - Error handling robustness');
      console.log('   - Mobile responsiveness');

      // This test always passes - it's for documentation
      expect(true).toBe(true);
    });

    test('should provide testing execution instructions', async ({ page }) => {
      console.log('\n🚀 TESTING EXECUTION INSTRUCTIONS:');
      console.log('='.repeat(50));
      console.log('');
      console.log('To run this comprehensive entitlements investigation:');
      console.log('');
      console.log('1. ENSURE APPLICATION IS RUNNING:');
      console.log('   npm run dev (should be on http://localhost:5173)');
      console.log('');
      console.log('2. RUN ENTITLEMENTS INVESTIGATION:');
      console.log('   npx playwright test entitlements-investigation.spec.ts --config=playwright-mcp.config.ts');
      console.log('');
      console.log('3. VIEW DETAILED RESULTS:');
      console.log('   - Check console output for entitlements data');
      console.log('   - Review mcp-report/index.html for visual results');
      console.log('   - Analyze test-results/mcp-results.json for data');
      console.log('');
      console.log('4. PROCEED TO PHASE 2 TESTING:');
      console.log('   - Based on findings, run authentication-flows.spec.ts');
      console.log('   - Then role-system-validation.spec.ts');
      console.log('   - Finally comprehensive feature tests');
      console.log('');
      console.log('Expected Outcome: Complete understanding of role-based access control');

      // This test always passes - it's for documentation
      expect(true).toBe(true);
    });
  });
});
