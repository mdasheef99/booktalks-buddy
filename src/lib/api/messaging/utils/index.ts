/**
 * Messaging Utils Module - Main Export
 * 
 * Aggregates all messaging utility functionality with proper organization
 */

// =========================
// Store Context Functions
// =========================
export {
  getUserStoreId,
  areUsersInSameStore,
  getUserStoreContext
} from './store-context';

// =========================
// User Lookup Functions
// =========================
export {
  searchUsersInStore,
  findUserInStore,
  getUsersInStore
} from './user-lookup';

// =========================
// Conversation Functions
// =========================
export {
  findExistingConversation,
  isUserInConversation,
  getUnreadMessageCount,
  getConversationDisplayName
} from './conversation-helpers';

// =========================
// Validation Functions
// =========================
export {
  validateMessageContent,
  validateUsername,
  validateUserId,
  validateConversationId,
  validateStoreId
} from './validation';

// =========================
// Message Formatting Functions
// =========================
export {
  formatMessagingError,
  sanitizeContent,
  formatMessageContent,
  truncateMessage,
  extractMentions,
  highlightMentions,
  formatMessageTimestamp,
  formatSearchResult
} from './message-formatting';

// =========================
// Convenience Functions
// =========================

/**
 * Check if user is participant in conversation (alias for backward compatibility)
 */
export async function isUserParticipant(
  conversationId: string,
  userId: string
): Promise<boolean> {
  const { isUserInConversation } = await import('./conversation-helpers');
  return isUserInConversation(userId, conversationId);
}

/**
 * Validate store context for a user
 */
export async function validateStoreContext(userId: string): Promise<boolean> {
  const { getUserStoreId } = await import('./store-context');
  const storeId = await getUserStoreId(userId);
  return storeId !== null;
}

/**
 * Validate user exists and has store context
 */
export async function validateUser(userId: string): Promise<boolean> {
  const { validateUserId } = await import('./validation');
  const { getUserStoreId } = await import('./store-context');

  const userIdValidation = validateUserId(userId);
  if (!userIdValidation.valid) {
    return false;
  }

  const storeId = await getUserStoreId(userId);
  return storeId !== null;
}
