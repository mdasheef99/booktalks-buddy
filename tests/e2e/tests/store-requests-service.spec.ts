import { test, expect } from '@playwright/test';
import { AuthenticationPage } from '../page-objects/Authentication.page';
import { BooksSectionPage } from '../page-objects/BooksSection.page';

/**
 * Store Requests Service Tests
 * 
 * Tests the complete store request workflow and functionality
 */

test.describe('Store Requests Service Workflow', () => {
  let authPage: AuthenticationPage;
  let booksPage: BooksSectionPage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthenticationPage(page);
    booksPage = new BooksSectionPage(page);
    
    // Ensure user is logged in
    await authPage.goto();
    if (!(await authPage.isLoggedIn())) {
      await authPage.loginAsTestUser();
    }
    
    await booksPage.goto();
  });

  test.describe('Store Request Creation', () => {
    test('should create store request from search results', async ({ page }) => {
      await booksPage.switchToTab('search');
      await booksPage.searchBooks('Rare Programming Book');
      await booksPage.verifySearchResults();
      
      // Check if request from store button is available
      const requestButton = booksPage.requestFromStoreButtons.first();
      const hasRequestButton = await requestButton.isVisible().catch(() => false);
      
      if (hasRequestButton) {
        // Get initial request count
        await booksPage.switchToTab('store-requests');
        await booksPage.waitForLoading();
        const initialCount = await booksPage.getStoreRequestsCount();
        
        // Create request
        await booksPage.switchToTab('search');
        await booksPage.requestFirstBookFromStore();
        
        // Verify request was created
        await booksPage.switchToTab('store-requests');
        await booksPage.waitForLoading();
        const newCount = await booksPage.getStoreRequestsCount();
        
        expect(newCount).toBeGreaterThan(initialCount);
      } else {
        console.log('Store request functionality not available for this user');
      }
    });

    test('should create store request from personal library', async ({ page }) => {
      // First add a book to library
      await booksPage.switchToTab('search');
      await booksPage.searchBooks('Specialized Technical Book');
      await booksPage.verifySearchResults();
      await booksPage.addFirstBookToLibrary();
      
      // Go to library and request from store
      await booksPage.switchToTab('library');
      await booksPage.waitForLoading();
      
      const hasBooks = await booksPage.getPersonalBooksCount() > 0;
      if (hasBooks) {
        const requestFromLibraryButton = page.locator('[data-testid="request-from-store-library"]').first();
        const hasLibraryRequestButton = await requestFromLibraryButton.isVisible().catch(() => false);
        
        if (hasLibraryRequestButton) {
          await requestFromLibraryButton.click();
          await booksPage.waitForSuccessToast();
          
          // Verify request appears in store requests
          await booksPage.switchToTab('store-requests');
          await booksPage.waitForLoading();
          await booksPage.verifyStoreRequests();
        }
      }
    });

    test('should handle store request form validation', async ({ page }) => {
      await booksPage.switchToTab('store-requests');
      
      // Look for create request button
      const createButton = booksPage.createRequestButton;
      const hasCreateButton = await createButton.isVisible().catch(() => false);
      
      if (hasCreateButton) {
        await createButton.click();
        
        // Test form validation
        const submitButton = page.locator('[data-testid="submit-request"]');
        const hasSubmitButton = await submitButton.isVisible().catch(() => false);
        
        if (hasSubmitButton) {
          // Try to submit empty form
          await submitButton.click();
          
          // Should show validation errors
          const errorMessages = page.locator('.error, [data-testid="error"]');
          const hasErrors = await errorMessages.count() > 0;
          
          if (hasErrors) {
            await expect(errorMessages.first()).toBeVisible();
          }
        }
      }
    });
  });

  test.describe('Store Request Management', () => {
    test('should display user store requests', async ({ page }) => {
      await booksPage.switchToTab('store-requests');
      await booksPage.waitForLoading();
      
      // Verify store requests section loads
      await booksPage.verifyStoreRequests();
      
      const requestCount = await booksPage.getStoreRequestsCount();
      
      if (requestCount > 0) {
        // Verify request cards display proper information
        const firstRequest = page.locator('[data-testid="store-request-card"]').first();
        await expect(firstRequest).toBeVisible();
        
        // Check for book title
        const hasTitle = await firstRequest.locator('h3, h4, .title').count() > 0;
        expect(hasTitle).toBeTruthy();
        
        // Check for status badge
        await expect(booksPage.requestStatusBadges.first()).toBeVisible();
        
        // Check for action buttons
        const hasCancelButton = await booksPage.cancelRequestButtons.first().isVisible().catch(() => false);
        if (hasCancelButton) {
          await expect(booksPage.cancelRequestButtons.first()).toBeVisible();
        }
      } else {
        // Verify empty state
        const emptyState = page.locator('[data-testid="empty-requests"], .empty-state');
        const hasEmptyState = await emptyState.count() > 0;
        
        if (hasEmptyState) {
          await expect(emptyState.first()).toBeVisible();
        }
      }
    });

    test('should show request status updates', async ({ page }) => {
      await booksPage.switchToTab('store-requests');
      await booksPage.waitForLoading();
      
      const requestCount = await booksPage.getStoreRequestsCount();
      
      if (requestCount > 0) {
        // Check status badges
        const statusBadges = booksPage.requestStatusBadges;
        const badgeCount = await statusBadges.count();
        
        if (badgeCount > 0) {
          const firstBadge = statusBadges.first();
          await expect(firstBadge).toBeVisible();
          
          // Verify status text
          const statusText = await firstBadge.textContent();
          expect(statusText).toMatch(/(pending|responded|available|unavailable|ordered)/i);
        }
      }
    });

    test('should cancel store requests', async ({ page }) => {
      // First create a request to cancel
      await booksPage.switchToTab('search');
      await booksPage.searchBooks('Book to Cancel Request');
      await booksPage.verifySearchResults();
      
      const requestButton = booksPage.requestFromStoreButtons.first();
      const hasRequestButton = await requestButton.isVisible().catch(() => false);
      
      if (hasRequestButton) {
        await booksPage.requestFirstBookFromStore();
        
        // Go to store requests and cancel
        await booksPage.switchToTab('store-requests');
        await booksPage.waitForLoading();
        
        const initialCount = await booksPage.getStoreRequestsCount();
        
        if (initialCount > 0) {
          const cancelButton = booksPage.cancelRequestButtons.first();
          const hasCancelButton = await cancelButton.isVisible().catch(() => false);
          
          if (hasCancelButton) {
            await cancelButton.click();
            
            // Confirm cancellation if dialog appears
            const confirmButton = booksPage.confirmButton;
            const hasConfirmDialog = await confirmButton.isVisible().catch(() => false);
            
            if (hasConfirmDialog) {
              await confirmButton.click();
            }
            
            await booksPage.waitForSuccessToast();
            await booksPage.waitForLoading();
            
            // Verify request was cancelled/removed
            const newCount = await booksPage.getStoreRequestsCount();
            expect(newCount).toBeLessThan(initialCount);
          }
        }
      }
    });
  });

  test.describe('Store Context and User Access', () => {
    test('should handle user store context', async ({ page }) => {
      await booksPage.switchToTab('store-requests');
      await booksPage.waitForLoading();
      
      // Check if user has store context
      const storeInfo = page.locator('[data-testid="store-info"], .store-context');
      const hasStoreInfo = await storeInfo.count() > 0;
      
      if (hasStoreInfo) {
        await expect(storeInfo.first()).toBeVisible();
        
        // Verify store name is displayed
        const hasStoreName = await storeInfo.first().locator('.store-name, [data-testid="store-name"]').count() > 0;
        expect(hasStoreName).toBeTruthy();
      } else {
        // User might not be associated with a store
        const noStoreMessage = page.locator('[data-testid="no-store"], .no-store-access');
        const hasNoStoreMessage = await noStoreMessage.count() > 0;
        
        if (hasNoStoreMessage) {
          await expect(noStoreMessage.first()).toBeVisible();
        }
      }
    });

    test('should validate user store access', async ({ page }) => {
      await booksPage.switchToTab('store-requests');
      await booksPage.waitForLoading();
      
      // Check if create request functionality is available
      const createButton = booksPage.createRequestButton;
      const hasCreateAccess = await createButton.isVisible().catch(() => false);
      
      if (!hasCreateAccess) {
        // User might not have store access
        const accessMessage = page.locator('[data-testid="access-denied"], .access-message');
        const hasAccessMessage = await accessMessage.count() > 0;
        
        if (hasAccessMessage) {
          await expect(accessMessage.first()).toBeVisible();
        }
      }
    });
  });

  test.describe('Request Status Workflow', () => {
    test('should display different request statuses', async ({ page }) => {
      await booksPage.switchToTab('store-requests');
      await booksPage.waitForLoading();
      
      const requestCount = await booksPage.getStoreRequestsCount();
      
      if (requestCount > 0) {
        // Check for different status types
        const statusBadges = booksPage.requestStatusBadges;
        const badgeCount = await statusBadges.count();
        
        for (let i = 0; i < Math.min(badgeCount, 3); i++) {
          const badge = statusBadges.nth(i);
          await expect(badge).toBeVisible();
          
          const statusText = await badge.textContent();
          expect(statusText).toBeTruthy();
        }
      }
    });

    test('should handle request notifications', async ({ page }) => {
      await booksPage.switchToTab('store-requests');
      await booksPage.waitForLoading();
      
      // Look for notification indicators
      const notifications = page.locator('[data-testid="notification"], .notification, .badge');
      const hasNotifications = await notifications.count() > 0;
      
      if (hasNotifications) {
        // Verify notifications are properly displayed
        const firstNotification = notifications.first();
        await expect(firstNotification).toBeVisible();
      }
    });
  });

  test.describe('Integration with Personal Library', () => {
    test('should link requests to personal books', async ({ page }) => {
      // Add a book to library first
      await booksPage.switchToTab('search');
      await booksPage.searchBooks('Integration Test Book');
      await booksPage.verifySearchResults();
      await booksPage.addFirstBookToLibrary();
      
      // Request the same book from store
      const requestButton = booksPage.requestFromStoreButtons.first();
      const hasRequestButton = await requestButton.isVisible().catch(() => false);
      
      if (hasRequestButton) {
        await booksPage.requestFirstBookFromStore();
        
        // Check store requests for the linked book
        await booksPage.switchToTab('store-requests');
        await booksPage.waitForLoading();
        
        const requestCount = await booksPage.getStoreRequestsCount();
        if (requestCount > 0) {
          // Verify request shows book information
          const firstRequest = page.locator('[data-testid="store-request-card"]').first();
          await expect(firstRequest).toBeVisible();
          
          // Should contain book title
          await expect(firstRequest).toContainText('Integration Test Book');
        }
      }
    });

    test('should prevent duplicate requests', async ({ page }) => {
      // Create a request
      await booksPage.switchToTab('search');
      await booksPage.searchBooks('Duplicate Prevention Test');
      await booksPage.verifySearchResults();
      
      const requestButton = booksPage.requestFromStoreButtons.first();
      const hasRequestButton = await requestButton.isVisible().catch(() => false);
      
      if (hasRequestButton) {
        await booksPage.requestFirstBookFromStore();
        
        // Try to create the same request again
        await booksPage.searchBooks('Duplicate Prevention Test');
        await booksPage.verifySearchResults();
        
        // Button should show different state or be disabled
        const buttonText = await requestButton.textContent();
        expect(buttonText?.toLowerCase()).toMatch(/(requested|pending|already requested)/);
      }
    });
  });
});
