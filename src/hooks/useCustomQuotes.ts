import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { QuotesAPI, CustomQuote } from '@/lib/api/store/quotes';

interface UseCustomQuotesResult {
  currentQuote: CustomQuote | null;
  allQuotes: CustomQuote[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook for managing custom quotes display on the landing page
 * Handles quote rotation and fetching current active quote
 */
export const useCustomQuotes = (storeId?: string): UseCustomQuotesResult => {
  const [currentQuote, setCurrentQuote] = useState<CustomQuote | null>(null);
  const [rotationIndex, setRotationIndex] = useState(0);



  // Fetch active quotes for the store (OPTIMIZED - database-level filtering)
  const {
    data: allQuotes = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['store-quotes-active', storeId],
    queryFn: async () => {
      if (!storeId) return [];

      try {
        // Use optimized API that filters at database level
        return await QuotesAPI.getActiveStoreQuotes(storeId);
      } catch (optimizedError) {
        console.warn('Optimized quotes API failed, falling back to legacy:', optimizedError);

        // Fallback to legacy client-side filtering
        const now = new Date().toISOString();
        const quotes = await QuotesAPI.getStoreQuotes(storeId);

        return quotes.filter(quote =>
          quote.is_active &&
          (!quote.start_date || quote.start_date <= now) &&
          (!quote.end_date || quote.end_date > now)
        );
      }
    },
    enabled: !!storeId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      // Retry up to 2 times for network errors, but not for data errors
      if (failureCount < 2 && error?.message?.includes('Failed to fetch')) {
        return true;
      }
      return false;
    },
  });

  // Quote rotation logic
  useEffect(() => {
    if (!allQuotes || allQuotes.length === 0) {
      setCurrentQuote(null);
      return;
    }

    // Set initial quote
    setCurrentQuote(allQuotes[0]);

    // If only one quote, no rotation needed
    if (allQuotes.length === 1) {
      return;
    }

    // Set up rotation timer (rotate every 30 seconds)
    const rotationInterval = setInterval(() => {
      setRotationIndex(prevIndex => {
        const nextIndex = (prevIndex + 1) % allQuotes.length;
        setCurrentQuote(allQuotes[nextIndex]);
        return nextIndex;
      });
    }, 30000); // 30 seconds

    return () => clearInterval(rotationInterval);
  }, [allQuotes]);

  return {
    currentQuote,
    allQuotes,
    loading: isLoading,
    error: error ? 'Failed to load quotes' : null,
    refetch,
  };
};

/**
 * Hook for admin quote management
 * Provides full CRUD operations for quotes
 */
export const useQuoteManagement = (storeId: string) => {
  const {
    data: quotes = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['store-quotes-admin', storeId],
    queryFn: () => QuotesAPI.getStoreQuotes(storeId),
    enabled: !!storeId,
    staleTime: 30 * 1000, // 30 seconds
  });

  return {
    quotes,
    loading: isLoading,
    error: error ? 'Failed to load quotes' : null,
    refetch,
  };
};

/**
 * Hook for getting current active quote (used in admin preview)
 */
export const useCurrentQuote = (storeId: string) => {
  const {
    data: currentQuote,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['current-quote', storeId],
    queryFn: () => QuotesAPI.getCurrentActiveQuote(storeId),
    enabled: !!storeId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  return {
    currentQuote: currentQuote || null,
    loading: isLoading,
    error: error ? 'Failed to load current quote' : null,
    refetch,
  };
};
