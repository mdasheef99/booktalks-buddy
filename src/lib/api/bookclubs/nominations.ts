/**
 * Book Nomination System API
 *
 * This file is maintained for backward compatibility.
 * It re-exports all functionality from the modular files.
 *
 * For new code, import directly from the specific modules:
 * - Types: '@/lib/api/bookclubs/types'
 * - Book search: '@/lib/api/bookclubs/books/search'
 * - Book storage: '@/lib/api/bookclubs/books/storage'
 * - Nomination creation: '@/lib/api/bookclubs/nominations/create'
 * - Nomination retrieval: '@/lib/api/bookclubs/nominations/retrieve'
 * - Nomination management: '@/lib/api/bookclubs/nominations/manage'
 * - Or use the index: '@/lib/api/bookclubs/nominations'
 */

// Export types
export type { Nomination, NominatedBook } from './types';

// Export book search functionality
export { searchBooks } from './books/search';

// Export book storage functionality (internal use only)
export { saveBook } from './books/storage';

// Export nomination creation functionality
export { nominateBook } from './nominations/create';

// Export nomination retrieval functionality
export { getNominations, getNominationById } from './nominations/retrieve';

// Export nomination management functionality
export { archiveNomination } from './nominations/manage';
