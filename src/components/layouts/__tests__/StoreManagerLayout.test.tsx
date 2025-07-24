/**
 * Light tests for StoreManagerLayout component
 * Tests navigation permissions, store context display, and theme application
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import StoreManagerLayout from '../StoreManagerLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useHasEntitlement } from '@/lib/entitlements/hooks';
import { useStoreManagerAccess } from '@/hooks/store-manager/useStoreManagerAccess';

// Mock dependencies
jest.mock('@/contexts/AuthContext');
jest.mock('@/lib/entitlements/hooks');
jest.mock('@/hooks/store-manager/useStoreManagerAccess');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseHasEntitlement = useHasEntitlement as jest.MockedFunction<typeof useHasEntitlement>;
const mockUseStoreManagerAccess = useStoreManagerAccess as jest.MockedFunction<typeof useStoreManagerAccess>;

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('StoreManagerLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mocks
    mockUseAuth.mockReturnValue({
      signOut: jest.fn(),
      user: { id: 'test-user' }
    } as any);

    mockUseStoreManagerAccess.mockReturnValue({
      isStoreManager: true,
      storeName: 'Default Store',
      loading: false
    });
  });

  describe('Navigation Permissions', () => {
    it('should show core navigation items (Dashboard, Clubs, Users)', () => {
      // Mock all entitlements as false to test core items
      mockUseHasEntitlement.mockReturnValue({ result: false });

      renderWithRouter(<StoreManagerLayout />);

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Clubs')).toBeInTheDocument();
      expect(screen.getByText('Users')).toBeInTheDocument();
    });

    it('should show Analytics when user has CAN_VIEW_STORE_ANALYTICS permission', () => {
      mockUseHasEntitlement.mockImplementation((entitlement) => ({
        result: entitlement === 'CAN_VIEW_STORE_ANALYTICS'
      }));

      renderWithRouter(<StoreManagerLayout />);

      expect(screen.getByText('Analytics')).toBeInTheDocument();
    });

    it('should show Moderation when user has CAN_MODERATE_CONTENT permission', () => {
      mockUseHasEntitlement.mockImplementation((entitlement) => ({
        result: entitlement === 'CAN_MODERATE_CONTENT'
      }));

      renderWithRouter(<StoreManagerLayout />);

      expect(screen.getByText('Moderation')).toBeInTheDocument();
    });

    it('should show Events when user has CAN_MANAGE_EVENTS permission', () => {
      mockUseHasEntitlement.mockImplementation((entitlement) => ({
        result: entitlement === 'CAN_MANAGE_EVENTS'
      }));

      renderWithRouter(<StoreManagerLayout />);

      expect(screen.getByText('Events')).toBeInTheDocument();
    });

    it('should hide optional sections when user lacks permissions', () => {
      mockUseHasEntitlement.mockReturnValue({ result: false });

      renderWithRouter(<StoreManagerLayout />);

      expect(screen.queryByText('Analytics')).not.toBeInTheDocument();
      expect(screen.queryByText('Moderation')).not.toBeInTheDocument();
      expect(screen.queryByText('Events')).not.toBeInTheDocument();
    });
  });

  describe('Store Context Display', () => {
    it('should display store name in header and context section', () => {
      mockUseHasEntitlement.mockReturnValue({ result: false });
      mockUseStoreManagerAccess.mockReturnValue({
        isStoreManager: true,
        storeName: 'Test Store',
        loading: false
      });

      renderWithRouter(<StoreManagerLayout />);

      expect(screen.getByText('Test Store Management')).toBeInTheDocument();
      expect(screen.getByText('Managing: Test Store')).toBeInTheDocument();
    });

    it('should show default text when store name is not available', () => {
      mockUseHasEntitlement.mockReturnValue({ result: false });
      mockUseStoreManagerAccess.mockReturnValue({
        isStoreManager: true,
        storeName: null,
        loading: false
      });

      renderWithRouter(<StoreManagerLayout />);

      expect(screen.getByText('Store Management')).toBeInTheDocument();
      expect(screen.queryByText(/Managing:/)).not.toBeInTheDocument();
    });

    it('should hide store context section when loading', () => {
      mockUseHasEntitlement.mockReturnValue({ result: false });
      mockUseStoreManagerAccess.mockReturnValue({
        isStoreManager: true,
        storeName: 'Test Store',
        loading: true
      });

      renderWithRouter(<StoreManagerLayout />);

      expect(screen.queryByText('Store Context')).not.toBeInTheDocument();
    });
  });

  describe('Theme Application', () => {
    it('should apply terracotta theme to sidebar', () => {
      mockUseHasEntitlement.mockReturnValue({ result: false });

      const { container } = renderWithRouter(<StoreManagerLayout />);
      
      const sidebar = container.querySelector('.bg-bookconnect-terracotta');
      expect(sidebar).toBeInTheDocument();
    });

    it('should display Store Manager Panel title', () => {
      mockUseHasEntitlement.mockReturnValue({ result: false });

      renderWithRouter(<StoreManagerLayout />);

      expect(screen.getByText('Store Manager Panel')).toBeInTheDocument();
    });
  });

  describe('Navigation Actions', () => {
    it('should render Back to Site and Logout buttons', () => {
      mockUseHasEntitlement.mockReturnValue({ result: false });

      renderWithRouter(<StoreManagerLayout />);

      expect(screen.getByText('Back to Site')).toBeInTheDocument();
      expect(screen.getByText('Logout')).toBeInTheDocument();
    });
  });
});
