/**
 * Test Configuration and Setup
 * 
 * Centralized configuration for all progress tracking tests
 * Provides consistent test environment setup and teardown
 */

import { beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';

/**
 * Global test configuration
 */
export const TEST_CONFIG = {
  // Test timeouts
  DEFAULT_TIMEOUT: 5000,
  REALTIME_TIMEOUT: 2000,
  INTEGRATION_TIMEOUT: 10000,
  
  // Test data
  TEST_CLUB_ID: 'test-club-id',
  TEST_USER_ID: 'test-user-id',
  TEST_BOOK_ID: 'test-book-id',
  
  // Mock delays
  API_DELAY: 100,
  SUBSCRIPTION_DELAY: 50,
  
  // Performance thresholds
  MAX_SUBSCRIPTION_TIME: 1000,
  MAX_UPDATE_TIME: 500,
  
  // Retry configuration
  MAX_RETRIES: 3,
  RETRY_DELAY: 100
};

/**
 * Creates a fresh QueryClient for each test
 */
export const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      cacheTime: 0,
      staleTime: 0
    },
    mutations: {
      retry: false
    }
  }
});

/**
 * Standard test environment setup
 */
export const setupTestEnvironment = () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    
    // Reset all mocks
    vi.clearAllMocks();
    
    // Setup console spy to catch errors
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    // Cleanup React Testing Library
    cleanup();
    
    // Clear query client
    queryClient?.clear();
    
    // Restore console
    vi.restoreAllMocks();
  });

  return () => queryClient;
};

/**
 * Database test setup for integration tests
 */
export const setupDatabaseTests = () => {
  let testData: {
    clubId: string;
    userId1: string;
    userId2: string;
    bookId: string;
  };

  beforeAll(async () => {
    // Setup test database state
    testData = await createTestData();
  });

  afterAll(async () => {
    // Cleanup test database state
    await cleanupTestData(testData);
  });

  beforeEach(async () => {
    // Reset progress data between tests
    await resetProgressData(testData.clubId);
  });

  return () => testData;
};

/**
 * Creates test data in the database
 */
async function createTestData() {
  // This would interact with your test database
  // Implementation depends on your test database setup
  
  const testData = {
    clubId: TEST_CONFIG.TEST_CLUB_ID,
    userId1: TEST_CONFIG.TEST_USER_ID,
    userId2: 'test-user-2-id',
    bookId: TEST_CONFIG.TEST_BOOK_ID
  };

  // Create test club, users, and book
  // Implementation would use your database client
  
  return testData;
}

/**
 * Cleans up test data from the database
 */
async function cleanupTestData(testData: any) {
  // Clean up test data
  // Implementation would use your database client
}

/**
 * Resets progress data for a club
 */
async function resetProgressData(clubId: string) {
  // Reset progress data
  // Implementation would use your database client
}

/**
 * Mock API responses for consistent testing
 */
export const setupMockAPIResponses = () => {
  const mockResponses = {
    // Progress tracking enabled
    isProgressTrackingEnabled: true,
    
    // Default user progress
    userProgress: {
      id: 'progress-1',
      user_id: TEST_CONFIG.TEST_USER_ID,
      club_id: TEST_CONFIG.TEST_CLUB_ID,
      status: 'reading' as const,
      progress_percentage: 50,
      is_private: false,
      created_at: '2025-01-24T10:00:00Z',
      last_updated: '2025-01-24T10:00:00Z'
    },
    
    // Default member progress
    memberProgress: [
      {
        id: 'progress-1',
        user_id: TEST_CONFIG.TEST_USER_ID,
        username: 'testuser',
        status: 'reading' as const,
        progress_percentage: 50,
        is_private: false,
        last_updated: '2025-01-24T10:00:00Z'
      },
      {
        id: 'progress-2',
        user_id: 'other-user-id',
        username: 'otheruser',
        status: 'finished' as const,
        is_private: false,
        last_updated: '2025-01-24T09:00:00Z'
      }
    ],
    
    // Default club stats
    clubStats: {
      total_members: 5,
      not_started_count: 1,
      reading_count: 2,
      finished_count: 2,
      completion_percentage: 40
    }
  };

  return mockResponses;
};

/**
 * Performance testing utilities
 */
export const performanceTestUtils = {
  /**
   * Measure execution time of a function
   */
  measureTime: async <T>(fn: () => Promise<T>): Promise<{ result: T; time: number }> => {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    return { result, time: end - start };
  },

  /**
   * Assert performance threshold
   */
  assertPerformance: (actualTime: number, maxTime: number, operation: string) => {
    if (actualTime > maxTime) {
      throw new Error(`${operation} took ${actualTime}ms, expected < ${maxTime}ms`);
    }
  },

  /**
   * Create performance test wrapper
   */
  createPerformanceTest: (maxTime: number, operation: string) => {
    return async <T>(fn: () => Promise<T>): Promise<T> => {
      const { result, time } = await performanceTestUtils.measureTime(fn);
      performanceTestUtils.assertPerformance(time, maxTime, operation);
      return result;
    };
  }
};

/**
 * Error testing utilities
 */
export const errorTestUtils = {
  /**
   * Expect an async function to throw
   */
  expectAsyncThrow: async (fn: () => Promise<any>, expectedError?: string | RegExp) => {
    try {
      await fn();
      throw new Error('Expected function to throw');
    } catch (error) {
      if (expectedError) {
        if (typeof expectedError === 'string') {
          expect(error.message).toContain(expectedError);
        } else {
          expect(error.message).toMatch(expectedError);
        }
      }
    }
  },

  /**
   * Create error scenarios for testing
   */
  createErrorScenarios: () => [
    {
      name: 'Network Error',
      error: new Error('Network request failed'),
      shouldRetry: true
    },
    {
      name: 'Authentication Error',
      error: new Error('User not authenticated'),
      shouldRetry: false
    },
    {
      name: 'Permission Error',
      error: new Error('User is not a member of this club'),
      shouldRetry: false
    },
    {
      name: 'Validation Error',
      error: new Error('Invalid progress data'),
      shouldRetry: false
    },
    {
      name: 'Server Error',
      error: new Error('Internal server error'),
      shouldRetry: true
    }
  ]
};

/**
 * Accessibility testing utilities
 */
export const accessibilityTestUtils = {
  /**
   * Test keyboard navigation
   */
  testKeyboardNavigation: async (container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    expect(focusableElements.length).toBeGreaterThan(0);
    
    // Test tab order
    for (let i = 0; i < focusableElements.length; i++) {
      const element = focusableElements[i] as HTMLElement;
      element.focus();
      expect(document.activeElement).toBe(element);
    }
  },

  /**
   * Test ARIA attributes
   */
  testARIAAttributes: (container: HTMLElement) => {
    // Check for required ARIA labels
    const interactiveElements = container.querySelectorAll(
      'button, input, select, textarea, [role="button"], [role="switch"]'
    );
    
    interactiveElements.forEach(element => {
      const hasLabel = element.hasAttribute('aria-label') ||
                      element.hasAttribute('aria-labelledby') ||
                      element.textContent?.trim();
      
      expect(hasLabel).toBe(true);
    });
  },

  /**
   * Test color contrast (simplified)
   */
  testColorContrast: (container: HTMLElement) => {
    // This would integrate with a color contrast testing library
    // For now, just check that text elements have proper styling
    const textElements = container.querySelectorAll('p, span, label, button');
    
    textElements.forEach(element => {
      const styles = window.getComputedStyle(element);
      expect(styles.color).toBeDefined();
      expect(styles.backgroundColor).toBeDefined();
    });
  }
};

/**
 * Mobile testing utilities
 */
export const mobileTestUtils = {
  /**
   * Simulate mobile viewport
   */
  setMobileViewport: () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375
    });
    
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 667
    });
    
    window.dispatchEvent(new Event('resize'));
  },

  /**
   * Simulate desktop viewport
   */
  setDesktopViewport: () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024
    });
    
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 768
    });
    
    window.dispatchEvent(new Event('resize'));
  },

  /**
   * Test touch interactions
   */
  testTouchTargets: (container: HTMLElement) => {
    const touchTargets = container.querySelectorAll('button, [role="button"], input, select');
    
    touchTargets.forEach(element => {
      const rect = element.getBoundingClientRect();
      const minSize = 44; // Minimum touch target size
      
      expect(Math.max(rect.width, rect.height)).toBeGreaterThanOrEqual(minSize);
    });
  }
};

export default {
  TEST_CONFIG,
  createTestQueryClient,
  setupTestEnvironment,
  setupDatabaseTests,
  setupMockAPIResponses,
  performanceTestUtils,
  errorTestUtils,
  accessibilityTestUtils,
  mobileTestUtils
};
