// ProfileService Verification and Testing Utilities
// This file contains utilities to verify the profileService implementation

import { 
  getUserProfile, 
  getUserProfiles, 
  updateUserProfile, 
  createUserProfile,
  createUserProfileLegacy,
  getUserProfileByUsername,
  clearProfileCache,
  type UserProfile,
  type ProfileUpdateData,
  type ProfileCreateData
} from '@/services/profileService';

// Test data for verification
export const TEST_USER_DATA: ProfileCreateData = {
  id: 'test-user-123',
  username: 'test_user',
  email: 'test@example.com',
  displayname: 'Test User Display'
};

export const TEST_UPDATE_DATA: ProfileUpdateData = {
  displayname: 'Updated Display Name',
  bio: 'This is a test bio',
  favorite_author: 'Test Author',
  favorite_genre: 'Test Genre'
};

/**
 * Verify that all ProfileService functions have correct TypeScript types
 */
export function verifyProfileServiceTypes(): boolean {
  try {
    // Test function signatures exist and have correct types
    const getUserProfileType: (userId: string) => Promise<UserProfile | null> = getUserProfile;
    const getUserProfilesType: (userIds: string[]) => Promise<Map<string, UserProfile>> = getUserProfiles;
    const updateUserProfileType: (userId: string, updates: ProfileUpdateData) => Promise<UserProfile | null> = updateUserProfile;
    const createUserProfileType: (profileData: ProfileCreateData) => Promise<UserProfile | null> = createUserProfile;
    const createUserProfileLegacyType: (userId: string, username: string, email: string, displayName?: string) => Promise<UserProfile | null> = createUserProfileLegacy;
    const getUserProfileByUsernameType: (username: string) => Promise<UserProfile | null> = getUserProfileByUsername;
    const clearProfileCacheType: () => void = clearProfileCache;

    // Verify types are assignable (this will cause TypeScript errors if types don't match)
    console.log('All ProfileService function types verified successfully');
    return true;
  } catch (error) {
    console.error('ProfileService type verification failed:', error);
    return false;
  }
}

/**
 * Verify UserProfile interface structure
 */
export function verifyUserProfileInterface(): boolean {
  try {
    const testProfile: UserProfile = {
      id: 'test',
      username: 'test_user',
      email: 'test@example.com',
      avatar_url: null,
      displayname: 'Test Display Name',
      favorite_author: 'Test Author',
      favorite_genre: 'Test Genre',
      bio: 'Test bio',
      account_tier: 'free'
    };

    // Verify all required fields are present
    const requiredFields = ['id', 'username', 'email', 'avatar_url', 'displayname', 'favorite_author', 'favorite_genre', 'bio', 'account_tier'];
    const missingFields = requiredFields.filter(field => !(field in testProfile));
    
    if (missingFields.length > 0) {
      console.error('Missing required fields in UserProfile:', missingFields);
      return false;
    }

    console.log('UserProfile interface structure verified successfully');
    return true;
  } catch (error) {
    console.error('UserProfile interface verification failed:', error);
    return false;
  }
}

/**
 * Test ProfileUpdateData type
 */
export function verifyProfileUpdateDataType(): boolean {
  try {
    // Test valid update data
    const validUpdate: ProfileUpdateData = {
      displayname: 'New Display Name',
      bio: 'New bio',
      favorite_author: 'New Author',
      favorite_genre: 'New Genre'
    };

    // Test partial update data
    const partialUpdate: ProfileUpdateData = {
      displayname: 'Only display name'
    };

    // Test empty update data
    const emptyUpdate: ProfileUpdateData = {};

    console.log('ProfileUpdateData type verified successfully');
    return true;
  } catch (error) {
    console.error('ProfileUpdateData type verification failed:', error);
    return false;
  }
}

/**
 * Test ProfileCreateData type
 */
export function verifyProfileCreateDataType(): boolean {
  try {
    // Test required fields
    const validCreateData: ProfileCreateData = {
      id: 'test-id',
      username: 'test_user',
      email: 'test@example.com'
    };

    // Test with optional displayname
    const createDataWithDisplayName: ProfileCreateData = {
      id: 'test-id',
      username: 'test_user',
      email: 'test@example.com',
      displayname: 'Test Display Name'
    };

    // Test with null displayname
    const createDataWithNullDisplayName: ProfileCreateData = {
      id: 'test-id',
      username: 'test_user',
      email: 'test@example.com',
      displayname: null
    };

    console.log('ProfileCreateData type verified successfully');
    return true;
  } catch (error) {
    console.error('ProfileCreateData type verification failed:', error);
    return false;
  }
}

/**
 * Run all verification tests
 */
export function runAllVerificationTests(): boolean {
  console.log('Running ProfileService verification tests...');
  
  const tests = [
    { name: 'Function Types', test: verifyProfileServiceTypes },
    { name: 'UserProfile Interface', test: verifyUserProfileInterface },
    { name: 'ProfileUpdateData Type', test: verifyProfileUpdateDataType },
    { name: 'ProfileCreateData Type', test: verifyProfileCreateDataType }
  ];

  let allPassed = true;
  const results: { name: string; passed: boolean }[] = [];

  for (const { name, test } of tests) {
    try {
      const passed = test();
      results.push({ name, passed });
      if (!passed) {
        allPassed = false;
      }
    } catch (error) {
      console.error(`Test "${name}" threw an error:`, error);
      results.push({ name, passed: false });
      allPassed = false;
    }
  }

  // Print results
  console.log('\n=== ProfileService Verification Results ===');
  results.forEach(({ name, passed }) => {
    console.log(`${passed ? '✅' : '❌'} ${name}`);
  });
  console.log(`\nOverall: ${allPassed ? '✅ All tests passed' : '❌ Some tests failed'}`);

  return allPassed;
}

/**
 * Mock data for testing components
 */
export const MOCK_USER_PROFILES: UserProfile[] = [
  {
    id: 'user-1',
    username: 'bookworm_jane',
    email: 'jane@example.com',
    avatar_url: null,
    displayname: 'Jane Smith',
    favorite_author: 'Jane Austen',
    favorite_genre: 'Classic Literature',
    bio: 'Avid reader and book club enthusiast',
    account_tier: 'privileged'
  },
  {
    id: 'user-2',
    username: 'reader_bob',
    email: 'bob@example.com',
    avatar_url: null,
    displayname: null, // No display name set
    favorite_author: 'Stephen King',
    favorite_genre: 'Horror',
    bio: 'Love scary stories!',
    account_tier: 'free'
  },
  {
    id: 'user-3',
    username: 'literature_lover',
    email: 'lover@example.com',
    avatar_url: null,
    displayname: 'Literary Enthusiast',
    favorite_author: 'Virginia Woolf',
    favorite_genre: 'Modernist Literature',
    bio: 'Exploring the depths of human consciousness through literature',
    account_tier: 'privileged_plus'
  }
];

/**
 * Utility to create a mock profile cache for testing
 */
export function createMockProfileCache(): Map<string, UserProfile> {
  const cache = new Map<string, UserProfile>();
  MOCK_USER_PROFILES.forEach(profile => {
    cache.set(profile.id, profile);
  });
  return cache;
}
