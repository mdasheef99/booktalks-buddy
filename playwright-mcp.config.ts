import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright MCP Configuration for BookTalks Buddy
 * This config is specifically for MCP (Model Context Protocol) testing
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',
  /* Run tests in files in parallel */
  fullyParallel: false, // MCP tests should run sequentially for better stability
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 1,
  /* Opt out of parallel tests on CI. */
  workers: 1, // MCP works better with single worker
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { outputFolder: 'mcp-report' }],
    ['json', { outputFile: 'test-results/mcp-results.json' }],
    ['junit', { outputFile: 'test-results/mcp-junit.xml' }],
    ['list']
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:5173',
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    /* Record video on failure */
    video: 'retain-on-failure',
    /* MCP-specific settings */
    headless: process.env.CI ? true : false, // Show browser in local development
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    permissions: ['notifications', 'geolocation'],
    locale: 'en-US',
    timezoneId: 'America/New_York',
  },

  /* Configure projects for MCP testing - focus on core browsers */
  projects: [
    {
      name: 'chromium-mcp',
      use: { 
        ...devices['Desktop Chrome'],
        // MCP-specific browser settings
        launchOptions: {
          args: [
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            '--no-sandbox'
          ]
        }
      },
    },
    {
      name: 'firefox-mcp',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'mobile-chrome-mcp',
      use: { ...devices['Pixel 5'] },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    stdout: 'pipe',
    stderr: 'pipe',
  },

  /* Global setup for MCP tests - removed for fresh start */
  // globalSetup: './tests/e2e/setup/global-setup.ts',
  
  /* Test timeout settings */
  timeout: 60 * 1000, // 60 seconds per test
  expect: {
    timeout: 10 * 1000, // 10 seconds for assertions
  },
});
