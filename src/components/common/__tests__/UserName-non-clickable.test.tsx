import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import UserName from '../UserName';
import { useAuth } from '@/contexts/AuthContext';
import { getUserProfile } from '@/services/profileService';

// Mock the dependencies
vi.mock('@/contexts/AuthContext');
vi.mock('@/services/profileService');

const mockUseAuth = vi.mocked(useAuth);
const mockGetUserProfile = vi.mocked(getUserProfile);

// Test wrapper with router
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('UserName Non-Clickable Own Profile', () => {
  const mockProfile = {
    id: 'user-123',
    username: 'testuser',
    displayname: 'Test User',
    account_tier: 'free' as const
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUserProfile.mockResolvedValue(mockProfile);
  });

  it('should render clickable link for other users', async () => {
    // Mock current user as different user
    mockUseAuth.mockReturnValue({
      user: { id: 'different-user-456' },
      loading: false,
      signOut: vi.fn(),
      signIn: vi.fn(),
      signUp: vi.fn()
    } as any);

    render(
      <TestWrapper>
        <UserName userId="user-123" linkToProfile={true} />
      </TestWrapper>
    );

    // Wait for profile to load
    await screen.findByText('Test User');

    // Should have a link element
    const link = screen.getByRole('link');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/user/testuser');
  });

  it('should render non-clickable text for current user', async () => {
    // Mock current user as the same user
    mockUseAuth.mockReturnValue({
      user: { id: 'user-123' },
      loading: false,
      signOut: vi.fn(),
      signIn: vi.fn(),
      signUp: vi.fn()
    } as any);

    render(
      <TestWrapper>
        <UserName userId="user-123" linkToProfile={true} />
      </TestWrapper>
    );

    // Wait for profile to load
    await screen.findByText('Test User');

    // Should NOT have a link element
    const links = screen.queryAllByRole('link');
    expect(links).toHaveLength(0);

    // Should still show the user name
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('should render non-clickable text when linkToProfile is false', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'different-user-456' },
      loading: false,
      signOut: vi.fn(),
      signIn: vi.fn(),
      signUp: vi.fn()
    } as any);

    render(
      <TestWrapper>
        <UserName userId="user-123" linkToProfile={false} />
      </TestWrapper>
    );

    // Wait for profile to load
    await screen.findByText('Test User');

    // Should NOT have a link element even for other users when linkToProfile is false
    const links = screen.queryAllByRole('link');
    expect(links).toHaveLength(0);
  });
});
