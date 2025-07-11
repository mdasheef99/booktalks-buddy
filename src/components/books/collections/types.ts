/**
 * Collections Components Types
 * 
 * TypeScript interfaces for all collections components
 */

import { BookCollection, CollectionBook } from '@/services/books/collections';
import { PersonalBook } from '@/services/books/personalBooksService';

// =====================================================
// CollectionCard Component Types
// =====================================================

export interface CollectionCardProps {
  collection: BookCollection;
  previewBooks?: PersonalBook[];
  onEdit?: (collection: BookCollection) => void;
  onDelete?: (collectionId: string) => void;
  onView?: (collection: BookCollection) => void;
  showActions?: boolean;
  className?: string;
}

// =====================================================
// CollectionGrid Component Types
// =====================================================

export interface CollectionGridProps {
  collections: BookCollection[];
  loading?: boolean;
  onCreateCollection?: () => void;
  onEditCollection?: (collection: BookCollection) => void;
  onDeleteCollection?: (collectionId: string) => void;
  onViewCollection?: (collection: BookCollection) => void;
  showCreateButton?: boolean;
  className?: string;
}

// =====================================================
// CreateCollectionModal Component Types
// =====================================================

export interface CreateCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (collection: BookCollection) => void;
  initialBooks?: PersonalBook[];
  userId: string;
}

export interface CreateCollectionFormData {
  name: string;
  description: string;
  is_public: boolean;
}

// =====================================================
// EditCollectionModal Component Types
// =====================================================

export interface EditCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (collection: BookCollection) => void;
  collection: BookCollection | null;
  userId: string;
}

export interface EditCollectionFormData {
  name: string;
  description: string;
  is_public: boolean;
}

// =====================================================
// AddToCollectionModal Component Types
// =====================================================

export interface AddToCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  book: PersonalBook;
  userId: string;
  existingCollections?: BookCollection[];
}

export interface CollectionSelectionItem {
  collection: BookCollection;
  isSelected: boolean;
  isAlreadyAdded: boolean;
}

// =====================================================
// CollectionBooksView Component Types
// =====================================================

export interface CollectionBooksViewProps {
  collection: BookCollection;
  onBack: () => void;
  onEditCollection?: (collection: BookCollection) => void;
  onDeleteCollection?: (collectionId: string) => void;
  onAddBooks?: () => void;
  onBookCountChanged?: () => void; // Add callback for book count changes
  userId: string;
  className?: string;
  showActions?: boolean; // Control whether to show edit/delete actions on individual books
}

export interface CollectionBookItemProps {
  collectionBook: CollectionBook;
  onRemove: (bookId: string) => void;
  onUpdateNotes: (bookId: string, notes: string) => void;
  showActions?: boolean;
}
