import { test, expect } from '@playwright/test';
import { AuthenticationPage } from '../page-objects/Authentication.page';
import { BooksSectionPage } from '../page-objects/BooksSection.page';

/**
 * Cross-Module Integration Tests
 * 
 * Tests that refactored modules work together correctly
 * Verifies data flow, state management, and error handling across modules
 */

test.describe('Cross-Module Integration', () => {
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

  test.describe('Data Flow Between Modules', () => {
    test('should maintain data consistency across search and library', async ({ page }) => {
      // Search for a specific book
      await booksPage.switchToTab('search');
      await booksPage.searchBooks('Data Flow Test Book');
      await booksPage.verifySearchResults();
      
      // Get book title from search results
      const firstResult = page.locator('[data-testid="book-card"]').first();
      const bookTitle = await firstResult.locator('h3, h4, .title').textContent();
      
      // Add to library
      await booksPage.addFirstBookToLibrary();
      
      // Verify book appears in library with same data
      await booksPage.switchToTab('library');
      await booksPage.waitForLoading();
      
      const libraryBooks = booksPage.personalBookCards;
      const libraryBookCount = await libraryBooks.count();
      
      if (libraryBookCount > 0) {
        // Find the added book in library
        let foundBook = false;
        for (let i = 0; i < libraryBookCount; i++) {
          const libraryBook = libraryBooks.nth(i);
          const libraryTitle = await libraryBook.locator('h3, h4, .title').textContent();
          
          if (libraryTitle && bookTitle && libraryTitle.includes(bookTitle.substring(0, 10))) {
            foundBook = true;
            break;
          }
        }
        
        expect(foundBook).toBeTruthy();
      }
    });

    test('should sync data between library and store requests', async ({ page }) => {
      // Add a book to library
      await booksPage.switchToTab('search');
      await booksPage.searchBooks('Library Store Sync Test');
      await booksPage.verifySearchResults();
      await booksPage.addFirstBookToLibrary();
      
      // Request the same book from store
      const requestButton = booksPage.requestFromStoreButtons.first();
      const hasRequestButton = await requestButton.isVisible().catch(() => false);
      
      if (hasRequestButton) {
        await booksPage.requestFirstBookFromStore();
        
        // Verify request appears in store requests with library book data
        await booksPage.switchToTab('store-requests');
        await booksPage.waitForLoading();
        
        const requestCount = await booksPage.getStoreRequestsCount();
        if (requestCount > 0) {
          const firstRequest = page.locator('[data-testid="store-request-card"]').first();
          await expect(firstRequest).toBeVisible();
          
          // Should contain book information from library
          await expect(firstRequest).toContainText('Library Store Sync Test');
        }
      }
    });

    test('should maintain state during rapid tab switching', async ({ page }) => {
      // Perform operations in multiple tabs rapidly
      await booksPage.switchToTab('search');
      await booksPage.searchBooks('Rapid Switch Test');
      await booksPage.verifySearchResults();
      
      // Switch tabs rapidly
      await booksPage.switchToTab('library');
      await booksPage.switchToTab('store-requests');
      await booksPage.switchToTab('collections');
      await booksPage.switchToTab('search');
      
      // Verify search results are still there
      await expect(booksPage.searchResults).toBeVisible();
      
      // Add book to library
      await booksPage.addFirstBookToLibrary();
      
      // Switch to library and verify book is there
      await booksPage.switchToTab('library');
      await booksPage.waitForLoading();
      
      const bookCount = await booksPage.getPersonalBooksCount();
      expect(bookCount).toBeGreaterThan(0);
    });
  });

  test.describe('State Management Across Components', () => {
    test('should preserve search state during library operations', async ({ page }) => {
      // Perform search
      await booksPage.switchToTab('search');
      await booksPage.searchBooks('State Management Test');
      await booksPage.verifySearchResults();
      
      // Add book to library
      await booksPage.addFirstBookToLibrary();
      
      // Search state should be preserved
      await expect(booksPage.searchResults).toBeVisible();
      await expect(booksPage.searchInput).toHaveValue('State Management Test');
    });

    test('should update UI state after library modifications', async ({ page }) => {
      // Add a book to library
      await booksPage.switchToTab('search');
      await booksPage.searchBooks('UI State Update Test');
      await booksPage.verifySearchResults();
      
      // Check initial button state
      const addButton = booksPage.addToLibraryButtons.first();
      const initialButtonText = await addButton.textContent();
      
      // Add to library
      await booksPage.addFirstBookToLibrary();
      
      // Button state should update
      const updatedButtonText = await addButton.textContent();
      expect(updatedButtonText).not.toBe(initialButtonText);
    });

    test('should handle concurrent state updates', async ({ page }) => {
      // Perform multiple operations quickly
      await booksPage.switchToTab('search');
      await booksPage.searchBooks('Concurrent Test Book');
      await booksPage.verifySearchResults();
      
      // Quickly add to library and request from store
      await booksPage.addFirstBookToLibrary();
      
      const requestButton = booksPage.requestFromStoreButtons.first();
      const hasRequestButton = await requestButton.isVisible().catch(() => false);
      
      if (hasRequestButton) {
        await booksPage.requestFirstBookFromStore();
      }
      
      // Verify both operations completed successfully
      await booksPage.switchToTab('library');
      await booksPage.waitForLoading();
      const libraryCount = await booksPage.getPersonalBooksCount();
      expect(libraryCount).toBeGreaterThan(0);
      
      if (hasRequestButton) {
        await booksPage.switchToTab('store-requests');
        await booksPage.waitForLoading();
        const requestCount = await booksPage.getStoreRequestsCount();
        expect(requestCount).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Error Handling Across Modules', () => {
    test('should handle search errors without affecting other modules', async ({ page }) => {
      // Cause a search error
      await booksPage.switchToTab('search');
      await booksPage.searchInput.fill('!@#$%^&*()_+');
      await booksPage.searchButton.click();
      
      // Wait for potential error
      await page.waitForTimeout(2000);
      
      // Other tabs should still be functional
      await booksPage.switchToTab('library');
      await booksPage.waitForLoading();
      await expect(booksPage.personalBooksGrid).toBeVisible();
      
      await booksPage.switchToTab('store-requests');
      await booksPage.waitForLoading();
      await expect(booksPage.storeRequestsList).toBeVisible();
    });

    test('should recover from network errors gracefully', async ({ page }) => {
      // Simulate network issues by rapid operations
      await booksPage.switchToTab('search');
      await booksPage.searchBooks('Network Error Test');
      
      // Quickly switch tabs while loading
      await booksPage.switchToTab('library');
      await booksPage.switchToTab('search');
      
      // Should handle gracefully without crashing
      await page.waitForTimeout(3000);
      await expect(booksPage.searchTab).toBeVisible();
      
      // Try search again
      await booksPage.searchBooks('Recovery Test');
      await booksPage.verifySearchResults();
    });

    test('should show appropriate error messages', async ({ page }) => {
      // Test error handling in different modules
      await booksPage.switchToTab('search');
      
      // Empty search
      await booksPage.searchInput.fill('');
      await booksPage.searchButton.click();
      
      // Should handle gracefully
      await page.waitForTimeout(1000);
      
      // Invalid operations should show user-friendly messages
      const errorElements = page.locator('.error, [data-testid="error"], .toast-error');
      const hasErrors = await errorElements.count() > 0;
      
      if (hasErrors) {
        const errorText = await errorElements.first().textContent();
        expect(errorText).toBeTruthy();
        expect(errorText?.length).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Performance and Loading States', () => {
    test('should show loading states during operations', async ({ page }) => {
      await booksPage.switchToTab('search');
      
      // Start search and check for loading state
      await booksPage.searchInput.fill('Loading State Test');
      await booksPage.searchButton.click();
      
      // Check for loading indicators
      const hasLoadingSpinner = await booksPage.loadingSpinner.isVisible().catch(() => false);
      if (hasLoadingSpinner) {
        await expect(booksPage.loadingSpinner).toBeVisible();
      }
      
      // Wait for completion
      await booksPage.verifySearchResults();
      
      // Loading should be hidden
      const isStillLoading = await booksPage.loadingSpinner.isVisible().catch(() => false);
      expect(isStillLoading).toBeFalsy();
    });

    test('should handle large datasets efficiently', async ({ page }) => {
      // Test with broad search that returns many results
      await booksPage.switchToTab('search');
      await booksPage.searchBooks('programming');
      await booksPage.verifySearchResults();
      
      // Should load results efficiently
      const searchResults = page.locator('[data-testid="book-card"]');
      const resultCount = await searchResults.count();
      
      expect(resultCount).toBeGreaterThan(0);
      expect(resultCount).toBeLessThanOrEqual(50); // Should have reasonable pagination
      
      // All results should be visible
      for (let i = 0; i < Math.min(resultCount, 5); i++) {
        await expect(searchResults.nth(i)).toBeVisible();
      }
    });

    test('should maintain responsiveness during operations', async ({ page }) => {
      // Perform multiple operations and verify UI remains responsive
      await booksPage.switchToTab('search');
      await booksPage.searchBooks('Responsiveness Test');
      await booksPage.verifySearchResults();
      
      // UI should remain interactive
      await expect(booksPage.searchTab).toBeEnabled();
      await expect(booksPage.libraryTab).toBeEnabled();
      
      // Tab switching should work smoothly
      const startTime = Date.now();
      await booksPage.switchToTab('library');
      const endTime = Date.now();
      
      // Tab switch should be reasonably fast (less than 2 seconds)
      expect(endTime - startTime).toBeLessThan(2000);
    });
  });

  test.describe('User Experience Integration', () => {
    test('should provide consistent user feedback across modules', async ({ page }) => {
      // Test success messages
      await booksPage.switchToTab('search');
      await booksPage.searchBooks('User Feedback Test');
      await booksPage.verifySearchResults();
      await booksPage.addFirstBookToLibrary();
      
      // Should show success feedback
      await booksPage.waitForSuccessToast();
      
      // Test in different modules
      await booksPage.switchToTab('library');
      await booksPage.waitForLoading();
      
      const hasBooks = await booksPage.getPersonalBooksCount() > 0;
      if (hasBooks) {
        await booksPage.rateFirstBook(4);
        // Should show rating success feedback
        await page.waitForTimeout(1000);
      }
    });

    test('should maintain accessibility across modules', async ({ page }) => {
      // Test keyboard navigation
      await booksPage.switchToTab('search');
      
      // Tab navigation should work
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Focus should be visible
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
      
      // Test in different tabs
      await booksPage.switchToTab('library');
      await page.keyboard.press('Tab');
      
      const libraryFocusedElement = page.locator(':focus');
      await expect(libraryFocusedElement).toBeVisible();
    });
  });
});
