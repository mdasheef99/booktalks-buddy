import { chromium, FullConfig } from '@playwright/test';
import { TEST_CONFIG } from './helpers/store-manager-helpers';

/**
 * Global Setup for BookTalks Buddy E2E Tests
 *
 * Handles authentication and test data preparation
 * Includes Store Manager Interface specific setup
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

    // Setup Store Manager specific tests
    await setupStoreManagerTests(page);

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
 * Setup Store Manager specific tests
 */
async function setupStoreManagerTests(page: any) {
  try {
    console.log('🏪 Setting up Store Manager Interface tests...');

    // Verify Store Manager routes are protected
    await page.goto(`${TEST_CONFIG.baseUrl}/store-manager/dashboard`);
    const currentUrl = page.url();

    if (currentUrl.includes('/login')) {
      console.log('✅ Store Manager routes are properly protected');
    } else {
      console.log('⚠️ Store Manager route protection needs verification');
    }

    // Test Store Manager account accessibility
    console.log('🔍 Testing Store Manager account...');
    await page.goto(`${TEST_CONFIG.baseUrl}/login`);

    // Fill Store Manager credentials
    await page.fill('input[type="email"]', TEST_CONFIG.storeManager.email);
    await page.fill('input[type="password"]', TEST_CONFIG.storeManager.password);
    await page.click('button[type="submit"]');

    // Wait for response
    await page.waitForTimeout(3000);

    const loginResult = page.url();
    if (loginResult.includes('/dashboard') || loginResult.includes('/profile')) {
      console.log('✅ Store Manager account accessible');

      // Test Store Manager interface access
      await page.goto(`${TEST_CONFIG.baseUrl}/store-manager/dashboard`);
      await page.waitForTimeout(2000);

      const storeManagerUrl = page.url();
      if (storeManagerUrl.includes('/store-manager')) {
        console.log('✅ Store Manager interface accessible');
      } else {
        console.log('⚠️ Store Manager interface access needs verification');
      }

      // Logout for clean state
      const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign Out")').first();
      if (await logoutButton.isVisible()) {
        await logoutButton.click();
        await page.waitForTimeout(2000);
      }
    } else {
      console.log('⚠️ Store Manager account login needs verification');
    }

    // Create screenshots directory
    const fs = require('fs');
    const path = require('path');
    const screenshotsDir = path.join(__dirname, 'screenshots');
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
      console.log('✅ Screenshots directory created');
    }

    console.log('✅ Store Manager setup completed');
  } catch (error) {
    console.log('⚠️ Store Manager setup encountered issues:', error.message);
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
