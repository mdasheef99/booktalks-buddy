import '@testing-library/jest-dom'

// Mock Supabase client
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
  },
}))

// Global test setup
beforeAll(() => {
  // Setup code that runs before all tests
})

afterAll(() => {
  // Cleanup code that runs after all tests
})
