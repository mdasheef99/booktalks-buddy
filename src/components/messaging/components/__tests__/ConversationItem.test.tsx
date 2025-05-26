/**
 * ConversationItem Component Tests
 *
 * Tests for the ConversationItem component including rendering,
 * user interactions, and different conversation states.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConversationItem } from '../ConversationItem';
import { DMConversation } from '@/lib/api/messaging/types';

// Mock UserAvatar and UserName components
vi.mock('@/components/common/UserAvatar', () => ({
  default: ({ userId, size, className }: any) => (
    <div data-testid="user-avatar" className={className}>
      Avatar for {userId}
    </div>
  )
}));

vi.mock('../UserName', () => ({
  UserName: ({ user, showBoth, fallback }: any) => (
    <span data-testid="user-name">
      {user.displayname || user.username || fallback}
    </span>
  )
}));

// Mock formatMessageTime function
vi.mock('@/lib/api/messaging', () => ({
  formatMessageTime: (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}));

describe('ConversationItem', () => {
  const createMockConversation = (overrides = {}): DMConversation => ({
    id: 'conv-123',
    store_id: 'store-456',
    created_at: '2023-07-01T12:00:00Z',
    updated_at: '2023-07-01T12:30:00Z',
    other_participant: {
      id: 'user-789',
      username: 'testuser',
      displayname: 'Test User'
    },
    last_message: {
      content: 'Hello, how are you?',
      sent_at: '2023-07-01T12:30:00Z',
      sender_id: 'user-789'
    },
    unread_count: 2,
    ...overrides
  });

  const mockOnClick = vi.fn();

  const setup = (props = {}) => {
    const defaultProps = {
      conversation: createMockConversation(),
      onClick: mockOnClick
    };

    const mergedProps = { ...defaultProps, ...props };
    const utils = render(<ConversationItem {...mergedProps} />);

    return {
      ...utils,
      conversation: mergedProps.conversation,
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('displays participant name and avatar', () => {
      const conversation = createMockConversation({
        other_participant: {
          id: 'user-123',
          username: 'johndoe',
          displayname: 'John Doe'
        }
      });

      setup({ conversation });

      expect(screen.getByTestId('user-avatar')).toBeInTheDocument();
      expect(screen.getByTestId('user-name')).toHaveTextContent('John Doe');
    });

    it('displays last message content', () => {
      const conversation = createMockConversation({
        last_message: {
          content: 'See you at the book club meeting!',
          sent_at: '2023-07-01T15:30:00Z',
          sender_id: 'user-789'
        }
      });

      setup({ conversation });

      expect(screen.getByText('See you at the book club meeting!')).toBeInTheDocument();
    });

    it('displays formatted timestamp', () => {
      const conversation = createMockConversation({
        last_message: {
          content: 'Hello',
          sent_at: '2023-07-01T15:30:00Z',
          sender_id: 'user-789'
        }
      });

      setup({ conversation });

      // The exact format depends on locale, but should contain time
      expect(screen.getByText(/\d{1,2}:\d{2}/)).toBeInTheDocument();
    });

    it('displays unread count badge when there are unread messages', () => {
      const conversation = createMockConversation({
        unread_count: 5
      });

      setup({ conversation });

      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('displays 99+ for unread count over 99', () => {
      const conversation = createMockConversation({
        unread_count: 150
      });

      setup({ conversation });

      expect(screen.getByText('99+')).toBeInTheDocument();
    });

    it('does not display unread badge when count is 0', () => {
      const conversation = createMockConversation({
        unread_count: 0
      });

      setup({ conversation });

      expect(screen.queryByText('0')).not.toBeInTheDocument();
    });

    it('shows "You:" prefix for own messages', () => {
      const conversation = createMockConversation({
        other_participant: {
          id: 'user-789',
          username: 'testuser',
          displayname: 'Test User'
        },
        last_message: {
          content: 'Thanks for the recommendation!',
          sent_at: '2023-07-01T15:30:00Z',
          sender_id: 'current-user-id' // Different from other_participant.id
        }
      });

      setup({ conversation });

      expect(screen.getByText(/You: Thanks for the recommendation!/)).toBeInTheDocument();
    });

    it('shows "No messages yet" when there is no last message', () => {
      const conversation = createMockConversation({
        last_message: undefined
      });

      setup({ conversation });

      expect(screen.getByText('No messages yet')).toBeInTheDocument();
    });

    it('handles missing participant gracefully', () => {
      const conversation = createMockConversation({
        other_participant: null
      });

      setup({ conversation });

      expect(screen.getByTestId('user-name')).toHaveTextContent('Unknown User');
    });
  });

  describe('interactions', () => {
    it('calls onClick when conversation item is clicked', async () => {
      const user = userEvent.setup();
      const { conversation } = setup();

      const conversationItem = screen.getByRole('button');
      await user.click(conversationItem);

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('calls onClick when Enter key is pressed', async () => {
      const user = userEvent.setup();
      const { conversation } = setup();

      const conversationItem = screen.getByRole('button');
      conversationItem.focus();
      await user.keyboard('{Enter}');

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('calls onClick when Space key is pressed', async () => {
      const user = userEvent.setup();
      const { conversation } = setup();

      const conversationItem = screen.getByRole('button');
      conversationItem.focus();
      await user.keyboard(' ');

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('styling', () => {
    it('applies unread styling when there are unread messages', () => {
      const conversation = createMockConversation({
        unread_count: 3
      });

      setup({ conversation });

      const conversationItem = screen.getByRole('button');
      expect(conversationItem).toHaveClass('bg-blue-50/30');
    });

    it('does not apply unread styling when there are no unread messages', () => {
      const conversation = createMockConversation({
        unread_count: 0
      });

      setup({ conversation });

      const conversationItem = screen.getByRole('button');
      expect(conversationItem).not.toHaveClass('bg-blue-50/30');
    });
  });

  describe('accessibility', () => {
    it('has proper aria-label', () => {
      const conversation = createMockConversation({
        other_participant: {
          id: 'user-123',
          username: 'johndoe',
          displayname: 'John Doe'
        }
      });

      setup({ conversation });

      const conversationItem = screen.getByRole('button');
      expect(conversationItem).toHaveAttribute('aria-label', 'Conversation with John Doe');
    });

    it('is keyboard accessible', () => {
      setup();

      const conversationItem = screen.getByRole('button');
      expect(conversationItem).toHaveAttribute('tabIndex', '0');
    });
  });
});
