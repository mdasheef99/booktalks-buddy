import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useStoreId } from '@/hooks/useStoreId';
import { supabase } from '@/lib/supabase';
import { PromotionalBanner as BannerType } from '@/lib/api/store/banners/types/bannerTypes';
import { OffersHeader } from './components/offers/OffersHeader';
import { OffersGrid } from './components/offers/OffersGrid';
import { OffersLoading } from './components/offers/OffersLoading';
import { OffersError } from './components/offers/OffersError';
import { OffersEmpty } from './components/offers/OffersEmpty';

/**
 * Main Offers page component
 * Displays all promotional banners/offers for the store
 */
const Offers: React.FC = () => {
  const navigate = useNavigate();
  const { storeId } = useStoreId();
  const [sortBy, setSortBy] = useState<'priority' | 'date' | 'title'>('priority');
  const [filterBy, setFilterBy] = useState<'all' | 'active' | 'upcoming'>('active');

  // Fetch all promotional banners (not just landing page ones)
  const {
    data: offers,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['offers', storeId, sortBy, filterBy],
    queryFn: async () => {
      if (!storeId) return [];

      let query = supabase
        .from('store_promotional_banners')
        .select('*')
        .eq('store_id', storeId);

      // Apply filters
      if (filterBy === 'active') {
        query = query
          .eq('is_active', true)
          .or(`start_date.is.null,start_date.lte.${new Date().toISOString()}`)
          .or(`end_date.is.null,end_date.gt.${new Date().toISOString()}`);
      } else if (filterBy === 'upcoming') {
        query = query
          .eq('is_active', true)
          .gt('start_date', new Date().toISOString());
      }

      // Apply sorting
      if (sortBy === 'priority') {
        query = query.order('priority_order', { ascending: true });
      } else if (sortBy === 'date') {
        query = query.order('created_at', { ascending: false });
      } else if (sortBy === 'title') {
        query = query.order('title', { ascending: true });
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching offers:', error);
        throw new Error('Failed to load offers');
      }

      return data as BannerType[];
    },
    enabled: !!storeId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-bookconnect-cream to-bookconnect-sage/20">
      <OffersHeader 
        sortBy={sortBy}
        setSortBy={setSortBy}
        filterBy={filterBy}
        setFilterBy={setFilterBy}
        totalOffers={offers?.length || 0}
        onRefresh={refetch}
      />
      
      <main className="container mx-auto px-4 py-8">
        {isLoading ? (
          <OffersLoading />
        ) : error ? (
          <OffersError onRetry={refetch} />
        ) : offers && offers.length > 0 ? (
          <OffersGrid offers={offers} />
        ) : (
          <OffersEmpty filterBy={filterBy} />
        )}
      </main>
    </div>
  );
};

export default Offers;
