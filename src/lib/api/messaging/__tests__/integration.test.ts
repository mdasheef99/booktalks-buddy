/**
 * Messaging API Integration Tests
 * 
 * Tests for the core messaging API functions including conversation management,
 * message sending, and data retrieval with mocked Supabase client.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { startConversation, sendMessage, getUserConversations } from '../index';

// Mock Supabase client
const mockSupabaseClient = {
  from: vi.fn(),
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  eq: vi.fn(),
  single: vi.fn(),
  order: vi.fn(),
  range: vi.fn(),
  limit: vi.fn()
};

// Create chainable mock methods
const createChainableMock = (finalResult: any) => {
  const chainMethods = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(finalResult),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis()
  };
  return chainMethods;
};

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: mockSupabaseClient
}));

// Mock utility functions
vi.mock('../utils', () => ({
  getUserStoreId: vi.fn(),
  findUserInStore: vi.fn(),
  findExistingConversation: vi.fn(),
  validateMessageContent: vi.fn(),
  getUnreadMessageCount: vi.fn()
}));

// Mock permission functions
vi.mock('../permissions', () => ({
  requireMessagingPermission: vi.fn(),
  getUserRetentionPeriod: vi.fn()
}));

// Import mocked functions
import { 
  getUserStoreId, 
  findUserInStore, 
  findExistingConversation,
  validateMessageContent,
  getUnreadMessageCount
} from '../utils';
import { requireMessagingPermission, getUserRetentionPeriod } from '../permissions';

describe('Messaging API Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset the mock to return chainable methods
    mockSupabaseClient.from.mockImplementation(() => createChainableMock({ data: null, error: null }));
  });

  describe('startConversation', () => {
    it('creates new conversation successfully', async () => {
      // Mock successful flow
      vi.mocked(requireMessagingPermission).mockResolvedValue(undefined);
      vi.mocked(getUserStoreId).mockResolvedValue('store-123');
      vi.mocked(findUserInStore).mockResolvedValue({
        id: 'user-456',
        username: 'testuser',
        displayname: 'Test User'
      });
      vi.mocked(findExistingConversation).mockResolvedValue(null);

      // Mock Supabase responses
      const conversationMock = createChainableMock({
        data: { id: 'conv-789' },
        error: null
      });
      const participantsMock = createChainableMock({
        data: null,
        error: null
      });

      mockSupabaseClient.from
        .mockReturnValueOnce(conversationMock)
        .mockReturnValueOnce(participantsMock);

      const result = await startConversation('user-123', 'testuser');

      expect(result).toEqual({
        conversation_id: 'conv-789',
        is_existing: false
      });

      expect(requireMessagingPermission).toHaveBeenCalledWith('user-123', 'initiate');
      expect(getUserStoreId).toHaveBeenCalledWith('user-123');
      expect(findUserInStore).toHaveBeenCalledWith('user-123', 'testuser');
    });

    it('returns existing conversation when found', async () => {
      // Mock successful flow with existing conversation
      vi.mocked(requireMessagingPermission).mockResolvedValue(undefined);
      vi.mocked(getUserStoreId).mockResolvedValue('store-123');
      vi.mocked(findUserInStore).mockResolvedValue({
        id: 'user-456',
        username: 'testuser',
        displayname: 'Test User'
      });
      vi.mocked(findExistingConversation).mockResolvedValue('existing-conv-123');

      const result = await startConversation('user-123', 'testuser');

      expect(result).toEqual({
        conversation_id: 'existing-conv-123',
        is_existing: true
      });

      // Should not create new conversation
      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
    });

    it('throws error when user not found', async () => {
      vi.mocked(requireMessagingPermission).mockResolvedValue(undefined);
      vi.mocked(getUserStoreId).mockResolvedValue('store-123');
      vi.mocked(findUserInStore).mockResolvedValue(null);

      await expect(startConversation('user-123', 'nonexistent')).rejects.toThrow(
        'User not found in your store'
      );
    });

    it('throws error when no store context', async () => {
      vi.mocked(requireMessagingPermission).mockResolvedValue(undefined);
      vi.mocked(getUserStoreId).mockResolvedValue(null);

      await expect(startConversation('user-123', 'testuser')).rejects.toThrow(
        'Unable to determine store context'
      );
    });

    it('throws error when permission denied', async () => {
      vi.mocked(requireMessagingPermission).mockRejectedValue(
        new Error('Permission denied')
      );

      await expect(startConversation('user-123', 'testuser')).rejects.toThrow(
        'Permission denied'
      );
    });
  });

  describe('sendMessage', () => {
    it('sends message successfully', async () => {
      // Mock successful validation and permission check
      vi.mocked(validateMessageContent).mockReturnValue({ valid: true });
      vi.mocked(getUserRetentionPeriod).mockResolvedValue({
        tier: 'privileged',
        retention_days: 180,
        expires_at: '2024-01-01T00:00:00Z'
      });

      // Mock Supabase responses
      const participantMock = createChainableMock({
        data: { user_id: 'user-123' },
        error: null
      });
      const messageMock = createChainableMock({
        data: {
          id: 'msg-456',
          conversation_id: 'conv-123',
          sender_id: 'user-123',
          content: 'Hello world!',
          sent_at: '2023-07-01T12:00:00Z',
          is_deleted: false,
          sender: {
            username: 'testuser',
            displayname: 'Test User'
          }
        },
        error: null
      });
      const updateMock = createChainableMock({
        data: null,
        error: null
      });

      mockSupabaseClient.from
        .mockReturnValueOnce(participantMock)
        .mockReturnValueOnce(messageMock)
        .mockReturnValueOnce(updateMock);

      const result = await sendMessage('user-123', 'conv-123', 'Hello world!');

      expect(result.content).toBe('Hello world!');
      expect(result.sender_id).toBe('user-123');
      expect(validateMessageContent).toHaveBeenCalledWith('Hello world!');
    });

    it('throws error for invalid message content', async () => {
      vi.mocked(validateMessageContent).mockReturnValue({
        valid: false,
        error: 'Message too long'
      });

      await expect(sendMessage('user-123', 'conv-123', 'x'.repeat(1001))).rejects.toThrow(
        'Message too long'
      );
    });

    it('throws error when user not participant', async () => {
      vi.mocked(validateMessageContent).mockReturnValue({ valid: true });

      const participantMock = createChainableMock({
        data: null,
        error: { message: 'Not found' }
      });

      mockSupabaseClient.from.mockReturnValueOnce(participantMock);

      await expect(sendMessage('user-123', 'conv-123', 'Hello')).rejects.toThrow(
        'You are not authorized to send messages in this conversation'
      );
    });
  });

  describe('getUserConversations', () => {
    it('retrieves user conversations successfully', async () => {
      vi.mocked(getUnreadMessageCount).mockResolvedValue(2);

      const conversationsMock = createChainableMock({
        data: [
          {
            id: 'conv-123',
            store_id: 'store-456',
            created_at: '2023-07-01T10:00:00Z',
            updated_at: '2023-07-01T12:00:00Z',
            participants: [
              {
                user_id: 'user-789',
                last_read_at: '2023-07-01T11:00:00Z',
                user: {
                  id: 'user-789',
                  username: 'otheruser',
                  displayname: 'Other User'
                }
              }
            ],
            last_message: [
              {
                content: 'Latest message',
                sent_at: '2023-07-01T12:00:00Z',
                sender_id: 'user-789'
              }
            ]
          }
        ],
        error: null,
        count: 1
      });

      mockSupabaseClient.from.mockReturnValueOnce(conversationsMock);

      const result = await getUserConversations('user-123');

      expect(result.conversations).toHaveLength(1);
      expect(result.total_count).toBe(1);
      expect(result.conversations[0].other_participant.username).toBe('otheruser');
      expect(result.conversations[0].unread_count).toBe(2);
    });

    it('handles empty conversation list', async () => {
      const conversationsMock = createChainableMock({
        data: [],
        error: null,
        count: 0
      });

      mockSupabaseClient.from.mockReturnValueOnce(conversationsMock);

      const result = await getUserConversations('user-123');

      expect(result.conversations).toHaveLength(0);
      expect(result.total_count).toBe(0);
    });

    it('handles database errors gracefully', async () => {
      const conversationsMock = createChainableMock({
        data: null,
        error: { message: 'Database connection failed' }
      });

      mockSupabaseClient.from.mockReturnValueOnce(conversationsMock);

      await expect(getUserConversations('user-123')).rejects.toThrow(
        'Failed to load conversations'
      );
    });
  });

  describe('error handling', () => {
    it('handles network timeouts', async () => {
      vi.mocked(requireMessagingPermission).mockRejectedValue(
        new Error('Network timeout')
      );

      await expect(startConversation('user-123', 'testuser')).rejects.toThrow();
    });

    it('handles malformed responses', async () => {
      vi.mocked(validateMessageContent).mockReturnValue({ valid: true });
      vi.mocked(getUserRetentionPeriod).mockResolvedValue({
        tier: 'free',
        retention_days: 30,
        expires_at: '2024-01-01T00:00:00Z'
      });

      const participantMock = createChainableMock({
        data: { user_id: 'user-123' },
        error: null
      });
      const messageMock = createChainableMock({
        data: null, // Malformed response
        error: { message: 'Invalid data' }
      });

      mockSupabaseClient.from
        .mockReturnValueOnce(participantMock)
        .mockReturnValueOnce(messageMock);

      await expect(sendMessage('user-123', 'conv-123', 'Hello')).rejects.toThrow(
        'Failed to send message'
      );
    });
  });
});
