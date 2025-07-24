/**
 * Focused tests for StoreManagerRouteGuard component
 * Tests access control logic, store context provision, and error handling
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { StoreManagerRouteGuard, useStoreManagerContext } from '../StoreManagerRouteGuard';
import { useAuth } from '@/contexts/AuthContext';
import { useStoreManagerAccess } from '@/hooks/store-manager/useStoreManagerAccess';

// Mock dependencies
jest.mock('@/contexts/AuthContext');
jest.mock('@/hooks/store-manager/useStoreManagerAccess');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseStoreManagerAccess = useStoreManagerAccess as jest.MockedFunction<typeof useStoreManagerAccess>;

// Test component to verify context provision
const TestComponent = () => {
  const { storeId, storeName, isStoreManager } = useStoreManagerContext();
  return (
    <div>
      <div data-testid="store-id">{storeId}</div>
      <div data-testid="store-name">{storeName}</div>
      <div data-testid="is-store-manager">{isStoreManager.toString()}</div>
    </div>
  );
};

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('StoreManagerRouteGuard', () => {
  const mockUser = {
    id: '192ea974-1770-4b03-9dba-cc8121525c57',
    email: 'kafka@bookconnect.com'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Access Control Logic', () => {
    it('should show loading state while checking authentication and permissions', () => {
      mockUseAuth.mockReturnValue({ user: mockUser, loading: true } as any);
      mockUseStoreManagerAccess.mockReturnValue({
        isStoreManager: false,
        storeId: null,
        storeName: null,
        loading: false,
        error: null,
        refetch: jest.fn()
      });

      renderWithRouter(
        <StoreManagerRouteGuard>
          <TestComponent />
        </StoreManagerRouteGuard>
      );

      expect(screen.getByText('Verifying Store Manager access...')).toBeInTheDocument();
    });

    it('should show loading state while checking store access', () => {
      mockUseAuth.mockReturnValue({ user: mockUser, loading: false } as any);
      mockUseStoreManagerAccess.mockReturnValue({
        isStoreManager: false,
        storeId: null,
        storeName: null,
        loading: true,
        error: null,
        refetch: jest.fn()
      });

      renderWithRouter(
        <StoreManagerRouteGuard>
          <TestComponent />
        </StoreManagerRouteGuard>
      );

      expect(screen.getByText('Verifying Store Manager access...')).toBeInTheDocument();
    });

    it('should show error alert when store access check fails', () => {
      mockUseAuth.mockReturnValue({ user: mockUser, loading: false } as any);
      mockUseStoreManagerAccess.mockReturnValue({
        isStoreManager: false,
        storeId: null,
        storeName: null,
        loading: false,
        error: 'Database connection failed',
        refetch: jest.fn()
      });

      renderWithRouter(
        <StoreManagerRouteGuard>
          <TestComponent />
        </StoreManagerRouteGuard>
      );

      expect(screen.getByText(/Unable to verify Store Manager access/)).toBeInTheDocument();
    });

    it('should render children when user is authenticated Store Manager', () => {
      mockUseAuth.mockReturnValue({ user: mockUser, loading: false } as any);
      mockUseStoreManagerAccess.mockReturnValue({
        isStoreManager: true,
        storeId: 'ce76b99a-5f1a-481a-af85-862e584465e1',
        storeName: 'Default Store',
        loading: false,
        error: null,
        refetch: jest.fn()
      });

      renderWithRouter(
        <StoreManagerRouteGuard>
          <TestComponent />
        </StoreManagerRouteGuard>
      );

      expect(screen.getByTestId('store-id')).toHaveTextContent('ce76b99a-5f1a-481a-af85-862e584465e1');
      expect(screen.getByTestId('store-name')).toHaveTextContent('Default Store');
      expect(screen.getByTestId('is-store-manager')).toHaveTextContent('true');
    });
  });

  describe('Store Context Provision', () => {
    it('should provide correct store context to children', () => {
      const storeId = 'ce76b99a-5f1a-481a-af85-862e584465e1';
      const storeName = 'Default Store';

      mockUseAuth.mockReturnValue({ user: mockUser, loading: false } as any);
      mockUseStoreManagerAccess.mockReturnValue({
        isStoreManager: true,
        storeId,
        storeName,
        loading: false,
        error: null,
        refetch: jest.fn()
      });

      renderWithRouter(
        <StoreManagerRouteGuard>
          <TestComponent />
        </StoreManagerRouteGuard>
      );

      expect(screen.getByTestId('store-id')).toHaveTextContent(storeId);
      expect(screen.getByTestId('store-name')).toHaveTextContent(storeName);
      expect(screen.getByTestId('is-store-manager')).toHaveTextContent('true');
    });

    it('should handle null store name gracefully', () => {
      mockUseAuth.mockReturnValue({ user: mockUser, loading: false } as any);
      mockUseStoreManagerAccess.mockReturnValue({
        isStoreManager: true,
        storeId: 'ce76b99a-5f1a-481a-af85-862e584465e1',
        storeName: null,
        loading: false,
        error: null,
        refetch: jest.fn()
      });

      renderWithRouter(
        <StoreManagerRouteGuard>
          <TestComponent />
        </StoreManagerRouteGuard>
      );

      expect(screen.getByTestId('store-name')).toBeEmptyDOMElement();
      expect(screen.getByTestId('is-store-manager')).toHaveTextContent('true');
    });
  });

  describe('useStoreManagerContext Hook', () => {
    it('should throw error when used outside StoreManagerRouteGuard', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useStoreManagerContext must be used within a StoreManagerRouteGuard');

      consoleSpy.mockRestore();
    });
  });
});
