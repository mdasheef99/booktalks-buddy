import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api";
import { Book } from "../../types/books";
import { useToast } from "../use-toast";

/**
 * Hook to search books via Google Books API
 * @param searchQuery The search string
 * @param maxResults Max results to fetch (default 8)
 */
export function useSearchBooks(searchQuery: string, maxResults: number = 8) {
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ["bookSearch", searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];

      const data = await apiFetch<any>(
        "https://www.googleapis.com/books/v1/volumes",
        {
          queryParams: {
            q: searchQuery,
            maxResults,
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
    enabled: !!searchQuery.trim(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    meta: {
      onError: (error: Error) => {
        console.error("Error searching books:", error, { searchQuery });

        toast({
          title: "Search Error",
          description: "We couldn't find what you're looking for. Please try again.",
          variant: "destructive",
        });
      },
    },
  });

  return query;
}