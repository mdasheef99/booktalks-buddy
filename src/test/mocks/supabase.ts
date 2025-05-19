/**
 * Supabase Mock for Testing
 * 
 * This file provides a chainable mock for the Supabase client
 * that can be used in tests to simulate Supabase API calls
 * without making actual network requests.
 */

import { vi } from 'vitest';

/**
 * Creates a chainable mock object for Supabase
 * This allows for fluent method chaining in tests
 */
const createSupabaseMock = () => {
  const mock = {
    // Database query methods
    from: vi.fn(() => mock),
    select: vi.fn(() => mock),
    insert: vi.fn(() => mock),
    update: vi.fn(() => mock),
    delete: vi.fn(() => mock),
    upsert: vi.fn(() => mock),
    
    // Query filters and modifiers
    eq: vi.fn(() => mock),
    neq: vi.fn(() => mock),
    gt: vi.fn(() => mock),
    gte: vi.fn(() => mock),
    lt: vi.fn(() => mock),
    lte: vi.fn(() => mock),
    like: vi.fn(() => mock),
    ilike: vi.fn(() => mock),
    is: vi.fn(() => mock),
    in: vi.fn(() => mock),
    contains: vi.fn(() => mock),
    containedBy: vi.fn(() => mock),
    range: vi.fn(() => mock),
    overlaps: vi.fn(() => mock),
    textSearch: vi.fn(() => mock),
    match: vi.fn(() => mock),
    not: vi.fn(() => mock),
    or: vi.fn(() => mock),
    and: vi.fn(() => mock),
    
    // Result modifiers
    order: vi.fn(() => mock),
    limit: vi.fn(() => mock),
    range: vi.fn(() => mock),
    single: vi.fn(),
    maybeSingle: vi.fn(),
    
    // Storage methods
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        download: vi.fn(),
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://example.com/test.jpg' } })),
        list: vi.fn(),
        remove: vi.fn(),
        createSignedUrl: vi.fn(),
        createSignedUrls: vi.fn(),
        updateSignedUrl: vi.fn(),
        updateSignedUrls: vi.fn()
      }))
    },
    
    // Auth methods
    auth: {
      getUser: vi.fn(),
      getSession: vi.fn(),
      getSessionFromUrl: vi.fn(),
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signInWithOAuth: vi.fn(),
      signInWithOtp: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(),
      refreshSession: vi.fn(),
      setSession: vi.fn(),
      updateUser: vi.fn()
    },
    
    // Realtime methods
    channel: vi.fn(() => ({
      on: vi.fn(() => ({
        subscribe: vi.fn(() => ({
          unsubscribe: vi.fn()
        }))
      }))
    }))
  };
  
  return mock;
};

// Export the mock
export const supabaseMock = createSupabaseMock();
