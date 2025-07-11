/**
 * Collections Components Export Aggregator
 * 
 * Clean export aggregator for all collections components
 * Maintains consistent import patterns across the application
 */

// Core Collection Components
export { CollectionCard } from './CollectionCard';
export { CollectionGrid } from './CollectionGrid';
export { CreateCollectionModal } from './CreateCollectionModal';
export { EditCollectionModal } from './EditCollectionModal';
export { AddToCollectionModal } from './AddToCollectionModal';
export { CollectionBooksView } from './CollectionBooksView';

// Component Types (re-export for convenience)
export type {
  CollectionCardProps,
  CollectionGridProps,
  CreateCollectionModalProps,
  EditCollectionModalProps,
  AddToCollectionModalProps,
  CollectionBooksViewProps,
  CollectionSelectionItem,
  CollectionBookItemProps,
  CreateCollectionFormData,
  EditCollectionFormData
} from './types';
