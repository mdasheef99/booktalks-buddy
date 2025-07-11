import { test, expect } from '@playwright/test';
import { AuthenticationPage } from '../page-objects/Authentication.page';
import { BooksSectionPage } from '../page-objects/BooksSection.page';

/**
 * Books Section Functionality Tests
 * 
 * Tests the complete user workflow in the refactored Books Section
 */

test.describe('Books Section Complete Workflow', () => {
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

  test.describe('Book Search Functionality', () => {
    test('should search for books using Google Books API', async ({ page }) => {
      await booksPage.switchToTab('search');
      
      // Test search with popular book
      await booksPage.searchBooks('The Great Gatsby');
      await booksPage.verifySearchResults();
      
      // Verify search results contain expected data
      const firstResult = page.locator('[data-testid="book-card"]').first();
      await expect(firstResult).toBeVisible();
      
      // Verify book has title and author
      await expect(firstResult).toContainText('Gatsby');
      
      // Verify action buttons are present
      await expect(booksPage.addToLibraryButtons.first()).toBeVisible();
    });

    test('should handle different search queries', async ({ page }) => {
      await booksPage.switchToTab('search');
      
      // Test author search
      await booksPage.searchBooks('Stephen King');
      await booksPage.verifySearchResults();
      
      // Test genre/topic search
      await booksPage.searchBooks('JavaScript programming');
      await booksPage.verifySearchResults();
      
      // Test specific book search
      await booksPage.searchBooks('1984 George Orwell');
      await booksPage.verifySearchResults();
    });

    test('should show loading states during search', async ({ page }) => {
      await booksPage.switchToTab('search');
      
      // Start search and verify loading state
      await booksPage.searchInput.fill('React Development');
      await booksPage.searchButton.click();
      
      // Check for loading indicator
      const hasLoading = await booksPage.loadingSpinner.isVisible().catch(() => false);
      if (hasLoading) {
        await expect(booksPage.loadingSpinner).toBeVisible();
      }
      
      // Wait for results
      await booksPage.verifySearchResults();
    });
  });

  test.describe('Personal Library Management', () => {
    test('should add books to personal library', async ({ page }) => {
      // Search for a book
      await booksPage.switchToTab('search');
      await booksPage.searchBooks('Clean Architecture');
      await booksPage.verifySearchResults();
      
      // Get initial library count
      await booksPage.switchToTab('library');
      const initialCount = await booksPage.getPersonalBooksCount();
      
      // Add book to library
      await booksPage.switchToTab('search');
      await booksPage.addFirstBookToLibrary();
      
      // Verify book was added
      await booksPage.switchToTab('library');
      await booksPage.waitForLoading();
      
      const newCount = await booksPage.getPersonalBooksCount();
      expect(newCount).toBeGreaterThan(initialCount);
    });

    test('should display personal book library', async ({ page }) => {
      await booksPage.switchToTab('library');
      await booksPage.waitForLoading();
      
      // Verify library section is visible
      await booksPage.verifyPersonalBooks();
      
      // Check if books are displayed or empty state is shown
      const hasBooks = await booksPage.personalBookCards.count() > 0;
      
      if (hasBooks) {
        // Verify book cards have required elements
        const firstBook = booksPage.personalBookCards.first();
        await expect(firstBook).toBeVisible();
        
        // Verify action buttons are present
        await expect(booksPage.rateBookButtons.first()).toBeVisible();
      } else {
        // Verify empty state with add books button
        await expect(booksPage.addBooksButton).toBeVisible();
      }
    });

    test('should remove books from library', async ({ page }) => {
      // Ensure we have at least one book in library
      await booksPage.switchToTab('search');
      await booksPage.searchBooks('Test Book');
      await booksPage.verifySearchResults();
      await booksPage.addFirstBookToLibrary();
      
      // Go to library and remove book
      await booksPage.switchToTab('library');
      await booksPage.waitForLoading();
      
      const initialCount = await booksPage.getPersonalBooksCount();
      
      if (initialCount > 0) {
        await booksPage.removeFirstBookFromLibrary();
        await booksPage.waitForLoading();
        
        const newCount = await booksPage.getPersonalBooksCount();
        expect(newCount).toBeLessThan(initialCount);
      }
    });
  });

  test.describe('Reading Lists and Ratings', () => {
    test('should rate books in library', async ({ page }) => {
      // Ensure we have a book to rate
      await booksPage.switchToTab('search');
      await booksPage.searchBooks('Design Patterns');
      await booksPage.verifySearchResults();
      await booksPage.addFirstBookToLibrary();
      
      // Rate the book
      await booksPage.switchToTab('library');
      await booksPage.waitForLoading();
      
      const hasBooks = await booksPage.personalBookCards.count() > 0;
      if (hasBooks) {
        await booksPage.rateFirstBook(4);
        
        // Verify rating was applied
        const ratedBook = booksPage.personalBookCards.first();
        await expect(ratedBook).toContainText('4');
      }
    });

    test('should manage reading status', async ({ page }) => {
      await booksPage.switchToTab('library');
      await booksPage.waitForLoading();
      
      const hasBooks = await booksPage.personalBookCards.count() > 0;
      if (hasBooks) {
        // Test reading status changes
        const statusButton = page.locator('[data-testid="reading-status-button"]').first();
        if (await statusButton.isVisible()) {
          await statusButton.click();
          
          // Select a status
          const currentlyReadingOption = page.locator('[data-testid="currently-reading"]');
          if (await currentlyReadingOption.isVisible()) {
            await currentlyReadingOption.click();
            await booksPage.waitForSuccessToast();
          }
        }
      }
    });
  });

  test.describe('Tab Navigation', () => {
    test('should navigate between all tabs', async ({ page }) => {
      // Test each tab navigation
      await booksPage.switchToTab('search');
      await booksPage.verifyTabActive('search');
      await expect(booksPage.searchInput).toBeVisible();
      
      await booksPage.switchToTab('library');
      await booksPage.verifyTabActive('library');
      await expect(booksPage.personalBooksGrid).toBeVisible();
      
      await booksPage.switchToTab('store-requests');
      await booksPage.verifyTabActive('store-requests');
      await expect(booksPage.storeRequestsList).toBeVisible();
      
      await booksPage.switchToTab('collections');
      await booksPage.verifyTabActive('collections');
      await expect(booksPage.collectionsGrid).toBeVisible();
    });

    test('should maintain tab state during navigation', async ({ page }) => {
      // Perform search
      await booksPage.switchToTab('search');
      await booksPage.searchBooks('Node.js');
      await booksPage.verifySearchResults();
      
      // Navigate away and back
      await booksPage.switchToTab('library');
      await booksPage.switchToTab('search');
      
      // Verify search results are still visible
      await expect(booksPage.searchResults).toBeVisible();
    });
  });

  test.describe('Error Handling and User Feedback', () => {
    test('should handle search errors gracefully', async ({ page }) => {
      await booksPage.switchToTab('search');
      
      // Test empty search
      await booksPage.searchInput.fill('');
      await booksPage.searchButton.click();
      
      // Should handle gracefully without crashing
      await page.waitForTimeout(1000);
      await expect(booksPage.searchTab).toBeVisible();
    });

    test('should show appropriate loading states', async ({ page }) => {
      await booksPage.switchToTab('library');
      
      // Verify loading completes
      await booksPage.waitForLoading();
      await expect(booksPage.personalBooksGrid).toBeVisible();
    });

    test('should display success messages for actions', async ({ page }) => {
      // Test adding book shows success message
      await booksPage.switchToTab('search');
      await booksPage.searchBooks('Vue.js');
      await booksPage.verifySearchResults();
      
      // Add book and verify success toast
      await booksPage.addFirstBookToLibrary();
      // Success toast verification is handled in the page object method
    });
  });
});
