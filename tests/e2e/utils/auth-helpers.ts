import { Page } from '@playwright/test';

/**
 * Authentication helpers for BookTalks Buddy MCP tests
 * Provides login functionality for different user roles
 */

export interface TestUser {
  email: string;
  password: string;
  role: 'store_owner' | 'privileged_plus' | 'privileged' | 'member';
  description: string;
}

export const TEST_USERS: Record<string, TestUser> = {
  store_owner: {
    email: 'admin@bookconnect.com',
    password: 'admin123',
    role: 'store_owner',
    description: 'Store Owner - admin panel loads slowly'
  },
  privileged_plus: {
    email: 'plato@bc.com',
    password: 'plato123',
    role: 'privileged_plus',
    description: 'Privileged+ user with premium features'
  },
  privileged: {
    email: 'kant@bc.com',
    password: 'kant123',
    role: 'privileged',
    description: 'Privileged user with enhanced features'
  },
  member_chomsky: {
    email: 'chomsky@bc.com',
    password: 'chomsky123',
    role: 'member',
    description: 'Member user - basic access'
  },
  member_aristotle: {
    email: 'aristotle@bc.com',
    password: 'aristotle123',
    role: 'member',
    description: 'Member user - basic access'
  }
};

/**
 * Login helper that handles the authentication flow
 */
export async function loginAs(page: Page, userType: keyof typeof TEST_USERS): Promise<boolean> {
  const user = TEST_USERS[userType];
  
  try {
    // Navigate to login page
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Fill login form using semantic selectors
    const emailInput = page.getByRole('textbox', { name: /email/i });
    const passwordInput = page.getByLabel(/password/i);
    const loginButton = page.getByRole('button', { name: /sign in|login/i });
    
    // Verify form elements are present
    if (!(await emailInput.isVisible()) || !(await passwordInput.isVisible()) || !(await loginButton.isVisible())) {
      console.error('Login form elements not found');
      return false;
    }
    
    // Fill credentials
    await emailInput.fill(user.email);
    await passwordInput.fill(user.password);
    
    // Submit login
    await loginButton.click();
    
    // Wait for navigation or response
    await page.waitForTimeout(3000);
    
    // Check if login was successful
    const currentUrl = page.url();
    const isLoggedIn = !currentUrl.includes('/login');
    
    if (isLoggedIn) {
      console.log(`Successfully logged in as ${user.description}`);
      return true;
    } else {
      console.error(`Login failed for ${user.description}`);
      return false;
    }
    
  } catch (error) {
    console.error(`Login error for ${user.description}:`, error);
    return false;
  }
}

/**
 * Login as store owner (admin user)
 */
export async function loginAsAdmin(page: Page): Promise<boolean> {
  return await loginAs(page, 'store_owner');
}

/**
 * Login as store owner
 */
export async function loginAsStoreOwner(page: Page): Promise<boolean> {
  return await loginAs(page, 'store_owner');
}

/**
 * Login as privileged+ user
 */
export async function loginAsPrivilegedPlus(page: Page): Promise<boolean> {
  return await loginAs(page, 'privileged_plus');
}

/**
 * Login as privileged user
 */
export async function loginAsPrivileged(page: Page): Promise<boolean> {
  return await loginAs(page, 'privileged');
}

/**
 * Login as member user (Chomsky)
 */
export async function loginAsMemberChomsky(page: Page): Promise<boolean> {
  return await loginAs(page, 'member_chomsky');
}

/**
 * Login as member user (Aristotle)
 */
export async function loginAsMemberAristotle(page: Page): Promise<boolean> {
  return await loginAs(page, 'member_aristotle');
}

/**
 * Login as normal user (alias for member)
 */
export async function loginAsNormal(page: Page): Promise<boolean> {
  return await loginAs(page, 'member_chomsky');
}

/**
 * Logout helper
 */
export async function logout(page: Page): Promise<boolean> {
  try {
    // Look for logout button in various locations
    const logoutSelectors = [
      page.getByRole('button', { name: /logout|sign out/i }),
      page.getByRole('link', { name: /logout|sign out/i }),
      page.locator('[data-testid*="logout"]'),
      page.locator('button:has-text("Logout")'),
      page.locator('a:has-text("Sign Out")')
    ];
    
    for (const selector of logoutSelectors) {
      if (await selector.isVisible()) {
        await selector.click();
        await page.waitForTimeout(2000);
        
        // Check if logout was successful
        const currentUrl = page.url();
        const isLoggedOut = currentUrl.includes('/login') || currentUrl === '/';
        
        if (isLoggedOut) {
          console.log('Successfully logged out');
          return true;
        }
      }
    }
    
    // If no logout button found, try navigating to logout endpoint
    await page.goto('/logout');
    await page.waitForTimeout(2000);
    
    const currentUrl = page.url();
    const isLoggedOut = currentUrl.includes('/login') || currentUrl === '/';
    
    return isLoggedOut;
    
  } catch (error) {
    console.error('Logout error:', error);
    return false;
  }
}

/**
 * Check if user is currently logged in
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  try {
    // Look for indicators of logged-in state
    const loggedInIndicators = [
      page.getByRole('button', { name: /logout|sign out/i }),
      page.getByRole('link', { name: /profile|account/i }),
      page.getByText(/welcome|dashboard/i),
      page.locator('[data-testid*="user-menu"]')
    ];
    
    for (const indicator of loggedInIndicators) {
      if (await indicator.isVisible()) {
        return true;
      }
    }
    
    // Check URL - if on login page, probably not logged in
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      return false;
    }
    
    // Try to access a protected route
    await page.goto('/profile');
    await page.waitForTimeout(1000);
    
    const profileUrl = page.url();
    return !profileUrl.includes('/login');
    
  } catch (error) {
    console.error('Error checking login status:', error);
    return false;
  }
}

/**
 * Ensure user is logged in as specific role, login if not
 */
export async function ensureLoggedInAs(page: Page, userType: keyof typeof TEST_USERS): Promise<boolean> {
  // Check if already logged in
  if (await isLoggedIn(page)) {
    // If logged in but need to switch users, logout first
    await logout(page);
  }
  
  // Login as requested user
  return await loginAs(page, userType);
}

/**
 * Setup authenticated session for tests
 */
export async function setupAuthenticatedSession(page: Page, userType: keyof typeof TEST_USERS): Promise<void> {
  const success = await ensureLoggedInAs(page, userType);
  
  if (!success) {
    throw new Error(`Failed to authenticate as ${TEST_USERS[userType].description}`);
  }
  
  // Wait for session to be fully established
  await page.waitForTimeout(2000);
}

/**
 * Test helper to skip test if authentication fails
 */
export function skipIfNotAuthenticated(isAuthenticated: boolean, userType: string): void {
  if (!isAuthenticated) {
    console.log(`Skipping test - could not authenticate as ${userType}`);
  }
}

/**
 * Verify admin access by checking for admin-specific elements
 */
export async function verifyAdminAccess(page: Page): Promise<boolean> {
  try {
    // Try to access admin dashboard
    await page.goto('/admin');
    await page.waitForTimeout(2000);
    
    // Check if we're on admin page and not redirected
    const currentUrl = page.url();
    if (!currentUrl.includes('/admin')) {
      return false;
    }
    
    // Look for admin-specific elements
    const adminElements = [
      page.getByText(/admin panel|admin dashboard/i),
      page.getByRole('link', { name: /dashboard|analytics|users|clubs/i }),
      page.getByText(/bookconnect management/i)
    ];
    
    for (const element of adminElements) {
      if (await element.isVisible()) {
        return true;
      }
    }
    
    return false;
    
  } catch (error) {
    console.error('Error verifying admin access:', error);
    return false;
  }
}

/**
 * Verify store owner access by checking for store management features
 */
export async function verifyStoreOwnerAccess(page: Page): Promise<boolean> {
  try {
    // Try to access store management
    await page.goto('/admin/store-management');
    await page.waitForTimeout(2000);
    
    // Check if we can access store management
    const currentUrl = page.url();
    if (!currentUrl.includes('store-management')) {
      return false;
    }
    
    // Look for store owner specific elements
    const storeElements = [
      page.getByText(/store management|landing page/i),
      page.getByRole('link', { name: /hero|carousel|banner|community/i }),
      page.getByText(/store owner/i)
    ];
    
    for (const element of storeElements) {
      if (await element.isVisible()) {
        return true;
      }
    }
    
    return false;
    
  } catch (error) {
    console.error('Error verifying store owner access:', error);
    return false;
  }
}

/**
 * Clean up authentication state
 */
export async function cleanupAuth(page: Page): Promise<void> {
  try {
    await logout(page);
    
    // Clear any stored authentication data
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    // Navigate to home page
    await page.goto('/');
    await page.waitForTimeout(1000);
    
  } catch (error) {
    console.error('Error cleaning up auth:', error);
  }
}
