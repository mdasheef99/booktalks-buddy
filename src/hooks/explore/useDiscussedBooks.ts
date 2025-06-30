import { useQuery } from "@tanstack/react-query";
import { createClient } from "@supabase/supabase-js";
import { Book } from "../../types/books";
import { useToast } from "../use-toast";
import { isUuid, getBookDiscussionId } from "../../services/base/supabaseService";

// Initialize Supabase client (adjust with your environment variables)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Hook to fetch recently discussed books from Supabase
 * @param limit Number of books to fetch (default 6)
 */
export function useDiscussedBooks(limit: number = 6) {
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ["discussedBooks", limit],
    queryFn: async (): Promise<Book[]> => {
      const { data: chatData, error: chatError } = await supabase
        .from("chat_messages")
        .select("book_id, created_at")
        .order("created_at", { ascending: false })
        .limit(50);

      if (chatError) throw chatError;
      if (!chatData || chatData.length === 0) return [];

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

      const uniqueBookIds = Object.keys(bookCounts)
        .sort((a, b) => {
          const timeA = new Date(recentTimestamps[a]).getTime();
          const timeB = new Date(recentTimestamps[b]).getTime();
          if (timeB !== timeA) return timeB - timeA;
          return bookCounts[b] - bookCounts[a];
        })
        .slice(0, limit);

      if (uniqueBookIds.length === 0) return [];

      const { data: bookData, error: bookError } = await supabase
        .from("books")
        .select("*")
        .in("id", uniqueBookIds);

      if (bookError) throw bookError;
      if (!bookData) return [];

      // Map database results to Book objects
      const mappedBooks = bookData.map((book: any) => {
        // Get the original Google Books ID if this is a UUID
        const originalId = isUuid(book.id) ? getBookDiscussionId(book.id) : book.id;

        return {
          id: originalId, // Use the original Google Books ID for consistency
          uuid: book.id,  // Keep the UUID for reference
          title: book.title,
          author: book.author,
          description: book.genre || "",
          imageUrl: book.cover_url,
          categories: book.genre ? [book.genre] : [],
        };
      });

      // Deduplicate books based on the original Google Books ID
      const uniqueBooks: Book[] = [];
      const seenIds = new Set<string>();

      for (const book of mappedBooks) {
        if (!seenIds.has(book.id)) {
          seenIds.add(book.id);
          uniqueBooks.push(book);
        }
      }

      return uniqueBooks;
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