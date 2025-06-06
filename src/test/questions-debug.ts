/**
 * Debug script to test join request questions functionality
 * Run this to verify the fixes work correctly
 */

import { getClubQuestions, getClubQuestionsStatus } from '@/lib/api/bookclubs/questions';
import { validateClubId, isValidUUID } from '@/lib/utils/validation';

// Test UUID validation
console.log('=== UUID Validation Tests ===');
console.log('Valid UUID:', isValidUUID('123e4567-e89b-12d3-a456-426614174000'));
console.log('Invalid UUID:', isValidUUID('invalid-uuid'));
console.log('Undefined:', isValidUUID('undefined'));
console.log('Null string:', isValidUUID('null'));
console.log('Empty string:', isValidUUID(''));

// Test club ID validation
console.log('\n=== Club ID Validation Tests ===');
console.log('Valid club ID:', validateClubId('123e4567-e89b-12d3-a456-426614174000'));
console.log('Invalid club ID:', validateClubId('invalid-uuid'));
console.log('Undefined club ID:', validateClubId('undefined'));

// Test API functions with invalid IDs
console.log('\n=== API Function Tests ===');

async function testAPIFunctions() {
  try {
    console.log('Testing getClubQuestions with undefined:');
    const result1 = await getClubQuestions('undefined');
    console.log('Result:', result1);

    console.log('\nTesting getClubQuestions with invalid UUID:');
    const result2 = await getClubQuestions('invalid-uuid');
    console.log('Result:', result2);

    console.log('\nTesting getClubQuestionsStatus with undefined:');
    const result3 = await getClubQuestionsStatus('undefined');
    console.log('Result:', result3);

    console.log('\nTesting getClubQuestionsStatus with invalid UUID:');
    const result4 = await getClubQuestionsStatus('invalid-uuid');
    console.log('Result:', result4);

  } catch (error) {
    console.error('Error in tests:', error);
  }
}

// Run tests if this file is executed directly
if (typeof window === 'undefined') {
  testAPIFunctions();
}

export { testAPIFunctions };
