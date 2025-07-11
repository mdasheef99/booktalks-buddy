/**
 * Interaction Tracking Module
 * 
 * Tracks user interactions with books for recommendation engine
 */

import { supabase } from '@/lib/supabase';
import * as Sentry from "@sentry/react";
import { throwIfInvalid } from '@/lib/api/books/validation';
import { InteractionType, BookInteraction } from './types/personalBooks';
import { validateInteractionTracking } from './bookValidation';

// =====================================================
// Interaction Tracking Functions
// =====================================================

/**
 * Track user interaction with a book for recommendation engine
 */
export async function trackBookInteraction(
  userId: string,
  googleBooksId: string,
  interactionType: InteractionType,
  interactionValue?: number
): Promise<void> {
  try {
    // Input validation
    const validationResult = validateInteractionTracking(userId, googleBooksId, interactionType, interactionValue);
    throwIfInvalid(validationResult, 'trackBookInteraction');

    console.log(`Tracking ${interactionType} interaction for user ${userId} with book ${googleBooksId}`);

    const { error } = await supabase
      .from('user_book_interactions')
      .insert([{
        user_id: userId,
        book_google_id: googleBooksId,
        interaction_type: interactionType,
        interaction_value: interactionValue,
        created_at: new Date().toISOString()
      }]);

    if (error) {
      console.error('Error tracking book interaction:', error);
      // Don't throw error for interaction tracking failures - it's not critical
      return;
    }

    console.log(`Successfully tracked ${interactionType} interaction`);
    
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        source: "personalBooks/interactionTracking",
        action: "trackBookInteraction"
      },
      extra: { userId, googleBooksId, interactionType, interactionValue }
    });
    
    console.error("Error tracking book interaction:", error);
    // Don't throw error for interaction tracking failures - it's not critical
  }
}

/**
 * Get user's interaction history
 */
export async function getUserInteractionHistory(
  userId: string,
  limit: number = 50
): Promise<BookInteraction[]> {
  try {
    const { data, error } = await supabase
      .from('user_book_interactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching interaction history:', error);
      return [];
    }

    return data || [];
    
  } catch (error) {
    console.error("Error fetching user interaction history:", error);
    return [];
  }
}

/**
 * Get interaction statistics for a user
 */
export async function getUserInteractionStats(userId: string): Promise<{
  totalInteractions: number;
  booksAdded: number;
  booksRemoved: number;
  booksRated: number;
  booksReviewed: number;
  booksCompleted: number;
  averageRating: number;
}> {
  try {
    const interactions = await getUserInteractionHistory(userId, 1000); // Get more for stats

    const stats = {
      totalInteractions: interactions.length,
      booksAdded: interactions.filter(i => i.interaction_type === 'added').length,
      booksRemoved: interactions.filter(i => i.interaction_type === 'removed').length,
      booksRated: interactions.filter(i => i.interaction_type === 'rated').length,
      booksReviewed: interactions.filter(i => i.interaction_type === 'reviewed').length,
      booksCompleted: interactions.filter(i => i.interaction_type === 'completed').length,
      averageRating: 0
    };

    // Calculate average rating
    const ratingInteractions = interactions.filter(i => 
      i.interaction_type === 'rated' && i.interaction_value !== null
    );

    if (ratingInteractions.length > 0) {
      const totalRating = ratingInteractions.reduce((sum, i) => sum + (i.interaction_value || 0), 0);
      stats.averageRating = totalRating / ratingInteractions.length;
    }

    return stats;
    
  } catch (error) {
    console.error("Error calculating interaction stats:", error);
    return {
      totalInteractions: 0,
      booksAdded: 0,
      booksRemoved: 0,
      booksRated: 0,
      booksReviewed: 0,
      booksCompleted: 0,
      averageRating: 0
    };
  }
}

/**
 * Get popular books based on interactions
 */
export async function getPopularBooksFromInteractions(
  interactionType?: InteractionType,
  limit: number = 20
): Promise<Array<{
  google_books_id: string;
  interaction_count: number;
  average_rating?: number;
}>> {
  try {
    let query = supabase
      .from('user_book_interactions')
      .select('book_google_id, interaction_type, interaction_value');

    if (interactionType) {
      query = query.eq('interaction_type', interactionType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching popular books:', error);
      return [];
    }

    // Group by google_books_id and count interactions
    const bookStats: Record<string, {
      count: number;
      ratings: number[];
    }> = {};

    data?.forEach(interaction => {
      if (!bookStats[interaction.book_google_id]) {
        bookStats[interaction.book_google_id] = {
          count: 0,
          ratings: []
        };
      }

      bookStats[interaction.book_google_id].count++;

      if (interaction.interaction_type === 'rated' && interaction.interaction_value) {
        bookStats[interaction.book_google_id].ratings.push(interaction.interaction_value);
      }
    });

    // Convert to array and sort by popularity
    const popularBooks = Object.entries(bookStats)
      .map(([googleBooksId, stats]) => ({
        google_books_id: googleBooksId,
        interaction_count: stats.count,
        average_rating: stats.ratings.length > 0 
          ? stats.ratings.reduce((sum, rating) => sum + rating, 0) / stats.ratings.length
          : undefined
      }))
      .sort((a, b) => b.interaction_count - a.interaction_count)
      .slice(0, limit);

    return popularBooks;
    
  } catch (error) {
    console.error("Error getting popular books from interactions:", error);
    return [];
  }
}

/**
 * Clean up old interaction data (for maintenance)
 */
export async function cleanupOldInteractions(daysToKeep: number = 365): Promise<void> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const { error } = await supabase
      .from('user_book_interactions')
      .delete()
      .lt('created_at', cutoffDate.toISOString());

    if (error) {
      console.error('Error cleaning up old interactions:', error);
      return;
    }

    console.log(`Successfully cleaned up interactions older than ${daysToKeep} days`);
    
  } catch (error) {
    console.error("Error during interaction cleanup:", error);
  }
}
