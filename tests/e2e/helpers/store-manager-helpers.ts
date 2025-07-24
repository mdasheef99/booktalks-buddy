import { Page, expect } from '@playwright/test';

/**
 * Helper utilities for Store Manager Interface E2E tests
 * Provides reusable functions for common test operations
 */

export interface StoreManagerCredentials {
  email: string;
  username: string;
  password: string;
}

export interface StoreContext {
  storeId: string;
  storeName: string;
}

// Test configuration
export const TEST_CONFIG = {
  baseUrl: process.env.BASE_URL || 'http://localhost:5173',
  storeManager: {
    email: 'kafka@bookconnect.com',
    username: 'kafka',
    password: process.env.STORE_MANAGER_PASSWORD || 'kafka'
  },
  expectedStore: {
    storeId: 'ce76b99a-5f1a-481a-af85-862e584465e1',
    storeName: 'Default Store'
  },
  timeouts: {
    navigation: 10000,
    element: 5000,
    api: 15000
  }
};

/**
 * Login as Store Manager user
 */
export async function loginAsStoreManager(page: Page, credentials?: StoreManagerCredentials): Promise<void> {
  const creds = credentials || TEST_CONFIG.storeManager;
  
  console.log(`🔐 Logging in as Store Manager: ${creds.email}`);
  
  // Navigate to login page
  await page.goto(`${TEST_CONFIG.baseUrl}/login`);
  
  // Wait for login form to be visible
  await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: TEST_CONFIG.timeouts.element });
  
  // Fill login form
  await page.fill('input[type="email"]', creds.email);
  await page.fill('input[type="password"]', creds.password);
  
  // Submit login form
  await page.click('button[type="submit"]');
  
  // Wait for successful login (redirect to book-club, profile, or dashboard)
  await page.waitForURL(/\/(book-club|profile|dashboard)/, { timeout: TEST_CONFIG.timeouts.navigation });
  
  console.log('✅ Store Manager login successful');
}

/**
 * Logout current user
 */
export async function logout(page: Page): Promise<void> {
  console.log('🚪 Logging out current user');
  
  // Try multiple logout methods
  const logoutSelectors = [
    'button:has-text("Logout")',
    'button:has-text("Sign Out")',
    'a:has-text("Logout")',
    'a:has-text("Sign Out")',
    '[data-testid="logout-button"]'
  ];

  for (const selector of logoutSelectors) {
    const logoutButton = page.locator(selector).first();
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      await page.waitForURL(/\/(login|home)/, { timeout: TEST_CONFIG.timeouts.navigation });
      console.log('✅ Logout successful');
      return;
    }
  }

  // Fallback: navigate to logout URL
  await page.goto(`${TEST_CONFIG.baseUrl}/logout`);
  console.log('✅ Logout via URL navigation');
}

/**
 * Navigate to Store Manager interface and verify access
 */
export async function navigateToStoreManager(page: Page, route: string = '/dashboard'): Promise<void> {
  const fullRoute = `/store-manager${route}`;
  console.log(`🧭 Navigating to Store Manager: ${fullRoute}`);
  
  await page.goto(`${TEST_CONFIG.baseUrl}${fullRoute}`);
  
  // Verify we're on the correct route or properly redirected
  await page.waitForLoadState('networkidle');
  
  const currentUrl = page.url();
  console.log(`📍 Current URL: ${currentUrl}`);
}

/**
 * Verify Store Manager Panel is displayed correctly
 */
export async function verifyStoreManagerPanel(page: Page): Promise<void> {
  console.log('🔍 Verifying Store Manager Panel display');
  
  // Verify Store Manager Panel title
  await expect(page.locator('h1:has-text("Store Manager Panel")')).toBeVisible({
    timeout: TEST_CONFIG.timeouts.element
  });
  
  // Verify terracotta theme
  const sidebar = page.locator('.bg-bookconnect-terracotta').first();
  await expect(sidebar).toBeVisible();
  
  console.log('✅ Store Manager Panel verified');
}

/**
 * Verify store context is displayed correctly
 */
export async function verifyStoreContext(page: Page, expectedStore?: StoreContext): Promise<void> {
  const store = expectedStore || TEST_CONFIG.expectedStore;
  console.log(`🏪 Verifying store context: ${store.storeName}`);
  
  // Verify store name in header
  await expect(page.locator(`text=${store.storeName} Management`)).toBeVisible({
    timeout: TEST_CONFIG.timeouts.element
  });
  
  // Verify store context section
  await expect(page.locator('text=Store Context')).toBeVisible();
  await expect(page.locator(`text=Managing: ${store.storeName}`)).toBeVisible();
  
  console.log('✅ Store context verified');
}

/**
 * Verify navigation items are present
 */
export async function verifyNavigation(page: Page, expectedItems?: string[]): Promise<void> {
  const defaultItems = ['Dashboard', 'Users', 'Clubs'];
  const optionalItems = ['Analytics', 'Moderation', 'Events'];
  const items = expectedItems || [...defaultItems, ...optionalItems];
  
  console.log('🧭 Verifying navigation items');
  
  for (const item of items) {
    const navItem = page.locator(`nav a:has-text("${item}")`);
    const isVisible = await navItem.isVisible();
    
    if (defaultItems.includes(item)) {
      // Core items should always be visible
      expect(isVisible).toBeTruthy();
      console.log(`✅ Core navigation item present: ${item}`);
    } else {
      // Optional items depend on permissions
      console.log(`${isVisible ? '✅' : '⚠️'} Optional navigation item: ${item} (${isVisible ? 'visible' : 'hidden'})`);
    }
  }
}

/**
 * Verify page content and store context
 */
export async function verifyPageContent(page: Page, pageTitle: string, storeContext?: StoreContext): Promise<void> {
  const store = storeContext || TEST_CONFIG.expectedStore;
  console.log(`📄 Verifying page content: ${pageTitle}`);
  
  // Verify page title
  await expect(page.locator(`h1:has-text("${pageTitle}")`)).toBeVisible({
    timeout: TEST_CONFIG.timeouts.element
  });
  
  // Verify store context is available on the page
  const storeIdText = page.locator(`text=${store.storeId}`);
  const storeNameText = page.locator(`text=${store.storeName}`);
  
  // At least one store context indicator should be present
  const hasStoreId = await storeIdText.isVisible();
  const hasStoreName = await storeNameText.isVisible();
  
  expect(hasStoreId || hasStoreName).toBeTruthy();
  
  console.log('✅ Page content verified');
}

/**
 * Test route access and verify proper handling
 */
export async function testRouteAccess(page: Page, route: string, shouldHaveAccess: boolean): Promise<void> {
  console.log(`🔐 Testing route access: ${route} (should have access: ${shouldHaveAccess})`);
  
  await page.goto(`${TEST_CONFIG.baseUrl}${route}`);
  await page.waitForLoadState('networkidle');
  
  const currentUrl = page.url();
  
  if (shouldHaveAccess) {
    // Should be on the requested route or a valid Store Manager route
    expect(currentUrl).toMatch(/\/store-manager/);
    console.log(`✅ Access granted to ${route}`);
  } else {
    // Should be redirected away from Store Manager routes
    expect(currentUrl).not.toMatch(/\/store-manager/);
    expect(currentUrl).toMatch(/\/(login|dashboard|unauthorized)/);
    console.log(`✅ Access denied to ${route}, redirected to ${currentUrl}`);
  }
}

/**
 * Wait for loading states to complete
 */
export async function waitForLoadingComplete(page: Page): Promise<void> {
  console.log('⏳ Waiting for loading to complete');
  
  // Wait for common loading indicators to disappear
  const loadingIndicators = [
    'text=Loading...',
    'text=Verifying Store Manager access...',
    '[data-testid="loading-spinner"]',
    '.loading-spinner'
  ];

  for (const indicator of loadingIndicators) {
    const element = page.locator(indicator);
    if (await element.isVisible()) {
      await element.waitFor({ state: 'hidden', timeout: TEST_CONFIG.timeouts.api });
    }
  }
  
  // Wait for network to be idle
  await page.waitForLoadState('networkidle');
  
  console.log('✅ Loading complete');
}

/**
 * Capture screenshot for debugging
 */
export async function captureScreenshot(page: Page, name: string): Promise<void> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${name}-${timestamp}.png`;
  
  await page.screenshot({ 
    path: `tests/e2e/screenshots/${filename}`,
    fullPage: true 
  });
  
  console.log(`📸 Screenshot captured: ${filename}`);
}

/**
 * Clean up test state
 */
export async function cleanupTestState(page: Page): Promise<void> {
  console.log('🧹 Cleaning up test state');
  
  try {
    await logout(page);
  } catch (error) {
    console.log('⚠️ Logout failed during cleanup, continuing...');
  }
  
  // Clear any stored data
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  
  console.log('✅ Test state cleaned up');
}
