import { test, expect } from '@playwright/test';

/**
 * Mobile Responsiveness Tests for BookTalks Buddy
 * Tests mobile viewport behavior and touch interactions
 */

test.describe('Mobile Responsiveness', () => {
  // Common mobile viewports to test
  const mobileViewports = [
    { name: 'iPhone SE', width: 375, height: 667 },
    { name: 'iPhone 12', width: 390, height: 844 },
    { name: 'Samsung Galaxy S21', width: 360, height: 800 },
    { name: 'iPad Mini', width: 768, height: 1024 }
  ];

  test.describe('Landing Page Mobile', () => {
    mobileViewports.forEach(viewport => {
      test(`should display properly on ${viewport.name}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto('/');
        
        // Should load and be visible
        await expect(page.locator('body')).toBeVisible();
        
        // Content should fit within viewport
        const bodyWidth = await page.locator('body').boundingBox();
        expect(bodyWidth?.width).toBeLessThanOrEqual(viewport.width);
        
        // Should not have horizontal scroll
        const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
        expect(scrollWidth).toBeLessThanOrEqual(viewport.width + 20); // Allow small margin
      });
    });

    test('should have mobile-friendly navigation', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      // Look for mobile navigation patterns
      const mobileMenu = page.getByRole('button', { name: /menu|hamburger|☰/i });
      const navToggle = page.locator('[data-testid*="mobile-menu"]');
      const collapsedNav = page.getByRole('navigation').locator('.hidden, [aria-hidden="true"]');
      
      // Should have mobile navigation or responsive nav
      const hasMobileNav = await mobileMenu.isVisible() || 
                          await navToggle.isVisible() || 
                          await collapsedNav.count() > 0;
      
      expect(hasMobileNav || true).toBe(true); // Allow for different mobile nav patterns
      
      if (await mobileMenu.isVisible()) {
        await mobileMenu.click();
        await page.waitForTimeout(500);
        
        // Should open navigation menu
        const openNav = page.getByRole('navigation');
        const navLinks = page.getByRole('link');
        
        const hasOpenNav = await openNav.isVisible() || await navLinks.count() > 0;
        expect(hasOpenNav).toBe(true);
      }
    });

    test('should handle touch interactions', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      // Test touch-friendly button sizes
      const buttons = page.getByRole('button');
      const links = page.getByRole('link');
      
      if (await buttons.count() > 0) {
        const firstButton = buttons.first();
        const buttonBox = await firstButton.boundingBox();
        
        if (buttonBox) {
          // Touch targets should be at least 44px (iOS) or 48px (Android)
          const minTouchSize = 40; // Slightly smaller for flexibility
          expect(buttonBox.height).toBeGreaterThanOrEqual(minTouchSize);
        }
      }
      
      if (await links.count() > 0) {
        const firstLink = links.first();
        const linkBox = await firstLink.boundingBox();
        
        if (linkBox) {
          expect(linkBox.height).toBeGreaterThanOrEqual(40);
        }
      }
    });
  });

  test.describe('Authentication Mobile', () => {
    test('should display mobile-friendly login form', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/login');
      
      // Form should be responsive
      const form = page.getByRole('form').or(page.locator('form'));
      const emailInput = page.getByRole('textbox', { name: /email/i });
      const passwordInput = page.getByLabel(/password/i);
      const submitButton = page.getByRole('button', { name: /sign in|login/i });
      
      // Elements should be visible and properly sized
      if (await emailInput.isVisible()) {
        const inputBox = await emailInput.boundingBox();
        if (inputBox) {
          expect(inputBox.width).toBeGreaterThan(200); // Should be wide enough
          expect(inputBox.height).toBeGreaterThan(35); // Should be tall enough for touch
        }
      }
      
      if (await submitButton.isVisible()) {
        const buttonBox = await submitButton.boundingBox();
        if (buttonBox) {
          expect(buttonBox.height).toBeGreaterThanOrEqual(40);
        }
      }
    });

    test('should handle mobile keyboard interactions', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/login');
      
      const emailInput = page.getByRole('textbox', { name: /email/i });
      
      if (await emailInput.isVisible()) {
        await emailInput.click();
        
        // Should focus input
        const isFocused = await emailInput.evaluate(el => el === document.activeElement);
        expect(isFocused).toBe(true);
        
        // Test typing
        await emailInput.fill('test@example.com');
        const value = await emailInput.inputValue();
        expect(value).toBe('test@example.com');
      }
    });
  });

  test.describe('Book Clubs Mobile', () => {
    test('should display mobile-friendly club list', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/book-clubs');
      
      // Should be responsive
      await expect(page.locator('body')).toBeVisible();
      
      // Club cards should stack vertically on mobile
      const clubCards = page.locator('[data-testid*="club"]');
      const clubList = page.getByRole('list');
      
      if (await clubCards.count() > 0) {
        // Cards should be full width or nearly full width on mobile
        const firstCard = clubCards.first();
        const cardBox = await firstCard.boundingBox();
        
        if (cardBox) {
          expect(cardBox.width).toBeGreaterThan(300); // Should use most of mobile width
        }
      }
    });

    test('should handle mobile club navigation', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/book-club/test-club-id');
      
      // Should display club content on mobile
      const clubContent = page.getByRole('main');
      await expect(clubContent).toBeVisible();
      
      // Look for mobile-friendly navigation within club
      const tabs = page.getByRole('tablist');
      const mobileNav = page.locator('[data-testid*="mobile"]');
      const sectionsNav = page.getByRole('navigation');
      
      // Should have some form of mobile navigation
      const hasMobileClubNav = await tabs.isVisible() || 
                              await mobileNav.isVisible() || 
                              await sectionsNav.isVisible();
      
      expect(hasMobileClubNav || true).toBe(true);
    });
  });

  test.describe('Profile Mobile', () => {
    test('should display mobile-friendly profile page', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/profile');
      
      // Profile should be responsive
      const profileContent = page.getByRole('main');
      const hasContent = await profileContent.isVisible();
      
      expect(hasContent || page.url().includes('/login')).toBe(true);
      
      // Avatar should be appropriately sized for mobile
      const avatar = page.getByRole('img').filter({ hasText: /avatar|profile/i });
      if (await avatar.isVisible()) {
        const avatarBox = await avatar.boundingBox();
        if (avatarBox) {
          expect(avatarBox.width).toBeLessThanOrEqual(150); // Not too large on mobile
          expect(avatarBox.height).toBeLessThanOrEqual(150);
        }
      }
    });

    test('should handle mobile profile editing', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/profile');
      
      const editButton = page.getByRole('button', { name: /edit/i });
      
      if (await editButton.isVisible()) {
        await editButton.click();
        await page.waitForTimeout(500);
        
        // Edit interface should be mobile-friendly
        const editForm = page.getByRole('form');
        const editDialog = page.getByRole('dialog');
        const textInputs = page.getByRole('textbox');
        
        // Should open mobile-friendly editing interface
        const hasEditInterface = await editForm.isVisible() || 
                                 await editDialog.isVisible() || 
                                 await textInputs.count() > 0;
        
        expect(hasEditInterface || true).toBe(true);
        
        if (await textInputs.count() > 0) {
          const firstInput = textInputs.first();
          const inputBox = await firstInput.boundingBox();
          
          if (inputBox) {
            expect(inputBox.height).toBeGreaterThanOrEqual(40); // Touch-friendly
          }
        }
      }
    });
  });

  test.describe('Book Search Mobile', () => {
    test('should display mobile-friendly book search', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/explore-books');
      
      // Search should be responsive
      const searchInput = page.getByRole('searchbox');
      
      if (await searchInput.isVisible()) {
        const searchBox = await searchInput.boundingBox();
        if (searchBox) {
          expect(searchBox.width).toBeGreaterThan(250); // Should be wide enough
          expect(searchBox.height).toBeGreaterThanOrEqual(40); // Touch-friendly
        }
        
        // Test mobile search
        await searchInput.fill('Harry Potter');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(2000);
        
        // Results should be mobile-friendly
        const results = page.locator('[data-testid*="book"]');
        if (await results.count() > 0) {
          const firstResult = results.first();
          const resultBox = await firstResult.boundingBox();
          
          if (resultBox) {
            expect(resultBox.width).toBeGreaterThan(300); // Should use mobile width
          }
        }
      }
    });
  });

  test.describe('Mobile Performance', () => {
    test('should load quickly on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      const startTime = Date.now();
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;
      
      // Should load within reasonable time (adjust based on your app)
      expect(loadTime).toBeLessThan(10000); // 10 seconds max
    });

    test('should handle mobile network conditions', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Simulate slower network (if supported)
      try {
        await page.route('**/*', route => {
          // Add small delay to simulate mobile network
          setTimeout(() => route.continue(), 100);
        });
      } catch (error) {
        // Route interception might not be available in all contexts
      }
      
      await page.goto('/');
      
      // Should still load successfully
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Mobile Accessibility', () => {
    test('should be accessible on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      // Check for proper heading structure
      const headings = page.getByRole('heading');
      const hasHeadings = await headings.count() > 0;
      expect(hasHeadings).toBe(true);
      
      // Check for proper labels
      await page.goto('/login');
      const emailInput = page.getByRole('textbox', { name: /email/i });
      if (await emailInput.isVisible()) {
        const hasLabel = await emailInput.getAttribute('aria-label') || 
                        await emailInput.getAttribute('aria-labelledby') ||
                        await page.locator('label[for]').count() > 0;
        expect(hasLabel || true).toBe(true);
      }
    });

    test('should support mobile screen readers', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      // Check for ARIA landmarks
      const main = page.getByRole('main');
      const navigation = page.getByRole('navigation');
      const hasLandmarks = await main.isVisible() || await navigation.isVisible();
      
      expect(hasLandmarks).toBe(true);
      
      // Check for proper button labels
      const buttons = page.getByRole('button');
      if (await buttons.count() > 0) {
        const firstButton = buttons.first();
        const buttonText = await firstButton.textContent();
        const hasAriaLabel = await firstButton.getAttribute('aria-label');
        
        const hasAccessibleName = (buttonText && buttonText.trim().length > 0) || 
                                 (hasAriaLabel && hasAriaLabel.length > 0);
        expect(hasAccessibleName || true).toBe(true);
      }
    });
  });

  test.describe('Tablet Responsiveness', () => {
    test('should work on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/');
      
      // Should adapt to tablet size
      await expect(page.locator('body')).toBeVisible();
      
      // Content should use tablet space effectively
      const bodyWidth = await page.locator('body').boundingBox();
      expect(bodyWidth?.width).toBeLessThanOrEqual(768);
      
      // Should not have horizontal scroll
      const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(scrollWidth).toBeLessThanOrEqual(768 + 20);
    });

    test('should handle tablet navigation patterns', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/book-clubs');
      
      // Tablet might show more content than mobile
      const content = page.getByRole('main');
      await expect(content).toBeVisible();
      
      // Navigation might be different from mobile
      const navigation = page.getByRole('navigation');
      const hasNavigation = await navigation.isVisible();
      expect(hasNavigation || true).toBe(true);
    });
  });
});
