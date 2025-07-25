import { useQuery } from "@tanstack/react-query";
import { createClient } from "@supabase/supabase-js";
import { Book } from "../../types/books";
import { useToast } from "../use-toast";
import { isUuid, getBookDiscussionIdAsync } from "../../services/base/supabaseService";
import * as Sentry from "@sentry/react";

// Initialize Supabase client (adjust with your environment variables)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface DiscussedBooksResult {
  books: Book[];
  hasMore: boolean;
  totalCount: number;
}

/**
 * Hook to fetch recently discussed books from Supabase with pagination and time filtering
 * @param page Page number (0-based)
 * @param pageSize Number of books per page (default 6)
 * @param hoursFilter Only show books with messages within this many hours (default 12)
 */
export function useDiscussedBooks(page: number = 0, pageSize: number = 6, hoursFilter: number = 12) {
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ["discussedBooks", page, pageSize, hoursFilter],
    queryFn: async (): Promise<DiscussedBooksResult> => {
      // Calculate the time threshold (12 hours ago by default)
      const timeThreshold = new Date();
      timeThreshold.setHours(timeThreshold.getHours() - hoursFilter);
      const timeThresholdISO = timeThreshold.toISOString();

      console.log(`[DiscussedBooks] Fetching books with messages after: ${timeThresholdISO}`);

      // Query chat_messages with time filter to get recent activity
      const { data: chatData, error: chatError } = await supabase
        .from("chat_messages")
        .select("book_id, created_at")
        .gte("created_at", timeThresholdISO)
        .order("created_at", { ascending: false });

      if (chatError) throw chatError;
      if (!chatData || chatData.length === 0) {
        console.log(`[DiscussedBooks] No messages found within ${hoursFilter} hours`);
        return { books: [], hasMore: false, totalCount: 0 };
      }

      console.log(`[DiscussedBooks] Found ${chatData.length} messages within ${hoursFilter} hours`);

      const bookCounts: Record<string, number> = {};
      const recentTimestamps: Record<string, string> = {};

      chatData.forEach((chat) => {
        if (chat.book_id) {
          bookCounts[chat.book_id] = (bookCounts[chat.book_id] || 0) + 1;
          if (
            !recentTimestamps[chat.book_id] ||
            chat.created_at > recentTimestamps[chat.book_id]
          ) {
            recentTimestamps[chat.book_id] = chat.created_at;
          }
        }
      });

      // Sort all qualifying books by most recent activity
      const allQualifyingBookIds = Object.keys(bookCounts)
        .sort((a, b) => {
          const timeA = new Date(recentTimestamps[a]).getTime();
          const timeB = new Date(recentTimestamps[b]).getTime();
          if (timeB !== timeA) return timeB - timeA;
          return bookCounts[b] - bookCounts[a];
        });

      const totalCount = allQualifyingBookIds.length;
      const startIndex = page * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedBookIds = allQualifyingBookIds.slice(startIndex, endIndex);
      const hasMore = endIndex < totalCount;

      console.log(`[DiscussedBooks] Page ${page}: ${paginatedBookIds.length} books, hasMore: ${hasMore}, total: ${totalCount}`);

      if (paginatedBookIds.length === 0) {
        return { books: [], hasMore, totalCount };
      }

      const { data: bookData, error: bookError } = await supabase
        .from("books")
        .select("*")
        .in("id", paginatedBookIds)
        .not("google_books_id", "is", null); // Only get books with valid Google Books IDs

      if (bookError) throw bookError;
      if (!bookData) {
        return { books: [], hasMore, totalCount };
      }

      // Additional safety check: filter out books without google_books_id
      const validBooks = bookData.filter(book => book.google_books_id && book.google_books_id.trim() !== '');

      // Map database results to Book objects with async ID resolution
      const mappedBooks = await Promise.all(
        validBooks.map(async (book: any) => {
          // Use the google_books_id directly since we filtered for valid ones
          const originalId = book.google_books_id || book.id;

          return {
            id: originalId, // Use the Google Books ID for consistency
            uuid: book.id,  // Keep the UUID for reference
            title: book.title,
            author: book.author,
            description: book.genre || "",
            imageUrl: book.cover_url,
            categories: book.genre ? [book.genre] : [],
          };
        })
      );

      // Deduplicate books based on the original Google Books ID
      const uniqueBooks: Book[] = [];
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

      console.log(`[DiscussedBooks] Returning ${sortedBooks.length} books for page ${page}`);
      return { books: sortedBooks, hasMore, totalCount };
    },
    staleTime: 15000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    meta: {
      onError: (error: Error) => {
        Sentry.captureException(error, {
          tags: {
            hook: "useDiscussedBooks",
          },
        });

        toast({
          title: "Couldn't load discussed books",
          description: "We're having trouble loading books currently being discussed.",
          variant: "destructive",
        });
      },
    },
  });

  return query;
}