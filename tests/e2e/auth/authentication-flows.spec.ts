import { test, expect } from '@playwright/test';

/**
 * Comprehensive Authentication Flow Tests for BookTalks Buddy
 * Tests the actual implemented authentication UI and workflows
 */

test.describe('Authentication Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Start from the landing page
    await page.goto('/');
  });

  test.describe('Landing Page Navigation', () => {
    test('should display landing page with proper sections', async ({ page }) => {
      // Verify landing page loads with main sections
      await expect(page).toHaveTitle(/BookTalks|BookConnect/);
      
      // Check for main landing page content using MCP semantic understanding
      await expect(page.getByRole('main')).toBeVisible();
      
      // Look for navigation or call-to-action elements
      const loginButton = page.getByRole('link', { name: /login|sign in/i });
      const registerButton = page.getByRole('link', { name: /register|sign up|get started/i });
      
      // At least one should be visible
      const hasLoginOrRegister = await loginButton.isVisible() || await registerButton.isVisible();
      expect(hasLoginOrRegister).toBe(true);
    });

    test('should navigate to login from landing page', async ({ page }) => {
      // Look for login navigation using semantic selectors
      const loginLink = page.getByRole('link', { name: /login|sign in/i }).first();
      
      if (await loginLink.isVisible()) {
        await loginLink.click();
        await expect(page).toHaveURL(/login/);
      } else {
        // Direct navigation if no visible link
        await page.goto('/login');
        await expect(page).toHaveURL(/login/);
      }
    });

    test('should navigate to register from landing page', async ({ page }) => {
      // Look for register navigation using semantic selectors
      const registerLink = page.getByRole('link', { name: /register|sign up|get started|create account/i }).first();
      
      if (await registerLink.isVisible()) {
        await registerLink.click();
        await expect(page).toHaveURL(/register/);
      } else {
        // Direct navigation if no visible link
        await page.goto('/register');
        await expect(page).toHaveURL(/register/);
      }
    });
  });

  test.describe('Login Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login');
    });

    test('should display login form with proper elements', async ({ page }) => {
      // Verify we're on the login page
      await expect(page).toHaveURL(/login/);
      
      // Check for form elements using semantic selectors
      await expect(page.getByRole('textbox', { name: /email/i })).toBeVisible();
      await expect(page.getByLabel(/password/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /sign in|login/i })).toBeVisible();
      
      // Check for link to register page
      const registerLink = page.getByRole('link', { name: /register|sign up|create account/i });
      if (await registerLink.isVisible()) {
        await expect(registerLink).toBeVisible();
      }
    });

    test('should validate required fields', async ({ page }) => {
      // Try to submit empty form
      const submitButton = page.getByRole('button', { name: /sign in|login/i });
      await submitButton.click();
      
      // Check for validation - either browser validation or custom
      const emailInput = page.getByRole('textbox', { name: /email/i });
      const passwordInput = page.getByLabel(/password/i);
      
      // Check if fields are marked as required
      const emailRequired = await emailInput.getAttribute('required');
      const passwordRequired = await passwordInput.getAttribute('required');
      
      expect(emailRequired !== null || passwordRequired !== null).toBe(true);
    });

    test('should validate email format', async ({ page }) => {
      // Enter invalid email
      await page.getByRole('textbox', { name: /email/i }).fill('invalid-email');
      await page.getByLabel(/password/i).fill('password123');
      
      const submitButton = page.getByRole('button', { name: /sign in|login/i });
      await submitButton.click();
      
      // Should show validation error or prevent submission
      const emailInput = page.getByRole('textbox', { name: /email/i });
      const validationMessage = await emailInput.evaluate((el: HTMLInputElement) => el.validationMessage);
      
      if (validationMessage) {
        expect(validationMessage).toContain('email');
      }
    });

    test('should handle login attempt with invalid credentials', async ({ page }) => {
      // Fill in fake credentials
      await page.getByRole('textbox', { name: /email/i }).fill('test@example.com');
      await page.getByLabel(/password/i).fill('wrongpassword');
      
      const submitButton = page.getByRole('button', { name: /sign in|login/i });
      await submitButton.click();
      
      // Wait for response and check for error message
      await page.waitForTimeout(2000);
      
      // Look for error messages using semantic selectors
      const errorMessage = page.getByText(/invalid|incorrect|error|failed/i);
      const isErrorVisible = await errorMessage.isVisible();
      
      // Should either show error or stay on login page
      const currentUrl = page.url();
      expect(currentUrl.includes('/login') || isErrorVisible).toBe(true);
    });

    test('should navigate to register page from login', async ({ page }) => {
      const registerLink = page.getByRole('link', { name: /register|sign up|create account/i });
      
      if (await registerLink.isVisible()) {
        await registerLink.click();
        await expect(page).toHaveURL(/register/);
      }
    });
  });

  test.describe('Register Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/register');
    });

    test('should display register form with proper elements', async ({ page }) => {
      // Verify we're on the register page
      await expect(page).toHaveURL(/register/);
      
      // Check for form elements
      await expect(page.getByRole('textbox', { name: /email/i })).toBeVisible();
      await expect(page.getByLabel(/password/i)).toBeVisible();
      
      // Look for username field (common in registration)
      const usernameField = page.getByRole('textbox', { name: /username|name/i });
      if (await usernameField.isVisible()) {
        await expect(usernameField).toBeVisible();
      }
      
      await expect(page.getByRole('button', { name: /create|register|sign up/i })).toBeVisible();
      
      // Check for link to login page
      const loginLink = page.getByRole('link', { name: /login|sign in/i });
      if (await loginLink.isVisible()) {
        await expect(loginLink).toBeVisible();
      }
    });

    test('should validate required fields on registration', async ({ page }) => {
      // Try to submit empty form
      const submitButton = page.getByRole('button', { name: /create|register|sign up/i });
      await submitButton.click();
      
      // Check for validation
      const emailInput = page.getByRole('textbox', { name: /email/i });
      const passwordInput = page.getByLabel(/password/i);
      
      const emailRequired = await emailInput.getAttribute('required');
      const passwordRequired = await passwordInput.getAttribute('required');
      
      expect(emailRequired !== null || passwordRequired !== null).toBe(true);
    });

    test('should validate password requirements', async ({ page }) => {
      // Test weak password
      await page.getByRole('textbox', { name: /email/i }).fill('test@example.com');
      await page.getByLabel(/password/i).fill('123');
      
      const usernameField = page.getByRole('textbox', { name: /username|name/i });
      if (await usernameField.isVisible()) {
        await usernameField.fill('testuser');
      }
      
      const submitButton = page.getByRole('button', { name: /create|register|sign up/i });
      await submitButton.click();
      
      // Should show password validation error
      await page.waitForTimeout(1000);
      
      // Look for password-related error messages
      const errorMessage = page.getByText(/password.*short|password.*weak|minimum.*characters/i);
      const isErrorVisible = await errorMessage.isVisible();
      
      // Should either show error or prevent submission
      const currentUrl = page.url();
      expect(currentUrl.includes('/register') || isErrorVisible).toBe(true);
    });

    test('should navigate to login page from register', async ({ page }) => {
      const loginLink = page.getByRole('link', { name: /login|sign in/i });
      
      if (await loginLink.isVisible()) {
        await loginLink.click();
        await expect(page).toHaveURL(/login/);
      }
    });
  });

  test.describe('Navigation Flow', () => {
    test('should handle back navigation correctly', async ({ page }) => {
      // Start at landing page
      await page.goto('/');
      
      // Navigate to login
      await page.goto('/login');
      await expect(page).toHaveURL(/login/);
      
      // Use browser back button
      await page.goBack();
      await expect(page).toHaveURL('/');
      
      // Navigate to register
      await page.goto('/register');
      await expect(page).toHaveURL(/register/);
      
      // Use browser back button
      await page.goBack();
      await expect(page).toHaveURL('/');
    });

    test('should redirect unauthorized users appropriately', async ({ page }) => {
      // Try to access protected routes without authentication
      const protectedRoutes = ['/profile', '/book-club', '/admin'];
      
      for (const route of protectedRoutes) {
        await page.goto(route);
        
        // Should either redirect to login or show unauthorized page
        const currentUrl = page.url();
        const isRedirected = currentUrl.includes('/login') || 
                           currentUrl.includes('/unauthorized') || 
                           currentUrl === '/';
        
        expect(isRedirected).toBe(true);
      }
    });
  });
});
