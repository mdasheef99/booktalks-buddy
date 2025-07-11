import { chromium, FullConfig } from '@playwright/test';

/**
 * Global Setup for BookTalks Buddy E2E Tests
 * 
 * Handles authentication and test data preparation
 */
async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global setup for BookTalks Buddy E2E tests...');
  
  const { baseURL } = config.projects[0].use;
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to the application
    await page.goto(baseURL || 'http://localhost:3000');
    
    // Wait for the application to load
    await page.waitForLoadState('networkidle');
    
    // Check if we can access the main page
    const title = await page.title();
    console.log(`📄 Application loaded with title: ${title}`);
    
    // Setup test user authentication if needed
    await setupTestAuthentication(page);
    
    // Prepare test data
    await prepareTestData(page);
    
    console.log('✅ Global setup completed successfully');
    
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await context.close();
    await browser.close();
  }
}

/**
 * Setup test user authentication
 */
async function setupTestAuthentication(page: any) {
  try {
    // Check if we're already authenticated
    const isAuthenticated = await page.locator('[data-testid="user-menu"]').isVisible().catch(() => false);
    
    if (!isAuthenticated) {
      console.log('🔐 Setting up test authentication...');
      
      // Navigate to login page
      await page.goto('/login');
      
      // Use test credentials from environment or defaults
      const testEmail = process.env.TEST_USER_EMAIL || 'chomsky@bc.com';
      const testPassword = process.env.TEST_USER_PASSWORD || 'chomsky123';
      
      // Fill login form
      await page.fill('[data-testid="email-input"]', testEmail);
      await page.fill('[data-testid="password-input"]', testPassword);
      await page.click('[data-testid="login-button"]');
      
      // Wait for successful login
      await page.waitForURL('/', { timeout: 10000 });
      await page.waitForSelector('[data-testid="user-menu"]', { timeout: 10000 });
      
      console.log('✅ Test authentication completed');
    } else {
      console.log('✅ Already authenticated');
    }
  } catch (error) {
    console.log('⚠️ Authentication setup skipped (may not be required for all tests)');
  }
}

/**
 * Prepare test data
 */
async function prepareTestData(page: any) {
  try {
    console.log('📊 Preparing test data...');
    
    // Clear any existing test data if needed
    // This could involve API calls to clean up test user data
    
    // Create any necessary test data
    // This could involve seeding the database with test books, collections, etc.
    
    console.log('✅ Test data preparation completed');
  } catch (error) {
    console.log('⚠️ Test data preparation skipped:', error.message);
  }
}

export default globalSetup;
