/**
 * Books Section Module Index
 * 
 * Clean export aggregator for all Books Section functionality
 */

// Main Component
export { default } from './BooksSection';

// Components
export { BooksHeader } from './components/BooksHeader';
export { SearchSection } from './components/SearchSection';
export { PersonalBooksSection } from './components/PersonalBooksSection';
export { StoreRequestsSection } from './components/StoreRequestsSection';
export { CollectionsSection } from './components/CollectionsSection';
export { QuickActions } from './components/QuickActions';

// Hooks
export { useBooksData } from './hooks/useBooksData';
export { useBooksNavigation } from './hooks/useBooksNavigation';
export { useBooksSearch } from './hooks/useBooksSearch';

// Types
export type { BooksSectionTab } from './hooks/useBooksNavigation';
export type { 
  BooksDataState, 
  BooksDataActions, 
  UseBooksDataReturn 
} from './hooks/useBooksData';
export type { 
  BooksNavigationState, 
  BooksNavigationActions, 
  UseBooksNavigationReturn 
} from './hooks/useBooksNavigation';
export type { 
  BooksSearchState, 
  BooksSearchActions, 
  UseBooksSearchReturn 
} from './hooks/useBooksSearch';
