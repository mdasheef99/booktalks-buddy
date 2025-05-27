/**
 * Query builder utilities for banner database operations
 * Centralized query construction and parameter handling
 */

import { supabase } from '@/lib/supabase';
import { 
  BannerQueryOptions, 
  ActiveBannerOptions, 
  ScheduledBannerOptions 
} from '../types/bannerTypes';
import { 
  BANNER_TABLE, 
  BANNER_FIELDS, 
  BANNER_DEFAULTS 
} from '../constants/bannerConstants';
import { 
  buildActiveBannerQuery, 
  buildDateRangeQuery 
} from './bannerUtils';

/**
 * Base query builder for banners table
 */
export const createBaseQuery = () => {
  return supabase.from(BANNER_TABLE);
};

/**
 * Build query for fetching all banners for a store
 */
export const buildGetBannersQuery = (options: BannerQueryOptions) => {
  let query = createBaseQuery()
    .select(BANNER_FIELDS.ALL)
    .eq('store_id', options.storeId);

  // Add active filter if specified
  if (!options.includeInactive) {
    query = query.eq('is_active', true);
  }

  // Add ordering
  const orderBy = options.orderBy || 'priority_order';
  const ascending = options.orderDirection !== 'desc';
  query = query.order(orderBy, { ascending });

  // Add limit if specified
  if (options.limit) {
    query = query.limit(options.limit);
  }

  return query;
};

/**
 * Build query for fetching active banners
 */
export const buildGetActiveBannersQuery = (options: ActiveBannerOptions) => {
  const { startCondition, endCondition } = buildActiveBannerQuery(options.currentTime);
  
  return createBaseQuery()
    .select(BANNER_FIELDS.ALL)
    .eq('store_id', options.storeId)
    .eq('is_active', true)
    .or(startCondition)
    .or(endCondition)
    .order('priority_order', { ascending: true })
    .limit(options.limit || BANNER_DEFAULTS.ACTIVE_BANNERS_LIMIT);
};

/**
 * Build query for fetching a single banner
 */
export const buildGetBannerQuery = (bannerId: string) => {
  return createBaseQuery()
    .select(BANNER_FIELDS.ALL)
    .eq('id', bannerId)
    .single();
};

/**
 * Build query for creating a banner
 */
export const buildCreateBannerQuery = (bannerData: any) => {
  return createBaseQuery()
    .insert(bannerData)
    .select(BANNER_FIELDS.ALL)
    .single();
};

/**
 * Build query for updating a banner
 */
export const buildUpdateBannerQuery = (bannerId: string, updates: any) => {
  return createBaseQuery()
    .update(updates)
    .eq('id', bannerId)
    .select(BANNER_FIELDS.ALL)
    .single();
};

/**
 * Build query for deleting a banner
 */
export const buildDeleteBannerQuery = (bannerId: string) => {
  return createBaseQuery()
    .delete()
    .eq('id', bannerId);
};

/**
 * Build query for updating priority order
 */
export const buildUpdatePriorityQuery = (bannerId: string, storeId: string, priorityOrder: number) => {
  return createBaseQuery()
    .update({ priority_order: priorityOrder })
    .eq('id', bannerId)
    .eq('store_id', storeId);
};

/**
 * Build query for getting next priority order
 */
export const buildGetNextPriorityQuery = (storeId: string) => {
  return createBaseQuery()
    .select(BANNER_FIELDS.PRIORITY_ONLY)
    .eq('store_id', storeId)
    .order('priority_order', { ascending: false })
    .limit(1);
};

/**
 * Build query for checking priority availability
 */
export const buildCheckPriorityQuery = (storeId: string, priorityOrder: number) => {
  return createBaseQuery()
    .select(BANNER_FIELDS.ID_ONLY)
    .eq('store_id', storeId)
    .eq('priority_order', priorityOrder)
    .limit(1);
};

/**
 * Build query for fetching banners in date range
 */
export const buildGetBannersInDateRangeQuery = (options: ScheduledBannerOptions) => {
  const { startCondition, endCondition } = buildDateRangeQuery(options.dateRange);
  
  let query = createBaseQuery()
    .select(BANNER_FIELDS.ALL)
    .eq('store_id', options.storeId)
    .or(startCondition)
    .or(endCondition)
    .order('priority_order', { ascending: true });

  // Add active filter if specified
  if (!options.includeInactive) {
    query = query.eq('is_active', true);
  }

  return query;
};

/**
 * Build query for deactivating expired banners
 */
export const buildDeactivateExpiredQuery = (storeId: string, currentTime: string) => {
  return createBaseQuery()
    .update({ is_active: false })
    .eq('store_id', storeId)
    .not('end_date', 'is', null)
    .lte('end_date', currentTime)
    .eq('is_active', true);
};

/**
 * Build query for activating scheduled banners
 */
export const buildActivateScheduledQuery = (storeId: string, currentTime: string) => {
  const { startCondition, endCondition } = buildActiveBannerQuery(currentTime);
  
  return createBaseQuery()
    .update({ is_active: true })
    .eq('store_id', storeId)
    .or(startCondition)
    .or(endCondition)
    .eq('is_active', false);
};
