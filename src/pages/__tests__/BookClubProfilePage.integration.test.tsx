/**
 * BookClubProfilePage Integration Test
 * 
 * Tests the integration of ProfileCollectionsSection within BookClubProfilePage
 * Validates that the Collections tab is properly integrated and functional
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import BookClubProfilePage from '../BookClubProfilePage';
import { useAuth } from '@/contexts/AuthContext';
import { getBookClubProfile, getUserClubMemberships } from '@/lib/api/profile';
import { getPublicReadingList } from '@/lib/api/books/reading-lists';
import { getPublicCollections } from '@/services/books/collections';

// Mock dependencies
vi.mock('@/contexts/AuthContext');
vi.mock('@/lib/api/profile');
vi.mock('@/lib/api/books/reading-lists');
vi.mock('@/services/books/collections');
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ username: 'testuser' }),
    useNavigate: () => vi.fn()
  };
});

const mockUseAuth = useAuth as ReturnType<typeof vi.fn>;
const mockGetBookClubProfile = getBookClubProfile as ReturnType<typeof vi.fn>;
const mockGetUserClubMemberships = getUserClubMemberships as ReturnType<typeof vi.fn>;
const mockGetPublicReadingList = getPublicReadingList as ReturnType<typeof vi.fn>;
const mockGetPublicCollections = getPublicCollections as ReturnType<typeof vi.fn>;

const mockUser = {
  id: 'current-user-id',
  email: 'current@example.com'
};

const mockProfile = {
  id: 'profile-user-id',
  username: 'testuser',
  display_name: 'Test User',
  bio: 'Test bio',
  avatar_url: null,
  created_at: '2024-01-01T00:00:00Z'
};

const mockCollections = [
  {
    id: '1',
    user_id: 'profile-user-id',
    name: 'Sci-Fi Collection',
    description: 'My favorite sci-fi books',
    is_public: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    book_count: 5,
    preview_covers: ['cover1.jpg']
  }
];

describe('BookClubProfilePage Collections Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    mockUseAuth.mockReturnValue({ user: mockUser });
    mockGetBookClubProfile.mockResolvedValue(mockProfile);
    mockGetUserClubMemberships.mockResolvedValue([]);
    mockGetPublicReadingList.mockResolvedValue([]);
    mockGetPublicCollections.mockResolvedValue(mockCollections);
  });

  const renderWithRouter = (component: React.ReactElement) => {
    return render(
      <BrowserRouter>
        {component}
      </BrowserRouter>
    );
  };

  it('should render Collections tab alongside existing tabs', async () => {
    renderWithRouter(<BookClubProfilePage />);

    await waitFor(() => {
      expect(screen.getByText('Book Clubs')).toBeInTheDocument();
      expect(screen.getByText('Reading List')).toBeInTheDocument();
      expect(screen.getByText('Collections')).toBeInTheDocument();
    });
  });

  it('should display Collections tab with FolderOpen icon', async () => {
    renderWithRouter(<BookClubProfilePage />);

    await waitFor(() => {
      const collectionsTab = screen.getByRole('tab', { name: /Collections/i });
      expect(collectionsTab).toBeInTheDocument();
      
      // Check that the tab contains the icon (FolderOpen is rendered as SVG)
      const svg = collectionsTab.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  it('should switch to Collections tab when clicked', async () => {
    renderWithRouter(<BookClubProfilePage />);

    await waitFor(() => {
      expect(screen.getByText('Collections')).toBeInTheDocument();
    });

    // Click on Collections tab
    fireEvent.click(screen.getByRole('tab', { name: /Collections/i }));

    // Wait for collections content to load
    await waitFor(() => {
      expect(mockGetPublicCollections).toHaveBeenCalledWith('profile-user-id', {
        includeBookCount: true,
        includePreviewCovers: true,
        sortBy: 'updated_at',
        sortOrder: 'desc',
        limit: 50
      });
    });
  });

  it('should pass correct props to ProfileCollectionsSection', async () => {
    renderWithRouter(<BookClubProfilePage />);

    await waitFor(() => {
      expect(screen.getByText('Collections')).toBeInTheDocument();
    });

    // Click on Collections tab to activate it
    fireEvent.click(screen.getByRole('tab', { name: /Collections/i }));

    await waitFor(() => {
      // Verify that ProfileCollectionsSection is called with correct props
      expect(mockGetPublicCollections).toHaveBeenCalledWith(
        'profile-user-id', // userId from profile
        expect.objectContaining({
          includeBookCount: true,
          includePreviewCovers: true
        })
      );
    });
  });

  it('should maintain existing tab functionality', async () => {
    renderWithRouter(<BookClubProfilePage />);

    await waitFor(() => {
      expect(screen.getByText('Book Clubs')).toBeInTheDocument();
      expect(screen.getByText('Reading List')).toBeInTheDocument();
      expect(screen.getByText('Collections')).toBeInTheDocument();
    });

    // Test switching between tabs
    fireEvent.click(screen.getByRole('tab', { name: /Reading List/i }));
    
    await waitFor(() => {
      expect(mockGetPublicReadingList).toHaveBeenCalled();
    });

    // Switch to Collections tab
    fireEvent.click(screen.getByRole('tab', { name: /Collections/i }));
    
    await waitFor(() => {
      expect(mockGetPublicCollections).toHaveBeenCalled();
    });

    // Switch back to Book Clubs tab
    fireEvent.click(screen.getByRole('tab', { name: /Book Clubs/i }));
    
    // All tabs should still be present
    expect(screen.getByText('Book Clubs')).toBeInTheDocument();
    expect(screen.getByText('Reading List')).toBeInTheDocument();
    expect(screen.getByText('Collections')).toBeInTheDocument();
  });

  it('should handle current user vs other user correctly', async () => {
    // Test with current user viewing their own profile
    mockGetBookClubProfile.mockResolvedValue({
      ...mockProfile,
      id: 'current-user-id' // Same as logged-in user
    });

    renderWithRouter(<BookClubProfilePage />);

    await waitFor(() => {
      expect(screen.getByText('Collections')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('tab', { name: /Collections/i }));

    await waitFor(() => {
      // Should call with current user's ID
      expect(mockGetPublicCollections).toHaveBeenCalledWith('current-user-id', expect.any(Object));
    });
  });

  it('should display collections count in tab when collections are loaded', async () => {
    renderWithRouter(<BookClubProfilePage />);

    await waitFor(() => {
      expect(screen.getByText('Collections')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('tab', { name: /Collections/i }));

    await waitFor(() => {
      // Should show collection count
      expect(screen.getByText('(1 collection)')).toBeInTheDocument();
    });
  });
});
