// Re-export all message-related functionality from the smaller modules
export * from './messageOperations';
export * from './reactions';

// Keep other imported and exported functionality for backward compatibility
import { supabase, generateBookUuid } from '../base/supabaseService';
import { ChatMessage, MessageReactionData } from './models';
import { ensureBookExists } from './bookService';
import {
  getBookChat,
  sendChatMessage,
  deleteMessage
} from './messageOperations';
import {
  getMessageReactions,
  addReaction
} from './reactions';
import {
  subscribeToChat,
  subscribeToReactions
} from './subscriptionService';

// Re-export everything for backward compatibility
export {
  getBookChat,
  sendChatMessage,
  deleteMessage,
  getMessageReactions,
  addReaction,
  subscribeToChat,
  subscribeToReactions
};
