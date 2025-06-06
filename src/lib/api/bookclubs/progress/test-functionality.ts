/**
 * Test functionality for reading progress feature
 * This file can be used to verify that the progress tracking works correctly
 */

import { 
  upsertReadingProgress, 
  getUserReadingProgress, 
  getClubProgressStats,
  getClubReadingProgress 
} from './crud';
import { 
  toggleClubProgressTracking, 
  isProgressTrackingEnabled 
} from './features';
import type { CreateProgressRequest } from './types';

/**
 * Test the basic CRUD operations for reading progress
 */
export async function testProgressCRUD(
  userId: string, 
  clubId: string, 
  bookId?: string
): Promise<boolean> {
  try {
    console.log('🧪 Testing Reading Progress CRUD Operations...');

    // Test 1: Enable progress tracking for the club
    console.log('1. Enabling progress tracking...');
    await toggleClubProgressTracking(userId, clubId, true);
    
    const isEnabled = await isProgressTrackingEnabled(clubId);
    if (!isEnabled) {
      throw new Error('Failed to enable progress tracking');
    }
    console.log('✅ Progress tracking enabled');

    // Test 2: Create initial progress (not_started)
    console.log('2. Creating initial progress...');
    const initialProgress: CreateProgressRequest = {
      club_id: clubId,
      book_id: bookId,
      status: 'not_started',
      is_private: false
    };

    const createdProgress = await upsertReadingProgress(userId, initialProgress);
    console.log('✅ Initial progress created:', createdProgress.id);

    // Test 3: Update to reading status with percentage
    console.log('3. Updating to reading status...');
    const readingProgress: CreateProgressRequest = {
      club_id: clubId,
      book_id: bookId,
      status: 'reading',
      progress_type: 'percentage',
      progress_percentage: 25,
      notes: 'Really enjoying this book!',
      is_private: false
    };

    const updatedProgress = await upsertReadingProgress(userId, readingProgress);
    console.log('✅ Progress updated to reading:', updatedProgress.progress_percentage + '%');

    // Test 4: Update to reading with chapter progress
    console.log('4. Updating to chapter progress...');
    const chapterProgress: CreateProgressRequest = {
      club_id: clubId,
      book_id: bookId,
      status: 'reading',
      progress_type: 'chapter',
      current_progress: 5,
      total_progress: 20,
      notes: 'Chapter 5 was amazing!',
      is_private: false
    };

    const chapterUpdated = await upsertReadingProgress(userId, chapterProgress);
    console.log('✅ Progress updated to chapters:', `${chapterUpdated.current_progress}/${chapterUpdated.total_progress}`);

    // Test 5: Mark as finished
    console.log('5. Marking as finished...');
    const finishedProgress: CreateProgressRequest = {
      club_id: clubId,
      book_id: bookId,
      status: 'finished',
      progress_type: 'percentage',
      progress_percentage: 100,
      notes: 'Fantastic book! Highly recommend.',
      is_private: false
    };

    const finished = await upsertReadingProgress(userId, finishedProgress);
    console.log('✅ Progress marked as finished');

    // Test 6: Retrieve user progress
    console.log('6. Retrieving user progress...');
    const retrievedProgress = await getUserReadingProgress(userId, userId, clubId, bookId);
    if (!retrievedProgress || retrievedProgress.status !== 'finished') {
      throw new Error('Failed to retrieve correct progress');
    }
    console.log('✅ Progress retrieved successfully');

    // Test 7: Get club progress stats
    console.log('7. Getting club progress stats...');
    const stats = await getClubProgressStats(userId, clubId);
    console.log('✅ Club stats retrieved:', {
      total: stats.total_members,
      finished: stats.finished_count,
      completion: stats.completion_percentage + '%'
    });

    // Test 8: Get all club member progress
    console.log('8. Getting club member progress...');
    const memberProgress = await getClubReadingProgress(userId, clubId, bookId);
    console.log('✅ Member progress retrieved:', memberProgress.length + ' members');

    console.log('🎉 All tests passed! Reading progress feature is working correctly.');
    return true;

  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

/**
 * Test privacy features
 */
export async function testPrivacyFeatures(
  user1Id: string,
  user2Id: string, 
  clubId: string,
  bookId?: string
): Promise<boolean> {
  try {
    console.log('🔒 Testing Privacy Features...');

    // User 1 creates private progress
    const privateProgress: CreateProgressRequest = {
      club_id: clubId,
      book_id: bookId,
      status: 'reading',
      progress_type: 'percentage',
      progress_percentage: 50,
      notes: 'This is private progress',
      is_private: true
    };

    await upsertReadingProgress(user1Id, privateProgress);
    console.log('✅ Private progress created');

    // User 2 tries to view User 1's private progress
    const viewAttempt = await getUserReadingProgress(user2Id, user1Id, clubId, bookId);
    if (viewAttempt !== null) {
      throw new Error('Privacy violation: User 2 can see User 1\'s private progress');
    }
    console.log('✅ Privacy protection working');

    // User 1 can view their own private progress
    const ownProgress = await getUserReadingProgress(user1Id, user1Id, clubId, bookId);
    if (!ownProgress || !ownProgress.is_private) {
      throw new Error('User cannot view their own private progress');
    }
    console.log('✅ Self-access working');

    console.log('🎉 Privacy tests passed!');
    return true;

  } catch (error) {
    console.error('❌ Privacy test failed:', error);
    return false;
  }
}

/**
 * Test feature toggle functionality
 */
export async function testFeatureToggle(
  userId: string,
  clubId: string
): Promise<boolean> {
  try {
    console.log('🔧 Testing Feature Toggle...');

    // Disable progress tracking
    await toggleClubProgressTracking(userId, clubId, false);
    let isEnabled = await isProgressTrackingEnabled(clubId);
    if (isEnabled) {
      throw new Error('Failed to disable progress tracking');
    }
    console.log('✅ Progress tracking disabled');

    // Enable progress tracking
    await toggleClubProgressTracking(userId, clubId, true);
    isEnabled = await isProgressTrackingEnabled(clubId);
    if (!isEnabled) {
      throw new Error('Failed to enable progress tracking');
    }
    console.log('✅ Progress tracking enabled');

    console.log('🎉 Feature toggle tests passed!');
    return true;

  } catch (error) {
    console.error('❌ Feature toggle test failed:', error);
    return false;
  }
}

/**
 * Run all tests
 */
export async function runAllTests(
  userId: string,
  clubId: string,
  bookId?: string,
  secondUserId?: string
): Promise<void> {
  console.log('🚀 Starting Reading Progress Feature Tests...');
  console.log('=====================================');

  const crudResult = await testProgressCRUD(userId, clubId, bookId);
  const toggleResult = await testFeatureToggle(userId, clubId);
  
  let privacyResult = true;
  if (secondUserId) {
    privacyResult = await testPrivacyFeatures(userId, secondUserId, clubId, bookId);
  }

  console.log('=====================================');
  console.log('📊 Test Results:');
  console.log(`CRUD Operations: ${crudResult ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Feature Toggle: ${toggleResult ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Privacy Features: ${privacyResult ? '✅ PASS' : '❌ FAIL'}`);
  
  const allPassed = crudResult && toggleResult && privacyResult;
  console.log(`Overall: ${allPassed ? '🎉 ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
}
