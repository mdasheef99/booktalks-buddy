/**
 * Store Requests Service Module Index
 * 
 * Clean export aggregator for all store requests functionality
 */

// Main Service API
export {
  requestBookFromStore,
  createCustomStoreRequest,
  getUserStoreRequestOverview,
  getStoreRequestManagementOverview
} from './storeRequestsService';

// Request Operations
export {
  createAuthenticatedStoreRequest,
  getUserStoreRequests,
  getStoreRequest,
  cancelStoreRequest,
  getStoreRequests,
  updateStoreRequestStatus,
  getUserRequestStats,
  getStoreRequestStats
} from './requestOperations';

// User Context Operations
export {
  getUserStoreId,
  getUserStoreContext,
  validateUserStoreAccess,
  userBelongsToStore,
  getUserClubInfo
} from './userContextService';

// Store Resolution Operations
export {
  getAvailableStores,
  getStoreById,
  validateStoreExists,
  getStoresByClub,
  searchStores,
  getStoreStats,
  isStoreAcceptingRequests
} from './storeResolution';

// Types
export type {
  BookAvailabilityRequest,
  CreateStoreRequestRequest,
  StoreRequestQueryOptions,
  UserRequestStats,
  StoreRequestStats,
  UserStoreContext,
  AvailableStore,
  RequestStatus,
  StoreResponseStatus,
  RequestSource
} from './types/storeRequests';
