/**
 * Reading Lists Service Module Index
 * 
 * Clean export aggregator for all reading lists functionality
 */

// CRUD Operations
export {
  addToReadingList,
  updateReadingListItem,
  removeFromReadingList,
  getReadingListItem,
  isBookInReadingList
} from './readingListCrud';

// Queries
export {
  getReadingList,
  getPublicReadingList,
  getReadingStats,
  searchReadingList,
  getRecentlyUpdated
} from './readingListQueries';

// Ratings
export {
  rateBook,
  updateBookRating,
  getUserRatingStats
} from './ratingsService';

// Reviews
export {
  updateBookReview,
  getUserReviews,
  getPublicReviews,
  searchUserReviews,
  getReviewStats
} from './reviewsService';

// Privacy
export {
  updateItemPrivacy,
  bulkUpdatePrivacy,
  getPrivacyStats
} from './privacyService';

// Types
export type {
  ReadingStatus,
  ReadingListItem,
  AddToReadingListRequest,
  UpdateReadingListRequest,
  ReadingListQueryOptions,
  ReadingStats,
  RatingStats,
  ReviewStats,
  PrivacyStats,
  ReadingListServiceResponse,
  ReadingListResponse,
  ReadingListFilters,
  ReadingListSearchOptions
} from './types/readingLists';
