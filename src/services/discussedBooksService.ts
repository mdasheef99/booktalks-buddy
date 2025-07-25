import * as Sentry from "@sentry/react";
import { supabase } from "@/lib/supabase";
import { BookType } from "@/types/books";
import { getBookDiscussionId, isUuid } from "@/services/base/supabaseService";

export interface DiscussedBooksResult {
  books: BookType[];
  hasMore: boolean;
  totalCount: number;
}

export async function fetchRecentlyDiscussedBooks(
  page: number = 0,
  pageSize: number = 6,
  hoursFilter: number = 12
): Promise<DiscussedBooksResult> {
  try {
    console.log(`[DiscussedBooksService] Fetching page ${page} with ${pageSize} books, ${hoursFilter}h filter`);

    // Calculate the time threshold
    const timeThreshold = new Date();
    timeThreshold.setHours(timeThreshold.getHours() - hoursFilter);
    const timeThresholdISO = timeThreshold.toISOString();

    console.log(`[DiscussedBooksService] Time threshold: ${timeThresholdISO}`);

    // Query chat_messages with time filter to get recent activity
    const { data: chatData, error: chatError } = await supabase
      .from('chat_messages')
      .select('book_id, created_at')
      .gte('created_at', timeThresholdISO)
      .order('created_at', { ascending: false });

    if (chatError) {
      throw chatError;
    }

    if (!chatData || chatData.length === 0) {
      console.log(`[DiscussedBooksService] No messages found within ${hoursFilter} hours`);
      return { books: [], hasMore: false, totalCount: 0 };
    }

    console.log(`[DiscussedBooksService] Found ${chatData.length} messages within ${hoursFilter} hours`);

    // Count occurrences of each book_id and get the most discussed ones
    const bookCounts: Record<string, number> = {};
    const recentTimestamps: Record<string, string> = {};

    chatData.forEach(chat => {
      if (chat.book_id) {
        bookCounts[chat.book_id] = (bookCounts[chat.book_id] || 0) + 1;

        // Keep track of the most recent activity for each book
        if (!recentTimestamps[chat.book_id] || chat.created_at > recentTimestamps[chat.book_id]) {
          recentTimestamps[chat.book_id] = chat.created_at;
        }
      }
    });

    // First, get all book IDs sorted by activity
    const allBookIdsSorted = Object.keys(bookCounts)
      .sort((a, b) => {
        // First sort by recency of activity
        const timeA = new Date(recentTimestamps[a]).getTime();
        const timeB = new Date(recentTimestamps[b]).getTime();
        if (timeB !== timeA) return timeB - timeA;

        // Then by message count if timestamps are the same
        return bookCounts[b] - bookCounts[a];
      });

    console.log(`[DiscussedBooksService] Found ${allBookIdsSorted.length} books with recent activity`);

    // Fetch ALL book details to filter for valid Google Books IDs BEFORE pagination
    const { data: allBooksData, error: allBooksError } = await supabase
      .from('books')
      .select('id, google_books_id')
      .in('id', allBookIdsSorted)
      .not('google_books_id', 'is', null);

    if (allBooksError) {
      throw allBooksError;
    }

    // Create a set of valid book IDs (those with Google Books IDs)
    const validBookIds = new Set((allBooksData || []).map(book => book.id));

    // Filter the sorted list to only include books with valid Google Books IDs
    const validQualifyingBookIds = allBookIdsSorted.filter(id => validBookIds.has(id));

    console.log(`[DiscussedBooksService] ${validQualifyingBookIds.length} books have valid Google Books IDs`);

    // Now apply pagination to the filtered list
    const totalCount = validQualifyingBookIds.length;
    const startIndex = page * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedBookIds = validQualifyingBookIds.slice(startIndex, endIndex);
    const hasMore = endIndex < totalCount;

    console.log(`[DiscussedBooksService] Page ${page}: ${paginatedBookIds.length} books, hasMore: ${hasMore}, total: ${totalCount}`);

    if (paginatedBookIds.length === 0) {
      return { books: [], hasMore, totalCount };
    }

    // Fetch full book details for the paginated IDs
    const { data: bookData, error: bookError } = await supabase
      .from('books')
      .select('*')
      .in('id', paginatedBookIds);

    if (bookError) {
      throw bookError;
    }

    console.log(`[DiscussedBooksService] Found ${bookData?.length || 0} books in database for page ${page}`);

    // We already filtered for valid Google Books IDs, so all books should be valid
    const validBooks = bookData || [];

    // Map database results to BookType objects with correct image URL
    const mappedBooks = validBooks.map(book => {
      // Use the google_books_id directly since we filtered for valid ones
      const originalId = book.google_books_id;

      console.log(`[DiscussedBooksService] Processing book: UUID=${book.id}, Google Books ID=${originalId}, Title=${book.title}`);

      return {
        id: originalId, // Use the Google Books ID for consistency
        uuid: book.id,  // Keep the UUID for reference
        title: book.title,
        author: book.author,
        description: book.genre || "", // Fixed: using genre as description if no description field
        imageUrl: book.cover_url,
        categories: book.genre ? [book.genre] : []
      };
    });

    // Deduplicate books based on the original Google Books ID
    const uniqueBooks: BookType[] = [];
    const seenIds = new Set<string>();

    for (const book of mappedBooks) {
      if (!seenIds.has(book.id)) {
        seenIds.add(book.id);
        uniqueBooks.push(book);
      }
    }

    // Sort the final books by their original order (most recent activity first)
    const sortedBooks = uniqueBooks.sort((a, b) => {
      const indexA = paginatedBookIds.findIndex(id => id === a.uuid);
      const indexB = paginatedBookIds.findIndex(id => id === b.uuid);
      return indexA - indexB;
    });

    console.log(`[DiscussedBooksService] Returning ${sortedBooks.length} books for page ${page}, hasMore: ${hasMore}`);
    return { books: sortedBooks, hasMore, totalCount };
  } catch (error) {
    // Log the error to Sentry
    Sentry.captureException(error, {
      tags: {
        source: "discussedBooksService",
        action: "fetchRecentlyDiscussedBooks"
      }
    });

    console.error("Error fetching recently discussed books:", error);

    // Return empty result on error
    return { books: [], hasMore: false, totalCount: 0 };
  }
}
