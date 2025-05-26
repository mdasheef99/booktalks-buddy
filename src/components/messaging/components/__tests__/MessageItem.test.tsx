/**
 * MessageItem Component Tests
 *
 * Tests for the MessageItem component including message rendering,
 * sender/receiver styling, and timestamp formatting.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MessageItem } from '../MessageItem';
import { DMMessage } from '@/lib/api/messaging/types';

// Mock UserName component
vi.mock('../UserName', () => ({
  UserName: ({ user, showBoth, fallback }: any) => (
    <span data-testid="user-name">
      {user.displayname || user.username || fallback}
    </span>
  )
}));

// Mock messaging utilities
vi.mock('@/lib/api/messaging', () => ({
  formatMessageTime: (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  },
  isMessageFromToday: (timestamp: string) => {
    const messageDate = new Date(timestamp);
    const today = new Date();
    return messageDate.toDateString() === today.toDateString();
  }
}));

describe('MessageItem', () => {
  const createMockMessage = (overrides = {}): DMMessage => ({
    id: 'msg-123',
    conversation_id: 'conv-456',
    sender_id: 'user-789',
    content: 'Hello, how are you doing today?',
    sent_at: '2023-07-01T15:30:00Z',
    is_deleted: false,
    sender: {
      username: 'testuser',
      displayname: 'Test User'
    },
    ...overrides
  });

  const setup = (props = {}) => {
    const defaultProps = {
      message: createMockMessage(),
      isOwn: false,
      showSender: true,
      className: ''
    };

    const mergedProps = { ...defaultProps, ...props };
    const utils = render(<MessageItem {...mergedProps} />);

    return {
      ...utils,
      message: mergedProps.message,
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('displays message content', () => {
      const message = createMockMessage({
        content: 'This is a test message content'
      });

      setup({ message });

      expect(screen.getByText('This is a test message content')).toBeInTheDocument();
    });

    it('displays sender name for received messages when showSender is true', () => {
      const message = createMockMessage({
        sender: {
          username: 'johndoe',
          displayname: 'John Doe'
        }
      });

      setup({ message, isOwn: false, showSender: true });

      expect(screen.getByTestId('user-name')).toHaveTextContent('John Doe');
    });

    it('does not display sender name for own messages', () => {
      const message = createMockMessage({
        sender: {
          username: 'currentuser',
          displayname: 'Current User'
        }
      });

      setup({ message, isOwn: true, showSender: true });

      expect(screen.queryByTestId('user-name')).not.toBeInTheDocument();
    });

    it('does not display sender name when showSender is false', () => {
      const message = createMockMessage({
        sender: {
          username: 'johndoe',
          displayname: 'John Doe'
        }
      });

      setup({ message, isOwn: false, showSender: false });

      expect(screen.queryByTestId('user-name')).not.toBeInTheDocument();
    });

    it('displays formatted timestamp', () => {
      const message = createMockMessage({
        sent_at: '2023-07-01T15:30:00Z'
      });

      setup({ message });

      // Should display formatted time
      expect(screen.getByText(/\d{1,2}:\d{2}/)).toBeInTheDocument();
    });

    it('preserves line breaks in message content', () => {
      const message = createMockMessage({
        content: 'Line 1\nLine 2\nLine 3'
      });

      setup({ message });

      const messageContent = screen.getByText('Line 1\nLine 2\nLine 3');
      expect(messageContent).toHaveClass('whitespace-pre-wrap');
    });
  });

  describe('styling', () => {
    it('applies own message styling for sent messages', () => {
      const message = createMockMessage();

      setup({ message, isOwn: true });

      const messageContainer = screen.getByText(message.content).closest('div');
      expect(messageContainer).toHaveClass('bg-bookconnect-sage', 'text-white');
    });

    it('applies received message styling for received messages', () => {
      const message = createMockMessage();

      setup({ message, isOwn: false });

      const messageContainer = screen.getByText(message.content).closest('div');
      expect(messageContainer).toHaveClass('bg-gray-200', 'text-gray-900');
    });

    it('aligns own messages to the right', () => {
      const message = createMockMessage();

      setup({ message, isOwn: true });

      const messageWrapper = screen.getByText(message.content).closest('div')?.parentElement;
      expect(messageWrapper).toHaveClass('justify-end');
    });

    it('aligns received messages to the left', () => {
      const message = createMockMessage();

      setup({ message, isOwn: false });

      const messageWrapper = screen.getByText(message.content).closest('div')?.parentElement;
      expect(messageWrapper).toHaveClass('justify-start');
    });

    it('applies custom className when provided', () => {
      const message = createMockMessage();

      setup({ message, className: 'custom-class' });

      const messageWrapper = screen.getByText(message.content).closest('div')?.parentElement;
      expect(messageWrapper).toHaveClass('custom-class');
    });
  });

  describe('timestamp styling', () => {
    it('applies correct timestamp styling for own messages', () => {
      const message = createMockMessage();

      setup({ message, isOwn: true });

      const timestamp = screen.getByText(/\d{1,2}:\d{2}/);
      expect(timestamp).toHaveClass('text-white/70');
    });

    it('applies correct timestamp styling for received messages', () => {
      const message = createMockMessage();

      setup({ message, isOwn: false });

      const timestamp = screen.getByText(/\d{1,2}:\d{2}/);
      expect(timestamp).toHaveClass('text-gray-500');
    });
  });

  describe('edge cases', () => {
    it('handles empty message content gracefully', () => {
      const message = createMockMessage({
        content: ''
      });

      setup({ message });

      // Should still render the message container
      const messageContainer = screen.getByText(/\d{1,2}:\d{2}/).closest('div')?.parentElement;
      expect(messageContainer).toBeInTheDocument();
    });

    it('handles very long message content', () => {
      const longContent = 'A'.repeat(1000);
      const message = createMockMessage({
        content: longContent
      });

      setup({ message });

      expect(screen.getByText(longContent)).toBeInTheDocument();

      const messageContent = screen.getByText(longContent);
      expect(messageContent).toHaveClass('break-words');
    });

    it('handles missing sender information', () => {
      const message = createMockMessage({
        sender: {
          username: '',
          displayname: ''
        }
      });

      setup({ message, isOwn: false, showSender: true });

      expect(screen.getByTestId('user-name')).toHaveTextContent('Unknown User');
    });

    it('handles special characters in message content', () => {
      const message = createMockMessage({
        content: 'Special chars: @#$%^&*()_+{}|:"<>?[]\\;\',./'
      });

      setup({ message });

      expect(screen.getByText('Special chars: @#$%^&*()_+{}|:"<>?[]\\;\',./')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('maintains proper text contrast for own messages', () => {
      const message = createMockMessage();

      setup({ message, isOwn: true });

      const messageContent = screen.getByText(message.content);
      expect(messageContent.closest('div')).toHaveClass('text-white');
    });

    it('maintains proper text contrast for received messages', () => {
      const message = createMockMessage();

      setup({ message, isOwn: false });

      const messageContent = screen.getByText(message.content);
      expect(messageContent.closest('div')).toHaveClass('text-gray-900');
    });
  });
});
