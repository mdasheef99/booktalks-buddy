/**
 * Collections Hooks Export Aggregator
 * 
 * Clean export aggregator for all collections hooks
 * Maintains consistent import patterns across the application
 */

// Core Collection Hooks
export { useCollections } from './useCollections';
export { useCollectionBooks } from './useCollectionBooks';
export { useCollectionActions } from './useCollectionActions';

// Hook Types (re-export for convenience)
export type {
  UseCollectionsReturn,
  UseCollectionBooksReturn,
  UseCollectionActionsReturn,
  CollectionHookOptions
} from './types';
