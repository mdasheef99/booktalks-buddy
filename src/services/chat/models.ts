
// Chat message model definitions
export interface ChatMessage {
  id: string;
  book_id: string;
  message: string;
  username: string;
  timestamp: string;
  user_id?: string;
  created_at: string;
  read?: boolean;
  reply_to_id?: string;
  deleted_at?: string;
  reactions?: Array<{reaction: string, count: number, userReacted: boolean, username: string}>;
}

// Message reaction type
export interface MessageReactionData {
  id: string;
  message_id: string;
  username: string;
  reaction: string;
}

// Helper function to get the current username from localStorage
export function getCurrentUsername(): string {
  return localStorage.getItem('anon_username') || 
         localStorage.getItem('username') || 
         'Anonymous Reader';
}
