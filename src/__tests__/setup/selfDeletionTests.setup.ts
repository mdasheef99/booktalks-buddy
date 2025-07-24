/**
 * Test Setup for Self-Deletion Request Tests
 * 
 * Provides common test utilities, mocks, and setup for self-deletion request testing
 */

import { vi } from 'vitest';

// Global test utilities
export const createMockUser = (overrides = {}) => ({
  id: 'user-123',
  email: 'user@example.com',
  displayname: 'Test User',
  username: 'testuser',
  ...overrides
});

export const createMockAdmin = (overrides = {}) => ({
  id: 'admin-456',
  email: 'admin@example.com',
  displayname: 'Admin User',
  username: 'admin',
  ...overrides
});

export const createMockClub = (overrides = {}) => ({
  id: 'club-123',
  name: 'Test Book Club',
  lead_user_id: 'user-123',
  created_at: '2024-01-01T00:00:00Z',
  ...overrides
});

export const createMockDeletionRequest = (overrides = {}) => ({
  id: 'request-123',
  user_id: 'user-123',
  reason: 'Test deletion reason',
  clubs_owned: [],
  created_at: '2024-01-15T10:30:00Z',
  ...overrides
});

// Common mock implementations
export const createMockSupabaseResponse = (data: any, error: any = null) => ({
  data,
  error
});

export const createMockSupabaseQuery = (responses: any[]) => {
  let callCount = 0;
  return vi.fn(() => {
    const response = responses[callCount] || responses[responses.length - 1];
    callCount++;
    return Promise.resolve(response);
  });
};

// Test data generators
export const generateMockRequests = (count: number) => {
  return Array.from({ length: count }, (_, index) => ({
    id: `request-${index + 1}`,
    user_id: `user-${index + 1}`,
    reason: `Test reason ${index + 1}`,
    clubs_owned: index % 2 === 0 ? [createMockClub({ id: `club-${index + 1}` })] : [],
    created_at: new Date(2024, 0, index + 1).toISOString(),
    user_name: `User ${index + 1}`,
    user_email: `user${index + 1}@example.com`
  }));
};

// Common test scenarios
export const testScenarios = {
  userWithClubs: {
    user: createMockUser(),
    clubs: [
      createMockClub({ id: 'club-1', name: 'Book Club Alpha' }),
      createMockClub({ id: 'club-2', name: 'Reading Circle Beta' })
    ],
    expectedClubOwnership: true
  },
  
  userWithoutClubs: {
    user: createMockUser({ id: 'user-no-clubs' }),
    clubs: [],
    expectedClubOwnership: false
  },
  
  adminUser: {
    user: createMockAdmin(),
    isStoreOwner: true,
    storeId: 'store-123',
    storeName: 'Test Store'
  }
};

// Mock implementations for common dependencies
export const mockAuthContext = (user = createMockUser()) => ({
  user,
  loading: false,
  signOut: vi.fn()
});

export const mockStoreOwnerAccess = (overrides = {}) => ({
  isStoreOwner: true,
  storeId: 'store-123',
  storeName: 'Test Store',
  loading: false,
  ...overrides
});

export const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn()
};

// Test assertion helpers
export const expectSuccessResult = (result: any, message?: string) => {
  expect(result.success).toBe(true);
  if (message) {
    expect(result.message).toContain(message);
  }
};

export const expectErrorResult = (result: any, message?: string) => {
  expect(result.success).toBe(false);
  if (message) {
    expect(result.message).toContain(message);
  }
};

export const expectToastCalled = (toastType: 'success' | 'error' | 'info' | 'warning', message?: string) => {
  expect(mockToast[toastType]).toHaveBeenCalled();
  if (message) {
    expect(mockToast[toastType]).toHaveBeenCalledWith(expect.stringContaining(message));
  }
};

// Database state helpers for integration tests
export class MockDatabase {
  private data: Record<string, any[]> = {};

  constructor() {
    this.reset();
  }

  reset() {
    this.data = {
      users: [createMockUser(), createMockAdmin()],
      book_clubs: [],
      self_deletion_requests: [],
      store_administrators: [
        {
          user_id: createMockAdmin().id,
          store_id: 'store-123',
          role: 'owner'
        }
      ]
    };
  }

  getTable(tableName: string) {
    return this.data[tableName] || [];
  }

  insert(tableName: string, record: any) {
    if (!this.data[tableName]) {
      this.data[tableName] = [];
    }
    const newRecord = { id: `${tableName}-${Date.now()}`, ...record };
    this.data[tableName].push(newRecord);
    return newRecord;
  }

  update(tableName: string, id: string, updates: any) {
    const table = this.data[tableName] || [];
    const index = table.findIndex(item => item.id === id);
    if (index >= 0) {
      this.data[tableName][index] = { ...table[index], ...updates };
      return this.data[tableName][index];
    }
    return null;
  }

  delete(tableName: string, id: string) {
    if (this.data[tableName]) {
      this.data[tableName] = this.data[tableName].filter(item => item.id !== id);
    }
  }

  find(tableName: string, predicate: (item: any) => boolean) {
    const table = this.data[tableName] || [];
    return table.find(predicate);
  }

  filter(tableName: string, predicate: (item: any) => boolean) {
    const table = this.data[tableName] || [];
    return table.filter(predicate);
  }

  count(tableName: string) {
    return (this.data[tableName] || []).length;
  }
}

// Export singleton instance for tests
export const mockDatabase = new MockDatabase();

// Cleanup helper
export const cleanupTests = () => {
  vi.clearAllMocks();
  mockDatabase.reset();
};

// Common test patterns
export const runAsyncTest = async (testFn: () => Promise<void>) => {
  try {
    await testFn();
  } finally {
    cleanupTests();
  }
};

export const withMockDatabase = (testFn: (db: MockDatabase) => Promise<void>) => {
  return async () => {
    const db = new MockDatabase();
    try {
      await testFn(db);
    } finally {
      db.reset();
    }
  };
};

// Test environment validation
export const validateTestEnvironment = () => {
  if (typeof vi === 'undefined') {
    throw new Error('Vitest is required for these tests');
  }
  
  if (typeof expect === 'undefined') {
    throw new Error('Test assertions are not available');
  }
};

// Initialize test environment
validateTestEnvironment();
