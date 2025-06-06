/**
 * Supabase Real-time Mocking Utilities
 * 
 * Provides comprehensive mocking strategies for Supabase real-time subscriptions
 * Used across all progress tracking tests
 */

import { vi } from 'vitest';

export interface MockChannel {
  on: ReturnType<typeof vi.fn>;
  subscribe: ReturnType<typeof vi.fn>;
  unsubscribe: ReturnType<typeof vi.fn>;
}

export interface MockSupabaseClient {
  channel: ReturnType<typeof vi.fn>;
  auth: {
    getUser: ReturnType<typeof vi.fn>;
  };
}

/**
 * Creates a mock Supabase channel with configurable behavior
 */
export const createMockChannel = (): MockChannel => ({
  on: vi.fn().mockReturnThis(),
  subscribe: vi.fn((callback) => {
    callback('SUBSCRIBED');
    return { unsubscribe: vi.fn() };
  }),
  unsubscribe: vi.fn()
});

/**
 * Creates a mock Supabase client with real-time capabilities
 */
export const createMockSupabaseClient = (): MockSupabaseClient => ({
  channel: vi.fn(() => createMockChannel()),
  auth: {
    getUser: vi.fn().mockResolvedValue({
      data: { user: { id: 'test-user-id' } }
    })
  }
});

/**
 * Advanced channel mock that can simulate various subscription states
 */
export const createAdvancedMockChannel = (options: {
  subscriptionStatus?: 'SUBSCRIBED' | 'CHANNEL_ERROR' | 'TIMED_OUT' | 'CLOSED';
  delay?: number;
  shouldFail?: boolean;
} = {}) => {
  const {
    subscriptionStatus = 'SUBSCRIBED',
    delay = 0,
    shouldFail = false
  } = options;

  const channel: MockChannel = {
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn(),
    unsubscribe: vi.fn()
  };

  channel.subscribe.mockImplementation((callback) => {
    if (delay > 0) {
      setTimeout(() => callback(subscriptionStatus), delay);
    } else {
      callback(subscriptionStatus);
    }

    if (shouldFail) {
      throw new Error('Subscription failed');
    }

    return { unsubscribe: channel.unsubscribe };
  });

  return channel;
};

/**
 * Mock for simulating real-time events
 */
export class MockRealtimeSimulator {
  private handlers: Map<string, Function[]> = new Map();
  private channels: Map<string, MockChannel> = new Map();

  /**
   * Register a handler for a specific table/event combination
   */
  registerHandler(table: string, handler: Function) {
    if (!this.handlers.has(table)) {
      this.handlers.set(table, []);
    }
    this.handlers.get(table)!.push(handler);
  }

  /**
   * Simulate a database change event
   */
  simulateChange(table: string, event: {
    eventType: 'INSERT' | 'UPDATE' | 'DELETE';
    old?: any;
    new?: any;
  }) {
    const handlers = this.handlers.get(table) || [];
    handlers.forEach(handler => handler(event));
  }

  /**
   * Create a channel that registers handlers with this simulator
   */
  createChannel(channelName: string): MockChannel {
    const channel = createMockChannel();
    
    channel.on.mockImplementation((event, config, handler) => {
      if (config.table) {
        this.registerHandler(config.table, handler);
      }
      return channel;
    });

    this.channels.set(channelName, channel);
    return channel;
  }

  /**
   * Get all registered channels
   */
  getChannels() {
    return Array.from(this.channels.values());
  }

  /**
   * Clear all handlers and channels
   */
  reset() {
    this.handlers.clear();
    this.channels.clear();
  }
}

/**
 * Test data factories for consistent test data creation
 */
export const createTestProgressData = (overrides: Partial<any> = {}) => ({
  id: 'test-progress-id',
  user_id: 'test-user-id',
  club_id: 'test-club-id',
  book_id: 'test-book-id',
  status: 'reading' as const,
  progress_type: 'percentage' as const,
  progress_percentage: 50,
  current_progress: null,
  total_progress: null,
  notes: null,
  is_private: false,
  started_at: '2025-01-24T10:00:00Z',
  finished_at: null,
  created_at: '2025-01-24T10:00:00Z',
  last_updated: '2025-01-24T10:00:00Z',
  ...overrides
});

export const createTestClubStats = (overrides: Partial<any> = {}) => ({
  total_members: 5,
  not_started_count: 1,
  reading_count: 2,
  finished_count: 2,
  completion_percentage: 40,
  ...overrides
});

export const createTestMemberProgress = (count: number = 3) => {
  return Array.from({ length: count }, (_, i) => createTestProgressData({
    id: `progress-${i + 1}`,
    user_id: `user-${i + 1}`,
    progress_percentage: (i + 1) * 25,
    status: i === count - 1 ? 'finished' : 'reading'
  }));
};

/**
 * Network simulation utilities
 */
export const simulateNetworkConditions = {
  /**
   * Simulate slow network with delays
   */
  slow: (baseDelay: number = 1000) => ({
    delay: baseDelay + Math.random() * 500
  }),

  /**
   * Simulate intermittent connectivity
   */
  intermittent: (failureRate: number = 0.3) => ({
    shouldFail: Math.random() < failureRate
  }),

  /**
   * Simulate network partition
   */
  partition: () => ({
    subscriptionStatus: 'CHANNEL_ERROR' as const,
    shouldFail: true
  }),

  /**
   * Simulate timeout conditions
   */
  timeout: (delay: number = 5000) => ({
    subscriptionStatus: 'TIMED_OUT' as const,
    delay
  })
};

/**
 * Test setup utilities
 */
export const setupTestEnvironment = () => {
  const simulator = new MockRealtimeSimulator();
  
  const mockSupabase = {
    channel: vi.fn((channelName: string) => simulator.createChannel(channelName)),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id' } }
      })
    }
  };

  return { simulator, mockSupabase };
};

/**
 * Assertion helpers for real-time tests
 */
export const realtimeAssertions = {
  /**
   * Assert that a subscription was created correctly
   */
  expectSubscriptionCreated: (mockChannel: MockChannel, table: string, filter?: string) => {
    const expectedConfig: any = { table };
    if (filter) {
      expectedConfig.filter = filter;
    }

    // Check if the mock was called with the expected configuration
    const onCalls = mockChannel.on.mock.calls;
    const hasCorrectCall = onCalls.some(call =>
      call[0] === 'postgres_changes' &&
      call[1].table === table &&
      (!filter || call[1].filter === filter)
    );

    if (!hasCorrectCall) {
      throw new Error(`Expected subscription to be created for table ${table}${filter ? ` with filter ${filter}` : ''}`);
    }

    if (!mockChannel.subscribe.mock.calls.length) {
      throw new Error('Expected subscribe to be called');
    }
  },

  /**
   * Assert that subscription cleanup occurred
   */
  expectSubscriptionCleaned: (mockChannel: MockChannel) => {
    if (!mockChannel.unsubscribe.mock.calls.length) {
      throw new Error('Expected unsubscribe to be called');
    }
  },

  /**
   * Assert that real-time data updates occurred
   */
  expectDataUpdated: async (result: any, expectedData: any, timeout: number = 1000) => {
    await new Promise(resolve => setTimeout(resolve, timeout));

    // Simple object comparison
    const current = result.current;
    for (const key in expectedData) {
      if (current[key] !== expectedData[key]) {
        throw new Error(`Expected ${key} to be ${expectedData[key]}, but got ${current[key]}`);
      }
    }
  }
};

/**
 * Performance testing utilities
 */
export const performanceHelpers = {
  /**
   * Measure subscription setup time
   */
  measureSubscriptionTime: async (setupFn: () => Promise<void>) => {
    const start = performance.now();
    await setupFn();
    const end = performance.now();
    return end - start;
  },

  /**
   * Simulate high-frequency updates
   */
  simulateHighFrequencyUpdates: (
    simulator: MockRealtimeSimulator,
    table: string,
    count: number = 100,
    interval: number = 10
  ) => {
    return new Promise<void>((resolve) => {
      let updateCount = 0;
      
      const intervalId = setInterval(() => {
        simulator.simulateChange(table, {
          eventType: 'UPDATE',
          new: createTestProgressData({
            progress_percentage: updateCount,
            last_updated: new Date().toISOString()
          })
        });
        
        updateCount++;
        
        if (updateCount >= count) {
          clearInterval(intervalId);
          resolve();
        }
      }, interval);
    });
  }
};

/**
 * Error simulation utilities
 */
export const errorSimulation = {
  /**
   * Create a channel that fails after a delay
   */
  createFailingChannel: (delay: number = 1000) => {
    const channel = createMockChannel();
    
    channel.subscribe.mockImplementation((callback) => {
      setTimeout(() => callback('CHANNEL_ERROR'), delay);
      return { unsubscribe: channel.unsubscribe };
    });
    
    return channel;
  },

  /**
   * Simulate API errors
   */
  simulateAPIError: (mockFn: any, errorMessage: string = 'API Error') => {
    mockFn.mockRejectedValue(new Error(errorMessage));
  },

  /**
   * Simulate timeout errors
   */
  simulateTimeout: (mockFn: any, delay: number = 5000) => {
    mockFn.mockImplementation(() => 
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), delay)
      )
    );
  }
};

export default {
  createMockChannel,
  createMockSupabaseClient,
  createAdvancedMockChannel,
  MockRealtimeSimulator,
  createTestProgressData,
  createTestClubStats,
  createTestMemberProgress,
  simulateNetworkConditions,
  setupTestEnvironment,
  realtimeAssertions,
  performanceHelpers,
  errorSimulation
};
