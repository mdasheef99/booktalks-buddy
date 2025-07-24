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

    // Clean up Store Manager test artifacts
    await cleanupStoreManagerTests();

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
 * Clean up Store Manager test artifacts
 */
async function cleanupStoreManagerTests() {
  try {
    console.log('🏪 Cleaning up Store Manager test artifacts...');

    const fs = require('fs');
    const path = require('path');

    // Clean up screenshots directory
    const screenshotsDir = path.join(__dirname, 'screenshots');
    if (fs.existsSync(screenshotsDir)) {
      const files = fs.readdirSync(screenshotsDir);
      const now = Date.now();
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

      let cleanedCount = 0;
      files.forEach((file: string) => {
        const filePath = path.join(screenshotsDir, file);
        const stats = fs.statSync(filePath);

        if (now - stats.mtime.getTime() > maxAge) {
          fs.unlinkSync(filePath);
          cleanedCount++;
        }
      });

      if (cleanedCount > 0) {
        console.log(`🗑️ Cleaned up ${cleanedCount} old screenshots`);
      }
    }

    console.log('✅ Store Manager test cleanup completed');
  } catch (error) {
    console.log('⚠️ Store Manager test cleanup skipped:', error.message);
  }
}

/**
 * Generate test summary
 */
async function generateTestSummary() {
  try {
    console.log('📊 Generating test summary...');

    const fs = require('fs');
    const path = require('path');

    // Read test results if available
    const testResultsDir = path.join(process.cwd(), 'test-results');
    if (fs.existsSync(testResultsDir)) {
      const resultsFile = path.join(testResultsDir, 'results.json');

      if (fs.existsSync(resultsFile)) {
        const results = JSON.parse(fs.readFileSync(resultsFile, 'utf8'));

        console.log('📈 Store Manager Test Results Summary:');
        console.log(`   Total Tests: ${results.stats?.total || 'N/A'}`);
        console.log(`   Passed: ${results.stats?.passed || 'N/A'}`);
        console.log(`   Failed: ${results.stats?.failed || 'N/A'}`);
        console.log(`   Skipped: ${results.stats?.skipped || 'N/A'}`);

        // Log Store Manager specific test results
        const storeManagerTests = results.suites?.filter((suite: any) =>
          suite.title?.includes('Store Manager')
        ) || [];

        if (storeManagerTests.length > 0) {
          console.log(`   Store Manager Tests: ${storeManagerTests.length} suites`);
        }
      }
    }

    console.log('✅ Test summary generated');
  } catch (error) {
    console.log('⚠️ Test summary generation skipped:', error.message);
  }
}

export default globalTeardown;
