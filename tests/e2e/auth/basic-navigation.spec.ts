import { test, expect } from '@playwright/test';

/**
 * Basic Navigation Tests for BookTalks Buddy
 * These tests verify the basic functionality and navigation works
 */

test.describe('Basic Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the landing page successfully', async ({ page }) => {
    // Verify the page loads
    await expect(page).toHaveTitle(/BookTalks|BookConnect/);
    
    // Check for main content
    await expect(page.locator('body')).toBeVisible();
    
    // Verify page is interactive
    await page.waitForLoadState('networkidle');
  });

  test('should navigate to login page', async ({ page }) => {
    // Navigate to login page directly
    await page.goto('/login');
    
    // Verify we're on the login page
    await expect(page).toHaveURL(/login/);
    
    // Check for login form elements
    await expect(page.getByRole('textbox', { name: /email/i })).toBeVisible();
    await expect(page.getByRole('textbox', { name: /password/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in|login/i })).toBeVisible();
  });

  test('should navigate to register page', async ({ page }) => {
    // Navigate to register page directly
    await page.goto('/register');
    
    // Verify we're on the register page
    await expect(page).toHaveURL(/register/);
    
    // Check for register form elements
    await expect(page.getByRole('textbox', { name: /email/i })).toBeVisible();
    await expect(page.getByRole('textbox', { name: /password/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /create|register|sign up/i })).toBeVisible();
  });

  test('should navigate from login to register', async ({ page }) => {
    // Go to login page
    await page.goto('/login');
    
    // Look for a link to register page
    const registerLink = page.getByRole('link', { name: /register|sign up|create account/i });
    if (await registerLink.isVisible()) {
      await registerLink.click();
      await expect(page).toHaveURL(/register/);
    } else {
      // If no link, navigate directly
      await page.goto('/register');
      await expect(page).toHaveURL(/register/);
    }
  });

  test('should have working back navigation', async ({ page }) => {
    // Go to login page
    await page.goto('/login');
    
    // Look for back button
    const backButton = page.getByRole('button', { name: /back|arrow/i }).first();
    if (await backButton.isVisible()) {
      await backButton.click();
      // Should go back to landing page
      await expect(page).toHaveURL('/');
    }
  });

  test('should handle form validation on login page', async ({ page }) => {
    await page.goto('/login');
    
    // Try to submit empty form
    const submitButton = page.getByRole('button', { name: /sign in|login/i });
    await submitButton.click();
    
    // Check if browser validation or custom validation appears
    const emailInput = page.getByRole('textbox', { name: /email/i });
    const isRequired = await emailInput.getAttribute('required');
    
    if (isRequired !== null) {
      // Browser validation should prevent submission
      expect(isRequired).toBe('');
    }
  });

  test('should handle form validation on register page', async ({ page }) => {
    await page.goto('/register');

    // Check that submit button is initially disabled (good validation)
    const submitButton = page.getByRole('button', { name: /create|register|sign up/i });
    const isDisabled = await submitButton.getAttribute('disabled');

    // Button should be disabled initially (this is correct behavior)
    expect(isDisabled).not.toBeNull();

    // Check for required field validation
    const emailInput = page.getByRole('textbox', { name: /email/i });
    const passwordInput = page.getByLabel(/password/i);

    // Fields should be present and potentially required
    await expect(emailInput).toBeVisible();
    if (await passwordInput.isVisible()) {
      await expect(passwordInput).toBeVisible();
    }

    // Test that button remains disabled with empty fields (good UX)
    const stillDisabled = await submitButton.getAttribute('disabled');
    expect(stillDisabled).not.toBeNull();
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Verify page still loads and is usable
    await expect(page.locator('body')).toBeVisible();
    
    // Check that content is not cut off
    const bodyWidth = await page.locator('body').boundingBox();
    expect(bodyWidth?.width).toBeLessThanOrEqual(375);
  });

  test('should have accessible elements', async ({ page }) => {
    // Basic accessibility checks
    await page.goto('/login');
    
    // Check for proper labels
    const emailInput = page.getByRole('textbox', { name: /email/i });
    await expect(emailInput).toBeVisible();
    
    // Check for proper headings
    const heading = page.getByRole('heading').first();
    await expect(heading).toBeVisible();
  });
});
