/**
 * Debug script for testing username validation issues
 * This script helps diagnose problems with username uniqueness validation
 */

import { supabase } from '@/integrations/supabase/client';
import { 
  validateUsername, 
  checkUsernameAvailability, 
  validateUsernameComprehensive 
} from './usernameValidation';

export interface DebugResult {
  username: string;
  formatValidation: any;
  availabilityCheck: boolean | null;
  comprehensiveValidation: any;
  databaseQuery: any;
  isReservedWord: boolean;
  normalizedUsername: string;
}

export async function debugUsernameValidation(username: string): Promise<DebugResult> {
  console.log(`🔍 Debugging username validation for: "${username}"`);
  
  const normalizedUsername = username.toLowerCase().trim();
  
  // Check if it's a reserved word
  const RESERVED_WORDS = [
    'admin', 'administrator', 'moderator', 'mod', 'owner', 'manager',
    'support', 'help', 'api', 'www', 'mail', 'email', 'root', 'system',
    'bookconnect', 'staff', 'team', 'official', 'bot', 'service',
    'null', 'undefined', 'anonymous', 'guest', 'user', 'test',
    'club', 'store', 'platform', 'lead', 'member', 'delete', 'edit',
    'create', 'update', 'remove', 'ban', 'kick', 'mute', 'warn'
  ];
  
  const isReservedWord = RESERVED_WORDS.includes(normalizedUsername);
  
  // 1. Test format validation
  console.log('📝 Testing format validation...');
  const formatValidation = validateUsername(username);
  console.log('Format validation result:', formatValidation);
  
  // 2. Test direct database query
  console.log('🗄️ Testing direct database query...');
  let databaseQuery = null;
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, username')
      .ilike('username', normalizedUsername)
      .limit(10); // Get more results for debugging
    
    databaseQuery = { data, error, count: data?.length || 0 };
    console.log('Database query result:', databaseQuery);
    
    if (data && data.length > 0) {
      console.log('Found existing usernames:', data.map(u => u.username));
    }
  } catch (error) {
    console.error('Database query error:', error);
    databaseQuery = { error, data: null, count: 0 };
  }
  
  // 3. Test availability check function
  console.log('✅ Testing availability check function...');
  let availabilityCheck = null;
  try {
    availabilityCheck = await checkUsernameAvailability(username);
    console.log('Availability check result:', availabilityCheck);
  } catch (error) {
    console.error('Availability check error:', error);
  }
  
  // 4. Test comprehensive validation
  console.log('🔬 Testing comprehensive validation...');
  let comprehensiveValidation = null;
  try {
    comprehensiveValidation = await validateUsernameComprehensive(username);
    console.log('Comprehensive validation result:', comprehensiveValidation);
  } catch (error) {
    console.error('Comprehensive validation error:', error);
  }
  
  const result: DebugResult = {
    username,
    formatValidation,
    availabilityCheck,
    comprehensiveValidation,
    databaseQuery,
    isReservedWord,
    normalizedUsername
  };
  
  console.log('🎯 Final debug result:', result);
  return result;
}

export async function debugMultipleUsernames(usernames: string[]): Promise<DebugResult[]> {
  console.log('🔍 Debugging multiple usernames:', usernames);
  
  const results: DebugResult[] = [];
  
  for (const username of usernames) {
    console.log(`\n--- Testing "${username}" ---`);
    const result = await debugUsernameValidation(username);
    results.push(result);
    
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return results;
}

export async function listAllUsernamesInDatabase(): Promise<string[]> {
  console.log('📋 Fetching all usernames from database...');

  try {
    // Try multiple approaches to get usernames
    console.log('🔍 Trying different query approaches...');

    // Approach 1: Select all columns to see what's there
    console.log('\n1. Getting all user data:');
    const allData = await supabase
      .from('users')
      .select('*')
      .limit(10);
    console.log('All user data:', allData);

    // Approach 2: Try specific username column
    console.log('\n2. Getting username column specifically:');
    const usernameData = await supabase
      .from('users')
      .select('username')
      .order('username');
    console.log('Username column data:', usernameData);

    // Approach 3: Try different possible column names
    console.log('\n3. Trying different column names:');
    const possibleColumns = ['username', 'user_name', 'name', 'login', 'handle'];

    for (const col of possibleColumns) {
      try {
        const test = await supabase
          .from('users')
          .select(col)
          .limit(1);
        console.log(`Column "${col}":`, test);
      } catch (e) {
        console.log(`Column "${col}" doesn't exist or error:`, e);
      }
    }

    // Approach 4: Search for "kant" specifically
    console.log('\n4. Searching for "kant" specifically:');
    const kantSearch = await supabase
      .from('users')
      .select('*')
      .or('username.eq.kant,username.eq.Kant,username.eq.KANT');
    console.log('Kant search result:', kantSearch);

    if (usernameData.error) {
      console.error('Error fetching usernames:', usernameData.error);
      return [];
    }

    const usernames = usernameData.data?.map(u => u.username).filter(Boolean) || [];
    console.log('📊 Final usernames found:', usernames);
    return usernames;
  } catch (error) {
    console.error('💥 Error fetching usernames:', error);
    return [];
  }
}

// Test specific cases mentioned in the issue
export async function testSpecificIssues(): Promise<void> {
  console.log('🐛 Testing specific reported issues...');
  
  // Test Issue 1: "kant" not being flagged
  console.log('\n=== Issue 1: Testing "kant" ===');
  await debugUsernameValidation('kant');
  
  // Test Issue 2: "admin" being flagged
  console.log('\n=== Issue 2: Testing "admin" ===');
  await debugUsernameValidation('admin');
  
  // Test case variations
  console.log('\n=== Testing case variations ===');
  await debugUsernameValidation('Kant');
  await debugUsernameValidation('KANT');
  await debugUsernameValidation('Admin');
  await debugUsernameValidation('ADMIN');
  
  // List all usernames in database
  console.log('\n=== All usernames in database ===');
  await listAllUsernamesInDatabase();
}

// Advanced database debugging function
export async function debugDatabaseConnection(): Promise<void> {
  console.log('🔧 ===== DATABASE CONNECTION DEBUG =====');

  try {
    // Test 1: Basic connection
    console.log('\n1. Testing basic database connection...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    console.log('Connection test:', { data: connectionTest, error: connectionError });

    // Test 2: Get table schema info
    console.log('\n2. Testing table structure...');
    const { data: schemaTest, error: schemaError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    console.log('Schema test:', { data: schemaTest, error: schemaError });

    // Test 3: Count total records
    console.log('\n3. Counting total records...');
    const { count, error: countError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    console.log('Total records count:', { count, error: countError });

    // Test 4: Try different search methods for "kant"
    console.log('\n4. Testing different search methods for "kant"...');

    const searchMethods = [
      { name: 'Exact match', query: supabase.from('users').select('*').eq('username', 'kant') },
      { name: 'Case insensitive ilike', query: supabase.from('users').select('*').ilike('username', 'kant') },
      { name: 'Case insensitive ilike with %', query: supabase.from('users').select('*').ilike('username', '%kant%') },
      { name: 'Like with %', query: supabase.from('users').select('*').like('username', '%kant%') },
      { name: 'Text search', query: supabase.from('users').select('*').textSearch('username', 'kant') },
      { name: 'Filter contains', query: supabase.from('users').select('*').filter('username', 'cs', '{"kant"}') }
    ];

    for (const method of searchMethods) {
      try {
        const result = await method.query;
        console.log(`${method.name}:`, result);
      } catch (error) {
        console.log(`${method.name} failed:`, error);
      }
    }

    // Test 5: Raw SQL if possible
    console.log('\n5. Testing raw SQL approach...');
    try {
      const { data: rawData, error: rawError } = await supabase
        .rpc('get_users_with_username', { search_username: 'kant' });
      console.log('Raw SQL result:', { data: rawData, error: rawError });
    } catch (error) {
      console.log('Raw SQL not available or failed:', error);
    }

  } catch (error) {
    console.error('💥 Database debug failed:', error);
  }
}

// Export for console testing
if (typeof window !== 'undefined') {
  (window as any).debugUsername = {
    debugUsernameValidation,
    debugMultipleUsernames,
    listAllUsernamesInDatabase,
    testSpecificIssues,
    debugDatabaseConnection
  };
}
