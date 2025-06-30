/**
 * Conversation Helpers Module Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  findExistingConversation,
  isUserInConversation,
  getUnreadMessageCount,
  getConversationDisplayName
} from '../conversation-helpers';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
          limit: vi.fn(() => ({
            single: vi.fn()
          })),
          in: vi.fn(() => ({
            limit: vi.fn(() => ({
              single: vi.fn()
            }))
          })),
          gt: vi.fn(() => ({
            neq: vi.fn()
          }))
        })),
        gt: vi.fn(() => ({
          neq: vi.fn()
        }))
      }))
    }))
  }
}));

describe('Conversation Helpers Module', () => {
  let mockSupabase: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    const { supabase } = await import('@/lib/supabase');
    mockSupabase = supabase;
  });

  describe('findExistingConversation', () => {
    it('should find existing conversation between two users', async () => {
      // Mock user1 conversations
      mockSupabase.from().select().eq.mockReturnValueOnce({
        single: vi.fn(),
        limit: vi.fn(),
        in: vi.fn()
      });
      
      const mockChain1 = mockSupabase.from().select().eq();
      mockChain1.mockResolvedValueOnce({
        data: [{ conversation_id: 'conv-1' }, { conversation_id: 'conv-2' }],
        error: null
      });

      // Mock user2 conversations
      const mockChain2 = mockSupabase.from().select().eq();
      mockChain2.mockResolvedValueOnce({
        data: [{ conversation_id: 'conv-1' }, { conversation_id: 'conv-3' }],
        error: null
      });

      // Mock conversation verification
      const mockChain3 = mockSupabase.from().select().eq().in().limit();
      mockChain3.single.mockResolvedValueOnce({
        data: { id: 'conv-1' },
        error: null
      });

      const result = await findExistingConversation('user-1', 'user-2', 'store-123');
      expect(result).toBe('conv-1');
    });

    it('should return null when no common conversations exist', async () => {
      // Mock user1 conversations
      const mockChain1 = mockSupabase.from().select().eq();
      mockChain1.mockResolvedValueOnce({
        data: [{ conversation_id: 'conv-1' }],
        error: null
      });

      // Mock user2 conversations
      const mockChain2 = mockSupabase.from().select().eq();
      mockChain2.mockResolvedValueOnce({
        data: [{ conversation_id: 'conv-2' }],
        error: null
      });

      const result = await findExistingConversation('user-1', 'user-2', 'store-123');
      expect(result).toBeNull();
    });

    it('should return null when user has no conversations', async () => {
      const mockChain1 = mockSupabase.from().select().eq();
      mockChain1.mockResolvedValueOnce({
        data: [],
        error: null
      });

      const result = await findExistingConversation('user-1', 'user-2', 'store-123');
      expect(result).toBeNull();
    });
  });

  describe('isUserInConversation', () => {
    it('should return true when user is participant', async () => {
      const mockChain = mockSupabase.from().select().eq().eq();
      mockChain.single.mockResolvedValue({
        data: { user_id: 'user-123' },
        error: null
      });

      const result = await isUserInConversation('user-123', 'conv-123');
      expect(result).toBe(true);
    });

    it('should return false when user is not participant', async () => {
      const mockChain = mockSupabase.from().select().eq().eq();
      mockChain.single.mockResolvedValue({
        data: null,
        error: { message: 'No rows returned' }
      });

      const result = await isUserInConversation('user-123', 'conv-123');
      expect(result).toBe(false);
    });

    it('should handle database errors gracefully', async () => {
      const mockChain = mockSupabase.from().select().eq().eq();
      mockChain.single.mockRejectedValue(new Error('Database error'));

      const result = await isUserInConversation('user-123', 'conv-123');
      expect(result).toBe(false);
    });
  });

  describe('getUnreadMessageCount', () => {
    it('should return correct unread count', async () => {
      // Mock participant data
      const mockChain1 = mockSupabase.from().select().eq().eq();
      mockChain1.single.mockResolvedValue({
        data: { last_read_at: '2023-01-01T10:00:00Z' },
        error: null
      });

      // Mock message count
      const mockChain2 = mockSupabase.from().select().eq().eq().gt().neq();
      mockChain2.mockResolvedValue({
        count: 5,
        error: null
      });

      const result = await getUnreadMessageCount('conv-123', 'user-123');
      expect(result).toBe(5);
    });

    it('should return 0 when user is not participant', async () => {
      const mockChain = mockSupabase.from().select().eq().eq();
      mockChain.single.mockResolvedValue({
        data: null,
        error: { message: 'No rows returned' }
      });

      const result = await getUnreadMessageCount('conv-123', 'user-123');
      expect(result).toBe(0);
    });

    it('should handle database errors gracefully', async () => {
      const mockChain = mockSupabase.from().select().eq().eq();
      mockChain.single.mockRejectedValue(new Error('Database error'));

      const result = await getUnreadMessageCount('conv-123', 'user-123');
      expect(result).toBe(0);
    });
  });

  describe('getConversationDisplayName', () => {
    it('should return other participant name for 1-on-1 conversation', () => {
      const participants = [
        { id: 'user-1', username: 'john', displayname: 'John Doe' },
        { id: 'user-2', username: 'jane', displayname: 'Jane Smith' }
      ];

      const result = getConversationDisplayName(participants, 'user-1');
      expect(result).toBe('Jane Smith');
    });

    it('should fallback to username when displayname is not available', () => {
      const participants = [
        { id: 'user-1', username: 'john', displayname: 'John Doe' },
        { id: 'user-2', username: 'jane', displayname: '' }
      ];

      const result = getConversationDisplayName(participants, 'user-1');
      expect(result).toBe('jane');
    });

    it('should return "You" when only current user is participant', () => {
      const participants = [
        { id: 'user-1', username: 'john', displayname: 'John Doe' }
      ];

      const result = getConversationDisplayName(participants, 'user-1');
      expect(result).toBe('You');
    });

    it('should handle group conversations', () => {
      const participants = [
        { id: 'user-1', username: 'john', displayname: 'John Doe' },
        { id: 'user-2', username: 'jane', displayname: 'Jane Smith' },
        { id: 'user-3', username: 'bob', displayname: 'Bob Wilson' }
      ];

      const result = getConversationDisplayName(participants, 'user-1');
      expect(result).toBe('Jane Smith, Bob Wilson');
    });

    it('should handle empty participants array', () => {
      const result = getConversationDisplayName([], 'user-1');
      expect(result).toBe('You');
    });
  });
});
