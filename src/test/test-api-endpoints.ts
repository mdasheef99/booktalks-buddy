/**
 * Test API endpoints for join request questions
 */

const PARMEDIS_CLUB_ID = '2267a485-8401-4447-8490-8ed2b1db2adc';

/**
 * Test the API endpoints directly
 */
export async function testAPIEndpoints() {
  console.log('=== Testing API Endpoints ===');

  try {
    // Test 1: GET /api/clubs/[clubId]/questions
    console.log('\n1. Testing GET /api/clubs/[clubId]/questions...');
    
    const response = await fetch(`/api/clubs/${PARMEDIS_CLUB_ID}/questions`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      console.error('❌ API request failed with status:', response.status);
      const errorText = await response.text();
      console.error('Error response:', errorText);
      return { success: false, error: `API returned ${response.status}` };
    }

    const contentType = response.headers.get('content-type');
    console.log('Content-Type:', contentType);

    if (!contentType || !contentType.includes('application/json')) {
      console.error('❌ API returned non-JSON response');
      const responseText = await response.text();
      console.error('Response text (first 500 chars):', responseText.substring(0, 500));
      return { success: false, error: 'API returned non-JSON response' };
    }

    const result = await response.json();
    console.log('✅ API Response:', result);

    if (result.success) {
      console.log(`✅ API returned ${result.questions?.length || 0} questions`);
      result.questions?.forEach((q: any, i: number) => {
        console.log(`  ${i + 1}. "${q.question_text}" ${q.is_required ? '(Required)' : '(Optional)'}`);
      });
    } else {
      console.error('❌ API returned error:', result.error);
    }

    return { success: true, apiResponse: result };

  } catch (error) {
    console.error('❌ Network error:', error);
    return { success: false, error: 'Network error occurred' };
  }
}

/**
 * Test if the API route exists by checking different paths
 */
export async function testAPIRouteExistence() {
  console.log('=== Testing API Route Existence ===');

  const testPaths = [
    `/api/clubs/${PARMEDIS_CLUB_ID}/questions`,
    `/api/clubs/test/questions`,
    '/api/clubs',
    '/api/health', // If this exists
  ];

  for (const path of testPaths) {
    try {
      console.log(`\nTesting: ${path}`);
      const response = await fetch(path, { method: 'GET' });
      console.log(`Status: ${response.status}`);
      
      if (response.status === 404) {
        console.log('❌ Route not found');
      } else if (response.status === 500) {
        console.log('⚠️ Route exists but has server error');
      } else {
        console.log('✅ Route exists');
      }
    } catch (error) {
      console.error(`❌ Error testing ${path}:`, error);
    }
  }
}

/**
 * Test environment variables and configuration
 */
export async function testEnvironmentConfig() {
  console.log('=== Testing Environment Configuration ===');

  // Check if we're in development mode
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('Current URL:', window.location.origin);

  // Test if Supabase is configured
  try {
    const { supabase } = await import('@/lib/supabase');
    
    // Test basic Supabase connection
    const { data, error } = await supabase
      .from('book_clubs')
      .select('id, name')
      .limit(1);

    if (error) {
      console.error('❌ Supabase connection error:', error);
    } else {
      console.log('✅ Supabase connection working');
    }
  } catch (error) {
    console.error('❌ Error importing Supabase:', error);
  }
}

/**
 * Comprehensive test function
 */
export async function runComprehensiveTest() {
  console.log('🚀 Running Comprehensive API Test for Parmedis Club');
  console.log('Club ID:', PARMEDIS_CLUB_ID);

  const results = {
    environment: await testEnvironmentConfig(),
    routes: await testAPIRouteExistence(),
    api: await testAPIEndpoints(),
  };

  console.log('\n📊 Test Summary:');
  console.log('Environment:', results.environment ? '✅' : '❌');
  console.log('Routes:', results.routes ? '✅' : '❌');
  console.log('API:', results.api?.success ? '✅' : '❌');

  if (results.api?.success) {
    console.log('\n🎉 All tests passed! The API should be working.');
    console.log('If the frontend is still not working, the issue is likely in the component logic.');
  } else {
    console.log('\n❌ API tests failed. This explains why the frontend is not working.');
    console.log('Recommended fixes:');
    console.log('1. Check if the API route files exist in pages/api/clubs/[clubId]/questions/');
    console.log('2. Verify environment variables are set correctly');
    console.log('3. Check server logs for detailed error messages');
  }

  return results;
}

// Make functions available globally for browser console
if (typeof window !== 'undefined') {
  (window as any).testAPIEndpoints = testAPIEndpoints;
  (window as any).testAPIRouteExistence = testAPIRouteExistence;
  (window as any).testEnvironmentConfig = testEnvironmentConfig;
  (window as any).runComprehensiveTest = runComprehensiveTest;
}
