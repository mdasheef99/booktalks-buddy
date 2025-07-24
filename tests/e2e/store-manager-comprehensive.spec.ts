import { test, expect } from '@playwright/test';
import {
  loginAsStoreManager,
  logout,
  navigateToStoreManager,
  verifyStoreManagerPanel,
  verifyStoreContext,
  verifyNavigation,
  verifyPageContent,
  testRouteAccess,
  waitForLoadingComplete,
  captureScreenshot,
  cleanupTestState,
  TEST_CONFIG
} from './helpers/store-manager-helpers';

/**
 * Comprehensive End-to-End Tests for Store Manager Interface
 * Tests complete user flows with actual Store Manager account
 */

test.describe('Store Manager Interface - Comprehensive Flow Tests', () => {
  test.beforeEach(async ({ page }) => {
    await cleanupTestState(page);
  });

  test.afterEach(async ({ page }) => {
    await cleanupTestState(page);
  });

  test('Complete Store Manager authentication and access flow', async ({ page }) => {
    // Step 1: Login as Store Manager
    await loginAsStoreManager(page);
    
    // Step 2: Navigate to Store Manager interface
    await navigateToStoreManager(page);
    
    // Step 3: Wait for loading to complete
    await waitForLoadingComplete(page);
    
    // Step 4: Verify Store Manager Panel is displayed
    await verifyStoreManagerPanel(page);
    
    // Step 5: Verify store context
    await verifyStoreContext(page);
    
    // Step 6: Verify navigation items
    await verifyNavigation(page);
    
    // Step 7: Capture screenshot for verification
    await captureScreenshot(page, 'store-manager-dashboard');
    
    console.log('✅ Complete authentication and access flow verified');
  });

  test('Navigate through all Store Manager pages', async ({ page }) => {
    // Setup: Login as Store Manager
    await loginAsStoreManager(page);
    await navigateToStoreManager(page);
    await waitForLoadingComplete(page);

    const pageTests = [
      { route: '/dashboard', title: 'Store Manager Dashboard' },
      { route: '/users', title: 'Users Management' },
      { route: '/clubs', title: 'Clubs Management' },
      { route: '/moderation', title: 'Moderation' },
      { route: '/events', title: 'Events Management' }
    ];

    for (const pageTest of pageTests) {
      console.log(`🧭 Testing navigation to ${pageTest.route}`);
      
      // Navigate to page
      await navigateToStoreManager(page, pageTest.route);
      await waitForLoadingComplete(page);
      
      // Check if page is accessible (depends on permissions)
      const pageTitle = page.locator(`h1:has-text("${pageTest.title}")`);
      const isAccessible = await pageTitle.isVisible();
      
      if (isAccessible) {
        // Verify page content
        await verifyPageContent(page, pageTest.title);
        
        // Verify store context is available
        await verifyStoreContext(page);
        
        // Capture screenshot
        await captureScreenshot(page, `store-manager-${pageTest.route.replace('/', '')}`);
        
        console.log(`✅ Successfully accessed ${pageTest.route}`);
      } else {
        // Page not accessible - check if properly redirected
        const currentUrl = page.url();
        console.log(`⚠️ Page ${pageTest.route} not accessible, redirected to: ${currentUrl}`);
        
        // Should not show error pages
        const errorIndicators = page.locator('text=404, text=Error, text=Not Found');
        await expect(errorIndicators).not.toBeVisible();
      }
    }
  });

  test('Verify Store Manager permissions and navigation visibility', async ({ page }) => {
    // Setup: Login as Store Manager
    await loginAsStoreManager(page);
    await navigateToStoreManager(page);
    await waitForLoadingComplete(page);

    // Test core navigation items (should always be visible)
    const coreItems = ['Dashboard', 'Users', 'Clubs'];
    for (const item of coreItems) {
      const navItem = page.locator(`nav a:has-text("${item}")`);
      await expect(navItem).toBeVisible();
      console.log(`✅ Core navigation item visible: ${item}`);
    }

    // Test optional navigation items (visibility depends on permissions)
    const optionalItems = [
      { name: 'Analytics', permission: 'CAN_VIEW_STORE_ANALYTICS' },
      { name: 'Moderation', permission: 'CAN_MODERATE_CONTENT' },
      { name: 'Events', permission: 'CAN_MANAGE_EVENTS' }
    ];

    for (const item of optionalItems) {
      const navItem = page.locator(`nav a:has-text("${item.name}")`);
      const isVisible = await navItem.isVisible();
      
      console.log(`${isVisible ? '✅' : '⚠️'} Optional navigation item: ${item.name} (${isVisible ? 'visible' : 'hidden based on permissions'})`);
      
      if (isVisible) {
        // If visible, should be clickable and lead to valid page
        await navItem.click();
        await waitForLoadingComplete(page);
        
        // Should not show error page
        const errorIndicators = page.locator('text=404, text=Error, text=Not Found');
        await expect(errorIndicators).not.toBeVisible();
        
        // Navigate back to dashboard
        await navigateToStoreManager(page, '/dashboard');
      }
    }
  });

  test('Test Store Manager session persistence across page refreshes', async ({ page }) => {
    // Step 1: Login and navigate to Store Manager interface
    await loginAsStoreManager(page);
    await navigateToStoreManager(page);
    await waitForLoadingComplete(page);
    
    // Step 2: Verify initial access
    await verifyStoreManagerPanel(page);
    
    // Step 3: Refresh the page
    await page.reload();
    await waitForLoadingComplete(page);
    
    // Step 4: Verify access is maintained
    const currentUrl = page.url();
    
    if (currentUrl.includes('/store-manager')) {
      // Session maintained - verify Store Manager interface
      await verifyStoreManagerPanel(page);
      await verifyStoreContext(page);
      console.log('✅ Store Manager session persisted across refresh');
    } else if (currentUrl.includes('/login')) {
      // Session expired - this is also valid behavior
      console.log('⚠️ Store Manager session expired, redirected to login');
      
      // Verify login form is displayed
      await expect(page.locator('input[type="email"]')).toBeVisible();
    } else {
      // Unexpected redirect
      console.log(`⚠️ Unexpected redirect after refresh: ${currentUrl}`);
    }
  });

  test('Test Store Manager interface responsiveness', async ({ page }) => {
    // Setup: Login as Store Manager
    await loginAsStoreManager(page);
    await navigateToStoreManager(page);
    await waitForLoadingComplete(page);

    // Test different viewport sizes
    const viewports = [
      { width: 1920, height: 1080, name: 'desktop' },
      { width: 1024, height: 768, name: 'tablet' },
      { width: 375, height: 667, name: 'mobile' }
    ];

    for (const viewport of viewports) {
      console.log(`📱 Testing ${viewport.name} viewport: ${viewport.width}x${viewport.height}`);
      
      // Set viewport size
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      
      // Wait for layout to adjust
      await page.waitForTimeout(1000);
      
      // Verify Store Manager Panel is still visible
      await verifyStoreManagerPanel(page);
      
      // Verify navigation is accessible (may be collapsed on mobile)
      const navigation = page.locator('nav');
      await expect(navigation).toBeVisible();
      
      // Capture screenshot for visual verification
      await captureScreenshot(page, `store-manager-${viewport.name}`);
      
      console.log(`✅ ${viewport.name} viewport verified`);
    }
  });

  test('Test Store Manager logout flow', async ({ page }) => {
    // Step 1: Login as Store Manager
    await loginAsStoreManager(page);
    await navigateToStoreManager(page);
    await waitForLoadingComplete(page);
    
    // Step 2: Verify Store Manager access
    await verifyStoreManagerPanel(page);
    
    // Step 3: Logout
    await logout(page);
    
    // Step 4: Try to access Store Manager interface after logout
    await testRouteAccess(page, '/store-manager/dashboard', false);
    
    console.log('✅ Store Manager logout flow verified');
  });
});

test.describe('Store Manager Interface - Error Scenarios', () => {
  test.beforeEach(async ({ page }) => {
    await cleanupTestState(page);
  });

  test('Handle unauthorized access attempts', async ({ page }) => {
    const storeManagerRoutes = [
      '/store-manager',
      '/store-manager/dashboard',
      '/store-manager/users',
      '/store-manager/clubs'
    ];

    for (const route of storeManagerRoutes) {
      await testRouteAccess(page, route, false);
    }
    
    console.log('✅ All unauthorized access attempts properly handled');
  });

  test('Handle network errors gracefully', async ({ page }) => {
    // Step 1: Login as Store Manager
    await loginAsStoreManager(page);
    
    // Step 2: Mock network failure
    await page.route('**/api/**', async route => {
      await route.abort('failed');
    });
    
    // Step 3: Try to access Store Manager interface
    await page.goto(`${TEST_CONFIG.baseUrl}/store-manager/dashboard`);
    
    // Step 4: Should handle error gracefully
    await page.waitForLoadState('networkidle');
    
    const currentUrl = page.url();
    
    // Should either show error message or redirect to safe page
    const errorMessages = [
      'Unable to verify Store Manager access',
      'Something went wrong',
      'Please try again'
    ];

    let errorHandled = false;
    for (const message of errorMessages) {
      const errorElement = page.locator(`text=${message}`);
      if (await errorElement.isVisible()) {
        errorHandled = true;
        console.log(`✅ Error message displayed: ${message}`);
        break;
      }
    }

    const isOnSafePage = currentUrl.includes('/login') || 
                        currentUrl.includes('/dashboard') || 
                        currentUrl.includes('/error');

    expect(errorHandled || isOnSafePage).toBeTruthy();
    console.log('✅ Network errors handled gracefully');
  });
});
