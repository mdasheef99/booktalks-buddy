
import * as Sentry from "@sentry/react";
import { supabase } from "@/lib/supabase";
import { BookType } from "@/types/books";

export async function fetchRecentlyDiscussedBooks(limit: number = 4): Promise<BookType[]> {
  try {
    console.log('Fetching recently discussed books');
    
    // Query chat_messages to get the most active book_ids
    const { data: chatData, error: chatError } = await supabase
      .from('chat_messages')
      .select('book_id, created_at')
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (chatError) {
      throw chatError;
    }
    
    if (!chatData || chatData.length === 0) {
      return [];
    }
    
    // Count occurrences of each book_id and get the most discussed ones
    const bookCounts: Record<string, number> = {};
    chatData.forEach(chat => {
      if (chat.book_id) {
        bookCounts[chat.book_id] = (bookCounts[chat.book_id] || 0) + 1;
      }
    });
    
    // Get unique book_ids sorted by message count (most active first)
    const uniqueBookIds = Object.keys(bookCounts)
      .sort((a, b) => bookCounts[b] - bookCounts[a])
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
    
    // Map database results to BookType objects
    return (bookData || []).map(book => ({
      id: book.id,
      title: book.title,
      author: book.author,
      description: book.genre || "", // Fix: Use genre as description if description is not available
      imageUrl: book.cover_url,
      categories: book.genre ? [book.genre] : []
    }));
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
