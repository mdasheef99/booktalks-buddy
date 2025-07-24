#!/usr/bin/env node

/**
 * Store Manager Moderation Tests Runner
 * 
 * Custom test runner for Store Manager Moderation Interface E2E tests
 * Provides specialized configuration and reporting for moderation functionality testing
 */

import { spawn } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';

// Configuration
const CONFIG = {
  baseUrl: process.env.BASE_URL || 'http://localhost:5173',
  testTimeout: 60000,
  retries: 2,
  workers: 1, // Single worker for Store Manager tests to avoid conflicts
  outputDir: 'tests/e2e/test-results/store-manager-moderation',
  reportDir: 'tests/e2e/test-results/store-manager-moderation/reports'
};

// Test suites
const TEST_SUITES = {
  basic: [
    'tests/e2e/store-manager-moderation.spec.ts'
  ],
  integration: [
    'tests/e2e/store-manager-moderation.spec.ts',
    'tests/e2e/store-manager-access.spec.ts'
  ],
  all: [
    'tests/e2e/store-manager-moderation.spec.ts'
  ]
};

// Ensure output directories exist
function ensureDirectories(): void {
  const dirs = [CONFIG.outputDir, CONFIG.reportDir];
  
  dirs.forEach(dir => {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
      console.log(`📁 Created directory: ${dir}`);
    }
  });
}

// Build Playwright command
function buildPlaywrightCommand(suite: string, options: any = {}): string[] {
  const testFiles = TEST_SUITES[suite as keyof typeof TEST_SUITES] || TEST_SUITES.basic;
  
  const command = [
    'npx', 'playwright', 'test',
    ...testFiles,
    '--config=playwright.config.ts',
    `--output-dir=${CONFIG.outputDir}`,
    `--reporter=html:${CONFIG.reportDir}/html,json:${CONFIG.reportDir}/results.json,junit:${CONFIG.reportDir}/results.xml`,
    `--timeout=${CONFIG.testTimeout}`,
    `--retries=${CONFIG.retries}`,
    `--workers=${CONFIG.workers}`,
    '--headed=false'
  ];

  // Add additional options
  if (options.headed) {
    command.push('--headed=true');
  }
  
  if (options.debug) {
    command.push('--debug');
  }
  
  if (options.grep) {
    command.push(`--grep=${options.grep}`);
  }

  return command;
}

// Run tests
async function runTests(suite: string, options: any = {}): Promise<void> {
  console.log('🚀 Starting Store Manager Moderation Tests');
  console.log(`📋 Test Suite: ${suite}`);
  console.log(`🌐 Base URL: ${CONFIG.baseUrl}`);
  console.log(`📁 Output Directory: ${CONFIG.outputDir}`);
  console.log('');

  ensureDirectories();

  const command = buildPlaywrightCommand(suite, options);
  
  console.log('🔧 Running command:', command.join(' '));
  console.log('');

  return new Promise((resolve, reject) => {
    const process = spawn(command[0], command.slice(1), {
      stdio: 'inherit',
      env: {
        ...process.env,
        BASE_URL: CONFIG.baseUrl,
        STORE_MANAGER_PASSWORD: 'kafka'
      }
    });

    process.on('close', (code) => {
      console.log('');
      
      if (code === 0) {
        console.log('✅ Store Manager Moderation tests completed successfully!');
        console.log(`📊 HTML Report: ${CONFIG.reportDir}/html/index.html`);
        console.log(`📄 JSON Report: ${CONFIG.reportDir}/results.json`);
        console.log(`📋 JUnit Report: ${CONFIG.reportDir}/results.xml`);
        resolve();
      } else {
        console.log(`❌ Store Manager Moderation tests failed with exit code ${code}`);
        console.log(`📊 Check reports at: ${CONFIG.reportDir}/`);
        reject(new Error(`Tests failed with exit code ${code}`));
      }
    });

    process.on('error', (error) => {
      console.error('❌ Failed to start test process:', error);
      reject(error);
    });
  });
}

// CLI interface
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const suite = args[0] || 'basic';
  
  const options = {
    headed: args.includes('--headed'),
    debug: args.includes('--debug'),
    grep: args.find(arg => arg.startsWith('--grep='))?.split('=')[1]
  };

  console.log('🎭 Store Manager Moderation Interface - E2E Test Runner');
  console.log('='.repeat(60));
  console.log('');

  try {
    await runTests(suite, options);
  } catch (error) {
    console.error('💥 Test execution failed:', error);
    process.exit(1);
  }
}

// Help text
function showHelp(): void {
  console.log('🎭 Store Manager Moderation Tests Runner');
  console.log('');
  console.log('Usage: npm run test:store-manager:moderation [suite] [options]');
  console.log('');
  console.log('Test Suites:');
  console.log('  basic       - Core moderation functionality tests (default)');
  console.log('  integration - Moderation + access control tests');
  console.log('  all         - All moderation-related tests');
  console.log('');
  console.log('Options:');
  console.log('  --headed    - Run tests in headed mode (visible browser)');
  console.log('  --debug     - Run tests in debug mode');
  console.log('  --grep=     - Run only tests matching pattern');
  console.log('  --help      - Show this help message');
  console.log('');
  console.log('Examples:');
  console.log('  npm run test:store-manager:moderation');
  console.log('  npm run test:store-manager:moderation basic --headed');
  console.log('  npm run test:store-manager:moderation all --grep="user management"');
  console.log('');
  console.log('Environment Variables:');
  console.log('  BASE_URL              - Application base URL (default: http://localhost:5173)');
  console.log('  STORE_MANAGER_PASSWORD - Store Manager test account password (default: kafka)');
  console.log('');
  console.log('Reports:');
  console.log(`  HTML Report: ${CONFIG.reportDir}/html/index.html`);
  console.log(`  JSON Report: ${CONFIG.reportDir}/results.json`);
  console.log(`  JUnit Report: ${CONFIG.reportDir}/results.xml`);
}

// Handle help flag
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  showHelp();
  process.exit(0);
}

// Run main function
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });
}

export { runTests, CONFIG, TEST_SUITES };
