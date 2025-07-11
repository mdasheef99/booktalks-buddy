import '@testing-library/jest-dom'
import { vi } from 'vitest'

/**
 * Create a chainable mock for Supabase
 * This allows for proper method chaining in tests
 */
const createSupabaseMock = () => {
  // Create a base mock object with common methods
  const mock = {
    from: vi.fn(),
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    eq: vi.fn(),
    neq: vi.fn(),
    gt: vi.fn(),
    gte: vi.fn(),
    lt: vi.fn(),
    lte: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
    single: vi.fn(),
    in: vi.fn(),
    is: vi.fn(),
    match: vi.fn(),
    or: vi.fn(),
    and: vi.fn(),
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: { path: 'test-path' }, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/test.jpg' } }),
        remove: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
    },
    auth: {
      getUser: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
    },
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
    }),
    rpc: vi.fn().mockImplementation((functionName, params) => {
      // Mock feature flag calls to return enabled for subscription_validation_fix
      if (functionName === 'is_feature_enabled' && params?.p_flag_key === 'subscription_validation_fix') {
        return Promise.resolve({ data: true, error: null });
      }
      // Default to false for other feature flags
      return Promise.resolve({ data: false, error: null });
    }),
  }

  // Setup method chaining
  mock.from.mockReturnValue(mock)
  mock.select.mockReturnValue(mock)
  mock.insert.mockReturnValue(mock)
  mock.update.mockReturnValue(mock)
  mock.delete.mockReturnValue(mock)
  mock.eq.mockReturnValue(mock)
  mock.neq.mockReturnValue(mock)
  mock.gt.mockReturnValue(mock)
  mock.gte.mockReturnValue(mock)
  mock.lt.mockReturnValue(mock)
  mock.lte.mockReturnValue(mock)
  mock.order.mockReturnValue(mock)
  mock.limit.mockReturnValue(mock)
  mock.in.mockReturnValue(mock)
  mock.is.mockReturnValue(mock)
  mock.match.mockReturnValue(mock)
  mock.or.mockReturnValue(mock)
  mock.and.mockReturnValue(mock)

  // Special handling for single() - should return a resolved promise with data structure
  mock.single.mockResolvedValue({ data: null, error: null })

  return mock
}

// Create and export the mock
export const supabaseMock = createSupabaseMock()

// Mock Supabase client
vi.mock('../lib/supabase', () => ({
  supabase: supabaseMock,
}))

// Global test setup
beforeAll(() => {
  // Setup code that runs before all tests
})

afterAll(() => {
  // Cleanup code that runs after all tests
})
