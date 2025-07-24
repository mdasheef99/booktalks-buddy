#!/bin/bash

# Self-Deletion Request System Test Runner
# Runs all tests related to the self-deletion request functionality

echo "🧪 Running Self-Deletion Request System Tests"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test categories
echo -e "${BLUE}📋 Test Categories:${NC}"
echo "  1. API Layer Tests"
echo "  2. Component Tests" 
echo "  3. Integration Tests"
echo ""

# Function to run tests and capture results
run_test_suite() {
    local test_name="$1"
    local test_path="$2"
    
    echo -e "${YELLOW}Running $test_name...${NC}"
    
    if npm run test -- "$test_path" --reporter=verbose; then
        echo -e "${GREEN}✅ $test_name passed${NC}"
        return 0
    else
        echo -e "${RED}❌ $test_name failed${NC}"
        return 1
    fi
}

# Initialize counters
total_tests=0
passed_tests=0

# Run API Layer Tests
echo -e "\n${BLUE}1. API Layer Tests${NC}"
echo "=================="
total_tests=$((total_tests + 1))
if run_test_suite "Self-Deletion Requests API" "src/lib/api/admin/__tests__/selfDeletionRequests.test.ts"; then
    passed_tests=$((passed_tests + 1))
fi

# Run Component Tests
echo -e "\n${BLUE}2. Component Tests${NC}"
echo "=================="
total_tests=$((total_tests + 1))
if run_test_suite "SelfDeletionRequests Component" "src/components/admin/__tests__/SelfDeletionRequests.test.tsx"; then
    passed_tests=$((passed_tests + 1))
fi

# Run Integration Tests
echo -e "\n${BLUE}3. Integration Tests${NC}"
echo "===================="
total_tests=$((total_tests + 1))
if run_test_suite "Self-Deletion Flow Integration" "src/__tests__/integration/selfDeletionFlow.test.ts"; then
    passed_tests=$((passed_tests + 1))
fi

# Summary
echo -e "\n${BLUE}📊 Test Summary${NC}"
echo "==============="
echo "Total test suites: $total_tests"
echo "Passed: $passed_tests"
echo "Failed: $((total_tests - passed_tests))"

if [ $passed_tests -eq $total_tests ]; then
    echo -e "\n${GREEN}🎉 All tests passed! Self-deletion request system is working correctly.${NC}"
    exit 0
else
    echo -e "\n${RED}⚠️  Some tests failed. Please review the output above.${NC}"
    exit 1
fi
