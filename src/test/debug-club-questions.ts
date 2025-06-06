/**
 * Debug utility to check and enable join questions for clubs
 */

import { supabase } from '@/lib/supabase';

/**
 * Check the current state of clubs and their join_questions_enabled status
 */
export async function debugClubQuestionsStatus() {
  console.log('=== Debugging Club Questions Status ===');
  
  try {
    // Get all clubs with their questions status
    const { data: clubs, error } = await supabase
      .from('book_clubs')
      .select('id, name, privacy, join_questions_enabled')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching clubs:', error);
      return;
    }

    console.log('All clubs in database:');
    clubs?.forEach(club => {
      console.log(`- ${club.name} (${club.privacy}): join_questions_enabled = ${club.join_questions_enabled}`);
    });

    // Check for private clubs specifically
    const privateClubes = clubs?.filter(club => club.privacy === 'private') || [];
    console.log(`\nPrivate clubs: ${privateClubes.length}`);
    
    const privateClubsWithQuestions = privateClubes.filter(club => club.join_questions_enabled);
    console.log(`Private clubs with questions enabled: ${privateClubsWithQuestions.length}`);

    if (privateClubsWithQuestions.length === 0) {
      console.log('\n❌ No private clubs have join_questions_enabled = true');
      console.log('This is why the enhanced cards are not showing.');
    } else {
      console.log('\n✅ Found private clubs with questions enabled:');
      privateClubsWithQuestions.forEach(club => {
        console.log(`- ${club.name} (ID: ${club.id})`);
      });
    }

    return {
      totalClubs: clubs?.length || 0,
      privateClubes: privateClubes.length,
      privateClubsWithQuestions: privateClubsWithQuestions.length,
      clubs: clubs || []
    };

  } catch (error) {
    console.error('Error in debugClubQuestionsStatus:', error);
  }
}

/**
 * Enable join questions for a specific club
 */
export async function enableJoinQuestionsForClub(clubId: string) {
  console.log(`=== Enabling join questions for club: ${clubId} ===`);
  
  try {
    // First check if club exists and is private
    const { data: club, error: fetchError } = await supabase
      .from('book_clubs')
      .select('id, name, privacy, join_questions_enabled')
      .eq('id', clubId)
      .single();

    if (fetchError) {
      console.error('Error fetching club:', fetchError);
      return { success: false, error: fetchError.message };
    }

    if (!club) {
      console.error('Club not found');
      return { success: false, error: 'Club not found' };
    }

    console.log(`Club found: ${club.name} (${club.privacy})`);

    if (club.privacy !== 'private') {
      console.warn('⚠️ Club is not private. Join questions are only available for private clubs.');
      return { success: false, error: 'Club must be private to enable join questions' };
    }

    if (club.join_questions_enabled) {
      console.log('✅ Join questions are already enabled for this club');
      return { success: true, message: 'Join questions already enabled' };
    }

    // Enable join questions
    const { error: updateError } = await supabase
      .from('book_clubs')
      .update({ join_questions_enabled: true })
      .eq('id', clubId);

    if (updateError) {
      console.error('Error enabling join questions:', updateError);
      return { success: false, error: updateError.message };
    }

    console.log('✅ Successfully enabled join questions for club');
    return { success: true, message: 'Join questions enabled successfully' };

  } catch (error) {
    console.error('Error in enableJoinQuestionsForClub:', error);
    return { success: false, error: 'Unexpected error occurred' };
  }
}

/**
 * Create sample questions for a club
 */
export async function createSampleQuestionsForClub(clubId: string) {
  console.log(`=== Creating sample questions for club: ${clubId} ===`);
  
  try {
    // First enable join questions if not already enabled
    const enableResult = await enableJoinQuestionsForClub(clubId);
    if (!enableResult.success) {
      return enableResult;
    }

    // Check if questions already exist
    const { data: existingQuestions, error: fetchError } = await supabase
      .from('club_join_questions')
      .select('id')
      .eq('club_id', clubId);

    if (fetchError) {
      console.error('Error checking existing questions:', fetchError);
      return { success: false, error: fetchError.message };
    }

    if (existingQuestions && existingQuestions.length > 0) {
      console.log(`✅ Club already has ${existingQuestions.length} questions`);
      return { success: true, message: `Club already has ${existingQuestions.length} questions` };
    }

    // Create sample questions
    const sampleQuestions = [
      {
        club_id: clubId,
        question_text: 'Why do you want to join this book club?',
        is_required: true,
        display_order: 1
      },
      {
        club_id: clubId,
        question_text: 'What are your favorite book genres?',
        is_required: false,
        display_order: 2
      },
      {
        club_id: clubId,
        question_text: 'How often do you read books?',
        is_required: true,
        display_order: 3
      }
    ];

    const { data: insertedQuestions, error: insertError } = await supabase
      .from('club_join_questions')
      .insert(sampleQuestions)
      .select();

    if (insertError) {
      console.error('Error creating sample questions:', insertError);
      return { success: false, error: insertError.message };
    }

    console.log(`✅ Successfully created ${insertedQuestions?.length || 0} sample questions`);
    return { 
      success: true, 
      message: `Created ${insertedQuestions?.length || 0} sample questions`,
      questions: insertedQuestions
    };

  } catch (error) {
    console.error('Error in createSampleQuestionsForClub:', error);
    return { success: false, error: 'Unexpected error occurred' };
  }
}

/**
 * Quick setup function to enable questions for the first private club found
 */
export async function quickSetupEnhancedCards() {
  console.log('=== Quick Setup for Enhanced Cards ===');

  const debugResult = await debugClubQuestionsStatus();

  if (!debugResult) {
    console.error('Failed to get club status');
    return;
  }

  const privateClubes = debugResult.clubs.filter(club => club.privacy === 'private');

  if (privateClubes.length === 0) {
    console.log('❌ No private clubs found. Create a private club first.');
    return;
  }

  const clubToSetup = privateClubes[0];
  console.log(`Setting up enhanced cards for: ${clubToSetup.name}`);

  const result = await createSampleQuestionsForClub(clubToSetup.id);

  if (result.success) {
    console.log('✅ Setup complete! Refresh the discovery page to see enhanced cards.');
    console.log(`Club ID: ${clubToSetup.id}`);
    console.log('Expected behavior:');
    console.log('1. Private club cards should show "View Questions" and "Request to Join" buttons');
    console.log('2. "Request to Join" should be disabled initially');
    console.log('3. Click "View Questions" to see and answer questions');
    console.log('4. "Request to Join" becomes enabled after answering required questions');
  } else {
    console.error('❌ Setup failed:', result.error);
  }

  return result;
}

/**
 * Test the complete workflow
 */
export async function testCompleteWorkflow(clubId: string) {
  console.log('=== Testing Complete Workflow ===');

  try {
    // 1. Check club status
    const { data: club, error } = await supabase
      .from('book_clubs')
      .select('id, name, privacy, join_questions_enabled')
      .eq('id', clubId)
      .single();

    if (error || !club) {
      console.error('Club not found:', error);
      return;
    }

    console.log(`Testing club: ${club.name} (${club.privacy})`);

    // 2. Check questions
    const { data: questions, error: questionsError } = await supabase
      .from('club_join_questions')
      .select('*')
      .eq('club_id', clubId)
      .order('display_order');

    if (questionsError) {
      console.error('Error fetching questions:', questionsError);
      return;
    }

    console.log(`Questions found: ${questions?.length || 0}`);
    questions?.forEach((q, i) => {
      console.log(`  ${i + 1}. ${q.question_text} ${q.is_required ? '(Required)' : '(Optional)'}`);
    });

    // 3. Provide test instructions
    console.log('\n📋 Test Instructions:');
    console.log('1. Navigate to Book Club Discovery page');
    console.log('2. Find the club in the list');
    console.log('3. Verify enhanced card shows two buttons');
    console.log('4. Click "View Questions" - should show modal with questions');
    console.log('5. Answer required questions and save');
    console.log('6. Verify "Request to Join" button becomes enabled');
    console.log('7. Click "Request to Join" - should submit successfully');

    return {
      club,
      questions: questions || [],
      requiredCount: questions?.filter(q => q.is_required).length || 0,
      optionalCount: questions?.filter(q => !q.is_required).length || 0
    };

  } catch (error) {
    console.error('Error in testCompleteWorkflow:', error);
  }
}

// Make functions available globally for browser console
if (typeof window !== 'undefined') {
  (window as any).debugClubQuestionsStatus = debugClubQuestionsStatus;
  (window as any).enableJoinQuestionsForClub = enableJoinQuestionsForClub;
  (window as any).createSampleQuestionsForClub = createSampleQuestionsForClub;
  (window as any).quickSetupEnhancedCards = quickSetupEnhancedCards;
  (window as any).testCompleteWorkflow = testCompleteWorkflow;
}
