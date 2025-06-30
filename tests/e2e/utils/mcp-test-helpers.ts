import { Page, Locator, expect } from '@playwright/test';

/**
 * MCP Test Helpers for BookTalks Buddy
 * Utilities that leverage MCP's semantic understanding for better test reliability
 */

export class MCPTestHelpers {
  constructor(private page: Page) {}

  /**
   * Smart element finder using MCP's semantic understanding
   * Tries multiple strategies to find elements
   */
  async findElement(options: {
    role?: string;
    name?: string | RegExp;
    text?: string | RegExp;
    testId?: string;
    fallbackSelector?: string;
  }): Promise<Locator | null> {
    const { role, name, text, testId, fallbackSelector } = options;

    // Try role-based selection first (most semantic)
    if (role && name) {
      const element = this.page.getByRole(role as any, { name });
      if (await element.isVisible()) return element;
    }

    // Try role without name
    if (role) {
      const elements = this.page.getByRole(role as any);
      if (await elements.count() > 0) return elements.first();
    }

    // Try text-based selection
    if (text) {
      const element = this.page.getByText(text);
      if (await element.isVisible()) return element;
    }

    // Try test ID
    if (testId) {
      const element = this.page.getByTestId(testId);
      if (await element.isVisible()) return element;
    }

    // Try fallback selector
    if (fallbackSelector) {
      const element = this.page.locator(fallbackSelector);
      if (await element.isVisible()) return element;
    }

    return null;
  }

  /**
   * Smart form filling using semantic understanding
   */
  async fillForm(formData: Record<string, string>): Promise<void> {
    for (const [fieldName, value] of Object.entries(formData)) {
      const field = await this.findFormField(fieldName);
      if (field) {
        await field.clear();
        await field.fill(value);
      }
    }
  }

  /**
   * Find form fields using multiple strategies
   */
  async findFormField(fieldName: string): Promise<Locator | null> {
    const normalizedName = fieldName.toLowerCase();
    
    // Try different input types and patterns
    const strategies = [
      () => this.page.getByRole('textbox', { name: new RegExp(normalizedName, 'i') }),
      () => this.page.getByLabel(new RegExp(normalizedName, 'i')),
      () => this.page.getByPlaceholder(new RegExp(normalizedName, 'i')),
      () => this.page.locator(`input[name*="${normalizedName}"]`),
      () => this.page.locator(`input[id*="${normalizedName}"]`),
      () => this.page.locator(`[data-testid*="${normalizedName}"]`)
    ];

    for (const strategy of strategies) {
      try {
        const element = strategy();
        if (await element.isVisible()) {
          return element;
        }
      } catch (error) {
        // Continue to next strategy
      }
    }

    return null;
  }

  /**
   * Smart button clicking with multiple fallback strategies
   */
  async clickButton(buttonText: string | RegExp): Promise<boolean> {
    const strategies = [
      () => this.page.getByRole('button', { name: buttonText }),
      () => this.page.getByRole('link', { name: buttonText }),
      () => this.page.getByText(buttonText),
      () => this.page.locator(`button:has-text("${buttonText}")`),
      () => this.page.locator(`a:has-text("${buttonText}")`)
    ];

    for (const strategy of strategies) {
      try {
        const element = strategy();
        if (await element.isVisible()) {
          await element.click();
          return true;
        }
      } catch (error) {
        // Continue to next strategy
      }
    }

    return false;
  }

  /**
   * Wait for content to load with smart detection
   */
  async waitForContentLoad(options: {
    timeout?: number;
    expectedText?: string | RegExp;
    expectedElement?: string;
  } = {}): Promise<void> {
    const { timeout = 10000, expectedText, expectedElement } = options;

    // Wait for network to be idle
    await this.page.waitForLoadState('networkidle', { timeout });

    // Wait for specific content if provided
    if (expectedText) {
      await this.page.waitForSelector(`text=${expectedText}`, { timeout });
    }

    if (expectedElement) {
      await this.page.waitForSelector(expectedElement, { timeout });
    }

    // Wait for main content to be visible
    await this.page.waitForSelector('main, [role="main"], .main-content', { timeout });
  }

  /**
   * Smart navigation with verification
   */
  async navigateAndVerify(path: string, expectedContent?: string | RegExp): Promise<void> {
    await this.page.goto(path);
    await this.waitForContentLoad();

    // Verify URL
    expect(this.page.url()).toContain(path);

    // Verify expected content if provided
    if (expectedContent) {
      await expect(this.page.getByText(expectedContent)).toBeVisible();
    }
  }

  /**
   * Handle authentication state
   */
  async ensureAuthenticated(): Promise<boolean> {
    // Check if already authenticated
    const profileLink = this.page.getByRole('link', { name: /profile|account/i });
    const logoutButton = this.page.getByRole('button', { name: /logout|sign out/i });
    
    if (await profileLink.isVisible() || await logoutButton.isVisible()) {
      return true; // Already authenticated
    }

    // Try to authenticate with test credentials
    await this.page.goto('/login');
    
    const emailField = await this.findFormField('email');
    const passwordField = await this.findFormField('password');
    
    if (emailField && passwordField) {
      await emailField.fill('test@example.com');
      await passwordField.fill('testpassword123');
      
      const loginButton = await this.findElement({
        role: 'button',
        name: /sign in|login/i
      });
      
      if (loginButton) {
        await loginButton.click();
        await this.page.waitForTimeout(2000);
        
        // Check if login was successful
        const currentUrl = this.page.url();
        return !currentUrl.includes('/login');
      }
    }

    return false;
  }

  /**
   * Smart modal/dialog handling
   */
  async handleModal(action: 'open' | 'close', triggerSelector?: string): Promise<boolean> {
    if (action === 'open' && triggerSelector) {
      const trigger = await this.findElement({ fallbackSelector: triggerSelector });
      if (trigger) {
        await trigger.click();
        await this.page.waitForTimeout(500);
        
        // Verify modal opened
        const modal = this.page.getByRole('dialog');
        return await modal.isVisible();
      }
    }

    if (action === 'close') {
      // Try multiple close strategies
      const closeStrategies = [
        () => this.page.getByRole('button', { name: /close|×|cancel/i }),
        () => this.page.locator('[aria-label*="close"]'),
        () => this.page.keyboard.press('Escape')
      ];

      for (const strategy of closeStrategies) {
        try {
          if (typeof strategy === 'function' && strategy.name !== 'bound press') {
            const closeButton = strategy() as Locator;
            if (await closeButton.isVisible()) {
              await closeButton.click();
              await this.page.waitForTimeout(500);
              return true;
            }
          } else {
            await strategy();
            await this.page.waitForTimeout(500);
            return true;
          }
        } catch (error) {
          // Continue to next strategy
        }
      }
    }

    return false;
  }

  /**
   * Smart table/list interaction
   */
  async findInList(itemText: string | RegExp, containerSelector?: string): Promise<Locator | null> {
    const container = containerSelector ? 
      this.page.locator(containerSelector) : 
      this.page.getByRole('list').or(this.page.locator('[role="grid"]'));

    if (await container.isVisible()) {
      const items = container.getByText(itemText);
      if (await items.count() > 0) {
        return items.first();
      }
    }

    return null;
  }

  /**
   * Smart search functionality
   */
  async performSearch(searchTerm: string, searchContext?: string): Promise<boolean> {
    // Find search input
    const searchInput = await this.findElement({
      role: 'searchbox',
      fallbackSelector: 'input[type="search"], input[placeholder*="search" i]'
    });

    if (searchInput) {
      await searchInput.fill(searchTerm);
      
      // Try to submit search
      const searchButton = await this.findElement({
        role: 'button',
        name: /search/i,
        fallbackSelector: 'button[type="submit"]'
      });

      if (searchButton) {
        await searchButton.click();
      } else {
        await this.page.keyboard.press('Enter');
      }

      await this.page.waitForTimeout(2000);
      return true;
    }

    return false;
  }

  /**
   * Verify responsive design
   */
  async verifyResponsiveDesign(viewport: { width: number; height: number }): Promise<void> {
    await this.page.setViewportSize(viewport);
    
    // Verify content fits
    const bodyWidth = await this.page.locator('body').boundingBox();
    expect(bodyWidth?.width).toBeLessThanOrEqual(viewport.width);

    // Verify no horizontal scroll
    const scrollWidth = await this.page.evaluate(() => document.body.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(viewport.width + 20); // Allow small margin
  }

  /**
   * Smart error detection
   */
  async detectErrors(): Promise<string[]> {
    const errors: string[] = [];

    // Check for error messages
    const errorElements = this.page.getByText(/error|invalid|failed|wrong/i);
    const errorCount = await errorElements.count();

    for (let i = 0; i < errorCount; i++) {
      const errorText = await errorElements.nth(i).textContent();
      if (errorText) {
        errors.push(errorText);
      }
    }

    // Check console errors
    const consoleErrors = await this.page.evaluate(() => {
      return (window as any).__testErrors || [];
    });

    return [...errors, ...consoleErrors];
  }

  /**
   * Smart accessibility check
   */
  async checkBasicAccessibility(): Promise<{ passed: boolean; issues: string[] }> {
    const issues: string[] = [];

    // Check for headings
    const headings = this.page.getByRole('heading');
    if (await headings.count() === 0) {
      issues.push('No headings found on page');
    }

    // Check for main landmark
    const main = this.page.getByRole('main');
    if (!(await main.isVisible())) {
      issues.push('No main landmark found');
    }

    // Check for alt text on images
    const images = this.page.getByRole('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const altText = await img.getAttribute('alt');
      const ariaLabel = await img.getAttribute('aria-label');
      
      if (!altText && !ariaLabel) {
        issues.push(`Image ${i + 1} missing alt text`);
      }
    }

    return {
      passed: issues.length === 0,
      issues
    };
  }
}

/**
 * Test data factory for consistent test data
 */
export class TestDataFactory {
  static generateUser() {
    const timestamp = Date.now();
    return {
      email: `test${timestamp}@example.com`,
      username: `testuser${timestamp}`,
      password: 'TestPassword123!',
      displayName: `Test User ${timestamp}`
    };
  }

  static generateBookClub() {
    const timestamp = Date.now();
    return {
      name: `Test Book Club ${timestamp}`,
      description: `A test book club created at ${new Date().toISOString()}`,
      privacy: 'public'
    };
  }

  static generateBook() {
    return {
      title: 'Test Book Title',
      author: 'Test Author',
      isbn: '9780123456789'
    };
  }
}

/**
 * Page object base class for MCP testing
 */
export abstract class MCPPageObject {
  protected helpers: MCPTestHelpers;

  constructor(protected page: Page) {
    this.helpers = new MCPTestHelpers(page);
  }

  abstract navigate(): Promise<void>;
  abstract isLoaded(): Promise<boolean>;
}
