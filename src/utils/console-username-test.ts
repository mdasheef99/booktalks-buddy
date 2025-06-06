/**
 * Browser Console Test Script for Username Validation
 * 
 * Usage:
 * 1. Open browser console on any page of the app
 * 2. Copy and paste this script
 * 3. Run: testUsernameValidation('kant') or testUsernameValidation('admin')
 * 4. Check the detailed console output
 */

// Import validation functions (this will work in the browser context)
import { 
  validateUsername, 
  checkUsernameAvailability, 
  validateUsernameComprehensive 
} from './usernameValidation';
import { supabase } from '@/integrations/supabase/client';

// Test function that can be called from browser console
export async function testUsernameValidation(username: string) {
  console.log(`\n🧪 ===== TESTING USERNAME: "${username}" =====`);
  
  try {
    // 1. Test format validation
    console.log('\n📝 1. FORMAT VALIDATION TEST');
    const formatResult = validateUsername(username);
    console.log('Format validation result:', formatResult);
    
    // 2. Test direct database query
    console.log('\n🗄️ 2. DIRECT DATABASE QUERY TEST');
    const normalizedUsername = username.toLowerCase().trim();
    
    const { data: dbData, error: dbError } = await supabase
      .from('users')
      .select('id, username')
      .ilike('username', normalizedUsername)
      .limit(10);
    
    console.log('Database query result:', { data: dbData, error: dbError });
    
    if (dbData && dbData.length > 0) {
      console.log('Found existing usernames:', dbData.map(u => u.username));
    } else {
      console.log('No existing usernames found');
    }
    
    // 3. Test availability check function
    console.log('\n✅ 3. AVAILABILITY CHECK FUNCTION TEST');
    const availabilityResult = await checkUsernameAvailability(username);
    console.log('Availability check result:', availabilityResult);
    
    // 4. Test comprehensive validation
    console.log('\n🔬 4. COMPREHENSIVE VALIDATION TEST');
    const comprehensiveResult = await validateUsernameComprehensive(username);
    console.log('Comprehensive validation result:', comprehensiveResult);
    
    // 5. Summary
    console.log('\n📊 5. SUMMARY');
    console.log('Username:', username);
    console.log('Normalized:', normalizedUsername);
    console.log('Format Valid:', formatResult.isValid);
    console.log('Database Records Found:', dbData?.length || 0);
    console.log('Available (function):', availabilityResult);
    console.log('Overall Valid:', comprehensiveResult.isValid);
    console.log('Final Errors:', comprehensiveResult.errors);
    
    // 6. Check reserved words
    const RESERVED_WORDS = [
      'admin', 'administrator', 'moderator', 'mod', 'owner', 'manager',
      'support', 'help', 'api', 'www', 'mail', 'email', 'root', 'system',
      'bookconnect', 'staff', 'team', 'official', 'bot', 'service',
      'null', 'undefined', 'anonymous', 'guest', 'user', 'test',
      'club', 'store', 'platform', 'lead', 'member', 'delete', 'edit',
      'create', 'update', 'remove', 'ban', 'kick', 'mute', 'warn'
    ];
    
    const isReserved = RESERVED_WORDS.includes(normalizedUsername);
    console.log('Is Reserved Word:', isReserved);
    
    console.log(`\n🎯 ===== TEST COMPLETE FOR "${username}" =====\n`);
    
    return {
      username,
      normalizedUsername,
      formatValid: formatResult.isValid,
      formatErrors: formatResult.errors,
      databaseRecords: dbData?.length || 0,
      databaseData: dbData,
      availabilityResult,
      comprehensiveResult,
      isReserved
    };
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
    return { error: error.message };
  }
}

// Test multiple usernames at once
export async function testMultipleUsernames(usernames: string[]) {
  console.log(`\n🧪 ===== TESTING MULTIPLE USERNAMES =====`);
  console.log('Testing:', usernames);
  
  const results = [];
  
  for (const username of usernames) {
    const result = await testUsernameValidation(username);
    results.push(result);
    
    // Add delay to avoid overwhelming the database
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  console.log('\n📊 ===== SUMMARY OF ALL TESTS =====');
  results.forEach((result, index) => {
    if (result.error) {
      console.log(`${index + 1}. ${result.username}: ERROR - ${result.error}`);
    } else {
      console.log(`${index + 1}. ${result.username}: ${result.comprehensiveResult.isValid ? '✅ VALID' : '❌ INVALID'} (${result.comprehensiveResult.errors.join(', ')})`);
    }
  });
  
  return results;
}

// Get all usernames from database
export async function getAllDatabaseUsernames() {
  console.log('\n📋 ===== FETCHING ALL DATABASE USERNAMES =====');
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, email')
      .order('username');
    
    if (error) {
      console.error('Database error:', error);
      return [];
    }
    
    console.log(`Found ${data?.length || 0} users in database:`);
    data?.forEach((user, index) => {
      console.log(`${index + 1}. ${user.username} (${user.email}) [ID: ${user.id}]`);
    });
    
    return data?.map(u => u.username).filter(Boolean) || [];
  } catch (error) {
    console.error('Error fetching usernames:', error);
    return [];
  }
}

// Quick test for the reported issues
export async function testReportedIssues() {
  console.log('\n🐛 ===== TESTING REPORTED ISSUES =====');
  
  // Test Issue 1: "kant" not being flagged
  console.log('\n--- Issue 1: Testing "kant" ---');
  await testUsernameValidation('kant');
  
  // Test Issue 2: "admin" being flagged
  console.log('\n--- Issue 2: Testing "admin" ---');
  await testUsernameValidation('admin');
  
  // Test case variations
  console.log('\n--- Case Variations ---');
  await testMultipleUsernames(['Kant', 'KANT', 'Admin', 'ADMIN']);
  
  // Show all database usernames
  console.log('\n--- All Database Usernames ---');
  await getAllDatabaseUsernames();
}

// Make functions available globally for console use
if (typeof window !== 'undefined') {
  (window as any).testUsernameValidation = testUsernameValidation;
  (window as any).testMultipleUsernames = testMultipleUsernames;
  (window as any).getAllDatabaseUsernames = getAllDatabaseUsernames;
  (window as any).testReportedIssues = testReportedIssues;
  
  console.log(`
🧪 Username Validation Test Functions Available:

1. testUsernameValidation('username') - Test a single username
2. testMultipleUsernames(['user1', 'user2']) - Test multiple usernames
3. getAllDatabaseUsernames() - Show all usernames in database
4. testReportedIssues() - Test the specific reported issues

Example usage:
  testUsernameValidation('kant')
  testUsernameValidation('admin')
  testReportedIssues()
  `);
}
