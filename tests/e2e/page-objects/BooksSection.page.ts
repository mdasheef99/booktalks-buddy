import { Page, Locator, expect } from '@playwright/test';

/**
 * Books Section Page Object Model
 * 
 * Encapsulates all interactions with the refactored Books Section
 */
export class BooksSectionPage {
  readonly page: Page;
  
  // Navigation elements
  readonly searchTab: Locator;
  readonly libraryTab: Locator;
  readonly storeRequestsTab: Locator;
  readonly collectionsTab: Locator;
  
  // Search section elements
  readonly searchInput: Locator;
  readonly searchButton: Locator;
  readonly searchResults: Locator;
  readonly addToLibraryButtons: Locator;
  readonly requestFromStoreButtons: Locator;
  
  // Library section elements
  readonly personalBooksGrid: Locator;
  readonly personalBookCards: Locator;
  readonly removeBookButtons: Locator;
  readonly rateBookButtons: Locator;
  readonly addBooksButton: Locator;
  
  // Store requests section elements
  readonly storeRequestsList: Locator;
  readonly createRequestButton: Locator;
  readonly requestStatusBadges: Locator;
  readonly cancelRequestButtons: Locator;
  
  // Collections section elements
  readonly collectionsGrid: Locator;
  readonly createCollectionButton: Locator;
  readonly collectionCards: Locator;
  
  // Common elements
  readonly loadingSpinner: Locator;
  readonly errorMessage: Locator;
  readonly successToast: Locator;
  readonly confirmDialog: Locator;
  readonly confirmButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Navigation elements
    this.searchTab = page.locator('[data-testid="search-tab"]');
    this.libraryTab = page.locator('[data-testid="library-tab"]');
    this.storeRequestsTab = page.locator('[data-testid="store-requests-tab"]');
    this.collectionsTab = page.locator('[data-testid="collections-tab"]');
    
    // Search section elements
    this.searchInput = page.locator('[data-testid="book-search-input"]');
    this.searchButton = page.locator('[data-testid="search-button"]');
    this.searchResults = page.locator('[data-testid="search-results"]');
    this.addToLibraryButtons = page.locator('[data-testid="add-to-library-button"]');
    this.requestFromStoreButtons = page.locator('[data-testid="request-from-store-button"]');
    
    // Library section elements
    this.personalBooksGrid = page.locator('[data-testid="personal-books-grid"]');
    this.personalBookCards = page.locator('[data-testid="personal-book-card"]');
    this.removeBookButtons = page.locator('[data-testid="remove-book-button"]');
    this.rateBookButtons = page.locator('[data-testid="rate-book-button"]');
    this.addBooksButton = page.locator('[data-testid="add-books-button"]');
    
    // Store requests section elements
    this.storeRequestsList = page.locator('[data-testid="store-requests-list"]');
    this.createRequestButton = page.locator('[data-testid="create-request-button"]');
    this.requestStatusBadges = page.locator('[data-testid="request-status-badge"]');
    this.cancelRequestButtons = page.locator('[data-testid="cancel-request-button"]');
    
    // Collections section elements
    this.collectionsGrid = page.locator('[data-testid="collections-grid"]');
    this.createCollectionButton = page.locator('[data-testid="create-collection-button"]');
    this.collectionCards = page.locator('[data-testid="collection-card"]');
    
    // Common elements
    this.loadingSpinner = page.locator('[data-testid="loading-spinner"]');
    this.errorMessage = page.locator('[data-testid="error-message"]');
    this.successToast = page.locator('.sonner-toast');
    this.confirmDialog = page.locator('[data-testid="confirm-dialog"]');
    this.confirmButton = page.locator('[data-testid="confirm-button"]');
    this.cancelButton = page.locator('[data-testid="cancel-button"]');
  }

  /**
   * Navigate to Books Section
   */
  async goto() {
    await this.page.goto('/books');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Switch to a specific tab
   */
  async switchToTab(tab: 'search' | 'library' | 'store-requests' | 'collections') {
    const tabMap = {
      'search': this.searchTab,
      'library': this.libraryTab,
      'store-requests': this.storeRequestsTab,
      'collections': this.collectionsTab
    };
    
    await tabMap[tab].click();
    await this.page.waitForTimeout(500); // Wait for tab transition
  }

  /**
   * Search for books
   */
  async searchBooks(query: string) {
    await this.searchInput.fill(query);
    await this.searchButton.click();
    await this.page.waitForSelector('[data-testid="search-results"]', { timeout: 10000 });
  }

  /**
   * Add first search result to library
   */
  async addFirstBookToLibrary() {
    await this.addToLibraryButtons.first().click();
    await this.waitForSuccessToast();
  }

  /**
   * Request first search result from store
   */
  async requestFirstBookFromStore() {
    await this.requestFromStoreButtons.first().click();
    await this.waitForSuccessToast();
  }

  /**
   * Remove first book from library
   */
  async removeFirstBookFromLibrary() {
    await this.removeBookButtons.first().click();
    await this.confirmButton.click();
    await this.waitForSuccessToast();
  }

  /**
   * Rate first book in library
   */
  async rateFirstBook(rating: number) {
    await this.rateBookButtons.first().click();
    await this.page.locator(`[data-testid="rating-${rating}"]`).click();
    await this.page.locator('[data-testid="submit-rating"]').click();
    await this.waitForSuccessToast();
  }

  /**
   * Wait for success toast to appear
   */
  async waitForSuccessToast() {
    await this.successToast.waitFor({ state: 'visible', timeout: 5000 });
  }

  /**
   * Wait for loading to complete
   */
  async waitForLoading() {
    await this.loadingSpinner.waitFor({ state: 'hidden', timeout: 10000 });
  }

  /**
   * Verify tab is active
   */
  async verifyTabActive(tab: 'search' | 'library' | 'store-requests' | 'collections') {
    const tabMap = {
      'search': this.searchTab,
      'library': this.libraryTab,
      'store-requests': this.storeRequestsTab,
      'collections': this.collectionsTab
    };
    
    await expect(tabMap[tab]).toHaveAttribute('data-state', 'active');
  }

  /**
   * Verify search results are displayed
   */
  async verifySearchResults() {
    await expect(this.searchResults).toBeVisible();
    await expect(this.addToLibraryButtons.first()).toBeVisible();
  }

  /**
   * Verify personal books are displayed
   */
  async verifyPersonalBooks() {
    await expect(this.personalBooksGrid).toBeVisible();
  }

  /**
   * Verify store requests are displayed
   */
  async verifyStoreRequests() {
    await expect(this.storeRequestsList).toBeVisible();
  }

  /**
   * Get count of personal books
   */
  async getPersonalBooksCount(): Promise<number> {
    return await this.personalBookCards.count();
  }

  /**
   * Get count of store requests
   */
  async getStoreRequestsCount(): Promise<number> {
    return await this.page.locator('[data-testid="store-request-card"]').count();
  }
}
