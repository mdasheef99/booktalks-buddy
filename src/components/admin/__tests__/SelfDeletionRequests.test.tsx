/**
 * SelfDeletionRequests Component Tests
 * 
 * Tests the admin interface for managing self-deletion requests:
 * - Component rendering
 * - Loading states
 * - Request display
 * - Action handling
 */

import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import SelfDeletionRequests from '../SelfDeletionRequests';

// Mock dependencies
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'admin-123', email: 'admin@example.com' }
  }))
}));

vi.mock('@/hooks/useStoreOwnerAccess', () => ({
  useStoreOwnerAccess: vi.fn(() => ({
    isStoreOwner: true,
    storeId: 'store-123',
    storeName: 'Test Store',
    loading: false
  }))
}));

vi.mock('@/lib/api/admin/selfDeletionRequests', () => ({
  getSelfDeletionRequests: vi.fn(),
  processSelfDeletionRequest: vi.fn(),
  deleteSelfDeletionRequest: vi.fn()
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

// Mock UI components
vi.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div data-testid="card" {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div data-testid="card-content" {...props}>{children}</div>,
  CardHeader: ({ children, ...props }: any) => <div data-testid="card-header" {...props}>{children}</div>,
  CardTitle: ({ children, ...props }: any) => <h3 data-testid="card-title" {...props}>{children}</h3>
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, ...props }: any) => <span data-testid="badge" {...props}>{children}</span>
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} data-testid="button" {...props}>
      {children}
    </button>
  )
}));

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
);

describe('SelfDeletionRequests Component', () => {
  const mockRequests = [
    {
      id: 'request-1',
      user_id: 'user-1',
      reason: 'No longer need the service',
      clubs_owned: [
        { id: 'club-1', name: 'Book Club Alpha' },
        { id: 'club-2', name: 'Reading Circle Beta' }
      ],
      created_at: '2024-01-15T10:30:00Z',
      user_name: 'John Doe',
      user_email: 'john@example.com'
    },
    {
      id: 'request-2',
      user_id: 'user-2',
      reason: 'Moving to different platform',
      clubs_owned: [],
      created_at: '2024-01-14T15:45:00Z',
      user_name: 'Jane Smith',
      user_email: 'jane@example.com'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render loading state initially', async () => {
      const { getSelfDeletionRequests } = await import('@/lib/api/admin/selfDeletionRequests');
      (getSelfDeletionRequests as any).mockImplementation(() => new Promise(() => {})); // Never resolves

      render(
        <TestWrapper>
          <SelfDeletionRequests />
        </TestWrapper>
      );

      expect(screen.getByText('Loading deletion requests...')).toBeInTheDocument();
    });

    it('should render store access loading state', async () => {
      const { useStoreOwnerAccess } = await import('@/hooks/useStoreOwnerAccess');
      (useStoreOwnerAccess as any).mockReturnValue({
        isStoreOwner: false,
        storeId: null,
        storeName: null,
        loading: true
      });

      render(
        <TestWrapper>
          <SelfDeletionRequests />
        </TestWrapper>
      );

      expect(screen.getByText('Verifying access...')).toBeInTheDocument();
    });

    it('should render empty state when no requests', async () => {
      const { getSelfDeletionRequests } = await import('@/lib/api/admin/selfDeletionRequests');
      (getSelfDeletionRequests as any).mockResolvedValue([]);

      render(
        <TestWrapper>
          <SelfDeletionRequests />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('No deletion requests found')).toBeInTheDocument();
      });
    });

    it('should render requests when data is available', async () => {
      const { getSelfDeletionRequests } = await import('@/lib/api/admin/selfDeletionRequests');
      (getSelfDeletionRequests as any).mockResolvedValue(mockRequests);

      render(
        <TestWrapper>
          <SelfDeletionRequests />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.getByText('2 Pending')).toBeInTheDocument();
      });
    });

    it('should display store name in title when available', async () => {
      const { getSelfDeletionRequests } = await import('@/lib/api/admin/selfDeletionRequests');
      (getSelfDeletionRequests as any).mockResolvedValue([]);

      render(
        <TestWrapper>
          <SelfDeletionRequests />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/for Test Store/)).toBeInTheDocument();
      });
    });
  });

  describe('Request Display', () => {
    beforeEach(async () => {
      const { getSelfDeletionRequests } = await import('@/lib/api/admin/selfDeletionRequests');
      (getSelfDeletionRequests as any).mockResolvedValue(mockRequests);
    });

    it('should display user information correctly', async () => {
      render(
        <TestWrapper>
          <SelfDeletionRequests />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('john@example.com')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.getByText('jane@example.com')).toBeInTheDocument();
      });
    });

    it('should display club ownership information', async () => {
      render(
        <TestWrapper>
          <SelfDeletionRequests />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Book Club Alpha')).toBeInTheDocument();
        expect(screen.getByText('Reading Circle Beta')).toBeInTheDocument();
        expect(screen.getByText('No clubs owned')).toBeInTheDocument();
      });
    });

    it('should display deletion reasons', async () => {
      render(
        <TestWrapper>
          <SelfDeletionRequests />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('No longer need the service')).toBeInTheDocument();
        expect(screen.getByText('Moving to different platform')).toBeInTheDocument();
      });
    });

    it('should show warning for users with clubs', async () => {
      render(
        <TestWrapper>
          <SelfDeletionRequests />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Transfer club leadership/)).toBeInTheDocument();
      });
    });
  });

  describe('Action Handling', () => {
    beforeEach(async () => {
      const { getSelfDeletionRequests } = await import('@/lib/api/admin/selfDeletionRequests');
      (getSelfDeletionRequests as any).mockResolvedValue(mockRequests);
    });

    it('should handle reject request action', async () => {
      const { deleteSelfDeletionRequest } = await import('@/lib/api/admin/selfDeletionRequests');
      (deleteSelfDeletionRequest as any).mockResolvedValue({ success: true, message: 'Request rejected' });

      render(
        <TestWrapper>
          <SelfDeletionRequests />
        </TestWrapper>
      );

      await waitFor(() => {
        const rejectButtons = screen.getAllByText('Reject Request');
        fireEvent.click(rejectButtons[0]);
      });

      await waitFor(() => {
        expect(deleteSelfDeletionRequest).toHaveBeenCalledWith('request-1');
      });
    });

    it('should handle delete account action', async () => {
      const { processSelfDeletionRequest } = await import('@/lib/api/admin/selfDeletionRequests');
      (processSelfDeletionRequest as any).mockResolvedValue({ success: true, message: 'Account deleted' });

      render(
        <TestWrapper>
          <SelfDeletionRequests />
        </TestWrapper>
      );

      await waitFor(() => {
        const deleteButtons = screen.getAllByText('Delete Account');
        fireEvent.click(deleteButtons[1]); // Second request has no clubs
      });

      await waitFor(() => {
        expect(processSelfDeletionRequest).toHaveBeenCalledWith('request-2', 'admin-123');
      });
    });

    it('should disable buttons during processing', async () => {
      const { deleteSelfDeletionRequest } = await import('@/lib/api/admin/selfDeletionRequests');
      (deleteSelfDeletionRequest as any).mockImplementation(() => new Promise(() => {})); // Never resolves

      render(
        <TestWrapper>
          <SelfDeletionRequests />
        </TestWrapper>
      );

      await waitFor(() => {
        const rejectButtons = screen.getAllByText('Reject Request');
        fireEvent.click(rejectButtons[0]);
      });

      await waitFor(() => {
        const processingButton = screen.getByText('Processing...');
        expect(processingButton).toBeDisabled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      const { getSelfDeletionRequests } = await import('@/lib/api/admin/selfDeletionRequests');
      (getSelfDeletionRequests as any).mockRejectedValue(new Error('API Error'));

      const { toast } = await import('sonner');

      render(
        <TestWrapper>
          <SelfDeletionRequests />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to load deletion requests');
      });
    });

    it('should handle action errors', async () => {
      const { getSelfDeletionRequests, deleteSelfDeletionRequest } = await import('@/lib/api/admin/selfDeletionRequests');
      (getSelfDeletionRequests as any).mockResolvedValue(mockRequests);
      (deleteSelfDeletionRequest as any).mockResolvedValue({ success: false, message: 'Delete failed' });

      const { toast } = await import('sonner');

      render(
        <TestWrapper>
          <SelfDeletionRequests />
        </TestWrapper>
      );

      await waitFor(() => {
        const rejectButtons = screen.getAllByText('Reject Request');
        fireEvent.click(rejectButtons[0]);
      });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Delete failed');
      });
    });
  });
});
