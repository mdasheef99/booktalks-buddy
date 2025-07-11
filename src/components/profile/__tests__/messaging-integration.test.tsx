/**
 * Profile Messaging Integration Tests
 * 
 * Tests for messaging integration in profile components including
 * "Message User" buttons and navigation to messaging system.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import BookClubProfileHeader from '../BookClubProfileHeader';

// Mock AuthContext
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'current-user-id',
      email: 'current@example.com'
    }
  })
}));

// Mock messaging hooks
vi.mock('@/components/messaging/hooks/useMessaging', () => ({
  useMessagingButton: vi.fn()
}));

// Mock profile API
vi.mock('@/lib/api/profile', () => ({
  uploadProfileAvatar: vi.fn()
}));

// Mock UI components
vi.mock('@/components/ui/avatar', () => ({
  Avatar: ({ children, className }: any) => <div className={className}>{children}</div>,
  AvatarFallback: ({ children, className }: any) => <div className={className}>{children}</div>,
  AvatarImage: ({ src, alt }: any) => <img src={src} alt={alt} />
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, variant, size, className }: any) => (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      className={`${variant} ${size} ${className}`}
    >
      {children}
    </button>
  )
}));

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardContent: ({ children, className }: any) => <div className={className}>{children}</div>
}));

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  Edit: () => <span data-testid="edit-icon">Edit</span>,
  Upload: () => <span data-testid="upload-icon">Upload</span>,
  MessageCircle: () => <span data-testid="message-icon">Message</span>,
  ChevronDown: () => <span data-testid="chevron-down">Down</span>,
  ChevronUp: () => <span data-testid="chevron-up">Up</span>
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

// Import mocked functions
import { useMessagingButton } from '@/components/messaging/hooks/useMessaging';

describe('Profile Messaging Integration', () => {
  let queryClient: QueryClient;

  const createWrapper = ({ children }: { children: React.ReactNode }) => (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </BrowserRouter>
  );

  const mockProfile = {
    id: 'user-123',
    email: 'test@example.com',
    username: 'testuser',
    avatar_url: null,
    bio: 'Test user bio',
    favorite_genres: ['Fiction', 'Mystery'],
    favorite_authors: ['Agatha Christie'],
    created_at: '2023-01-01T00:00:00Z'
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

  describe('BookClubProfileHeader messaging integration', () => {
    it('shows Message User button for other users', () => {
      vi.mocked(useMessagingButton).mockReturnValue({
        children: 'Message',
        onClick: vi.fn(),
        disabled: false,
        variant: 'default' as const,
        canMessage: true,
        isStarting: false
      });

      render(
        <createWrapper>
          <BookClubProfileHeader
            profile={mockProfile}
            isCurrentUser={false}
            onProfileUpdated={vi.fn()}
          />
        </createWrapper>
      );

      expect(screen.getByText('Message')).toBeInTheDocument();
      expect(screen.getByTestId('message-icon')).toBeInTheDocument();
    });

    it('does not show Message User button for current user', () => {
      render(
        <createWrapper>
          <BookClubProfileHeader
            profile={mockProfile}
            isCurrentUser={true}
            onProfileUpdated={vi.fn()}
          />
        </createWrapper>
      );

      expect(screen.queryByText('Message')).not.toBeInTheDocument();
      expect(screen.queryByTestId('message-icon')).not.toBeInTheDocument();
    });

    it('does not show Edit Profile button for current user (clean separation)', () => {
      render(
        <createWrapper>
          <BookClubProfileHeader
            profile={mockProfile}
            isCurrentUser={true}
            onProfileUpdated={vi.fn()}
          />
        </createWrapper>
      );

      // Edit Profile button should not appear in BookClubProfileHeader anymore
      expect(screen.queryByText('Edit Profile')).not.toBeInTheDocument();
    });

    it('calls messaging hook with correct username for other users', () => {
      const mockUseMessagingButton = vi.mocked(useMessagingButton);

      render(
        <createWrapper>
          <BookClubProfileHeader
            profile={mockProfile}
            isCurrentUser={false}
            onEditProfile={vi.fn()}
            onProfileUpdated={vi.fn()}
          />
        </createWrapper>
      );

      expect(mockUseMessagingButton).toHaveBeenCalledWith('testuser');
    });

    it('calls messaging hook with undefined for current user', () => {
      const mockUseMessagingButton = vi.mocked(useMessagingButton);

      render(
        <createWrapper>
          <BookClubProfileHeader
            profile={mockProfile}
            isCurrentUser={true}
            onEditProfile={vi.fn()}
            onProfileUpdated={vi.fn()}
          />
        </createWrapper>
      );

      expect(mockUseMessagingButton).toHaveBeenCalledWith(undefined);
    });

    it('handles message button click', async () => {
      const mockOnClick = vi.fn();
      vi.mocked(useMessagingButton).mockReturnValue({
        children: 'Message',
        onClick: mockOnClick,
        disabled: false,
        variant: 'default' as const,
        canMessage: true,
        isStarting: false
      });

      const user = userEvent.setup();

      render(
        <createWrapper>
          <BookClubProfileHeader
            profile={mockProfile}
            isCurrentUser={false}
            onProfileUpdated={vi.fn()}
          />
        </createWrapper>
      );

      const messageButton = screen.getByText('Message');
      await user.click(messageButton);

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('shows upgrade button for users without messaging permissions', () => {
      vi.mocked(useMessagingButton).mockReturnValue({
        children: 'Upgrade to Message',
        onClick: vi.fn(),
        disabled: false,
        variant: 'outline' as const,
        canMessage: false,
        isStarting: false
      });

      render(
        <createWrapper>
          <BookClubProfileHeader
            profile={mockProfile}
            isCurrentUser={false}
            onEditProfile={vi.fn()}
            onProfileUpdated={vi.fn()}
          />
        </createWrapper>
      );

      expect(screen.getByText('Upgrade to Message')).toBeInTheDocument();
    });

    it('shows loading state when starting conversation', () => {
      vi.mocked(useMessagingButton).mockReturnValue({
        children: 'Starting...',
        onClick: vi.fn(),
        disabled: true,
        variant: 'outline' as const,
        canMessage: true,
        isStarting: true
      });

      render(
        <createWrapper>
          <BookClubProfileHeader
            profile={mockProfile}
            isCurrentUser={false}
            onEditProfile={vi.fn()}
            onProfileUpdated={vi.fn()}
          />
        </createWrapper>
      );

      expect(screen.getByText('Starting...')).toBeInTheDocument();
      
      const messageButton = screen.getByText('Starting...');
      expect(messageButton).toBeDisabled();
    });

    it('positions buttons correctly in header', () => {
      vi.mocked(useMessagingButton).mockReturnValue({
        children: 'Message',
        onClick: vi.fn(),
        disabled: false,
        variant: 'default' as const,
        canMessage: true,
        isStarting: false
      });

      render(
        <createWrapper>
          <BookClubProfileHeader
            profile={mockProfile}
            isCurrentUser={false}
            onEditProfile={vi.fn()}
            onProfileUpdated={vi.fn()}
          />
        </createWrapper>
      );

      // Check that the button container has the correct positioning classes
      const buttonContainer = screen.getByText('Message').closest('div');
      expect(buttonContainer).toHaveClass('absolute', 'top-4', 'right-4');
    });
  });

  describe('Enhanced ProfileHeader messaging integration', () => {
    // Note: Enhanced ProfileHeader tests would go here
    // For now, we'll focus on the BookClubProfileHeader since that's where
    // the main messaging integration was implemented
  });

  describe('Accessibility', () => {
    it('maintains proper button accessibility for messaging', () => {
      vi.mocked(useMessagingButton).mockReturnValue({
        children: 'Message',
        onClick: vi.fn(),
        disabled: false,
        variant: 'default' as const,
        canMessage: true,
        isStarting: false
      });

      render(
        <createWrapper>
          <BookClubProfileHeader
            profile={mockProfile}
            isCurrentUser={false}
            onProfileUpdated={vi.fn()}
          />
        </createWrapper>
      );

      const messageButton = screen.getByText('Message');
      expect(messageButton).toBeInTheDocument();
      expect(messageButton.tagName).toBe('BUTTON');
    });

    it('provides proper visual feedback for disabled state', () => {
      vi.mocked(useMessagingButton).mockReturnValue({
        children: 'Starting...',
        onClick: vi.fn(),
        disabled: true,
        variant: 'outline' as const,
        canMessage: true,
        isStarting: true
      });

      render(
        <createWrapper>
          <BookClubProfileHeader
            profile={mockProfile}
            isCurrentUser={false}
            onEditProfile={vi.fn()}
            onProfileUpdated={vi.fn()}
          />
        </createWrapper>
      );

      const messageButton = screen.getByText('Starting...');
      expect(messageButton).toBeDisabled();
    });
  });

  describe('Error handling', () => {
    it('handles missing profile username gracefully', () => {
      const profileWithoutUsername = {
        ...mockProfile,
        username: ''
      };

      vi.mocked(useMessagingButton).mockReturnValue({
        children: 'Message',
        onClick: vi.fn(),
        disabled: true,
        variant: 'outline' as const,
        canMessage: false,
        isStarting: false
      });

      render(
        <createWrapper>
          <BookClubProfileHeader
            profile={profileWithoutUsername}
            isCurrentUser={false}
            onProfileUpdated={vi.fn()}
          />
        </createWrapper>
      );

      // Should still render but be disabled
      expect(screen.getByText('Message')).toBeInTheDocument();
      expect(screen.getByText('Message')).toBeDisabled();
    });
  });
});
