import { useQuery } from '@tanstack/react-query';
import { HeroCustomizationAPI } from '@/lib/api/store/heroCustomization';

/**
 * Hook for fetching hero customization data for public display
 * Used by the HeroSection component to get customization settings
 */
export const useHeroCustomization = (storeId?: string) => {
  return useQuery({
    queryKey: ['hero-customization-public', storeId],
    queryFn: () => {
      if (!storeId) {
        // Return defaults when no store ID
        return {
          hasCustomQuote: false,
          fontStyle: 'elegant',
          chatButton: {
            text: 'Start Chatting Anonymously',
            position: 'center',
            colorScheme: 'terracotta',
            size: 'large',
            enabled: true
          }
        };
      }
      return HeroCustomizationAPI.getPublicHeroCustomization(storeId);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    enabled: true, // Always enabled, will return defaults if no storeId
  });
};

/**
 * Hook for checking if hero quote is active
 * Used for conditional rendering of hero quote section
 */
export const useHeroQuoteStatus = (storeId?: string) => {
  return useQuery({
    queryKey: ['hero-quote-status', storeId],
    queryFn: () => {
      if (!storeId) return false;
      return HeroCustomizationAPI.isHeroQuoteActive(storeId);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!storeId,
  });
};
