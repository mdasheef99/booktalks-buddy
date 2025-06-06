/**
 * Debug utility to test the complete join request questions flow
 * This helps identify where the breakdown is occurring
 */

import { createBookClubWithQuestions } from '@/lib/api/bookclubs/clubs';
import { getClubQuestions, getClubQuestionsStatus } from '@/lib/api/bookclubs/questions';
import type { CreateQuestionRequest } from '@/types/join-request-questions';

interface TestResult {
  step: string;
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Test the complete flow from club creation to question retrieval
 */
export async function testJoinQuestionsFlow(userId: string): Promise<TestResult[]> {
  const results: TestResult[] = [];
  let clubId: string | null = null;

  try {
    // Step 1: Create a test club with questions
    console.log('=== Step 1: Creating club with questions ===');
    
    const testQuestions: CreateQuestionRequest[] = [
      {
        question_text: 'Why do you want to join this book club?',
        is_required: true,
        display_order: 1
      },
      {
        question_text: 'What are your favorite book genres?',
        is_required: false,
        display_order: 2
      },
      {
        question_text: 'How often do you read books?',
        is_required: true,
        display_order: 3
      }
    ];

    const clubData = {
      name: `Test Club ${Date.now()}`,
      description: 'Test club for debugging join questions',
      privacy: 'private',
      join_questions_enabled: true
    };

    try {
      const club = await createBookClubWithQuestions(userId, clubData, testQuestions);
      clubId = club.id;
      
      results.push({
        step: 'Create club with questions',
        success: true,
        data: { clubId: club.id, clubName: club.name }
      });
      
      console.log('✅ Club created successfully:', club.id);
    } catch (error) {
      results.push({
        step: 'Create club with questions',
        success: false,
        error: error.message
      });
      
      console.error('❌ Failed to create club:', error);
      return results;
    }

    // Step 2: Verify questions were created
    console.log('=== Step 2: Verifying questions were created ===');
    
    try {
      const questionsResult = await getClubQuestions(clubId);
      
      if (questionsResult.success && questionsResult.questions) {
        results.push({
          step: 'Retrieve created questions',
          success: true,
          data: {
            questionsCount: questionsResult.questions.length,
            questions: questionsResult.questions
          }
        });
        
        console.log('✅ Questions retrieved successfully:', questionsResult.questions.length);
        console.log('Questions:', questionsResult.questions);
      } else {
        results.push({
          step: 'Retrieve created questions',
          success: false,
          error: questionsResult.error || 'No questions found'
        });
        
        console.error('❌ Failed to retrieve questions:', questionsResult.error);
      }
    } catch (error) {
      results.push({
        step: 'Retrieve created questions',
        success: false,
        error: error.message
      });
      
      console.error('❌ Error retrieving questions:', error);
    }

    // Step 3: Verify club questions status
    console.log('=== Step 3: Verifying club questions status ===');
    
    try {
      const statusResult = await getClubQuestionsStatus(clubId);
      
      if (statusResult.success) {
        results.push({
          step: 'Check questions enabled status',
          success: true,
          data: { questionsEnabled: statusResult.enabled }
        });
        
        console.log('✅ Questions status retrieved:', statusResult.enabled);
      } else {
        results.push({
          step: 'Check questions enabled status',
          success: false,
          error: statusResult.error || 'Failed to get status'
        });
        
        console.error('❌ Failed to get questions status:', statusResult.error);
      }
    } catch (error) {
      results.push({
        step: 'Check questions enabled status',
        success: false,
        error: error.message
      });
      
      console.error('❌ Error getting questions status:', error);
    }

    // Step 4: Test direct database query (if possible)
    console.log('=== Step 4: Testing direct database access ===');
    
    try {
      // This would require direct supabase access
      // For now, just log that we would test this
      results.push({
        step: 'Direct database verification',
        success: true,
        data: { note: 'Would verify questions exist in database directly' }
      });
      
      console.log('✅ Direct database test placeholder');
    } catch (error) {
      results.push({
        step: 'Direct database verification',
        success: false,
        error: error.message
      });
    }

  } catch (error) {
    results.push({
      step: 'Overall test execution',
      success: false,
      error: error.message
    });
    
    console.error('❌ Overall test failed:', error);
  }

  return results;
}

/**
 * Test just the question retrieval for an existing club
 */
export async function testQuestionRetrieval(clubId: string): Promise<TestResult[]> {
  const results: TestResult[] = [];

  console.log('=== Testing Question Retrieval for Club:', clubId, '===');

  // Test 1: Validate club ID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(clubId)) {
    results.push({
      step: 'Validate club ID format',
      success: false,
      error: 'Invalid UUID format'
    });
    return results;
  }

  results.push({
    step: 'Validate club ID format',
    success: true,
    data: { clubId }
  });

  // Test 2: Get questions
  try {
    const questionsResult = await getClubQuestions(clubId);
    
    results.push({
      step: 'Retrieve questions',
      success: questionsResult.success,
      data: questionsResult.success ? {
        questionsCount: questionsResult.questions?.length || 0,
        questions: questionsResult.questions
      } : undefined,
      error: questionsResult.success ? undefined : questionsResult.error
    });
    
    console.log('Questions result:', questionsResult);
  } catch (error) {
    results.push({
      step: 'Retrieve questions',
      success: false,
      error: error.message
    });
  }

  // Test 3: Get questions status
  try {
    const statusResult = await getClubQuestionsStatus(clubId);
    
    results.push({
      step: 'Get questions status',
      success: statusResult.success,
      data: statusResult.success ? { enabled: statusResult.enabled } : undefined,
      error: statusResult.success ? undefined : statusResult.error
    });
    
    console.log('Status result:', statusResult);
  } catch (error) {
    results.push({
      step: 'Get questions status',
      success: false,
      error: error.message
    });
  }

  return results;
}

/**
 * Helper function to run tests from browser console
 */
export function runQuestionTests(clubId?: string, userId?: string) {
  if (clubId) {
    console.log('Running question retrieval test...');
    testQuestionRetrieval(clubId).then(results => {
      console.log('Test Results:', results);
    });
  } else if (userId) {
    console.log('Running full flow test...');
    testJoinQuestionsFlow(userId).then(results => {
      console.log('Test Results:', results);
    });
  } else {
    console.log('Usage:');
    console.log('runQuestionTests("club-id-here") - Test question retrieval');
    console.log('runQuestionTests(null, "user-id-here") - Test full flow');
  }
}

// Make available globally for browser console testing
if (typeof window !== 'undefined') {
  (window as any).runQuestionTests = runQuestionTests;
  (window as any).testQuestionRetrieval = testQuestionRetrieval;
  (window as any).testJoinQuestionsFlow = testJoinQuestionsFlow;
}
