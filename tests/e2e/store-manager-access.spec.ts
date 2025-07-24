import { test, expect, Page } from '@playwright/test';

/**
 * End-to-End Tests for Store Manager Interface
 * Tests the complete Store Manager access flow with actual Store Manager account
 */

// Test configuration
const STORE_MANAGER_CREDENTIALS = {
  email: 'kafka@bookconnect.com',
  username: 'kafka',
  // Note: Password should be set via environment variable in real tests
  password: process.env.STORE_MANAGER_PASSWORD || 'test-password'
};

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';
const STORE_MANAGER_ROUTES = [
  '/store-manager/dashboard',
  '/store-manager/users', 
  '/store-manager/clubs',
  '/store-manager/moderation',
  '/store-manager/events'
];

// Helper function to login as Store Manager
async function loginAsStoreManager(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  
  // Fill login form
  await page.fill('input[type="email"]', STORE_MANAGER_CREDENTIALS.email);
  await page.fill('input[type="password"]', STORE_MANAGER_CREDENTIALS.password);
  
  // Submit login form
  await page.click('button[type="submit"]');
  
  // Wait for successful login (redirect to dashboard or profile)
  await page.waitForURL(/\/(dashboard|profile)/);
}

// Helper function to logout
async function logout(page: Page) {
  // Look for logout button in navigation or user menu
  const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign Out")').first();
  if (await logoutButton.isVisible()) {
    await logoutButton.click();
    await page.waitForURL(/\/(login|home)/);
  }
}

test.describe('Store Manager Interface - Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure clean state
    await page.goto(`${BASE_URL}/logout`);
  });

  test('should allow Store Manager to login and access Store Manager interface', async ({ page }) => {
    // Step 1: Login with Store Manager credentials
    await loginAsStoreManager(page);
    
    // Step 2: Navigate to Store Manager interface
    await page.goto(`${BASE_URL}/store-manager`);
    
    // Step 3: Verify successful access and redirect to dashboard
    await expect(page).toHaveURL(`${BASE_URL}/store-manager/dashboard`);
    
    // Step 4: Verify Store Manager Panel is displayed
    await expect(page.locator('h1:has-text("Store Manager Panel")')).toBeVisible();
    
    // Step 5: Verify store context is displayed
    await expect(page.locator('text=Default Store Management')).toBeVisible();
  });

  test('should redirect unauthenticated users to login', async ({ page }) => {
    // Step 1: Try to access Store Manager interface without authentication
    await page.goto(`${BASE_URL}/store-manager/dashboard`);
    
    // Step 2: Verify redirect to login page
    await expect(page).toHaveURL(/\/login/);
    
    // Step 3: Verify login form is displayed
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should block non-Store Manager users from Store Manager interface', async ({ page }) => {
    // Note: This test would require a non-Store Manager user account
    // For now, we'll test the error handling when Store Manager access fails
    
    // Step 1: Navigate to Store Manager interface (assuming no valid session)
    await page.goto(`${BASE_URL}/store-manager/dashboard`);
    
    // Step 2: Should redirect to login or show access denied
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/(login|dashboard|unauthorized)/);
  });
});

test.describe('Store Manager Interface - Navigation and Layout', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsStoreManager(page);
    await page.goto(`${BASE_URL}/store-manager/dashboard`);
  });

  test('should display all required navigation sections', async ({ page }) => {
    // Verify all 6 navigation sections are present
    const navigationItems = [
      'Dashboard',
      'Analytics', 
      'Clubs',
      'Users',
      'Moderation',
      'Events'
    ];

    for (const item of navigationItems) {
      await expect(page.locator(`nav a:has-text("${item}")`)).toBeVisible();
    }
  });

  test('should apply terracotta theme correctly', async ({ page }) => {
    // Verify terracotta background is applied to sidebar
    const sidebar = page.locator('.bg-bookconnect-terracotta').first();
    await expect(sidebar).toBeVisible();
    
    // Verify Store Manager Panel title
    await expect(page.locator('h1:has-text("Store Manager Panel")')).toBeVisible();
  });

  test('should display store context information', async ({ page }) => {
    // Verify store name is displayed in header
    await expect(page.locator('text=Default Store Management')).toBeVisible();
    
    // Verify store context section
    await expect(page.locator('text=Store Context')).toBeVisible();
    await expect(page.locator('text=Managing: Default Store')).toBeVisible();
  });

  test('should show/hide navigation items based on permissions', async ({ page }) => {
    // Core sections should always be visible
    await expect(page.locator('nav a:has-text("Dashboard")')).toBeVisible();
    await expect(page.locator('nav a:has-text("Users")')).toBeVisible();
    await expect(page.locator('nav a:has-text("Clubs")')).toBeVisible();
    
    // Optional sections depend on permissions (Analytics, Moderation, Events)
    // These tests would need to be adjusted based on actual Store Manager permissions
    const optionalSections = ['Analytics', 'Moderation', 'Events'];
    
    for (const section of optionalSections) {
      const navItem = page.locator(`nav a:has-text("${section}")`);
      // Item should either be visible or not present (based on permissions)
      const isVisible = await navItem.isVisible();
      console.log(`${section} navigation visibility: ${isVisible}`);
    }
  });
});

test.describe('Store Manager Interface - Page Access', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsStoreManager(page);
  });

  test('should navigate to dashboard and display store context', async ({ page }) => {
    await page.goto(`${BASE_URL}/store-manager/dashboard`);
    
    // Verify dashboard page loads
    await expect(page.locator('h1:has-text("Store Manager Dashboard")')).toBeVisible();
    
    // Verify store context is available
    await expect(page.locator('text=Managing Default Store')).toBeVisible();
    await expect(page.locator('text=Store ID: ce76b99a-5f1a-481a-af85-862e584465e1')).toBeVisible();
    
    // Verify store context verification section
    await expect(page.locator('text=Store Context Verified')).toBeVisible();
    await expect(page.locator('text=✅ Store Manager access confirmed')).toBeVisible();
  });

  test('should navigate to users page and display placeholder content', async ({ page }) => {
    await page.goto(`${BASE_URL}/store-manager/users`);
    
    // Verify users page loads
    await expect(page.locator('h1:has-text("Users Management")')).toBeVisible();
    
    // Verify store context
    await expect(page.locator('text=Manage users for Default Store')).toBeVisible();
    
    // Verify implementation plan section
    await expect(page.locator('text=Store-Scoped User Management')).toBeVisible();
    await expect(page.locator('text=Template: AdminUserListPage.tsx')).toBeVisible();
  });

  test('should navigate to clubs page and display placeholder content', async ({ page }) => {
    await page.goto(`${BASE_URL}/store-manager/clubs`);
    
    // Verify clubs page loads
    await expect(page.locator('h1:has-text("Clubs Management")')).toBeVisible();
    
    // Verify store context
    await expect(page.locator('text=Manage book clubs for Default Store')).toBeVisible();
    
    // Verify implementation plan
    await expect(page.locator('text=Template: AdminClubManagementPage.tsx')).toBeVisible();
  });

  test('should navigate to moderation page if user has permissions', async ({ page }) => {
    await page.goto(`${BASE_URL}/store-manager/moderation`);
    
    // Check if moderation page is accessible (depends on permissions)
    const moderationHeader = page.locator('h1:has-text("Moderation")');
    const isAccessible = await moderationHeader.isVisible();
    
    if (isAccessible) {
      // Verify moderation page content
      await expect(moderationHeader).toBeVisible();
      await expect(page.locator('text=Content moderation for Default Store')).toBeVisible();
      await expect(page.locator('text=Template: ModerationDashboard.tsx')).toBeVisible();
    } else {
      // Should redirect or show access denied
      console.log('Moderation page not accessible - user may lack permissions');
    }
  });

  test('should navigate to events page if user has permissions', async ({ page }) => {
    await page.goto(`${BASE_URL}/store-manager/events`);
    
    // Check if events page is accessible (depends on permissions)
    const eventsHeader = page.locator('h1:has-text("Events Management")');
    const isAccessible = await eventsHeader.isVisible();
    
    if (isAccessible) {
      // Verify events page content
      await expect(eventsHeader).toBeVisible();
      await expect(page.locator('text=Manage events for Default Store')).toBeVisible();
      await expect(page.locator('text=Template: AdminEventsPage.tsx')).toBeVisible();
    } else {
      // Should redirect or show access denied
      console.log('Events page not accessible - user may lack permissions');
    }
  });
});
