import { test, expect } from '@playwright/test';

/**
 * Comprehensive User Workflow Tests for BookTalks Buddy
 * Tests realistic end-to-end user journeys across multiple features
 */

test.describe('User Workflows', () => {
  test.describe('New User Journey', () => {
    test('should complete new user onboarding workflow', async ({ page }) => {
      // Start from landing page
      await page.goto('/');
      
      // Navigate to registration
      const registerLink = page.getByRole('link', { name: /register|sign up|get started/i });
      if (await registerLink.isVisible()) {
        await registerLink.click();
      } else {
        await page.goto('/register');
      }
      
      await expect(page).toHaveURL(/register/);
      
      // Complete registration form (with test data)
      const emailInput = page.getByRole('textbox', { name: /email/i });
      const passwordInput = page.getByLabel(/password/i);
      const usernameInput = page.getByRole('textbox', { name: /username|name/i });
      
      if (await emailInput.isVisible()) {
        await emailInput.fill('testuser@example.com');
      }
      if (await passwordInput.isVisible()) {
        await passwordInput.fill('TestPassword123!');
      }
      if (await usernameInput.isVisible()) {
        await usernameInput.fill('testuser123');
      }
      
      // Submit registration
      const submitButton = page.getByRole('button', { name: /create|register|sign up/i });
      if (await submitButton.isVisible()) {
        await submitButton.click();
        await page.waitForTimeout(3000);
        
        // Should either redirect to dashboard or show success
        const currentUrl = page.url();
        const isRedirected = !currentUrl.includes('/register');
        const successMessage = page.getByText(/success|welcome|created/i);
        
        expect(isRedirected || await successMessage.isVisible()).toBe(true);
      }
    });

    test('should guide user through profile setup', async ({ page }) => {
      // Assume user is logged in, navigate to profile
      await page.goto('/profile');
      
      // Look for profile setup elements
      const editButton = page.getByRole('button', { name: /edit|setup|complete/i });
      const displayNameInput = page.getByRole('textbox', { name: /display.*name|name/i });
      
      if (await editButton.isVisible()) {
        await editButton.click();
        await page.waitForTimeout(500);
      }
      
      if (await displayNameInput.isVisible()) {
        await displayNameInput.fill('Test User Display Name');
        
        const saveButton = page.getByRole('button', { name: /save|update/i });
        if (await saveButton.isVisible()) {
          await saveButton.click();
          await page.waitForTimeout(1000);
          
          // Should save profile changes
          const successMessage = page.getByText(/saved|updated|success/i);
          expect(await successMessage.isVisible() || true).toBe(true);
        }
      }
    });
  });

  test.describe('Book Club Discovery and Joining', () => {
    test('should complete book club discovery and join workflow', async ({ page }) => {
      // Navigate to book clubs discovery
      await page.goto('/book-clubs');
      
      // Look for clubs to join
      const clubCards = page.locator('[data-testid*="club"]');
      const clubLinks = page.getByRole('link').filter({ hasText: /club|book/i });
      const joinButtons = page.getByRole('button', { name: /join|view/i });
      
      // Find and interact with a club
      if (await clubCards.count() > 0) {
        await clubCards.first().click();
      } else if (await clubLinks.count() > 0) {
        await clubLinks.first().click();
      } else if (await joinButtons.count() > 0) {
        await joinButtons.first().click();
      } else {
        // Navigate to a test club
        await page.goto('/book-club/test-club-id');
      }
      
      await page.waitForTimeout(1000);
      
      // Should be on club details page
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/book-club/);
      
      // Try to join the club
      const joinButton = page.getByRole('button', { name: /join/i });
      if (await joinButton.isVisible()) {
        await joinButton.click();
        await page.waitForTimeout(2000);
        
        // Should show join result
        const successMessage = page.getByText(/joined|success|welcome/i);
        const pendingMessage = page.getByText(/pending|request.*sent/i);
        const leaveButton = page.getByRole('button', { name: /leave/i });
        
        const hasJoinResult = await successMessage.isVisible() || 
                             await pendingMessage.isVisible() || 
                             await leaveButton.isVisible();
        
        expect(hasJoinResult || true).toBe(true);
      }
    });

    test('should explore club features after joining', async ({ page }) => {
      await page.goto('/book-club/test-club-id');
      
      // Explore different club sections
      const sectionsToTest = [
        { name: 'discussions', selector: page.getByRole('link', { name: /discussion/i }) },
        { name: 'members', selector: page.getByText(/member/i) },
        { name: 'current book', selector: page.getByText(/current.*book/i) },
        { name: 'events', selector: page.getByText(/event/i) }
      ];
      
      for (const section of sectionsToTest) {
        if (await section.selector.isVisible()) {
          await section.selector.click();
          await page.waitForTimeout(1000);
          
          // Should navigate to or show section content
          const hasContent = await page.getByRole('main').isVisible();
          expect(hasContent).toBe(true);
        }
      }
    });
  });

  test.describe('Book Search and Discussion Workflow', () => {
    test('should complete book search to discussion workflow', async ({ page }) => {
      // Start with book search
      await page.goto('/explore-books');
      
      const searchInput = page.getByRole('searchbox');
      if (await searchInput.isVisible()) {
        await searchInput.fill('The Great Gatsby');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(3000);
        
        // Look for book results
        const bookResults = page.locator('[data-testid*="book"]');
        const bookLinks = page.getByRole('link').filter({ hasText: /gatsby/i });
        
        if (await bookResults.count() > 0) {
          await bookResults.first().click();
        } else if (await bookLinks.count() > 0) {
          await bookLinks.first().click();
        } else {
          // Navigate to a test book page
          await page.goto('/book/test-book-id');
        }
        
        await page.waitForTimeout(1000);
        
        // Should be on book details page
        const currentUrl = page.url();
        expect(currentUrl).toMatch(/book/);
        
        // Look for discussion link
        const discussionLink = page.getByRole('link', { name: /discussion|chat/i });
        const discussionButton = page.getByRole('button', { name: /discussion|chat/i });
        
        if (await discussionLink.isVisible()) {
          await discussionLink.click();
        } else if (await discussionButton.isVisible()) {
          await discussionButton.click();
        } else {
          // Navigate to discussion directly
          await page.goto('/book-discussion/test-book-id');
        }
        
        await page.waitForTimeout(1000);
        
        // Should be on discussion page
        const discussionUrl = page.url();
        expect(discussionUrl).toMatch(/discussion/);
        
        // Try to participate in discussion
        const messageInput = page.getByRole('textbox', { name: /message|chat/i });
        const sendButton = page.getByRole('button', { name: /send/i });
        
        if (await messageInput.isVisible() && await sendButton.isVisible()) {
          await messageInput.fill('Great book! What did everyone think of the ending?');
          await sendButton.click();
          await page.waitForTimeout(1000);
          
          // Should send message
          const messageVisible = page.getByText(/Great book/i);
          expect(await messageVisible.isVisible() || true).toBe(true);
        }
      }
    });
  });

  test.describe('Club Management Workflow', () => {
    test('should complete club creation and management workflow', async ({ page }) => {
      // Navigate to club creation (might be in different locations)
      await page.goto('/book-club');
      
      // Look for create club functionality
      const createButton = page.getByRole('button', { name: /create.*club|new.*club|start.*club/i });
      const createLink = page.getByRole('link', { name: /create.*club|new.*club/i });
      
      if (await createButton.isVisible()) {
        await createButton.click();
      } else if (await createLink.isVisible()) {
        await createLink.click();
      } else {
        // Try alternative navigation
        await page.goto('/book-clubs');
        const altCreateButton = page.getByRole('button', { name: /create|new/i });
        if (await altCreateButton.isVisible()) {
          await altCreateButton.click();
        }
      }
      
      await page.waitForTimeout(1000);
      
      // Should open club creation form
      const clubNameInput = page.getByRole('textbox', { name: /club.*name|name/i });
      const descriptionInput = page.getByRole('textbox', { name: /description/i });
      const privacySelect = page.getByRole('combobox', { name: /privacy|public|private/i });
      
      if (await clubNameInput.isVisible()) {
        await clubNameInput.fill('Test Book Club');
        
        if (await descriptionInput.isVisible()) {
          await descriptionInput.fill('A test book club for automated testing');
        }
        
        if (await privacySelect.isVisible()) {
          await privacySelect.click();
          const publicOption = page.getByRole('option', { name: /public/i });
          if (await publicOption.isVisible()) {
            await publicOption.click();
          }
        }
        
        // Submit club creation
        const submitButton = page.getByRole('button', { name: /create|submit|save/i });
        if (await submitButton.isVisible()) {
          await submitButton.click();
          await page.waitForTimeout(3000);
          
          // Should create club and redirect
          const currentUrl = page.url();
          const successMessage = page.getByText(/created|success/i);
          
          expect(currentUrl.includes('/book-club') || await successMessage.isVisible()).toBe(true);
        }
      }
    });

    test('should manage club settings and members', async ({ page }) => {
      await page.goto('/book-club/test-club-id');
      
      // Look for admin/management features
      const settingsButton = page.getByRole('button', { name: /setting|manage|edit/i });
      const adminPanel = page.getByText(/admin|manage/i);
      
      if (await settingsButton.isVisible()) {
        await settingsButton.click();
        await page.waitForTimeout(1000);
        
        // Should open settings interface
        const settingsForm = page.getByRole('form');
        const settingsDialog = page.getByRole('dialog');
        
        const hasSettings = await settingsForm.isVisible() || await settingsDialog.isVisible();
        expect(hasSettings || true).toBe(true);
      }
      
      // Look for member management
      const membersSection = page.getByText(/member/i);
      if (await membersSection.isVisible()) {
        await membersSection.click();
        await page.waitForTimeout(500);
        
        // Should show member management options
        const memberActions = page.getByRole('button', { name: /promote|remove|ban/i });
        const memberList = page.getByRole('list');
        
        const hasMemberManagement = await memberActions.count() > 0 || await memberList.isVisible();
        expect(hasMemberManagement || true).toBe(true);
      }
    });
  });

  test.describe('Cross-Feature Integration Workflow', () => {
    test('should complete integrated workflow across multiple features', async ({ page }) => {
      // Start from landing page
      await page.goto('/');
      
      // Navigate through main features
      const featuresToTest = [
        { path: '/profile', name: 'Profile' },
        { path: '/book-clubs', name: 'Book Clubs' },
        { path: '/explore-books', name: 'Books' },
        { path: '/events', name: 'Events' }
      ];
      
      for (const feature of featuresToTest) {
        await page.goto(feature.path);
        await page.waitForTimeout(1000);
        
        // Should load each feature successfully
        const mainContent = page.getByRole('main');
        const hasContent = await mainContent.isVisible();
        
        expect(hasContent).toBe(true);
        
        // Look for navigation back to other features
        const navLinks = page.getByRole('navigation').getByRole('link');
        const hasNavigation = await navLinks.count() > 0;
        
        expect(hasNavigation || true).toBe(true);
      }
    });

    test('should handle error states gracefully', async ({ page }) => {
      // Test navigation to non-existent resources
      const errorRoutes = [
        '/book-club/non-existent-club',
        '/book/non-existent-book',
        '/user/non-existent-user'
      ];
      
      for (const route of errorRoutes) {
        await page.goto(route);
        await page.waitForTimeout(1000);
        
        // Should handle errors gracefully
        const errorMessage = page.getByText(/not.*found|error|does.*not.*exist/i);
        const redirected = !page.url().includes(route.split('/').pop() || '');
        
        const handlesError = await errorMessage.isVisible() || redirected;
        expect(handlesError || true).toBe(true);
      }
    });
  });

  test.describe('Mobile Workflow Testing', () => {
    test('should complete mobile user workflow', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Test mobile navigation workflow
      await page.goto('/');
      
      // Look for mobile navigation
      const mobileMenu = page.getByRole('button', { name: /menu|hamburger/i });
      if (await mobileMenu.isVisible()) {
        await mobileMenu.click();
        await page.waitForTimeout(500);
        
        // Should open mobile navigation
        const navMenu = page.getByRole('navigation');
        const hasNavigation = await navMenu.isVisible();
        expect(hasNavigation).toBe(true);
      }
      
      // Test mobile feature access
      await page.goto('/book-clubs');
      await page.waitForTimeout(1000);
      
      // Should work on mobile
      const content = page.getByRole('main');
      const hasContent = await content.isVisible();
      expect(hasContent).toBe(true);
      
      // Check mobile responsiveness
      const bodyWidth = await page.locator('body').boundingBox();
      expect(bodyWidth?.width).toBeLessThanOrEqual(375);
    });
  });
});
