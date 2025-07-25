import React, { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Book } from "../../types/books";
import { useToast } from "../use-toast";
import { fetchRecentlyDiscussedBooks, DiscussedBooksResult } from "../../services/discussedBooksService";
import * as Sentry from "@sentry/react";

export interface PaginatedDiscussedBooksState {
  books: Book[];
  isLoading: boolean;
  isError: boolean;
  hasMore: boolean;
  totalCount: number;
  currentPage: number;
  isLoadingMore: boolean;
  loadMore: () => void;
  refresh: () => void;
}

/**
 * Hook to fetch paginated discussed books with time-based filtering
 * @param pageSize Number of books per page (default 6)
 * @param hoursFilter Only show books with messages within this many hours (default 12)
 */
export function usePaginatedDiscussedBooks(
  pageSize: number = 6,
  hoursFilter: number = 12
): PaginatedDiscussedBooksState {
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(0);
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const query = useQuery({
    queryKey: ["paginatedDiscussedBooks", currentPage, pageSize, hoursFilter],
    queryFn: async (): Promise<DiscussedBooksResult> => {
      console.log(`[PaginatedDiscussedBooks] Fetching page ${currentPage}`);
      return await fetchRecentlyDiscussedBooks(currentPage, pageSize, hoursFilter);
    },
    staleTime: 15000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    meta: {
      onError: (error: Error) => {
        Sentry.captureException(error, {
          tags: {
            hook: "usePaginatedDiscussedBooks",
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

  // Update allBooks when new data arrives
  React.useEffect(() => {
    if (query.data?.books) {
      if (currentPage === 0 || isRefreshing) {
        // First page or refresh - replace all books
        setAllBooks(query.data.books);
        setIsRefreshing(false);
      } else {
        // Subsequent pages - append to existing books
        setAllBooks(prev => {
          const existingIds = new Set(prev.map(book => book.id));
          const newBooks = query.data!.books.filter(book => !existingIds.has(book.id));
          return [...prev, ...newBooks];
        });
      }
      setIsLoadingMore(false);
    } else if (query.data && query.data.books.length === 0) {
      // Handle empty results case
      setAllBooks([]);
      setIsLoadingMore(false);
      setIsRefreshing(false);
    }
  }, [query.data, currentPage, isRefreshing]);

  const loadMore = useCallback(() => {
    if (query.data?.hasMore && !query.isLoading && !isLoadingMore) {
      setIsLoadingMore(true);
      setCurrentPage(prev => prev + 1);
    }
  }, [query.data?.hasMore, query.isLoading, isLoadingMore]);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    setCurrentPage(0);
    setIsLoadingMore(false);
    // Invalidate and refetch the query to ensure fresh data
    await query.refetch();
  }, [query]);

  return {
    books: allBooks,
    isLoading: query.isLoading && currentPage === 0,
    isError: query.isError,
    hasMore: query.data?.hasMore ?? false,
    totalCount: query.data?.totalCount ?? 0,
    currentPage,
    isLoadingMore,
    loadMore,
    refresh,
  };
}
