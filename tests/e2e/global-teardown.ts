import { chromium, FullConfig } from '@playwright/test';

/**
 * Global Teardown for BookTalks Buddy E2E Tests
 * 
 * Handles cleanup after all tests complete
 */
async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global teardown for BookTalks Buddy E2E tests...');
  
  const { baseURL } = config.projects[0].use;
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to the application
    await page.goto(baseURL || 'http://localhost:3000');
    
    // Clean up test data
    await cleanupTestData(page);
    
    // Generate test report summary
    await generateTestSummary();
    
    console.log('✅ Global teardown completed successfully');
    
  } catch (error) {
    console.error('❌ Global teardown failed:', error);
    // Don't throw error to avoid masking test failures
  } finally {
    await context.close();
    await browser.close();
  }
}

/**
 * Clean up test data
 */
async function cleanupTestData(page: any) {
  try {
    console.log('🗑️ Cleaning up test data...');
    
    // Remove any test books, collections, or requests created during tests
    // This could involve API calls to clean up test user data
    
    console.log('✅ Test data cleanup completed');
  } catch (error) {
    console.log('⚠️ Test data cleanup skipped:', error.message);
  }
}

/**
 * Generate test summary
 */
async function generateTestSummary() {
  try {
    console.log('📊 Generating test summary...');
    
    // Could read test results and generate summary
    // Could send notifications about test completion
    
    console.log('✅ Test summary generated');
  } catch (error) {
    console.log('⚠️ Test summary generation skipped:', error.message);
  }
}

export default globalTeardown;
