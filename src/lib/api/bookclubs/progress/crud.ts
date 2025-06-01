/**
 * Reading Progress Management - CRUD Operations
 * 
 * This module contains core Create, Read, Update, Delete operations
 * for the reading progress tracking system.
 */

import { supabase } from '../../../supabase';
import { isClubMember } from '../../auth';
import { validateProgressData, validateUserId, validateClubId, validateProgressId } from './validation';
import { formatProgressDisplay } from './utils';
import type { 
  ReadingProgress, 
  CreateProgressRequest, 
  ClubProgressStats, 
  MemberProgressSummary 
} from './types';

// =========================
// Create Operations
// =========================

/**
 * Create or update reading progress for a user
 * 
 * @param userId - ID of user creating/updating progress
 * @param progressData - Progress data to create/update
 * @returns Created/updated progress record
 * @throws Error if validation fails or user lacks permission
 */
export async function upsertReadingProgress(
  userId: string,
  progressData: CreateProgressRequest
): Promise<ReadingProgress> {
  try {
    // Validate inputs
    validateUserId(userId);
    validateProgressData(progressData);

    // Verify user is a club member
    if (!(await isClubMember(userId, progressData.club_id))) {
      throw new Error('User is not a member of this club');
    }

    // Check if progress tracking is enabled for the club
    const { data: club, error: clubError } = await supabase
      .from('book_clubs')
      .select('progress_tracking_enabled')
      .eq('id', progressData.club_id)
      .single();

    if (clubError) {
      console.error('Error checking club progress tracking status:', clubError);
      throw new Error('Failed to verify club settings');
    }

    if (!club?.progress_tracking_enabled) {
      throw new Error('Progress tracking is not enabled for this club');
    }

    // Get current book for the club if book_id not provided
    let bookId = progressData.book_id;
    if (!bookId) {
      const { data: currentBook } = await supabase
        .from('current_books')
        .select('book_id')
        .eq('club_id', progressData.club_id)
        .single();
      
      bookId = currentBook?.book_id || null;
    }

    // Check if record already exists to handle timestamps properly
    let existingQuery = supabase
      .from('member_reading_progress')
      .select('started_at, finished_at, status')
      .eq('club_id', progressData.club_id)
      .eq('user_id', userId);

    if (bookId) {
      existingQuery = existingQuery.eq('book_id', bookId);
    } else {
      existingQuery = existingQuery.is('book_id', null);
    }

    const { data: existingRecord } = await existingQuery.maybeSingle();

    // Prepare upsert data with proper constraint handling
    const now = new Date().toISOString();

    // Handle progress data according to valid_progress_data constraint
    let progressFields = {};

    if (progressData.status === 'not_started') {
      // For not_started: progress_type must be null, all progress fields null
      progressFields = {
        progress_type: null,
        current_progress: null,
        total_progress: null,
        progress_percentage: null
      };
    } else if (progressData.status === 'reading') {
      // For reading: must match one of the valid combinations
      if (progressData.progress_type === 'percentage') {
        progressFields = {
          progress_type: 'percentage',
          progress_percentage: progressData.progress_percentage || 0,
          current_progress: null,
          total_progress: null
        };
      } else if (progressData.progress_type === 'chapter' || progressData.progress_type === 'page') {
        progressFields = {
          progress_type: progressData.progress_type,
          current_progress: progressData.current_progress || 1,
          total_progress: progressData.total_progress || 1,
          progress_percentage: null
        };
      } else {
        // Default to percentage if no valid progress_type provided
        progressFields = {
          progress_type: 'percentage',
          progress_percentage: 0,
          current_progress: null,
          total_progress: null
        };
      }
    } else if (progressData.status === 'finished') {
      // For finished: preserve the progress data from reading state
      if (progressData.progress_type === 'percentage') {
        progressFields = {
          progress_type: 'percentage',
          progress_percentage: 100, // Finished means 100%
          current_progress: null,
          total_progress: null
        };
      } else if (progressData.progress_type === 'chapter' || progressData.progress_type === 'page') {
        progressFields = {
          progress_type: progressData.progress_type,
          current_progress: progressData.total_progress || progressData.current_progress || 1,
          total_progress: progressData.total_progress || 1,
          progress_percentage: null
        };
      } else {
        // Default to 100% percentage for finished
        progressFields = {
          progress_type: 'percentage',
          progress_percentage: 100,
          current_progress: null,
          total_progress: null
        };
      }
    }

    const upsertData = {
      club_id: progressData.club_id,
      user_id: userId,
      book_id: bookId,
      status: progressData.status,
      ...progressFields,
      notes: progressData.notes || null,
      is_private: progressData.is_private ?? false,
      // Handle timestamp constraints
      started_at: progressData.status === 'not_started' ? null :
                  (existingRecord?.started_at || now),
      finished_at: progressData.status === 'finished' ? now : null,
      last_updated: now
    };

    // Upsert progress record
    const { data, error } = await supabase
      .from('member_reading_progress')
      .upsert(upsertData, {
        onConflict: 'club_id,user_id,book_id',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (error) {
      console.error('Error upserting reading progress:', error);
      throw new Error(`Failed to save reading progress: ${error.message}`);
    }

    return data as ReadingProgress;
  } catch (error) {
    console.error('Error in upsertReadingProgress:', error);
    throw error;
  }
}

// =========================
// Read Operations
// =========================

/**
 * Get reading progress for a specific user and club
 * 
 * @param requestingUserId - ID of user making the request
 * @param targetUserId - ID of user whose progress to fetch
 * @param clubId - Club ID
 * @param bookId - Optional book ID filter
 * @returns Reading progress or null if not found/private
 */
export async function getUserReadingProgress(
  requestingUserId: string,
  targetUserId: string,
  clubId: string,
  bookId?: string
): Promise<ReadingProgress | null> {
  try {
    // Validate inputs
    validateUserId(requestingUserId);
    validateUserId(targetUserId);
    validateClubId(clubId);

    // Verify requesting user is a club member
    if (!(await isClubMember(requestingUserId, clubId))) {
      throw new Error('User is not a member of this club');
    }

    // Build query
    let query = supabase
      .from('member_reading_progress')
      .select('*')
      .eq('user_id', targetUserId)
      .eq('club_id', clubId);

    if (bookId) {
      query = query.eq('book_id', bookId);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      console.error('Error fetching user reading progress:', error);
      throw new Error(`Failed to fetch reading progress: ${error.message}`);
    }

    // Privacy check: if progress is private and requesting user is not the owner, return null
    if (data && data.is_private && data.user_id !== requestingUserId) {
      return null;
    }

    return data as ReadingProgress;
  } catch (error) {
    console.error('Error in getUserReadingProgress:', error);
    throw error;
  }
}

/**
 * Get all reading progress for a club
 * 
 * @param requestingUserId - ID of user making the request
 * @param clubId - Club ID
 * @param bookId - Optional book ID filter
 * @returns Array of member progress summaries
 */
export async function getClubReadingProgress(
  requestingUserId: string,
  clubId: string,
  bookId?: string
): Promise<MemberProgressSummary[]> {
  try {
    // Validate inputs
    validateUserId(requestingUserId);
    validateClubId(clubId);

    // Verify user is a club member
    if (!(await isClubMember(requestingUserId, clubId))) {
      throw new Error('User is not a member of this club');
    }

    // Build query - use manual join since foreign key is to auth.users
    let query = supabase
      .from('member_reading_progress')
      .select(`
        user_id,
        status,
        progress_type,
        current_progress,
        total_progress,
        progress_percentage,
        last_updated,
        is_private
      `)
      .eq('club_id', clubId);

    if (bookId) {
      query = query.eq('book_id', bookId);
    }

    const { data, error } = await query.order('last_updated', { ascending: false });

    if (error) {
      console.error('Error fetching club reading progress:', error);
      throw new Error(`Failed to fetch club progress: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Get user data separately since foreign key is to auth.users
    const userIds = data.map((p: any) => p.user_id);
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, username, displayname, avatar_url')
      .in('id', userIds);

    if (userError) {
      console.error('Error fetching user data:', userError);
      // Continue without user data rather than failing completely
    }

    // Create a map of user data for quick lookup
    const userMap = new Map();
    if (userData) {
      userData.forEach((user: any) => {
        userMap.set(user.id, user);
      });
    }

    // Filter and format the results
    const results: MemberProgressSummary[] = (data || [])
      .filter((item: any) => {
        // Include if public or if it's the requesting user's own progress
        return !item.is_private || item.user_id === requestingUserId;
      })
      .map((item: any) => {
        const user = userMap.get(item.user_id);
        return {
          user_id: item.user_id,
          status: item.status,
          progress_display: formatProgressDisplay(item as ReadingProgress),
          last_updated: item.last_updated,
          is_private: item.is_private,
          user: user ? {
            username: user.username || 'Unknown',
            displayname: user.displayname || user.username || 'Unknown User',
            avatar_url: user.avatar_url || null
          } : {
            username: 'Unknown',
            displayname: 'Unknown User',
            avatar_url: null
          }
        };
      });

    return results;
  } catch (error) {
    console.error('Error in getClubReadingProgress:', error);
    throw error;
  }
}

/**
 * Get club reading statistics
 *
 * @param requestingUserId - ID of user making the request
 * @param clubId - Club ID
 * @returns Club progress statistics
 */
export async function getClubProgressStats(
  requestingUserId: string,
  clubId: string
): Promise<ClubProgressStats> {
  try {
    // Validate inputs
    validateUserId(requestingUserId);
    validateClubId(clubId);

    // Verify user is a club member
    if (!(await isClubMember(requestingUserId, clubId))) {
      throw new Error('User is not a member of this club');
    }

    // Call the database function
    const { data, error } = await supabase
      .rpc('get_club_reading_stats', { p_club_id: clubId })
      .single();

    if (error) {
      console.error('Error fetching club progress stats:', error);
      throw new Error(`Failed to fetch club statistics: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error in getClubProgressStats:', error);
    throw error;
  }
}

// =========================
// Delete Operations
// =========================

/**
 * Delete reading progress
 *
 * @param userId - ID of user deleting progress (must be owner)
 * @param progressId - Progress record ID to delete
 */
export async function deleteReadingProgress(
  userId: string,
  progressId: string
): Promise<void> {
  try {
    // Validate inputs
    validateUserId(userId);
    validateProgressId(progressId);

    const { error } = await supabase
      .from('member_reading_progress')
      .delete()
      .eq('id', progressId)
      .eq('user_id', userId); // Ensure user can only delete their own progress

    if (error) {
      console.error('Error deleting reading progress:', error);
      throw new Error(`Failed to delete reading progress: ${error.message}`);
    }
  } catch (error) {
    console.error('Error in deleteReadingProgress:', error);
    throw error;
  }
}
