import { vi } from 'vitest';

/**
 * Creates a standardized mock for Supabase client
 * This helps ensure consistent mocking across all tests
 * 
 * @param customData Optional custom data to include in the mock responses
 * @returns A mock Supabase client with chainable query methods
 */
export const createSupabaseMock = (customData: Record<string, any> = {}) => {
  // Default data for common tables
  const defaultData = {
    events: [],
    users: [],
    clubs: [],
    participants: [],
    notifications: [],
    // Add other tables as needed
  };
  
  // Merge default data with any custom data provided
  const data = { ...defaultData, ...customData };
  
  // Create a chainable query builder that tracks method calls
  const createQueryChain = (tableName: string) => {
    const chain = {
      // Store method calls for assertions
      calls: [] as Array<{ method: string, args: any[] }>,
      
      // Current data for this chain
      data: data[tableName] || [],
      
      // Track method calls
      _trackCall: function(method: string, args: any[]) {
        this.calls.push({ method, args });
        return this;
      },
      
      // Query builder methods
      select: function(...args: any[]) { return this._trackCall('select', args); },
      from: function(...args: any[]) { return this._trackCall('from', args); },
      eq: function(...args: any[]) { return this._trackCall('eq', args); },
      neq: function(...args: any[]) { return this._trackCall('neq', args); },
      gt: function(...args: any[]) { return this._trackCall('gt', args); },
      gte: function(...args: any[]) { return this._trackCall('gte', args); },
      lt: function(...args: any[]) { return this._trackCall('lt', args); },
      lte: function(...args: any[]) { return this._trackCall('lte', args); },
      order: function(...args: any[]) { return this._trackCall('order', args); },
      limit: function(...args: any[]) { return this._trackCall('limit', args); },
      in: function(...args: any[]) { return this._trackCall('in', args); },
      is: function(...args: any[]) { return this._trackCall('is', args); },
      
      // Result methods
      single: function() {
        return Promise.resolve({ 
          data: this.data.length > 0 ? this.data[0] : null, 
          error: null 
        });
      },
      
      maybeSingle: function() {
        return Promise.resolve({ 
          data: this.data.length > 0 ? this.data[0] : null, 
          error: null 
        });
      },
      
      then: function(callback: (result: { data: any[], error: null | Error }) => any) {
        return Promise.resolve().then(() => callback({ 
          data: this.data, 
          error: null 
        }));
      }
    };
    
    return chain;
  };
  
  // Create the mock Supabase client
  return {
    // Database query methods
    from: (tableName: string) => createQueryChain(tableName),
    
    // Auth methods
    auth: {
      getUser: vi.fn().mockResolvedValue({ 
        data: { user: { id: 'test-user-id' } },
        error: null
      }),
      getSession: vi.fn().mockResolvedValue({
        data: { 
          session: { 
            user: { id: 'test-user-id' } 
          } 
        },
        error: null
      }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      // Add other auth methods as needed
    },
    
    // Storage methods
    storage: {
      from: (bucketName: string) => ({
        upload: vi.fn().mockResolvedValue({ data: { path: `${bucketName}/test-file` }, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: `https://test-storage/${bucketName}/test-file` } }),
        remove: vi.fn().mockResolvedValue({ data: null, error: null }),
        // Add other storage methods as needed
      }),
    },
    
    // Realtime methods
    channel: (channelName: string) => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockImplementation((callback) => {
        // Optionally trigger the callback immediately for testing
        if (callback) callback();
        return {
          unsubscribe: vi.fn()
        };
      }),
    }),
  };
};

/**
 * Helper to mock entitlements for testing permission-based features
 * 
 * @param entitlements Array of entitlements to mock for the user
 * @returns Mocked entitlements functions
 */
export const mockEntitlements = (entitlements: string[] = ['STORE_OWNER', 'CLUB_OWNER']) => {
  return {
    calculateUserEntitlements: vi.fn().mockResolvedValue(entitlements),
    hasContextualEntitlement: vi.fn().mockImplementation((userId, entitlement) => {
      return Promise.resolve(entitlements.includes(entitlement));
    }),
    getUserEntitlements: vi.fn().mockResolvedValue(entitlements)
  };
};
