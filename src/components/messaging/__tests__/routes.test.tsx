/**
 * Messaging Routes Tests
 * 
 * Tests for messaging route navigation, error boundaries,
 * and proper component rendering within the routing context.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Routes, Route } from 'react-router-dom';
import { ConversationListPage } from '../pages/ConversationListPage';
import { MessageThreadPage } from '../pages/MessageThreadPage';
import { NewConversationPage } from '../pages/NewConversationPage';
import {
  ConversationListErrorBoundary,
  MessageThreadErrorBoundary,
  NewConversationErrorBoundary
} from '../components/MessagingErrorBoundary';

// Mock AuthContext
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'test-user-id',
      email: 'test@example.com'
    }
  })
}));

// Mock messaging API
vi.mock('@/lib/api/messaging', () => ({
  getUserConversations: vi.fn(),
  getConversationMessages: vi.fn(),
  canInitiateConversations: vi.fn(),
  startConversation: vi.fn(),
  sendMessage: vi.fn(),
  formatMessageTime: vi.fn((timestamp) => new Date(timestamp).toLocaleTimeString()),
  isMessageFromToday: vi.fn(() => true)
}));

// Mock UI components to avoid complex rendering
vi.mock('../components/ConversationItem', () => ({
  ConversationItem: ({ conversation, onClick }: any) => (
    <div data-testid="conversation-item" onClick={onClick}>
      {conversation.other_participant?.username || 'Unknown'}
    </div>
  )
}));

vi.mock('../components/MessageItem', () => ({
  MessageItem: ({ message, isOwn }: any) => (
    <div data-testid="message-item" data-own={isOwn}>
      {message.content}
    </div>
  )
}));

vi.mock('../components/MessageInput', () => ({
  MessageInput: ({ onSendMessage, disabled }: any) => (
    <div data-testid="message-input">
      <input 
        placeholder="Type a message..."
        disabled={disabled}
        onChange={(e) => onSendMessage?.(e.target.value)}
      />
    </div>
  )
}));

vi.mock('../components/MessagingHeader', () => ({
  MessagingHeader: ({ title, onBack }: any) => (
    <div data-testid="messaging-header">
      <button onClick={onBack}>Back</button>
      <h1>{title}</h1>
    </div>
  )
}));

// Import mocked functions
import { 
  getUserConversations, 
  getConversationMessages, 
  canInitiateConversations 
} from '@/lib/api/messaging';

describe('Messaging Routes', () => {
  let queryClient: QueryClient;

  const createWrapper = (initialEntries = ['/messages']) => {
    return ({ children }: { children: React.ReactNode }) => (
      <MemoryRouter initialEntries={initialEntries}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });
    vi.clearAllMocks();
  });

  describe('ConversationListPage route', () => {
    it('renders conversation list page at /messages', async () => {
      vi.mocked(getUserConversations).mockResolvedValue({
        conversations: [
          {
            id: 'conv-1',
            other_participant: { username: 'testuser', displayname: 'Test User' },
            last_message: { content: 'Hello', sent_at: '2023-07-01T12:00:00Z' },
            unread_count: 1
          }
        ],
        total_count: 1
      });
      vi.mocked(canInitiateConversations).mockResolvedValue(true);

      const Wrapper = createWrapper(['/messages']);

      render(
        <Wrapper>
          <Routes>
            <Route path="/messages" element={
              <ConversationListErrorBoundary>
                <ConversationListPage />
              </ConversationListErrorBoundary>
            } />
          </Routes>
        </Wrapper>
      );

      expect(screen.getByTestId('messaging-header')).toBeInTheDocument();
      
      // Wait for conversations to load
      await screen.findByTestId('conversation-item');
      expect(screen.getByTestId('conversation-item')).toHaveTextContent('testuser');
    });

    it('shows empty state when no conversations', async () => {
      vi.mocked(getUserConversations).mockResolvedValue({
        conversations: [],
        total_count: 0
      });
      vi.mocked(canInitiateConversations).mockResolvedValue(true);

      const Wrapper = createWrapper(['/messages']);

      render(
        <Wrapper>
          <Routes>
            <Route path="/messages" element={
              <ConversationListErrorBoundary>
                <ConversationListPage />
              </ConversationListErrorBoundary>
            } />
          </Routes>
        </Wrapper>
      );

      await screen.findByText(/no conversations yet/i);
      expect(screen.getByText(/no conversations yet/i)).toBeInTheDocument();
    });
  });

  describe('MessageThreadPage route', () => {
    it('renders message thread page at /messages/:conversationId', async () => {
      vi.mocked(getConversationMessages).mockResolvedValue({
        messages: [
          {
            id: 'msg-1',
            content: 'Hello there!',
            sender_id: 'other-user',
            sent_at: '2023-07-01T12:00:00Z',
            sender: { username: 'otheruser', displayname: 'Other User' }
          }
        ],
        has_more: false
      });

      const Wrapper = createWrapper(['/messages/conv-123']);

      render(
        <Wrapper>
          <Routes>
            <Route path="/messages/:conversationId" element={
              <MessageThreadErrorBoundary>
                <MessageThreadPage />
              </MessageThreadErrorBoundary>
            } />
          </Routes>
        </Wrapper>
      );

      expect(screen.getByTestId('messaging-header')).toBeInTheDocument();
      
      // Wait for messages to load
      await screen.findByTestId('message-item');
      expect(screen.getByTestId('message-item')).toHaveTextContent('Hello there!');
      expect(screen.getByTestId('message-input')).toBeInTheDocument();
    });

    it('handles invalid conversation ID', async () => {
      vi.mocked(getConversationMessages).mockRejectedValue(
        new Error('Conversation not found')
      );

      const Wrapper = createWrapper(['/messages/invalid-id']);

      render(
        <Wrapper>
          <Routes>
            <Route path="/messages/:conversationId" element={
              <MessageThreadErrorBoundary>
                <MessageThreadPage />
              </MessageThreadErrorBoundary>
            } />
          </Routes>
        </Wrapper>
      );

      // Should show error state
      await screen.findByText(/failed to load conversation/i);
    });
  });

  describe('NewConversationPage route', () => {
    it('renders new conversation page at /messages/new', async () => {
      vi.mocked(canInitiateConversations).mockResolvedValue(true);

      const Wrapper = createWrapper(['/messages/new']);

      render(
        <Wrapper>
          <Routes>
            <Route path="/messages/new" element={
              <NewConversationErrorBoundary>
                <NewConversationPage />
              </NewConversationErrorBoundary>
            } />
          </Routes>
        </Wrapper>
      );

      expect(screen.getByTestId('messaging-header')).toBeInTheDocument();
      expect(screen.getByText(/start new conversation/i)).toBeInTheDocument();
    });

    it('shows upgrade prompt for users without permissions', async () => {
      vi.mocked(canInitiateConversations).mockResolvedValue(false);

      const Wrapper = createWrapper(['/messages/new']);

      render(
        <Wrapper>
          <Routes>
            <Route path="/messages/new" element={
              <NewConversationErrorBoundary>
                <NewConversationPage />
              </NewConversationErrorBoundary>
            } />
          </Routes>
        </Wrapper>
      );

      await screen.findByText(/upgrade to privileged/i);
      expect(screen.getByText(/upgrade to privileged/i)).toBeInTheDocument();
    });
  });

  describe('Error Boundaries', () => {
    it('catches and displays error in ConversationListErrorBoundary', () => {
      const ThrowError = () => {
        throw new Error('Test error');
      };

      render(
        <ConversationListErrorBoundary>
          <ThrowError />
        </ConversationListErrorBoundary>
      );

      expect(screen.getByText(/failed to load conversations/i)).toBeInTheDocument();
      expect(screen.getByText(/refresh page/i)).toBeInTheDocument();
    });

    it('catches and displays error in MessageThreadErrorBoundary', () => {
      const ThrowError = () => {
        throw new Error('Test error');
      };

      render(
        <MessageThreadErrorBoundary>
          <ThrowError />
        </MessageThreadErrorBoundary>
      );

      expect(screen.getByText(/failed to load conversation/i)).toBeInTheDocument();
      expect(screen.getByText(/back to messages/i)).toBeInTheDocument();
    });

    it('catches and displays error in NewConversationErrorBoundary', () => {
      const ThrowError = () => {
        throw new Error('Test error');
      };

      render(
        <NewConversationErrorBoundary>
          <ThrowError />
        </NewConversationErrorBoundary>
      );

      expect(screen.getByText(/failed to load new conversation page/i)).toBeInTheDocument();
      expect(screen.getByText(/back to messages/i)).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('navigates between messaging routes correctly', async () => {
      vi.mocked(getUserConversations).mockResolvedValue({
        conversations: [],
        total_count: 0
      });
      vi.mocked(canInitiateConversations).mockResolvedValue(true);

      const Wrapper = createWrapper(['/messages']);

      const { rerender } = render(
        <Wrapper>
          <Routes>
            <Route path="/messages" element={<ConversationListPage />} />
            <Route path="/messages/new" element={<NewConversationPage />} />
          </Routes>
        </Wrapper>
      );

      // Should start at conversation list
      expect(screen.getByTestId('messaging-header')).toBeInTheDocument();

      // Navigate to new conversation (would be done via router in real app)
      const NewWrapper = createWrapper(['/messages/new']);
      rerender(
        <NewWrapper>
          <Routes>
            <Route path="/messages" element={<ConversationListPage />} />
            <Route path="/messages/new" element={<NewConversationPage />} />
          </Routes>
        </NewWrapper>
      );

      expect(screen.getByText(/start new conversation/i)).toBeInTheDocument();
    });
  });
});
