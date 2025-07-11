#!/usr/bin/env node

/**
 * Test Runner for BookTalks Buddy E2E Tests
 * 
 * Comprehensive test execution with reporting and validation
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import path from 'path';

interface TestSuite {
  name: string;
  file: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

const TEST_SUITES: TestSuite[] = [
  {
    name: 'Backward Compatibility',
    file: 'backward-compatibility.spec.ts',
    description: 'Verifies that refactored modules maintain 100% backward compatibility',
    priority: 'high'
  },
  {
    name: 'Books Section Functionality',
    file: 'books-section-functionality.spec.ts',
    description: 'Tests complete user workflow in Books Section',
    priority: 'high'
  },
  {
    name: 'Personal Books Service',
    file: 'personal-books-service.spec.ts',
    description: 'Tests all CRUD operations for personal books',
    priority: 'high'
  },
  {
    name: 'Store Requests Service',
    file: 'store-requests-service.spec.ts',
    description: 'Tests store request workflow and functionality',
    priority: 'medium'
  },
  {
    name: 'Cross-Module Integration',
    file: 'cross-module-integration.spec.ts',
    description: 'Tests integration between refactored modules',
    priority: 'high'
  }
];

interface TestResults {
  suite: string;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  status: 'passed' | 'failed' | 'error';
  error?: string;
}

class TestRunner {
  private results: TestResults[] = [];
  private startTime: number = 0;

  constructor() {
    this.ensureDirectories();
  }

  private ensureDirectories() {
    const dirs = ['test-results', 'test-results/screenshots', 'test-results/videos'];
    dirs.forEach(dir => {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
    });
  }

  async runAllTests() {
    console.log('🚀 Starting BookTalks Buddy E2E Test Suite');
    console.log('=' .repeat(60));
    
    this.startTime = Date.now();

    // Run tests by priority
    const highPriorityTests = TEST_SUITES.filter(t => t.priority === 'high');
    const mediumPriorityTests = TEST_SUITES.filter(t => t.priority === 'medium');
    const lowPriorityTests = TEST_SUITES.filter(t => t.priority === 'low');

    console.log('\n📋 Test Execution Plan:');
    console.log(`High Priority: ${highPriorityTests.length} suites`);
    console.log(`Medium Priority: ${mediumPriorityTests.length} suites`);
    console.log(`Low Priority: ${lowPriorityTests.length} suites`);

    // Run high priority tests first
    await this.runTestGroup('High Priority Tests', highPriorityTests);
    
    // Run medium priority tests
    await this.runTestGroup('Medium Priority Tests', mediumPriorityTests);
    
    // Run low priority tests
    await this.runTestGroup('Low Priority Tests', lowPriorityTests);

    this.generateReport();
  }

  async runTestGroup(groupName: string, tests: TestSuite[]) {
    if (tests.length === 0) return;

    console.log(`\n🎯 Running ${groupName}`);
    console.log('-'.repeat(40));

    for (const test of tests) {
      await this.runSingleTest(test);
    }
  }

  async runSingleTest(test: TestSuite) {
    console.log(`\n📝 Running: ${test.name}`);
    console.log(`   ${test.description}`);

    const startTime = Date.now();
    
    try {
      const command = `npx playwright test tests/${test.file} --reporter=json`;
      const output = execSync(command, { 
        encoding: 'utf8',
        cwd: path.join(__dirname),
        timeout: 300000 // 5 minutes timeout
      });

      const duration = Date.now() - startTime;
      
      // Parse Playwright JSON output
      const result = this.parsePlaywrightOutput(output);
      
      this.results.push({
        suite: test.name,
        passed: result.passed,
        failed: result.failed,
        skipped: result.skipped,
        duration,
        status: result.failed > 0 ? 'failed' : 'passed'
      });

      console.log(`   ✅ Passed: ${result.passed}, Failed: ${result.failed}, Skipped: ${result.skipped}`);
      console.log(`   ⏱️  Duration: ${(duration / 1000).toFixed(2)}s`);

    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      this.results.push({
        suite: test.name,
        passed: 0,
        failed: 0,
        skipped: 0,
        duration,
        status: 'error',
        error: error.message
      });

      console.log(`   ❌ Error running test: ${error.message}`);
    }
  }

  private parsePlaywrightOutput(output: string): { passed: number; failed: number; skipped: number } {
    try {
      const jsonOutput = JSON.parse(output);
      return {
        passed: jsonOutput.stats?.passed || 0,
        failed: jsonOutput.stats?.failed || 0,
        skipped: jsonOutput.stats?.skipped || 0
      };
    } catch {
      // Fallback parsing if JSON parsing fails
      const passedMatch = output.match(/(\d+) passed/);
      const failedMatch = output.match(/(\d+) failed/);
      const skippedMatch = output.match(/(\d+) skipped/);

      return {
        passed: passedMatch ? parseInt(passedMatch[1]) : 0,
        failed: failedMatch ? parseInt(failedMatch[1]) : 0,
        skipped: skippedMatch ? parseInt(skippedMatch[1]) : 0
      };
    }
  }

  private generateReport() {
    const totalDuration = Date.now() - this.startTime;
    const totalPassed = this.results.reduce((sum, r) => sum + r.passed, 0);
    const totalFailed = this.results.reduce((sum, r) => sum + r.failed, 0);
    const totalSkipped = this.results.reduce((sum, r) => sum + r.skipped, 0);
    const totalTests = totalPassed + totalFailed + totalSkipped;

    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST EXECUTION SUMMARY');
    console.log('='.repeat(60));

    console.log(`\n📈 Overall Results:`);
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   ✅ Passed: ${totalPassed}`);
    console.log(`   ❌ Failed: ${totalFailed}`);
    console.log(`   ⏭️  Skipped: ${totalSkipped}`);
    console.log(`   ⏱️  Total Duration: ${(totalDuration / 1000).toFixed(2)}s`);

    const successRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : '0';
    console.log(`   📊 Success Rate: ${successRate}%`);

    console.log(`\n📋 Suite Details:`);
    this.results.forEach(result => {
      const status = result.status === 'passed' ? '✅' : 
                    result.status === 'failed' ? '❌' : '⚠️';
      console.log(`   ${status} ${result.suite}: ${result.passed}/${result.passed + result.failed} (${(result.duration / 1000).toFixed(1)}s)`);
      
      if (result.error) {
        console.log(`      Error: ${result.error}`);
      }
    });

    // Generate JSON report
    const report = {
      summary: {
        totalTests,
        passed: totalPassed,
        failed: totalFailed,
        skipped: totalSkipped,
        duration: totalDuration,
        successRate: parseFloat(successRate),
        timestamp: new Date().toISOString()
      },
      suites: this.results
    };

    writeFileSync('test-results/summary.json', JSON.stringify(report, null, 2));
    console.log(`\n📄 Detailed report saved to: test-results/summary.json`);

    // Exit with appropriate code
    const hasFailures = totalFailed > 0 || this.results.some(r => r.status === 'error');
    if (hasFailures) {
      console.log('\n❌ Some tests failed. Please review the results above.');
      process.exit(1);
    } else {
      console.log('\n🎉 All tests passed successfully!');
      process.exit(0);
    }
  }
}

// CLI interface
const args = process.argv.slice(2);
const runner = new TestRunner();

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
BookTalks Buddy E2E Test Runner

Usage:
  npm run test:e2e              Run all tests
  npm run test:e2e -- --help    Show this help

Test Suites:
${TEST_SUITES.map(t => `  - ${t.name}: ${t.description}`).join('\n')}

Options:
  --help, -h    Show this help message
  `);
  process.exit(0);
}

// Run tests
runner.runAllTests().catch(error => {
  console.error('❌ Test runner failed:', error);
  process.exit(1);
});
