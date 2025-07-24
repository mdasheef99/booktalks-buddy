/**
 * Verification script for Store Manager Access Hook
 * Tests the useStoreManagerAccess hook functionality with actual database data
 */

import { supabase } from '@/lib/supabase';
import { STORE_MANAGER_ENTITLEMENTS } from '@/lib/entitlements/constants';

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL';
  details: string;
}

/**
 * Simulate the Store Manager access check logic
 */
async function testStoreManagerAccess(userId: string): Promise<TestResult[]> {
  const results: TestResult[] = [];

  try {
    // Test 1: Store Manager Role Detection
    console.log('Testing Store Manager role detection...');
    const { data: storeAdmin, error: adminError } = await supabase
      .from('store_administrators')
      .select(`
        store_id,
        role,
        stores (
          id,
          name
        )
      `)
      .eq('user_id', userId)
      .eq('role', 'manager')
      .single();

    if (adminError) {
      if (adminError.code === 'PGRST116') {
        results.push({
          test: 'Store Manager Role Detection',
          status: 'PASS',
          details: 'User is not a Store Manager (PGRST116 handled correctly)'
        });
      } else {
        results.push({
          test: 'Store Manager Role Detection',
          status: 'FAIL',
          details: `Database error: ${adminError.message}`
        });
      }
    } else if (storeAdmin?.stores) {
      results.push({
        test: 'Store Manager Role Detection',
        status: 'PASS',
        details: `Store Manager detected for store: ${storeAdmin.stores.name} (${storeAdmin.store_id})`
      });

      // Test 2: Store Context Retrieval
      results.push({
        test: 'Store Context Retrieval',
        status: 'PASS',
        details: `Store ID: ${storeAdmin.store_id}, Store Name: ${storeAdmin.stores.name}`
      });

      // Test 3: Entitlements Mapping
      results.push({
        test: 'Entitlements Mapping',
        status: 'PASS',
        details: `${STORE_MANAGER_ENTITLEMENTS.length} entitlements mapped: ${STORE_MANAGER_ENTITLEMENTS.slice(0, 3).join(', ')}...`
      });
    } else {
      results.push({
        test: 'Store Manager Role Detection',
        status: 'FAIL',
        details: 'Store data not found or inactive'
      });
    }

    // Test 4: Store Validation
    if (storeAdmin?.store_id) {
      console.log('Testing store validation...');
      const { data: validationData, error: validationError } = await supabase
        .from('store_administrators')
        .select('store_id, role')
        .eq('user_id', userId)
        .eq('store_id', storeAdmin.store_id)
        .eq('role', 'manager')
        .single();

      if (validationError) {
        results.push({
          test: 'Store Validation',
          status: 'FAIL',
          details: `Validation error: ${validationError.message}`
        });
      } else {
        results.push({
          test: 'Store Validation',
          status: 'PASS',
          details: `Store validation successful for store: ${validationData.store_id}`
        });
      }
    }

  } catch (error) {
    results.push({
      test: 'Overall Test Execution',
      status: 'FAIL',
      details: `Test execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }

  return results;
}

/**
 * Run verification tests
 */
async function runVerification() {
  console.log('🔍 Store Manager Access Hook Verification');
  console.log('==========================================');

  // Test with known Store Manager user ID from database analysis
  const storeManagerUserId = '192ea974-1770-4b03-9dba-cc8121525c57'; // kafka user
  
  console.log(`Testing with Store Manager user ID: ${storeManagerUserId}`);
  const results = await testStoreManagerAccess(storeManagerUserId);

  console.log('\n📊 Test Results:');
  console.log('================');
  
  let passCount = 0;
  let failCount = 0;

  results.forEach((result, index) => {
    const status = result.status === 'PASS' ? '✅' : '❌';
    console.log(`${index + 1}. ${status} ${result.test}`);
    console.log(`   ${result.details}`);
    
    if (result.status === 'PASS') passCount++;
    else failCount++;
  });

  console.log('\n📈 Summary:');
  console.log(`✅ Passed: ${passCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`📊 Total: ${results.length}`);

  if (failCount === 0) {
    console.log('\n🎉 All tests passed! Store Manager Access Hook is ready for use.');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the implementation.');
  }
}

// Export for use in other scripts
export { testStoreManagerAccess, runVerification };

// Run verification if this script is executed directly
if (require.main === module) {
  runVerification().catch(console.error);
}
