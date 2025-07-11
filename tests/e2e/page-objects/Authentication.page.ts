import { Page, Locator, expect } from '@playwright/test';

/**
 * Authentication Page Object Model
 * 
 * Handles login/logout functionality for tests
 */
export class AuthenticationPage {
  readonly page: Page;
  
  // Login elements
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly loginForm: Locator;
  
  // Navigation elements
  readonly userMenu: Locator;
  readonly logoutButton: Locator;
  readonly profileLink: Locator;
  
  // Error elements
  readonly errorMessage: Locator;
  readonly successMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Login elements
    this.emailInput = page.locator('[data-testid="email-input"], input[type="email"]');
    this.passwordInput = page.locator('[data-testid="password-input"], input[type="password"]');
    this.loginButton = page.locator('[data-testid="login-button"], button[type="submit"]');
    this.loginForm = page.locator('[data-testid="login-form"], form');
    
    // Navigation elements
    this.userMenu = page.locator('[data-testid="user-menu"]');
    this.logoutButton = page.locator('[data-testid="logout-button"]');
    this.profileLink = page.locator('[data-testid="profile-link"]');
    
    // Error elements
    this.errorMessage = page.locator('[data-testid="error-message"], .error');
    this.successMessage = page.locator('[data-testid="success-message"], .success');
  }

  /**
   * Navigate to login page
   */
  async goto() {
    await this.page.goto('/login');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Login with credentials
   */
  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
    
    // Wait for navigation or error
    try {
      await this.page.waitForURL('/', { timeout: 10000 });
      await this.userMenu.waitFor({ state: 'visible', timeout: 5000 });
    } catch (error) {
      // Check if there's an error message
      const hasError = await this.errorMessage.isVisible();
      if (hasError) {
        const errorText = await this.errorMessage.textContent();
        throw new Error(`Login failed: ${errorText}`);
      }
      throw error;
    }
  }

  /**
   * Login with test user credentials
   */
  async loginAsTestUser() {
    const testEmail = process.env.TEST_USER_EMAIL || 'chomsky@bc.com';
    const testPassword = process.env.TEST_USER_PASSWORD || 'chomsky123';
    await this.login(testEmail, testPassword);
  }

  /**
   * Login as privileged user
   */
  async loginAsPrivilegedUser() {
    const privilegedEmail = process.env.PRIVILEGED_USER_EMAIL || 'kant@bc.com';
    const privilegedPassword = process.env.PRIVILEGED_USER_PASSWORD || 'kant123';
    await this.login(privilegedEmail, privilegedPassword);
  }

  /**
   * Login as admin user
   */
  async loginAsAdmin() {
    const adminEmail = process.env.ADMIN_USER_EMAIL || 'admin@bookconnect.com';
    const adminPassword = process.env.ADMIN_USER_PASSWORD || 'admin123';
    await this.login(adminEmail, adminPassword);
  }

  /**
   * Logout current user
   */
  async logout() {
    await this.userMenu.click();
    await this.logoutButton.click();
    await this.page.waitForURL('/login', { timeout: 10000 });
  }

  /**
   * Check if user is logged in
   */
  async isLoggedIn(): Promise<boolean> {
    try {
      await this.userMenu.waitFor({ state: 'visible', timeout: 2000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Verify successful login
   */
  async verifyLoggedIn() {
    await expect(this.userMenu).toBeVisible();
    await expect(this.page).toHaveURL('/');
  }

  /**
   * Verify successful logout
   */
  async verifyLoggedOut() {
    await expect(this.page).toHaveURL('/login');
    await expect(this.userMenu).not.toBeVisible();
  }
}
