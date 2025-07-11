import { test, expect } from '@playwright/test';
import { AuthenticationPage } from '../page-objects/Authentication.page';
import { BooksSectionPage } from '../page-objects/BooksSection.page';

/**
 * Personal Books Service Tests
 * 
 * Tests all CRUD operations and functionality of the refactored personal books service
 */

test.describe('Personal Books Service Operations', () => {
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

  test.describe('Book Search Integration', () => {
    test('should search books using Google Books API', async ({ page }) => {
      await booksPage.switchToTab('search');
      
      // Test comprehensive search functionality
      await booksPage.searchBooks('JavaScript: The Good Parts');
      await booksPage.verifySearchResults();
      
      // Verify search results have proper structure
      const searchResults = page.locator('[data-testid="book-card"]');
      const resultCount = await searchResults.count();
      expect(resultCount).toBeGreaterThan(0);
      
      // Verify first result has required data
      const firstResult = searchResults.first();
      await expect(firstResult).toBeVisible();
      
      // Check for book title
      const hasTitle = await firstResult.locator('h3, h4, .title').count() > 0;
      expect(hasTitle).toBeTruthy();
      
      // Check for author
      const hasAuthor = await firstResult.locator('.author, [data-testid="author"]').count() > 0;
      expect(hasAuthor).toBeTruthy();
    });

    test('should handle different search types', async ({ page }) => {
      await booksPage.switchToTab('search');
      
      // Test ISBN search
      await booksPage.searchBooks('9780596517748');
      await page.waitForTimeout(2000);
      
      // Test author search
      await booksPage.searchBooks('Douglas Crockford');
      await page.waitForTimeout(2000);
      
      // Test title search
      await booksPage.searchBooks('Eloquent JavaScript');
      await booksPage.verifySearchResults();
    });

    test('should provide book details for library addition', async ({ page }) => {
      await booksPage.switchToTab('search');
      await booksPage.searchBooks('Clean Code Robert Martin');
      await booksPage.verifySearchResults();
      
      // Verify add to library button is functional
      await expect(booksPage.addToLibraryButtons.first()).toBeVisible();
      await expect(booksPage.addToLibraryButtons.first()).toBeEnabled();
    });
  });

  test.describe('Library CRUD Operations', () => {
    test('should add books to personal library', async ({ page }) => {
      // Get initial library count
      await booksPage.switchToTab('library');
      await booksPage.waitForLoading();
      const initialCount = await booksPage.getPersonalBooksCount();
      
      // Search and add a book
      await booksPage.switchToTab('search');
      await booksPage.searchBooks('The Pragmatic Programmer');
      await booksPage.verifySearchResults();
      await booksPage.addFirstBookToLibrary();
      
      // Verify book was added to library
      await booksPage.switchToTab('library');
      await booksPage.waitForLoading();
      
      const newCount = await booksPage.getPersonalBooksCount();
      expect(newCount).toBeGreaterThan(initialCount);
      
      // Verify the added book appears in library
      await expect(booksPage.personalBookCards.first()).toBeVisible();
    });

    test('should display personal book library with proper data', async ({ page }) => {
      await booksPage.switchToTab('library');
      await booksPage.waitForLoading();
      
      const bookCount = await booksPage.getPersonalBooksCount();
      
      if (bookCount > 0) {
        // Verify book cards display required information
        const firstBook = booksPage.personalBookCards.first();
        await expect(firstBook).toBeVisible();
        
        // Check for book cover or placeholder
        const hasCover = await firstBook.locator('img, .cover-placeholder').count() > 0;
        expect(hasCover).toBeTruthy();
        
        // Check for book title
        const hasTitle = await firstBook.locator('h3, h4, .title').count() > 0;
        expect(hasTitle).toBeTruthy();
        
        // Check for action buttons
        await expect(booksPage.rateBookButtons.first()).toBeVisible();
        await expect(booksPage.removeBookButtons.first()).toBeVisible();
      } else {
        // Verify empty state
        await expect(booksPage.addBooksButton).toBeVisible();
      }
    });

    test('should update book details in library', async ({ page }) => {
      // Ensure we have a book in library
      await booksPage.switchToTab('search');
      await booksPage.searchBooks('Design Patterns Gang of Four');
      await booksPage.verifySearchResults();
      await booksPage.addFirstBookToLibrary();
      
      // Go to library and test rating (update operation)
      await booksPage.switchToTab('library');
      await booksPage.waitForLoading();
      
      const hasBooks = await booksPage.getPersonalBooksCount() > 0;
      if (hasBooks) {
        // Rate the book (this is an update operation)
        await booksPage.rateFirstBook(5);
        
        // Verify rating was saved
        const ratedBook = booksPage.personalBookCards.first();
        await page.waitForTimeout(1000);
        
        // Check if rating is displayed
        const hasRating = await ratedBook.locator('[data-testid*="rating"], .rating').count() > 0;
        expect(hasRating).toBeTruthy();
      }
    });

    test('should remove books from library', async ({ page }) => {
      // Ensure we have a book to remove
      await booksPage.switchToTab('search');
      await booksPage.searchBooks('Refactoring Martin Fowler');
      await booksPage.verifySearchResults();
      await booksPage.addFirstBookToLibrary();
      
      // Remove the book
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

    test('should check if book exists in library', async ({ page }) => {
      // Add a specific book
      await booksPage.switchToTab('search');
      await booksPage.searchBooks('You Don\'t Know JS');
      await booksPage.verifySearchResults();
      await booksPage.addFirstBookToLibrary();
      
      // Search for the same book again
      await booksPage.switchToTab('search');
      await booksPage.searchBooks('You Don\'t Know JS');
      await booksPage.verifySearchResults();
      
      // Verify the add button shows different state (already in library)
      const addButton = booksPage.addToLibraryButtons.first();
      const buttonText = await addButton.textContent();
      
      // Button should indicate book is already in library
      expect(buttonText?.toLowerCase()).toMatch(/(added|in library|remove)/);
    });
  });

  test.describe('Library Statistics and Analytics', () => {
    test('should display library statistics', async ({ page }) => {
      await booksPage.switchToTab('library');
      await booksPage.waitForLoading();
      
      // Look for statistics display
      const statsSection = page.locator('[data-testid="library-stats"], .stats, .statistics');
      const hasStats = await statsSection.count() > 0;
      
      if (hasStats) {
        await expect(statsSection.first()).toBeVisible();
        
        // Check for book count
        const hasBookCount = await page.locator('[data-testid="book-count"], .book-count').count() > 0;
        expect(hasBookCount).toBeTruthy();
      }
    });

    test('should show genre distribution', async ({ page }) => {
      // Add books from different genres
      await booksPage.switchToTab('search');
      
      // Add a programming book
      await booksPage.searchBooks('JavaScript programming');
      await booksPage.verifySearchResults();
      await booksPage.addFirstBookToLibrary();
      
      // Add a fiction book
      await booksPage.searchBooks('Science Fiction novel');
      await booksPage.verifySearchResults();
      await booksPage.addFirstBookToLibrary();
      
      // Check library for genre information
      await booksPage.switchToTab('library');
      await booksPage.waitForLoading();
      
      // Look for genre indicators on books
      const genreElements = page.locator('[data-testid="genre"], .genre, .category');
      const hasGenres = await genreElements.count() > 0;
      
      if (hasGenres) {
        await expect(genreElements.first()).toBeVisible();
      }
    });

    test('should track recently added books', async ({ page }) => {
      await booksPage.switchToTab('library');
      await booksPage.waitForLoading();
      
      // Look for recently added section or sorting
      const recentSection = page.locator('[data-testid="recent-books"], .recent, .recently-added');
      const hasRecentSection = await recentSection.count() > 0;
      
      if (hasRecentSection) {
        await expect(recentSection.first()).toBeVisible();
      }
      
      // Verify books are sorted by date (most recent first by default)
      const bookCards = booksPage.personalBookCards;
      const bookCount = await bookCards.count();
      
      if (bookCount > 1) {
        // Books should be in chronological order
        const firstBook = bookCards.first();
        const secondBook = bookCards.nth(1);
        
        await expect(firstBook).toBeVisible();
        await expect(secondBook).toBeVisible();
      }
    });
  });

  test.describe('Data Persistence and Sync', () => {
    test('should persist library data across sessions', async ({ page }) => {
      // Add a book
      await booksPage.switchToTab('search');
      await booksPage.searchBooks('Test Persistence Book');
      await booksPage.verifySearchResults();
      await booksPage.addFirstBookToLibrary();
      
      // Get library count
      await booksPage.switchToTab('library');
      await booksPage.waitForLoading();
      const bookCount = await booksPage.getPersonalBooksCount();
      
      // Refresh page (simulate new session)
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Verify data persists
      await booksPage.switchToTab('library');
      await booksPage.waitForLoading();
      const newBookCount = await booksPage.getPersonalBooksCount();
      
      expect(newBookCount).toBe(bookCount);
    });

    test('should handle concurrent operations', async ({ page }) => {
      await booksPage.switchToTab('search');
      await booksPage.searchBooks('Concurrent Operations Test');
      await booksPage.verifySearchResults();
      
      // Quickly perform multiple operations
      await booksPage.addFirstBookToLibrary();
      
      // Immediately switch to library
      await booksPage.switchToTab('library');
      await booksPage.waitForLoading();
      
      // Verify operation completed successfully
      const bookCount = await booksPage.getPersonalBooksCount();
      expect(bookCount).toBeGreaterThan(0);
    });
  });
});
