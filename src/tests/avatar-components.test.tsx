/**
 * Avatar Components Tests
 * 
 * Tests to verify that avatar-related components work correctly after AvatarSyncManager refactoring
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock the auth context
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'test-user-id',
      email: 'test@example.com'
    },
    loading: false
  })
}));

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: {
          session: {
            user: {
              id: 'test-user-id',
              email: 'test@example.com'
            }
          }
        }
      })
    },
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: { path: 'test-path' }, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/test.jpg' } })
      })
    },
    from: vi.fn().mockReturnValue({
      update: vi.fn().mockResolvedValue({ data: {}, error: null }),
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'test-user-id',
              username: 'testuser',
              avatar_url: 'https://example.com/avatar.jpg',
              avatar_thumbnail_url: 'https://example.com/thumb.jpg',
              avatar_medium_url: 'https://example.com/medium.jpg',
              avatar_full_url: 'https://example.com/full.jpg'
            },
            error: null
          })
        })
      })
    })
  }
}));

// Mock ProfileImageService
vi.mock('@/services/ProfileImageService', () => ({
  ProfileImageService: {
    uploadAvatar: vi.fn().mockResolvedValue({
      thumbnail: 'https://example.com/thumb.jpg',
      medium: 'https://example.com/medium.jpg',
      full: 'https://example.com/full.jpg',
      legacy: 'https://example.com/legacy.jpg'
    })
  }
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

// Import components to test
import SmartAvatar, { 
  NavAvatar, 
  ListAvatar, 
  CardAvatar, 
  ProfileAvatar 
} from '@/components/ui/SmartAvatar';
import UserAvatar from '@/components/common/UserAvatar';

describe('Avatar Components Tests', () => {
  const mockProfile = {
    id: 'test-user-id',
    username: 'testuser',
    displayname: 'Test User',
    email: 'test@example.com',
    avatar_url: 'https://example.com/avatar.jpg',
    avatar_thumbnail_url: 'https://example.com/thumb.jpg',
    avatar_medium_url: 'https://example.com/medium.jpg',
    avatar_full_url: 'https://example.com/full.jpg',
    bio: 'Test bio'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('SmartAvatar Component', () => {
    it('should render SmartAvatar without errors', () => {
      render(<SmartAvatar profile={mockProfile} context="profile" />);
      
      const avatar = screen.getByRole('img');
      expect(avatar).toBeInTheDocument();
    });

    it('should use correct image size for context', () => {
      render(<SmartAvatar profile={mockProfile} context="thumbnail" />);
      
      const avatar = screen.getByRole('img');
      expect(avatar).toHaveAttribute('src', mockProfile.avatar_thumbnail_url);
    });

    it('should fallback to initials when no avatar URL', () => {
      const profileWithoutAvatar = {
        ...mockProfile,
        avatar_url: null,
        avatar_thumbnail_url: null,
        avatar_medium_url: null,
        avatar_full_url: null
      };

      render(<SmartAvatar profile={profileWithoutAvatar} context="profile" />);
      
      // Should show initials fallback
      const fallback = screen.getByText('TU'); // Test User initials
      expect(fallback).toBeInTheDocument();
    });

    it('should handle loading states', () => {
      render(<SmartAvatar profile={mockProfile} context="profile" />);
      
      const avatar = screen.getByRole('img');
      expect(avatar).toBeInTheDocument();
      
      // Simulate image load error to test fallback
      fireEvent.error(avatar);
      
      // Should fallback to initials
      const fallback = screen.getByText('TU');
      expect(fallback).toBeInTheDocument();
    });
  });

  describe('SmartAvatar Variants', () => {
    it('should render NavAvatar correctly', () => {
      render(<NavAvatar profile={mockProfile} />);
      
      const avatar = screen.getByRole('img');
      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveClass('h-8', 'w-8'); // 32px size
    });

    it('should render ListAvatar correctly', () => {
      render(<ListAvatar profile={mockProfile} />);
      
      const avatar = screen.getByRole('img');
      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveClass('h-12', 'w-12'); // 48px size
    });

    it('should render CardAvatar correctly', () => {
      render(<CardAvatar profile={mockProfile} />);
      
      const avatar = screen.getByRole('img');
      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveClass('h-16', 'w-16'); // 64px size
    });

    it('should render ProfileAvatar correctly', () => {
      render(<ProfileAvatar profile={mockProfile} />);
      
      const avatar = screen.getByRole('img');
      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveClass('h-24', 'w-24'); // 96px size
    });
  });

  describe('UserAvatar Component', () => {
    it('should render UserAvatar without errors', async () => {
      render(<UserAvatar userId="test-user-id" size="md" />);
      
      // Should eventually render the avatar after profile fetch
      await waitFor(() => {
        const avatar = screen.getByRole('img');
        expect(avatar).toBeInTheDocument();
      });
    });

    it('should show tooltip when enabled', async () => {
      render(<UserAvatar userId="test-user-id" size="md" showTooltip={true} />);
      
      await waitFor(() => {
        const avatar = screen.getByRole('img');
        expect(avatar).toBeInTheDocument();
      });

      // Hover to show tooltip
      const avatar = screen.getByRole('img');
      fireEvent.mouseEnter(avatar);
      
      await waitFor(() => {
        expect(screen.getByText('testuser')).toBeInTheDocument();
      });
    });

    it('should handle click events when clickable', async () => {
      const handleClick = vi.fn();
      
      render(
        <UserAvatar 
          userId="test-user-id" 
          size="md" 
          clickable={true} 
          onClick={handleClick} 
        />
      );
      
      await waitFor(() => {
        const avatar = screen.getByRole('img');
        expect(avatar).toBeInTheDocument();
      });

      const avatar = screen.getByRole('img');
      fireEvent.click(avatar);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should map legacy sizes correctly', async () => {
      const { rerender } = render(<UserAvatar userId="test-user-id" size="xs" />);
      
      await waitFor(() => {
        const avatar = screen.getByRole('img');
        expect(avatar).toBeInTheDocument();
      });

      // Test different size mappings
      rerender(<UserAvatar userId="test-user-id" size="sm" />);
      rerender(<UserAvatar userId="test-user-id" size="md" />);
      rerender(<UserAvatar userId="test-user-id" size="lg" />);
      
      // Should render without errors for all sizes
      const avatar = screen.getByRole('img');
      expect(avatar).toBeInTheDocument();
    });
  });

  describe('Avatar Error Handling', () => {
    it('should handle missing profile gracefully', () => {
      render(<SmartAvatar profile={null as any} context="profile" />);
      
      // Should render fallback without crashing
      const fallback = screen.getByText('?');
      expect(fallback).toBeInTheDocument();
    });

    it('should handle invalid image URLs', () => {
      const profileWithBadUrl = {
        ...mockProfile,
        avatar_url: 'invalid-url',
        avatar_thumbnail_url: 'invalid-url',
        avatar_medium_url: 'invalid-url',
        avatar_full_url: 'invalid-url'
      };

      render(<SmartAvatar profile={profileWithBadUrl} context="profile" />);
      
      const avatar = screen.getByRole('img');
      expect(avatar).toBeInTheDocument();
      
      // Simulate image load error
      fireEvent.error(avatar);
      
      // Should fallback to initials
      const fallback = screen.getByText('TU');
      expect(fallback).toBeInTheDocument();
    });

    it('should handle network errors gracefully', async () => {
      // Mock network error for UserAvatar
      vi.mocked(vi.importActual('@/services/profileService')).getUserProfile = vi.fn().mockRejectedValue(new Error('Network error'));
      
      render(<UserAvatar userId="test-user-id" size="md" />);
      
      // Should render loading state initially, then fallback
      await waitFor(() => {
        // Should not crash and should show some fallback
        expect(screen.getByTestId('avatar-fallback') || screen.getByText('?')).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('Avatar Integration with Refactored AvatarSyncManager', () => {
    it('should import AvatarSyncManager types without errors', async () => {
      // This test verifies that components can import from the refactored module
      const { AvatarSyncManager, AvatarSyncError } = await import('@/lib/sync/AvatarSyncManager');
      
      expect(AvatarSyncManager).toBeDefined();
      expect(AvatarSyncError).toBeDefined();
    });

    it('should maintain compatibility with existing avatar upload workflow', async () => {
      // Test that the refactored AvatarSyncManager can still be used by components
      const { AvatarSyncManager } = await import('@/lib/sync/AvatarSyncManager');
      
      expect(AvatarSyncManager.uploadAvatarAtomic).toBeDefined();
      expect(typeof AvatarSyncManager.uploadAvatarAtomic).toBe('function');
      
      // Verify function signature matches what components expect
      expect(AvatarSyncManager.uploadAvatarAtomic.length).toBe(3); // file, userId, onProgress
    });
  });
});
