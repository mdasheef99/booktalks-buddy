/**
 * Reading Progress Management - Utility Functions
 * 
 * This module contains utility and helper functions
 * for the reading progress tracking system.
 */

import { supabase } from '../../../supabase';
import type { ReadingProgress } from './types';

// =========================
// Display Formatting Functions
// =========================

/**
 * Formats progress data for display in UI components
 * 
 * @param progress - Reading progress data
 * @returns Formatted display string
 */
export function formatProgressDisplay(progress: ReadingProgress): string {
  if (progress.status === 'not_started') return 'Not Started';
  if (progress.status === 'finished') return 'Finished';
  
  if (progress.progress_type === 'percentage' && progress.progress_percentage !== null) {
    return `${progress.progress_percentage}%`;
  } else if (progress.progress_type === 'chapter' && progress.current_progress && progress.total_progress) {
    return `Chapter ${progress.current_progress}/${progress.total_progress}`;
  } else if (progress.progress_type === 'page' && progress.current_progress && progress.total_progress) {
    return `Page ${progress.current_progress}/${progress.total_progress}`;
  }
  
  return 'Reading';
}

/**
 * Calculates completion percentage for numeric progress types
 * 
 * @param current - Current progress value
 * @param total - Total progress value
 * @returns Completion percentage (0-100)
 */
export function calculateCompletionPercentage(current: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((current / total) * 100);
}

/**
 * Formats progress status for display
 * 
 * @param status - Progress status
 * @returns Formatted status string
 */
export function formatProgressStatus(status: 'not_started' | 'reading' | 'finished'): string {
  switch (status) {
    case 'not_started':
      return 'Not Started';
    case 'reading':
      return 'Reading';
    case 'finished':
      return 'Finished';
    default:
      return 'Unknown';
  }
}

// =========================
// Data Utility Functions
// =========================

/**
 * Get current book progress for a user in a club
 *
 * @param requestingUserId - ID of user making the request
 * @param targetUserId - ID of user whose progress to fetch
 * @param clubId - Club ID
 * @returns Reading progress or null if not found
 */
export async function getCurrentBookProgress(
  requestingUserId: string,
  targetUserId: string,
  clubId: string
): Promise<ReadingProgress | null> {
  try {
    // ✅ FIXED: Get current book for the club with fallback fields and proper NULL handling
    const { data: currentBook } = await supabase
      .from('current_books')
      .select('book_id, title, author')  // Include fallback fields for legacy records
      .eq('club_id', clubId)
      .maybeSingle();  // Changed from .single() to handle NULL/empty results gracefully

    // ✅ FIXED: Handle case where no current book is set
    if (!currentBook) {
      return null; // No current book set for this club
    }

    let bookId = currentBook.book_id;

    // ✅ FIXED: Handle legacy records without book_id (auto-migration)
    if (!bookId && currentBook.title && currentBook.author) {
      try {
        // Check if book already exists to avoid duplicates
        const { data: existingBook } = await supabase
          .from('books')
          .select('id')
          .eq('title', currentBook.title)
          .eq('author', currentBook.author)
          .maybeSingle();

        if (existingBook) {
          bookId = existingBook.id;
        } else {
          // Create new book record for legacy data
          const { data: newBook } = await supabase
            .from('books')
            .insert({
              title: currentBook.title,
              author: currentBook.author,
              genre: 'Unknown'  // Default genre for legacy records
            })
            .select('id')
            .single();

          if (newBook) {
            bookId = newBook.id;
          }
        }

        // Update current_books with the book_id (one-time migration)
        if (bookId) {
          await supabase
            .from('current_books')
            .update({ book_id: bookId })
            .eq('club_id', clubId);
        }
      } catch (migrationError) {
        console.warn('Auto-migration failed for legacy current_books record:', migrationError);
        // Continue without book_id - don't break the flow
      }
    }

    // ✅ FIXED: Final validation - return null if still no valid book_id
    if (!bookId) {
      return null; // No valid book_id available
    }

    // Import getUserReadingProgress to avoid circular dependency
    const { getUserReadingProgress } = await import('./crud');
    return await getUserReadingProgress(requestingUserId, targetUserId, clubId, currentBook.book_id);
  } catch (error) {
    console.error('Error in getCurrentBookProgress:', error);
    throw error;
  }
}

/**
 * Check if user has any progress in a club
 * 
 * @param userId - User ID
 * @param clubId - Club ID
 * @returns True if user has progress records
 */
export async function hasReadingProgress(
  userId: string,
  clubId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('member_reading_progress')
      .select('id')
      .eq('user_id', userId)
      .eq('club_id', clubId)
      .limit(1);

    if (error) {
      console.error('Error checking reading progress:', error);
      return false;
    }

    return (data?.length || 0) > 0;
  } catch (error) {
    console.error('Error in hasReadingProgress:', error);
    return false;
  }
}

/**
 * Get the most recent progress update for a user in a club
 * 
 * @param userId - User ID
 * @param clubId - Club ID
 * @returns Most recent progress record or null
 */
export async function getLatestUserProgress(
  userId: string,
  clubId: string
): Promise<ReadingProgress | null> {
  try {
    const { data, error } = await supabase
      .from('member_reading_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('club_id', clubId)
      .order('last_updated', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching latest user progress:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getLatestUserProgress:', error);
    return null;
  }
}

// =========================
// Validation Helpers
// =========================

/**
 * Checks if a progress type is valid
 * 
 * @param progressType - Progress type to validate
 * @returns True if valid
 */
export function isValidProgressType(progressType: string): boolean {
  return ['percentage', 'chapter', 'page'].includes(progressType);
}

/**
 * Checks if a progress status is valid
 * 
 * @param status - Status to validate
 * @returns True if valid
 */
export function isValidProgressStatus(status: string): boolean {
  return ['not_started', 'reading', 'finished'].includes(status);
}

/**
 * Sanitizes notes content
 * 
 * @param notes - Notes content to sanitize
 * @returns Sanitized notes
 */
export function sanitizeNotes(notes: string): string {
  if (!notes) return '';
  
  // Trim whitespace and limit length
  return notes.trim().substring(0, 500);
}
