/**
 * Username Autocomplete Component Tests
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import { UsernameAutocomplete } from '../UsernameAutocomplete';
import { AuthContext } from '@/contexts/AuthContext';

// Mock the messaging API
vi.mock('@/lib/api/messaging', () => ({
  searchUsersInStore: vi.fn()
}));

// Mock the debounce hook
vi.mock('@/hooks/useDebounce', () => ({
  useDebounce: vi.fn((value) => value)
}));

const mockUser = {
  id: 'test-user-id',
  username: 'testuser',
  displayname: 'Test User'
};

const mockAuthContext = {
  user: mockUser,
  isLoading: false,
  signIn: vi.fn(),
  signOut: vi.fn(),
  signUp: vi.fn()
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={mockAuthContext}>
        {children}
      </AuthContext.Provider>
    </QueryClientProvider>
  );
};

describe('UsernameAutocomplete', () => {
  const mockOnChange = vi.fn();
  const mockOnSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders input field correctly', () => {
    render(
      <UsernameAutocomplete
        value=""
        onChange={mockOnChange}
        onSelect={mockOnSelect}
        placeholder="Enter username..."
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByPlaceholderText('Enter username...')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('calls onChange when input value changes', () => {
    render(
      <UsernameAutocomplete
        value=""
        onChange={mockOnChange}
        onSelect={mockOnSelect}
      />,
      { wrapper: createWrapper() }
    );

    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'test' } });

    expect(mockOnChange).toHaveBeenCalledWith('test');
  });

  it('shows loading state when searching', async () => {
    const { searchUsersInStore } = await import('@/lib/api/messaging');
    (searchUsersInStore as any).mockImplementation(() => new Promise(() => {}));

    render(
      <UsernameAutocomplete
        value="test"
        onChange={mockOnChange}
        onSelect={mockOnSelect}
      />,
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(screen.getByText('Searching users...')).toBeInTheDocument();
    });
  });

  it('handles keyboard navigation', () => {
    render(
      <UsernameAutocomplete
        value=""
        onChange={mockOnChange}
        onSelect={mockOnSelect}
      />,
      { wrapper: createWrapper() }
    );

    const input = screen.getByRole('combobox');
    
    // Test Escape key
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(input).not.toHaveFocus();
  });

  it('disables input when disabled prop is true', () => {
    render(
      <UsernameAutocomplete
        value=""
        onChange={mockOnChange}
        onSelect={mockOnSelect}
        disabled={true}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByRole('combobox')).toBeDisabled();
  });
});
