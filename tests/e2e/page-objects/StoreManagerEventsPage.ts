import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for Store Manager Events Management
 * 
 * Provides reusable methods and locators for testing Store Manager Events functionality
 */
export class StoreManagerEventsPage {
  readonly page: Page;
  
  // Page elements
  readonly pageTitle: Locator;
  readonly storeContextText: Locator;
  readonly createEventButton: Locator;
  readonly refreshButton: Locator;
  readonly backToDashboardButton: Locator;
  
  // Statistics cards
  readonly totalEventsCard: Locator;
  readonly upcomingEventsCard: Locator;
  readonly pastEventsCard: Locator;
  readonly featuredEventsCard: Locator;
  
  // Search and filters
  readonly searchInput: Locator;
  readonly filterSelect: Locator;
  readonly sortSelect: Locator;
  
  // Event list
  readonly eventsList: Locator;
  readonly eventCards: Locator;
  readonly emptyState: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Page elements
    this.pageTitle = page.locator('h1:has-text("Events Management")');
    this.storeContextText = page.locator('text=Manage events for');
    this.createEventButton = page.locator('[data-testid="create-event-button"]');
    this.refreshButton = page.locator('[data-testid="refresh-events-button"]');
    this.backToDashboardButton = page.locator('button:has-text("Back to Dashboard")');

    // Statistics cards
    this.totalEventsCard = page.locator('text=Total Events').locator('..');
    this.upcomingEventsCard = page.locator('text=Upcoming Events').locator('..');
    this.pastEventsCard = page.locator('text=Past Events').locator('..');
    this.featuredEventsCard = page.locator('text=Featured Events').locator('..');

    // Search and filters
    this.searchInput = page.locator('[data-testid="search-events-input"]');
    this.filterSelect = page.locator('[data-testid="filter-events-select"]');
    this.sortSelect = page.locator('[data-testid="sort-events-select"]');

    // Event list
    this.eventsList = page.locator('[data-testid="events-list"]');
    this.eventCards = page.locator('[data-testid="event-card"]');
    this.emptyState = page.locator('text=No events found');
  }

  /**
   * Navigate to the Store Manager Events page
   */
  async goto(): Promise<void> {
    await this.page.goto('/store-manager/events');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Wait for the page to load completely
   */
  async waitForPageLoad(): Promise<void> {
    await expect(this.pageTitle).toBeVisible({ timeout: 10000 });
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Verify the page is displayed correctly
   */
  async verifyPageDisplay(storeName: string): Promise<void> {
    await expect(this.pageTitle).toBeVisible();
    await expect(this.storeContextText).toContainText(storeName);
    await expect(this.createEventButton).toBeVisible();
    
    // Verify statistics cards
    await expect(this.totalEventsCard).toBeVisible();
    await expect(this.upcomingEventsCard).toBeVisible();
    await expect(this.pastEventsCard).toBeVisible();
    await expect(this.featuredEventsCard).toBeVisible();
    
    // Verify search and filter controls
    await expect(this.searchInput).toBeVisible();
    await expect(this.filterSelect).toBeVisible();
  }

  /**
   * Get statistics from the cards
   */
  async getStatistics(): Promise<{
    total: number;
    upcoming: number;
    past: number;
    featured: number;
  }> {
    const total = await this.getCardValue(this.totalEventsCard);
    const upcoming = await this.getCardValue(this.upcomingEventsCard);
    const past = await this.getCardValue(this.pastEventsCard);
    const featured = await this.getCardValue(this.featuredEventsCard);
    
    return { total, upcoming, past, featured };
  }

  /**
   * Helper to get numeric value from a statistics card
   */
  private async getCardValue(card: Locator): Promise<number> {
    const text = await card.locator('.text-2xl').textContent();
    return parseInt(text || '0', 10);
  }

  /**
   * Search for events
   */
  async searchEvents(query: string): Promise<void> {
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(500); // Wait for debounced search
  }

  /**
   * Clear search
   */
  async clearSearch(): Promise<void> {
    await this.searchInput.clear();
    await this.page.waitForTimeout(500);
  }

  /**
   * Filter events by type
   */
  async filterEvents(filter: 'all' | 'upcoming' | 'past' | 'featured'): Promise<void> {
    const filterMap = {
      'all': 'All Events',
      'upcoming': 'Upcoming',
      'past': 'Past',
      'featured': 'Featured'
    };
    
    await this.filterSelect.selectOption(filterMap[filter]);
    await this.page.waitForTimeout(500);
  }

  /**
   * Sort events
   */
  async sortEvents(sort: 'upcoming' | 'newest' | 'oldest'): Promise<void> {
    const sortMap = {
      'upcoming': 'By Date',
      'newest': 'Newest First',
      'oldest': 'Oldest First'
    };
    
    if (await this.sortSelect.isVisible()) {
      await this.sortSelect.selectOption(sortMap[sort]);
      await this.page.waitForTimeout(500);
    }
  }

  /**
   * Get all visible event cards
   */
  async getEventCards(): Promise<Locator[]> {
    const count = await this.eventCards.count();
    const cards: Locator[] = [];
    
    for (let i = 0; i < count; i++) {
      cards.push(this.eventCards.nth(i));
    }
    
    return cards;
  }

  /**
   * Find event card by title
   */
  getEventCardByTitle(title: string): Locator {
    return this.page.locator(`[data-testid="event-card"]:has-text("${title}")`);
  }

  /**
   * Click create event button
   */
  async clickCreateEvent(): Promise<void> {
    await this.createEventButton.click();
  }

  /**
   * Click refresh button
   */
  async clickRefresh(): Promise<void> {
    await this.refreshButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Navigate back to dashboard
   */
  async goBackToDashboard(): Promise<void> {
    await this.backToDashboardButton.click();
  }

  /**
   * Verify empty state is shown
   */
  async verifyEmptyState(): Promise<void> {
    await expect(this.emptyState).toBeVisible();
  }

  /**
   * Verify event exists in the list
   */
  async verifyEventExists(title: string): Promise<void> {
    const eventCard = this.getEventCardByTitle(title);
    await expect(eventCard).toBeVisible();
  }

  /**
   * Verify event does not exist in the list
   */
  async verifyEventNotExists(title: string): Promise<void> {
    const eventCard = this.getEventCardByTitle(title);
    await expect(eventCard).not.toBeVisible();
  }
}

/**
 * Page Object Model for Store Manager Event Form (Create/Edit)
 */
export class StoreManagerEventFormPage {
  readonly page: Page;
  
  // Form elements
  readonly pageTitle: Locator;
  readonly titleInput: Locator;
  readonly descriptionTextarea: Locator;
  readonly eventTypeSelect: Locator;
  readonly clubSelect: Locator;
  readonly startDateInput: Locator;
  readonly startTimeInput: Locator;
  readonly endDateInput: Locator;
  readonly endTimeInput: Locator;
  readonly locationInput: Locator;
  readonly isVirtualCheckbox: Locator;
  readonly virtualLinkInput: Locator;
  readonly maxParticipantsInput: Locator;
  readonly featuredCheckbox: Locator;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;
  readonly backButton: Locator;
  
  // Error messages
  readonly errorMessages: Locator;
  readonly successMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Form elements
    this.pageTitle = page.locator('h1');
    this.titleInput = page.locator('input[name="title"]');
    this.descriptionTextarea = page.locator('textarea[name="description"]');
    this.eventTypeSelect = page.locator('select[name="eventType"]');
    this.clubSelect = page.locator('select[name="clubId"]');
    this.startDateInput = page.locator('input[name="startDate"]');
    this.startTimeInput = page.locator('input[name="startTime"]');
    this.endDateInput = page.locator('input[name="endDate"]');
    this.endTimeInput = page.locator('input[name="endTime"]');
    this.locationInput = page.locator('input[name="location"]');
    this.isVirtualCheckbox = page.locator('input[name="isVirtual"]');
    this.virtualLinkInput = page.locator('input[name="virtualMeetingLink"]');
    this.maxParticipantsInput = page.locator('input[name="maxParticipants"]');
    this.featuredCheckbox = page.locator('input[name="featuredOnLanding"]');
    this.submitButton = page.locator('button[type="submit"]');
    this.cancelButton = page.locator('button:has-text("Cancel")');
    this.backButton = page.locator('button:has-text("Back to Events")');
    
    // Messages
    this.errorMessages = page.locator('.error, [role="alert"]');
    this.successMessage = page.locator('.success, text=successfully');
  }

  /**
   * Wait for form to load
   */
  async waitForFormLoad(): Promise<void> {
    await expect(this.titleInput).toBeVisible({ timeout: 10000 });
  }

  /**
   * Fill basic event information
   */
  async fillBasicInfo(data: {
    title: string;
    description: string;
    eventType?: string;
    clubId?: string;
  }): Promise<void> {
    await this.titleInput.fill(data.title);
    await this.descriptionTextarea.fill(data.description);
    
    if (data.eventType) {
      await this.eventTypeSelect.selectOption(data.eventType);
    }
    
    if (data.clubId) {
      await this.clubSelect.selectOption(data.clubId);
    }
  }

  /**
   * Fill date and time information
   */
  async fillDateTime(data: {
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
  }): Promise<void> {
    await this.startDateInput.fill(data.startDate);
    await this.startTimeInput.fill(data.startTime);
    await this.endDateInput.fill(data.endDate);
    await this.endTimeInput.fill(data.endTime);
  }

  /**
   * Fill location information
   */
  async fillLocation(data: {
    location: string;
    isVirtual?: boolean;
    virtualLink?: string;
  }): Promise<void> {
    await this.locationInput.fill(data.location);
    
    if (data.isVirtual) {
      await this.isVirtualCheckbox.check();
      if (data.virtualLink) {
        await this.virtualLinkInput.fill(data.virtualLink);
      }
    }
  }

  /**
   * Fill additional settings
   */
  async fillAdditionalSettings(data: {
    maxParticipants?: string;
    featured?: boolean;
  }): Promise<void> {
    if (data.maxParticipants) {
      await this.maxParticipantsInput.fill(data.maxParticipants);
    }
    
    if (data.featured) {
      await this.featuredCheckbox.check();
    }
  }

  /**
   * Submit the form
   */
  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  /**
   * Cancel the form
   */
  async cancel(): Promise<void> {
    await this.cancelButton.click();
  }

  /**
   * Go back to events list
   */
  async goBack(): Promise<void> {
    await this.backButton.click();
  }

  /**
   * Verify success message
   */
  async verifySuccess(message: string): Promise<void> {
    await expect(this.page.locator(`text=${message}`)).toBeVisible({ timeout: 10000 });
  }

  /**
   * Verify error message
   */
  async verifyError(message: string): Promise<void> {
    await expect(this.page.locator(`text=${message}`)).toBeVisible();
  }
}
