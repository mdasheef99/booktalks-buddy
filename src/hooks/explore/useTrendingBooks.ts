import { useQuery } from "@tanstack/react-query";
import * as Sentry from "@sentry/browser";
import { apiFetch } from "../../lib/api";
import { Book } from "../../types/books";
import { useToast } from "../use-toast";

/**
 * Hook to fetch trending books for a genre via Google Books API
 * @param genre The genre string
 * @param maxResults Max results to fetch (default 5)
 */
export function useTrendingBooks(genre: string, maxResults: number = 5) {
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ["trendingBooks", genre],
    queryFn: async () => {
      if (!genre.trim()) return [];

      const queryStr = `${genre} subject:${genre} relevance:high`;

      const data = await apiFetch<any>(
        "https://www.googleapis.com/books/v1/volumes",
        {
          queryParams: {
            q: queryStr,
            maxResults,
            orderBy: "relevance",
          },
        }
      );

      if (!data.items || data.items.length === 0) {
        return [];
      }

      return data.items.map((item: any): Book => ({
        id: item.id,
        title: item.volumeInfo.title,
        author: item.volumeInfo.authors ? item.volumeInfo.authors.join(", ") : "Unknown Author",
        description: item.volumeInfo.description || "No description available",
        imageUrl: item.volumeInfo.imageLinks?.thumbnail || null,
        publishedDate: item.volumeInfo.publishedDate,
        pageCount: item.volumeInfo.pageCount,
        categories: item.volumeInfo.categories || [],
      }));
    },
    enabled: !!genre.trim(),
    staleTime: 1000 * 60 * 30, // 30 minutes
    cacheTime: 1000 * 60 * 60, // 60 minutes
    retry: 2, // Retry failed requests twice
    meta: {
      onError: (error: Error) => {
        Sentry.captureException(error, {
          tags: {
            hook: "useTrendingBooks",
          },
          extra: { genre },
        });

        toast({
          title: "Couldn't load trending books",
          description: "We're having trouble finding the hottest reads right now.",
          variant: "destructive",
        });
      },
    },
  });

  return query;
}