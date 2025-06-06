# Test Execution Guidelines - Phase 8 Integration Testing

**Purpose**: Step-by-step instructions for running all Store Management tests  
**Scope**: Complete test execution workflow from setup to reporting  

## 🚀 **TEST EXECUTION WORKFLOW**

### **Phase 1: Pre-Test Setup (Day 1)**
```bash
# 1. Environment Preparation
npm install
npm run build
npm run test:setup

# 2. Database Setup
npm run db:test:reset
npm run db:test:seed

# 3. Test Environment Verification
npm run test:env:verify
```

### **Phase 2: Critical Priority Tests (Days 1-2)**
```bash
# Run critical tests in sequence
npm run test:critical

# Individual critical test suites
npm run test:database
npm run test:analytics-api
npm run test:dashboard-integration

# Generate critical test report
npm run test:critical:report
```

### **Phase 3: High Priority Tests (Days 3-4)**
```bash
# Run high priority tests
npm run test:high

# Individual high priority test suites
npm run test:components
npm run test:e2e
npm run test:landing-page

# Generate high priority test report
npm run test:high:report
```

### **Phase 4: Medium Priority Tests (Days 5-6)**
```bash
# Run medium priority tests
npm run test:medium

# Individual medium priority test suites
npm run test:responsive
npm run test:performance
npm run test:security

# Generate medium priority test report
npm run test:medium:report
```

## 📋 **DETAILED EXECUTION COMMANDS**

### **1. Critical Priority Tests**

#### **Database Tests**
```bash
# Run database integration tests
npm run test -- --testPathPattern="database" --verbose

# Run with coverage
npm run test:coverage -- --testPathPattern="database"

# Run specific database test
npm run test -- --testNamePattern="analytics timestamp fix"
```

#### **Enhanced Analytics API Tests**
```bash
# Run analytics API tests
npm run test -- --testPathPattern="analytics.*api" --verbose

# Test specific analytics features
npm run test -- --testNamePattern="enhanced metrics"
npm run test -- --testNamePattern="section-specific"

# Performance testing for analytics
npm run test:performance -- --testPathPattern="analytics"
```

#### **Store Dashboard Integration Tests**
```bash
# Run dashboard integration tests
npm run test -- --testPathPattern="dashboard.*integration" --verbose

# Test dashboard data loading
npm run test -- --testNamePattern="dashboard.*load"

# Test navigation integration
npm run test -- --testNamePattern="navigation"
```

### **2. High Priority Tests**

#### **Component Unit Tests**
```bash
# Run all component tests
npm run test -- --testPathPattern="components" --verbose

# Test specific components
npm run test -- --testNamePattern="HeroCustomization"
npm run test -- --testNamePattern="LandingPageAnalytics"
npm run test -- --testNamePattern="CarouselManagement"

# Component test coverage
npm run test:coverage -- --testPathPattern="components"
```

#### **End-to-End Tests**
```bash
# Run Cypress E2E tests
npm run cypress:run

# Run specific E2E test suites
npm run cypress:run -- --spec "cypress/e2e/store-customization-workflow.cy.ts"
npm run cypress:run -- --spec "cypress/e2e/analytics-integration.cy.ts"

# Run E2E tests in headed mode for debugging
npm run cypress:open
```

#### **Landing Page Rendering Tests**
```bash
# Run landing page rendering tests
npm run test -- --testPathPattern="landing.*rendering" --verbose

# Test specific sections
npm run test -- --testNamePattern="hero.*rendering"
npm run test -- --testNamePattern="carousel.*rendering"
npm run test -- --testNamePattern="banner.*rendering"
```

### **3. Medium Priority Tests**

#### **Responsive Design Tests**
```bash
# Run responsive design tests
npm run test -- --testPathPattern="responsive" --verbose

# Test specific viewports
npm run test -- --testNamePattern="mobile.*layout"
npm run test -- --testNamePattern="desktop.*layout"

# Visual regression testing
npm run test:visual -- --testPathPattern="responsive"
```

#### **Performance Tests**
```bash
# Run performance tests
npm run test:performance

# Lighthouse performance audit
npm run test:lighthouse

# Memory leak detection
npm run test:memory

# API performance testing
npm run test:api:performance
```

#### **Security Tests**
```bash
# Run security tests
npm run test -- --testPathPattern="security" --verbose

# Test access control
npm run test -- --testNamePattern="access.*control"

# Test data isolation
npm run test -- --testNamePattern="data.*isolation"
```

## 🔧 **PACKAGE.JSON SCRIPTS**

### **4. Test Scripts Configuration**
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --watchAll=false",
    
    "test:critical": "jest --testPathPattern='(database|analytics.*api|dashboard.*integration)'",
    "test:high": "jest --testPathPattern='(components|e2e|landing.*rendering)'",
    "test:medium": "jest --testPathPattern='(responsive|performance|security)'",
    
    "test:database": "jest --testPathPattern='database'",
    "test:analytics-api": "jest --testPathPattern='analytics.*api'",
    "test:dashboard-integration": "jest --testPathPattern='dashboard.*integration'",
    "test:components": "jest --testPathPattern='components'",
    "test:landing-page": "jest --testPathPattern='landing.*rendering'",
    "test:responsive": "jest --testPathPattern='responsive'",
    "test:performance": "jest --testPathPattern='performance'",
    "test:security": "jest --testPathPattern='security'",
    
    "cypress:open": "cypress open",
    "cypress:run": "cypress run",
    "cypress:run:chrome": "cypress run --browser chrome",
    "cypress:run:firefox": "cypress run --browser firefox",
    
    "test:e2e": "npm run cypress:run",
    "test:e2e:headed": "npm run cypress:open",
    
    "test:lighthouse": "lighthouse-ci autorun",
    "test:visual": "percy exec -- npm run test",
    "test:memory": "jest --testPathPattern='memory' --logHeapUsage",
    "test:api:performance": "jest --testPathPattern='api.*performance'",
    
    "test:setup": "node scripts/test-setup.js",
    "test:env:verify": "node scripts/verify-test-env.js",
    "db:test:reset": "node scripts/reset-test-db.js",
    "db:test:seed": "node scripts/seed-test-db.js",
    
    "test:critical:report": "jest --testPathPattern='critical' --json --outputFile=reports/critical-tests.json",
    "test:high:report": "jest --testPathPattern='high' --json --outputFile=reports/high-tests.json",
    "test:medium:report": "jest --testPathPattern='medium' --json --outputFile=reports/medium-tests.json",
    
    "test:all": "npm run test:critical && npm run test:high && npm run test:medium",
    "test:full:report": "npm run test:all -- --json --outputFile=reports/full-test-report.json"
  }
}
```

## 📊 **CONTINUOUS INTEGRATION SETUP**

### **5. GitHub Actions Workflow**
```yaml
# .github/workflows/test.yml
name: Store Management Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  critical-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Setup test database
        run: npm run db:test:setup
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_TEST_URL }}
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_TEST_ANON_KEY }}
      
      - name: Run critical tests
        run: npm run test:critical
        env:
          CI: true
      
      - name: Upload critical test results
        uses: actions/upload-artifact@v3
        with:
          name: critical-test-results
          path: reports/critical-tests.json

  high-priority-tests:
    runs-on: ubuntu-latest
    needs: critical-tests
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run high priority tests
        run: npm run test:high
        env:
          CI: true
      
      - name: Run E2E tests
        run: npm run cypress:run
        env:
          CYPRESS_baseUrl: http://localhost:3000

  medium-priority-tests:
    runs-on: ubuntu-latest
    needs: high-priority-tests
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run medium priority tests
        run: npm run test:medium
        env:
          CI: true
      
      - name: Generate coverage report
        run: npm run test:coverage
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
```

## 🐛 **DEBUGGING AND TROUBLESHOOTING**

### **6. Common Issues and Solutions**

#### **Database Connection Issues**
```bash
# Check database connection
npm run db:test:ping

# Reset test database
npm run db:test:reset
npm run db:test:seed

# Verify database schema
npm run db:test:verify-schema
```

#### **Test Failures**
```bash
# Run tests in debug mode
npm run test:debug -- --testNamePattern="failing test name"

# Run single test file
npm run test -- path/to/test/file.test.ts --verbose

# Run tests with increased timeout
npm run test -- --testTimeout=30000
```

#### **Performance Issues**
```bash
# Run tests with heap profiling
node --max-old-space-size=4096 --expose-gc npm run test

# Check for memory leaks
npm run test:memory -- --logHeapUsage

# Profile test execution
npm run test -- --verbose --detectOpenHandles
```

### **7. Test Data Management**
```bash
# Clean up test data
npm run test:cleanup

# Reset to clean state
npm run test:reset

# Seed specific test data
npm run test:seed -- --fixture=hero-customization
npm run test:seed -- --fixture=analytics-data
npm run test:seed -- --fixture=carousel-items
```

## 📈 **REPORTING AND METRICS**

### **8. Test Reports Generation**
```bash
# Generate comprehensive test report
npm run test:report

# Generate coverage report
npm run test:coverage:report

# Generate performance report
npm run test:performance:report

# Generate visual diff report
npm run test:visual:report
```

### **9. Quality Gates**
```bash
# Check coverage thresholds
npm run test:coverage:check

# Verify performance budgets
npm run test:performance:check

# Security audit
npm run test:security:audit

# Accessibility testing
npm run test:a11y
```

## ✅ **EXECUTION CHECKLIST**

### **Pre-Execution**
- ✅ **Environment Setup**: Test environment configured and verified
- ✅ **Database Ready**: Test database reset and seeded with test data
- ✅ **Dependencies**: All testing dependencies installed and updated
- ✅ **Configuration**: Jest, Cypress, and other tools properly configured

### **During Execution**
- ✅ **Sequential Order**: Run tests in priority order (Critical → High → Medium)
- ✅ **Monitor Progress**: Track test execution and identify failures early
- ✅ **Resource Usage**: Monitor memory and CPU usage during test runs
- ✅ **Error Logging**: Capture detailed logs for failed tests

### **Post-Execution**
- ✅ **Results Analysis**: Review test results and coverage reports
- ✅ **Failure Investigation**: Debug and fix any test failures
- ✅ **Performance Review**: Analyze performance test results
- ✅ **Documentation**: Update test documentation based on findings

**These test execution guidelines ensure systematic, reliable testing of the Store Management Landing Page system with proper reporting and quality assurance.**
