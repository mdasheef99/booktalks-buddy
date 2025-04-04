import * as Sentry from "@sentry/react";
import { supabase } from "@/lib/supabase";
import { BookType } from "@/types/books";
import { getBookDiscussionId, isUuid } from "@/services/base/supabaseService";

export async function fetchRecentlyDiscussedBooks(limit: number = 6): Promise<BookType[]> {
  try {
    console.log('Fetching recently discussed books');

    // Query chat_messages to get the most active book_ids
    const { data: chatData, error: chatError } = await supabase
      .from('chat_messages')
      .select('book_id, created_at')
      .order('created_at', { ascending: false })
      .limit(50);

    if (chatError) {
      throw chatError;
    }

    if (!chatData || chatData.length === 0) {
      return [];
    }

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

    // Get unique book_ids sorted by most recent activity first, then by message count
    const uniqueBookIds = Object.keys(bookCounts)
      .sort((a, b) => {
        // First sort by recency of activity
        const timeA = new Date(recentTimestamps[a]).getTime();
        const timeB = new Date(recentTimestamps[b]).getTime();
        if (timeB !== timeA) return timeB - timeA;

        // Then by message count if timestamps are the same
        return bookCounts[b] - bookCounts[a];
      })
      .slice(0, limit);

    if (uniqueBookIds.length === 0) {
      return [];
    }

    // Fetch book details for these IDs
    const { data: bookData, error: bookError } = await supabase
      .from('books')
      .select('*')
      .in('id', uniqueBookIds);

    if (bookError) {
      throw bookError;
    }

    console.log('Found discussed books:', bookData);

    // Map database results to BookType objects with correct image URL
    const mappedBooks = (bookData || []).map(book => {
      // Get the original Google Books ID if this is a UUID
      const originalId = isUuid(book.id) ? getBookDiscussionId(book.id) : book.id;

      console.log(`Processing book: UUID=${book.id}, Original ID=${originalId}, Title=${book.title}, Cover URL=${book.cover_url}`);

      return {
        id: originalId, // Use the original Google Books ID for consistency
        uuid: book.id,  // Keep the UUID for reference
        title: book.title,
        author: book.author,
        description: book.genre || "", // Fixed: using genre as description if no description field
        imageUrl: book.cover_url,
        categories: book.genre ? [book.genre] : []
      };
    });

    console.log('Returning mapped discussed books:', mappedBooks);
    return mappedBooks;
  } catch (error) {
    // Log the error to Sentry
    Sentry.captureException(error, {
      tags: {
        source: "discussedBooksService",
        action: "fetchRecentlyDiscussedBooks"
      }
    });

    console.error("Error fetching recently discussed books:", error);

    // Return empty array on error
    return [];
  }
}
