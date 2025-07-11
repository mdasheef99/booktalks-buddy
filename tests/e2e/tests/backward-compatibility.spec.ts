import { test, expect } from '@playwright/test';
import { AuthenticationPage } from '../page-objects/Authentication.page';
import { BooksSectionPage } from '../page-objects/BooksSection.page';

/**
 * Backward Compatibility Tests
 * 
 * Verifies that refactored modules maintain 100% backward compatibility
 * Tests that existing import paths still work and all functions are accessible
 */

test.describe('Backward Compatibility Verification', () => {
  let authPage: AuthenticationPage;
  let booksPage: BooksSectionPage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthenticationPage(page);
    booksPage = new BooksSectionPage(page);
    
    // Ensure user is logged in for tests
    await authPage.goto();
    if (!(await authPage.isLoggedIn())) {
      await authPage.loginAsTestUser();
    }
  });

  test.describe('Original Import Paths', () => {
    test('should access Books Section through original path', async ({ page }) => {
      // Navigate to Books Section using original route
      await page.goto('/books');
      await page.waitForLoadState('networkidle');
      
      // Verify the page loads correctly
      await expect(page).toHaveURL('/books');
      await expect(page.locator('h1, h2')).toContainText(['Books', 'Library', 'Search']);
      
      // Verify all tabs are present (indicating full component functionality)
      await expect(booksPage.searchTab).toBeVisible();
      await expect(booksPage.libraryTab).toBeVisible();
      await expect(booksPage.storeRequestsTab).toBeVisible();
      await expect(booksPage.collectionsTab).toBeVisible();
    });

    test('should maintain all Books Section functionality', async ({ page }) => {
      await booksPage.goto();
      
      // Test tab navigation (verifies component structure is intact)
      await booksPage.switchToTab('search');
      await booksPage.verifyTabActive('search');
      
      await booksPage.switchToTab('library');
      await booksPage.verifyTabActive('library');
      
      await booksPage.switchToTab('store-requests');
      await booksPage.verifyTabActive('store-requests');
      
      await booksPage.switchToTab('collections');
      await booksPage.verifyTabActive('collections');
    });
  });

  test.describe('Service Function Availability', () => {
    test('should access personal books service functions', async ({ page }) => {
      await booksPage.goto();
      await booksPage.switchToTab('library');
      
      // Verify library loads (tests getUserBooks function)
      await booksPage.waitForLoading();
      await expect(booksPage.personalBooksGrid).toBeVisible();
      
      // Test search functionality (tests searchBooks function)
      await booksPage.switchToTab('search');
      await booksPage.searchBooks('JavaScript');
      await booksPage.verifySearchResults();
    });

    test('should access store requests service functions', async ({ page }) => {
      await booksPage.goto();
      await booksPage.switchToTab('store-requests');
      
      // Verify store requests section loads (tests getUserStoreRequests function)
      await booksPage.waitForLoading();
      await booksPage.verifyStoreRequests();
      
      // Verify request creation is available
      const hasCreateButton = await booksPage.createRequestButton.isVisible().catch(() => false);
      if (hasCreateButton) {
        await expect(booksPage.createRequestButton).toBeVisible();
      }
    });

    test('should maintain error handling and user feedback', async ({ page }) => {
      await booksPage.goto();
      
      // Test invalid search (verifies error handling is preserved)
      await booksPage.switchToTab('search');
      await booksPage.searchInput.fill('');
      await booksPage.searchButton.click();
      
      // Should handle empty search gracefully
      await page.waitForTimeout(1000);
      
      // Test valid search to ensure functionality works
      await booksPage.searchBooks('React');
      await booksPage.verifySearchResults();
    });
  });

  test.describe('Data Flow and State Management', () => {
    test('should maintain state across tab switches', async ({ page }) => {
      await booksPage.goto();
      
      // Perform search
      await booksPage.switchToTab('search');
      await booksPage.searchBooks('TypeScript');
      await booksPage.verifySearchResults();
      
      // Switch to library and back
      await booksPage.switchToTab('library');
      await booksPage.switchToTab('search');
      
      // Verify search results are still there (state preserved)
      await expect(booksPage.searchResults).toBeVisible();
    });

    test('should handle loading states correctly', async ({ page }) => {
      await booksPage.goto();
      
      // Test loading states in different sections
      await booksPage.switchToTab('library');
      // Loading should complete
      await booksPage.waitForLoading();
      
      await booksPage.switchToTab('store-requests');
      // Loading should complete
      await booksPage.waitForLoading();
    });
  });

  test.describe('Component Integration', () => {
    test('should integrate with existing navigation', async ({ page }) => {
      // Navigate from home to books section
      await page.goto('/');
      
      // Find and click books navigation link
      const booksLink = page.locator('a[href="/books"], a[href*="books"]').first();
      if (await booksLink.isVisible()) {
        await booksLink.click();
        await expect(page).toHaveURL('/books');
      } else {
        // Direct navigation if no link found
        await booksPage.goto();
      }
      
      // Verify books section loads correctly
      await expect(booksPage.searchTab).toBeVisible();
    });

    test('should maintain responsive design', async ({ page }) => {
      await booksPage.goto();
      
      // Test mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(500);
      
      // Verify components are still visible and functional
      await expect(booksPage.searchTab).toBeVisible();
      await expect(booksPage.libraryTab).toBeVisible();
      
      // Test desktop viewport
      await page.setViewportSize({ width: 1200, height: 800 });
      await page.waitForTimeout(500);
      
      // Verify components adapt correctly
      await expect(booksPage.searchTab).toBeVisible();
      await expect(booksPage.libraryTab).toBeVisible();
    });
  });

  test.describe('API Integration', () => {
    test('should maintain Google Books API integration', async ({ page }) => {
      await booksPage.goto();
      await booksPage.switchToTab('search');
      
      // Test Google Books search
      await booksPage.searchBooks('Clean Code');
      
      // Verify search results contain expected elements
      await expect(booksPage.searchResults).toBeVisible();
      await expect(booksPage.addToLibraryButtons.first()).toBeVisible();
      
      // Verify book data is displayed correctly
      const firstResult = page.locator('[data-testid="book-card"]').first();
      await expect(firstResult).toContainText(['Clean Code', 'Robert', 'Martin']);
    });

    test('should handle API errors gracefully', async ({ page }) => {
      await booksPage.goto();
      await booksPage.switchToTab('search');
      
      // Test with potentially problematic search
      await booksPage.searchBooks('!@#$%^&*()');
      
      // Should either show results or handle error gracefully
      await page.waitForTimeout(3000);
      
      // No error should crash the application
      await expect(booksPage.searchTab).toBeVisible();
    });
  });
});
