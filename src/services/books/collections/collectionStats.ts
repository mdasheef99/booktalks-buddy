/**
 * Collection Statistics Module
 * 
 * Handles statistics and analytics functions for collections
 */

import { supabase } from '@/lib/supabase';

// =====================================================
// Statistics Functions
// =====================================================

/**
 * Get collection book count
 */
export async function getCollectionBookCount(collectionId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('collection_books')
      .select('*', { count: 'exact', head: true })
      .eq('collection_id', collectionId);

    if (error) {
      console.error("Error getting collection book count:", error);
      return 0;
    }

    return count || 0;
    
  } catch (error) {
    console.error("Error getting collection book count:", error);
    return 0;
  }
}

/**
 * Get preview covers for collection
 */
export async function getCollectionPreviewCovers(
  collectionId: string, 
  limit: number = 4
): Promise<string[]> {
  try {
    const { data } = await supabase
      .from('collection_books')
      .select(`
        personal_books (cover_url)
      `)
      .eq('collection_id', collectionId)
      .not('personal_books.cover_url', 'is', null)
      .limit(limit);

    if (!data) return [];

    return data
      .map(item => item.personal_books?.cover_url)
      .filter(Boolean) as string[];
    
  } catch (error) {
    console.error("Error getting collection preview covers:", error);
    return [];
  }
}

/**
 * Get user collection statistics
 */
export async function getUserCollectionStats(userId: string): Promise<{
  totalCollections: number;
  publicCollections: number;
  privateCollections: number;
  totalBooksInCollections: number;
  averageBooksPerCollection: number;
}> {
  try {
    // Get collection counts
    const { data: collections, error: collectionsError } = await supabase
      .from('book_collections')
      .select('id, is_public')
      .eq('user_id', userId);

    if (collectionsError) {
      console.error("Error getting user collections for stats:", collectionsError);
      return {
        totalCollections: 0,
        publicCollections: 0,
        privateCollections: 0,
        totalBooksInCollections: 0,
        averageBooksPerCollection: 0
      };
    }

    const totalCollections = collections?.length || 0;
    const publicCollections = collections?.filter(c => c.is_public).length || 0;
    const privateCollections = totalCollections - publicCollections;

    // Get total books in all collections
    let totalBooksInCollections = 0;
    if (collections && collections.length > 0) {
      const collectionIds = collections.map(c => c.id);
      
      const { count, error: booksError } = await supabase
        .from('collection_books')
        .select('*', { count: 'exact', head: true })
        .in('collection_id', collectionIds);

      if (!booksError) {
        totalBooksInCollections = count || 0;
      }
    }

    const averageBooksPerCollection = totalCollections > 0 
      ? Math.round((totalBooksInCollections / totalCollections) * 10) / 10 
      : 0;

    return {
      totalCollections,
      publicCollections,
      privateCollections,
      totalBooksInCollections,
      averageBooksPerCollection
    };
    
  } catch (error) {
    console.error("Error getting user collection stats:", error);
    return {
      totalCollections: 0,
      publicCollections: 0,
      privateCollections: 0,
      totalBooksInCollections: 0,
      averageBooksPerCollection: 0
    };
  }
}

/**
 * Get most popular books across collections
 */
export async function getMostPopularBooksInCollections(
  userId?: string,
  limit: number = 10
): Promise<Array<{
  book_id: string;
  collection_count: number;
  personal_books?: any;
}>> {
  try {
    let query = supabase
      .from('collection_books')
      .select(`
        book_id,
        personal_books (*)
      `);

    // If userId provided, filter by user's collections
    if (userId) {
      const { data: userCollections } = await supabase
        .from('book_collections')
        .select('id')
        .eq('user_id', userId);

      if (userCollections && userCollections.length > 0) {
        const collectionIds = userCollections.map(c => c.id);
        query = query.in('collection_id', collectionIds);
      } else {
        return []; // User has no collections
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error getting popular books in collections:", error);
      return [];
    }

    if (!data) return [];

    // Count occurrences of each book
    const bookCounts = data.reduce((acc, item) => {
      const bookId = item.book_id;
      if (!acc[bookId]) {
        acc[bookId] = {
          book_id: bookId,
          collection_count: 0,
          personal_books: item.personal_books
        };
      }
      acc[bookId].collection_count++;
      return acc;
    }, {} as Record<string, any>);

    // Convert to array and sort by count
    const sortedBooks = Object.values(bookCounts)
      .sort((a: any, b: any) => b.collection_count - a.collection_count)
      .slice(0, limit);

    return sortedBooks;
    
  } catch (error) {
    console.error("Error getting popular books in collections:", error);
    return [];
  }
}
