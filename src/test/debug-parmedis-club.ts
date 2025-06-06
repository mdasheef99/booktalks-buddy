/**
 * Debug utility specifically for the Parmedis club issue
 */

import { supabase } from '@/lib/supabase';
import { getClubQuestions } from '@/lib/api/bookclubs/questions';

const PARMEDIS_CLUB_ID = '2267a485-8401-4447-8490-8ed2b1db2adc';

/**
 * Debug the specific Parmedis club issue
 */
export async function debugParmedisClub() {
  console.log('=== Debugging Parmedis Club Issue ===');
  console.log('Club ID:', PARMEDIS_CLUB_ID);

  try {
    // Step 1: Check if club exists and its settings
    console.log('\n1. Checking club existence and settings...');
    const { data: club, error: clubError } = await supabase
      .from('book_clubs')
      .select('id, name, privacy, join_questions_enabled, lead_user_id')
      .eq('id', PARMEDIS_CLUB_ID)
      .single();

    if (clubError) {
      console.error('❌ Error fetching club:', clubError);
      return { success: false, error: clubError.message };
    }

    if (!club) {
      console.error('❌ Club not found');
      return { success: false, error: 'Club not found' };
    }

    console.log('✅ Club found:', {
      name: club.name,
      privacy: club.privacy,
      join_questions_enabled: club.join_questions_enabled,
      lead_user_id: club.lead_user_id
    });

    // Step 2: Check if questions exist in database
    console.log('\n2. Checking questions in database...');
    const { data: questions, error: questionsError } = await supabase
      .from('club_join_questions')
      .select('*')
      .eq('club_id', PARMEDIS_CLUB_ID)
      .order('display_order', { ascending: true });

    if (questionsError) {
      console.error('❌ Error fetching questions:', questionsError);
      return { success: false, error: questionsError.message };
    }

    console.log(`✅ Questions found in database: ${questions?.length || 0}`);
    questions?.forEach((q, i) => {
      console.log(`  ${i + 1}. "${q.question_text}" ${q.is_required ? '(Required)' : '(Optional)'} [Order: ${q.display_order}]`);
    });

    // Step 3: Test the API function
    console.log('\n3. Testing getClubQuestions API function...');
    const apiResult = await getClubQuestions(PARMEDIS_CLUB_ID);
    
    console.log('API Result:', {
      success: apiResult.success,
      questionsCount: apiResult.questions?.length || 0,
      error: apiResult.error
    });

    if (apiResult.success && apiResult.questions) {
      console.log('✅ API returned questions successfully');
      apiResult.questions.forEach((q, i) => {
        console.log(`  ${i + 1}. "${q.question_text}" ${q.is_required ? '(Required)' : '(Optional)'}`);
      });
    } else {
      console.error('❌ API failed to return questions:', apiResult.error);
    }

    // Step 4: Check RLS policies
    console.log('\n4. Testing RLS policy access...');
    
    // Test if we can read questions without authentication (should work with public policy)
    const { data: publicQuestions, error: publicError } = await supabase
      .from('club_join_questions')
      .select('id, question_text, is_required, display_order')
      .eq('club_id', PARMEDIS_CLUB_ID);

    if (publicError) {
      console.error('❌ RLS policy blocking public access:', publicError);
    } else {
      console.log(`✅ RLS policy allows public access: ${publicQuestions?.length || 0} questions`);
    }

    // Step 5: Diagnosis and recommendations
    console.log('\n5. Diagnosis:');
    
    if (!club.join_questions_enabled) {
      console.log('❌ ISSUE: join_questions_enabled is false');
      console.log('💡 SOLUTION: Enable questions for the club');
    }

    if (club.privacy !== 'private') {
      console.log('❌ ISSUE: Club is not private');
      console.log('💡 SOLUTION: Questions only work for private clubs');
    }

    if (!questions || questions.length === 0) {
      console.log('❌ ISSUE: No questions exist in database');
      console.log('💡 SOLUTION: Create questions for the club');
    }

    if (!apiResult.success) {
      console.log('❌ ISSUE: API function failing');
      console.log('💡 SOLUTION: Check API implementation and RLS policies');
    }

    return {
      success: true,
      club,
      questions: questions || [],
      apiResult,
      recommendations: generateRecommendations(club, questions, apiResult)
    };

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return { success: false, error: 'Unexpected error occurred' };
  }
}

function generateRecommendations(club: any, questions: any[], apiResult: any): string[] {
  const recommendations: string[] = [];

  if (!club.join_questions_enabled) {
    recommendations.push('Enable join_questions_enabled for the club');
  }

  if (club.privacy !== 'private') {
    recommendations.push('Change club privacy to "private"');
  }

  if (!questions || questions.length === 0) {
    recommendations.push('Create at least one question for the club');
  }

  if (!apiResult.success) {
    recommendations.push('Fix API function or RLS policies');
  }

  if (recommendations.length === 0) {
    recommendations.push('All settings appear correct - check frontend component logic');
  }

  return recommendations;
}

/**
 * Quick fix function to enable questions and create sample questions
 */
export async function quickFixParmedisClub() {
  console.log('=== Quick Fix for Parmedis Club ===');

  try {
    // Step 1: Enable questions
    console.log('1. Enabling join questions...');
    const { error: enableError } = await supabase
      .from('book_clubs')
      .update({ join_questions_enabled: true })
      .eq('id', PARMEDIS_CLUB_ID);

    if (enableError) {
      console.error('❌ Failed to enable questions:', enableError);
      return { success: false, error: enableError.message };
    }

    console.log('✅ Questions enabled');

    // Step 2: Check if questions already exist
    const { data: existingQuestions } = await supabase
      .from('club_join_questions')
      .select('id')
      .eq('club_id', PARMEDIS_CLUB_ID);

    if (existingQuestions && existingQuestions.length > 0) {
      console.log(`✅ Questions already exist (${existingQuestions.length})`);
      return { success: true, message: 'Questions already exist' };
    }

    // Step 3: Create sample questions
    console.log('2. Creating sample questions...');
    const sampleQuestions = [
      {
        club_id: PARMEDIS_CLUB_ID,
        question_text: 'Why do you want to join this book club?',
        is_required: true,
        display_order: 1
      },
      {
        club_id: PARMEDIS_CLUB_ID,
        question_text: 'What are your favorite book genres?',
        is_required: false,
        display_order: 2
      }
    ];

    const { data: createdQuestions, error: createError } = await supabase
      .from('club_join_questions')
      .insert(sampleQuestions)
      .select();

    if (createError) {
      console.error('❌ Failed to create questions:', createError);
      return { success: false, error: createError.message };
    }

    console.log(`✅ Created ${createdQuestions?.length || 0} questions`);
    console.log('🎉 Quick fix complete! Refresh the discovery page to test.');

    return { 
      success: true, 
      message: 'Quick fix applied successfully',
      questionsCreated: createdQuestions?.length || 0
    };

  } catch (error) {
    console.error('❌ Unexpected error in quick fix:', error);
    return { success: false, error: 'Unexpected error occurred' };
  }
}

// Make functions available globally for browser console
if (typeof window !== 'undefined') {
  (window as any).debugParmedisClub = debugParmedisClub;
  (window as any).quickFixParmedisClub = quickFixParmedisClub;
}
