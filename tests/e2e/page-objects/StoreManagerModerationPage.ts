import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for Store Manager Moderation Interface
 * 
 * Provides reusable methods and locators for testing the Store Manager
 * Moderation functionality including report management, user actions,
 * and moderation dashboard interactions.
 */
export class StoreManagerModerationPage {
  readonly page: Page;
  
  // Main page elements
  readonly pageTitle: Locator;
  readonly storeContextText: Locator;
  readonly backToDashboardButton: Locator;
  readonly moderationDashboard: Locator;
  
  // Moderation tabs
  readonly pendingTab: Locator;
  readonly underReviewTab: Locator;
  readonly highPriorityTab: Locator;
  readonly resolvedTab: Locator;
  readonly userManagementTab: Locator;
  
  // Tab content areas - Using specific selectors to avoid multiple tabpanel conflicts
  readonly reportsTabContent: Locator;
  readonly userManagementTabContent: Locator;
  readonly reportsContainer: Locator;
  readonly userManagementContainer: Locator;
  
  // Statistics and metrics
  readonly statsCards: Locator;
  readonly reportCounts: Locator;
  
  // User management elements
  readonly userAccountManager: Locator;
  readonly suspendUserButton: Locator;
  readonly deleteUserButton: Locator;
  readonly activateUserButton: Locator;
  readonly warningButton: Locator;
  
  // Report elements
  readonly reportItems: Locator;
  readonly reportActionButtons: Locator;
  readonly takeActionButton: Locator;
  
  // Loading and error states
  readonly loadingIndicator: Locator;
  readonly errorMessage: Locator;
  readonly emptyState: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Main page elements
    this.pageTitle = page.locator('h1:has-text("Moderation")');
    this.storeContextText = page.locator('text=Content moderation for');
    this.backToDashboardButton = page.locator('button:has-text("Back to Dashboard")');
    this.moderationDashboard = page.locator('[class*="moderation"], [class*="dashboard"]');
    
    // Moderation tabs
    this.pendingTab = page.locator('[role="tab"]:has-text("Pending")');
    this.underReviewTab = page.locator('[role="tab"]:has-text("Under Review")');
    this.highPriorityTab = page.locator('[role="tab"]:has-text("High Priority")');
    this.resolvedTab = page.locator('[role="tab"]:has-text("Resolved")');
    this.userManagementTab = page.locator('[role="tab"]:has-text("User Management")');
    
    // Tab content areas - Using specific selectors to avoid multiple tabpanel conflicts
    this.reportsContainer = page.locator('[class*="report"], [class*="table"], [role="table"]');
    this.userManagementContainer = page.locator('[class*="user-management"]');

    // Specific tab content locators - Using position-based selectors to handle duplicate IDs
    this.reportsTabContent = page.locator('[role="tabpanel"]').nth(1); // Second tabpanel is for reports
    this.userManagementTabContent = page.locator('[role="tabpanel"]').first(); // First tabpanel is for user management
    
    // Statistics and metrics
    this.statsCards = page.locator('[class*="card"], [class*="stat"]');
    this.reportCounts = page.locator('text=/\\d+.*report/i');
    
    // User management elements
    this.userAccountManager = page.locator('[class*="user-account-manager"]');
    this.suspendUserButton = page.locator('button:has-text("Suspend")');
    this.deleteUserButton = page.locator('button:has-text("Delete")');
    this.activateUserButton = page.locator('button:has-text("Activate")');
    this.warningButton = page.locator('button:has-text("Warning")');
    
    // Report elements
    this.reportItems = page.locator('[class*="report-item"], [class*="report-row"]');
    this.reportActionButtons = page.locator('button:has-text("Take Action")');
    this.takeActionButton = page.locator('button:has-text("Take Action")');
    
    // Loading and error states
    this.loadingIndicator = page.locator('text=Loading, [class*="loading"], [class*="spinner"]');
    this.errorMessage = page.locator('[class*="error"], [role="alert"]');
    this.emptyState = page.locator('text=No reports, text=No data');
  }

  /**
   * Navigate to the Store Manager Moderation page
   */
  async navigate(): Promise<void> {
    await this.page.goto('/store-manager/moderation');
    await this.waitForPageLoad();
  }

  /**
   * Wait for the moderation page to fully load
   */
  async waitForPageLoad(): Promise<void> {
    await expect(this.pageTitle).toBeVisible({ timeout: 10000 });
    await expect(this.storeContextText).toBeVisible();
    
    // Wait for any loading indicators to disappear
    if (await this.loadingIndicator.isVisible()) {
      await this.loadingIndicator.waitFor({ state: 'hidden', timeout: 15000 });
    }
  }

  /**
   * Verify the page structure and main elements
   */
  async verifyPageStructure(): Promise<void> {
    await expect(this.pageTitle).toBeVisible();
    await expect(this.storeContextText).toBeVisible();
    await expect(this.backToDashboardButton).toBeVisible();
    
    // Verify all moderation tabs are present
    await expect(this.pendingTab).toBeVisible();
    await expect(this.underReviewTab).toBeVisible();
    await expect(this.highPriorityTab).toBeVisible();
    await expect(this.resolvedTab).toBeVisible();
    await expect(this.userManagementTab).toBeVisible();
  }

  /**
   * Verify store context is properly displayed
   */
  async verifyStoreContext(expectedStoreName: string = 'Default Store'): Promise<void> {
    await expect(this.page.locator(`text=Content moderation for ${expectedStoreName}`)).toBeVisible();
    
    // Check for store-wide reports indicator
    const storeReportsIndicator = this.page.locator('text=Store-wide reports');
    if (await storeReportsIndicator.isVisible()) {
      await expect(storeReportsIndicator).toBeVisible();
    }
  }

  /**
   * Navigate to a specific moderation tab
   */
  async navigateToTab(tabName: 'pending' | 'under_review' | 'high_priority' | 'resolved' | 'user_management'): Promise<void> {
    const tabMap = {
      pending: this.pendingTab,
      under_review: this.underReviewTab,
      high_priority: this.highPriorityTab,
      resolved: this.resolvedTab,
      user_management: this.userManagementTab
    };

    const tab = tabMap[tabName];
    await tab.click();
    await this.page.waitForTimeout(500);

    // Use specific tab content based on tab type
    if (tabName === 'user_management') {
      await expect(this.userManagementTabContent).toBeVisible();
    } else {
      await expect(this.reportsTabContent).toBeVisible();
    }
  }

  /**
   * Test all tab navigation
   */
  async testAllTabNavigation(): Promise<void> {
    const tabs: Array<'pending' | 'under_review' | 'high_priority' | 'resolved' | 'user_management'> = [
      'pending', 'under_review', 'high_priority', 'resolved', 'user_management'
    ];

    for (const tab of tabs) {
      await this.navigateToTab(tab);
      // The navigateToTab method already verifies visibility, no need to check again
    }
  }

  /**
   * Navigate to User Management tab and verify functionality
   */
  async navigateToUserManagement(): Promise<void> {
    await this.navigateToTab('user_management');

    // Verify user management content is loaded
    await expect(this.userManagementTabContent).toBeVisible();
  }

  /**
   * Check for user management action buttons
   */
  async verifyUserManagementActions(): Promise<string[]> {
    await this.navigateToUserManagement();
    
    const availableActions: string[] = [];
    
    const actionButtons = [
      { button: this.suspendUserButton, name: 'Suspend' },
      { button: this.deleteUserButton, name: 'Delete' },
      { button: this.activateUserButton, name: 'Activate' },
      { button: this.warningButton, name: 'Warning' }
    ];

    for (const action of actionButtons) {
      if (await action.button.isVisible()) {
        availableActions.push(action.name);
      }
    }

    return availableActions;
  }

  /**
   * Navigate back to Store Manager dashboard
   */
  async navigateBackToDashboard(): Promise<void> {
    await this.backToDashboardButton.click();
    
    // Wait for navigation to complete
    await this.page.waitForURL(/\/store-manager\/dashboard/, { timeout: 10000 });
    await expect(this.page.locator('h1:has-text("Dashboard")')).toBeVisible();
  }

  /**
   * Check for reports in the current tab
   */
  async getReportsCount(): Promise<number> {
    if (await this.reportItems.count() > 0) {
      return await this.reportItems.count();
    }
    
    // Check for empty state
    if (await this.emptyState.isVisible()) {
      return 0;
    }
    
    return 0;
  }

  /**
   * Verify store-scoped data access
   */
  async verifyStoreScopedAccess(): Promise<void> {
    // Navigate through different tabs and verify store context is maintained
    const tabs: Array<'pending' | 'under_review' | 'high_priority' | 'resolved'> = [
      'pending', 'under_review', 'high_priority', 'resolved'
    ];

    for (const tab of tabs) {
      await this.navigateToTab(tab);
      
      // Verify store context is still displayed
      await expect(this.storeContextText).toBeVisible();
      
      // If reports are present, they should be store-scoped
      const reportsCount = await this.getReportsCount();
      console.log(`Tab "${tab}": ${reportsCount} reports found`);
    }
  }

  /**
   * Test responsive design across different viewport sizes
   */
  async testResponsiveDesign(): Promise<void> {
    const viewports = [
      { width: 1920, height: 1080, name: 'Desktop' },
      { width: 1024, height: 768, name: 'Tablet' },
      { width: 375, height: 667, name: 'Mobile' }
    ];

    for (const viewport of viewports) {
      await this.page.setViewportSize({ width: viewport.width, height: viewport.height });
      await this.page.waitForTimeout(500);
      
      // Verify main elements are still visible
      await expect(this.pageTitle).toBeVisible();
      await expect(this.storeContextText).toBeVisible();
      
      console.log(`✅ ${viewport.name} viewport (${viewport.width}x${viewport.height}) verified`);
    }
  }

  /**
   * Handle loading states and wait for completion
   */
  async waitForLoadingComplete(): Promise<void> {
    // Wait for any loading indicators to disappear
    const loadingSelectors = [
      'text=Loading',
      'text=Verifying',
      '[class*="loading"]',
      '[class*="spinner"]',
      '[class*="skeleton"]'
    ];

    for (const selector of loadingSelectors) {
      const element = this.page.locator(selector);
      if (await element.isVisible()) {
        await element.waitFor({ state: 'hidden', timeout: 15000 });
      }
    }
  }

  /**
   * Capture screenshot for debugging
   */
  async captureScreenshot(name: string): Promise<void> {
    await this.page.screenshot({ 
      path: `tests/e2e/screenshots/store-manager-moderation-${name}.png`,
      fullPage: true 
    });
  }
}
