#!/usr/bin/env node

/**
 * Test Runner for Store Manager Events E2E Tests
 * 
 * Runs comprehensive Store Manager Events tests with proper setup and reporting
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';

// Configuration
const TEST_CONFIG = {
  baseUrl: process.env.BASE_URL || 'http://localhost:5173',
  headless: process.env.HEADLESS !== 'false',
  browser: process.env.BROWSER || 'chromium',
  workers: process.env.WORKERS || '1',
  retries: process.env.RETRIES || '2',
  timeout: process.env.TIMEOUT || '60000',
  outputDir: 'tests/e2e/test-results/store-manager-events',
  reportDir: 'tests/e2e/test-results/store-manager-events/reports'
};

// Test suites
const TEST_SUITES = {
  basic: [
    'tests/e2e/store-manager-events.spec.ts'
  ],
  advanced: [
    'tests/e2e/store-manager-events-advanced.spec.ts'
  ],
  all: [
    'tests/e2e/store-manager-events.spec.ts',
    'tests/e2e/store-manager-events-advanced.spec.ts'
  ]
};

/**
 * Ensure required directories exist
 */
function ensureDirectories(): void {
  const dirs = [
    TEST_CONFIG.outputDir,
    TEST_CONFIG.reportDir,
    'tests/e2e/screenshots'
  ];

  dirs.forEach(dir => {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
      console.log(`📁 Created directory: ${dir}`);
    }
  });
}

/**
 * Build Playwright command
 */
function buildPlaywrightCommand(suite: string, options: any = {}): string {
  const testFiles = TEST_SUITES[suite as keyof typeof TEST_SUITES] || TEST_SUITES.all;
  
  const baseCommand = [
    'npx playwright test',
    ...testFiles,
    `--project=${TEST_CONFIG.browser}`,
    `--workers=${options.workers || TEST_CONFIG.workers}`,
    `--retries=${options.retries || TEST_CONFIG.retries}`,
    `--timeout=${options.timeout || TEST_CONFIG.timeout}`,
    `--output-dir=${TEST_CONFIG.outputDir}`,
    `--reporter=html:${TEST_CONFIG.reportDir}/html,json:${TEST_CONFIG.reportDir}/results.json,junit:${TEST_CONFIG.reportDir}/results.xml`
  ];

  // Add conditional flags
  if (TEST_CONFIG.headless) {
    baseCommand.push('--headed=false');
  } else {
    baseCommand.push('--headed=true');
  }

  if (options.debug) {
    baseCommand.push('--debug');
  }

  if (options.ui) {
    baseCommand.push('--ui');
  }

  if (options.grep) {
    baseCommand.push(`--grep="${options.grep}"`);
  }

  return baseCommand.join(' ');
}

/**
 * Run pre-test checks
 */
function runPreTestChecks(): boolean {
  console.log('🔍 Running pre-test checks...');

  try {
    // Check if dev server is running
    execSync(`curl -f ${TEST_CONFIG.baseUrl} > /dev/null 2>&1`, { stdio: 'ignore' });
    console.log('✅ Dev server is running');
  } catch (error) {
    console.error('❌ Dev server is not running. Please start it with: npm run dev');
    return false;
  }

  try {
    // Check if Playwright is installed
    execSync('npx playwright --version', { stdio: 'ignore' });
    console.log('✅ Playwright is installed');
  } catch (error) {
    console.error('❌ Playwright is not installed. Please run: npx playwright install');
    return false;
  }

  return true;
}

/**
 * Run tests
 */
async function runTests(suite: string, options: any = {}): Promise<void> {
  console.log(`🚀 Running Store Manager Events tests (${suite} suite)...`);
  console.log(`📊 Configuration:`, {
    baseUrl: TEST_CONFIG.baseUrl,
    browser: TEST_CONFIG.browser,
    headless: TEST_CONFIG.headless,
    workers: options.workers || TEST_CONFIG.workers,
    retries: options.retries || TEST_CONFIG.retries
  });

  const command = buildPlaywrightCommand(suite, options);
  console.log(`🔧 Command: ${command}`);

  try {
    execSync(command, { 
      stdio: 'inherit',
      env: {
        ...process.env,
        BASE_URL: TEST_CONFIG.baseUrl
      }
    });
    
    console.log('✅ Tests completed successfully!');
    console.log(`📊 Reports available at: ${TEST_CONFIG.reportDir}`);
    
  } catch (error) {
    console.error('❌ Tests failed!');
    console.log(`📊 Reports available at: ${TEST_CONFIG.reportDir}`);
    process.exit(1);
  }
}

/**
 * Show help
 */
function showHelp(): void {
  console.log(`
Store Manager Events E2E Test Runner

Usage:
  npm run test:e2e:events [suite] [options]
  node tests/e2e/run-store-manager-events-tests.ts [suite] [options]

Test Suites:
  basic     - Basic Store Manager Events functionality tests
  advanced  - Advanced scenarios and edge cases
  all       - All Store Manager Events tests (default)

Options:
  --headed          Run tests in headed mode (show browser)
  --debug           Run tests in debug mode
  --ui              Run tests with Playwright UI
  --workers=N       Number of parallel workers (default: 1)
  --retries=N       Number of retries on failure (default: 2)
  --timeout=N       Test timeout in milliseconds (default: 60000)
  --grep="pattern"  Run only tests matching pattern
  --help            Show this help

Environment Variables:
  BASE_URL          Base URL for tests (default: http://localhost:5173)
  BROWSER           Browser to use (default: chromium)
  HEADLESS          Run headless (default: true)
  STORE_MANAGER_PASSWORD  Password for Store Manager test account

Examples:
  npm run test:e2e:events basic
  npm run test:e2e:events advanced --headed
  npm run test:e2e:events all --debug
  npm run test:e2e:events --grep="should create"
  
Reports:
  HTML Report: ${TEST_CONFIG.reportDir}/html/index.html
  JSON Report: ${TEST_CONFIG.reportDir}/results.json
  JUnit Report: ${TEST_CONFIG.reportDir}/results.xml
`);
}

/**
 * Parse command line arguments
 */
function parseArgs(): { suite: string; options: any } {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    process.exit(0);
  }

  let suite = 'all';
  const options: any = {};

  args.forEach(arg => {
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');
      
      switch (key) {
        case 'headed':
          options.headless = false;
          break;
        case 'debug':
          options.debug = true;
          break;
        case 'ui':
          options.ui = true;
          break;
        case 'workers':
          options.workers = value;
          break;
        case 'retries':
          options.retries = value;
          break;
        case 'timeout':
          options.timeout = value;
          break;
        case 'grep':
          options.grep = value;
          break;
      }
    } else if (!arg.startsWith('-') && ['basic', 'advanced', 'all'].includes(arg)) {
      suite = arg;
    }
  });

  return { suite, options };
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  console.log('🎭 Store Manager Events E2E Test Runner');
  console.log('=====================================');

  const { suite, options } = parseArgs();

  // Ensure directories exist
  ensureDirectories();

  // Run pre-test checks
  if (!runPreTestChecks()) {
    process.exit(1);
  }

  // Run tests
  await runTests(suite, options);
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  });
}

export { runTests, TEST_CONFIG, TEST_SUITES };
