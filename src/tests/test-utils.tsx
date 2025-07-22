/**
 * Test utilities for BookConnect application
 *
 * This file provides common utilities for testing components and hooks,
 * including:
 * - Custom render functions with providers
 * - Mock data factories
 * - Common test setup functions
 */
import React, { ReactElement, createContext } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { renderHook, RenderHookOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { Event } from '@/lib/api/bookclubs/events/types';

// Create a mock AuthContext since we can't import it directly
type AuthContextType = {
  user: { id: string } | null;
  session: any | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
  clubRoles: Record<string, string>;
  fetchClubRoles: () => Promise<void>;
  isAdmin: (clubId: string) => boolean;
  isMember: (clubId: string) => boolean;
  entitlements: string[];
  entitlementsLoading: boolean;
  refreshEntitlements: () => Promise<void>;
  hasEntitlement: (entitlement: string) => boolean;
  hasContextualEntitlement: (prefix: string, contextId: string) => boolean;
};

// Create a mock AuthContext
export const MockAuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: false,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  clubRoles: {},
  fetchClubRoles: async () => {},
  isAdmin: () => false,
  isMember: () => false,
  entitlements: [],
  entitlementsLoading: false,
  refreshEntitlements: async () => {},
  hasEntitlement: () => false,
  hasContextualEntitlement: () => false,
  // Subscription state (Phase 4B.1.1)
  subscriptionStatus: null,
  subscriptionLoading: false,
  refreshSubscriptionStatus: async () => {},
  hasValidSubscription: () => false,
  getSubscriptionTier: () => 'MEMBER',
  hasRequiredTier: () => false,
  // Enhanced subscription helpers (Phase 4B.1.2)
  canAccessFeature: () => false,
  getSubscriptionStatusWithContext: () => ({
    tier: 'MEMBER',
    hasActiveSubscription: false,
    isValid: false,
    needsUpgrade: false,
    canUpgrade: true,
    context: 'Mock context'
  }),
  // Coordinated data refresh (Phase 4B.1.2)
  refreshUserData: async () => {},
});

// Define types for the wrapper props
interface AllProvidersProps {
  children: React.ReactNode;
  authUser?: { id: string } | null;
  queryClient?: QueryClient;
}

/**
 * Wrapper component that provides all necessary context providers for tests
 */
export const AllProviders: React.FC<AllProvidersProps> = ({
  children,
  authUser = { id: 'test-user-id' },
  queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0, // Use gcTime instead of cacheTime in React Query v5
      },
    },
  })
}) => {
  // Create a mock auth context value
  const authContextValue: AuthContextType = {
    user: authUser,
    session: null,
    loading: false,
    signIn: async () => {},
    signUp: async () => {},
    signOut: async () => {},
    clubRoles: {},
    fetchClubRoles: async () => {},
    isAdmin: () => false,
    isMember: () => false,
    entitlements: [],
    entitlementsLoading: false,
    refreshEntitlements: async () => {},
    hasEntitlement: () => false,
    hasContextualEntitlement: () => false,
  };

  return (
    <BrowserRouter>
      <MockAuthContext.Provider value={authContextValue}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </MockAuthContext.Provider>
    </BrowserRouter>
  );
};

/**
 * Custom render function that wraps the component with all necessary providers
 */
export function renderWithProviders(
  ui: ReactElement,
  {
    authUser = { id: 'test-user-id' },
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0, // Use gcTime instead of cacheTime in React Query v5
        },
      },
    }),
    ...renderOptions
  }: Omit<RenderOptions, 'wrapper'> & {
    authUser?: { id: string } | null;
    queryClient?: QueryClient;
  } = {}
) {
  // Create a wrapper component
  function Wrapper({ children }: { children?: React.ReactNode }) {
    return (
      <AllProviders authUser={authUser} queryClient={queryClient}>
        {children}
      </AllProviders>
    );
  }

  return render(ui, {
    wrapper: Wrapper,
    ...renderOptions,
  });
}

/**
 * Custom renderHook function that wraps the hook with all necessary providers
 */
export function renderHookWithProviders<TProps, TResult>(
  hook: (props: TProps) => TResult,
  {
    authUser = { id: 'test-user-id' },
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0, // Use gcTime instead of cacheTime in React Query v5
        },
      },
    }),
    ...renderHookOptions
  }: Omit<RenderHookOptions<TProps>, 'wrapper'> & {
    authUser?: { id: string } | null;
    queryClient?: QueryClient;
  } = {}
) {
  // Create a wrapper that works with renderHook
  function Wrapper({ children }: { children?: React.ReactNode }) {
    return (
      <AllProviders authUser={authUser} queryClient={queryClient}>
        {children}
      </AllProviders>
    );
  }

  return renderHook(hook, {
    // @ts-ignore - The typing for wrapper is complex but this works
    wrapper: Wrapper,
    ...renderHookOptions,
  });
}

/**
 * Factory function to create a mock Event object for testing
 */
export function createMockEvent(overrides = {}): Event {
  return {
    id: 'test-event-id',
    title: 'Test Event',
    description: 'This is a test event description',
    date: '2023-07-15', // Required field
    start_time: '2023-07-15T18:00:00Z',
    end_time: '2023-07-15T20:00:00Z',
    location: 'Test Location',
    event_type: 'discussion',
    is_virtual: false,
    virtual_meeting_link: null,
    max_participants: 20,
    featured_on_landing: false,
    created_by: 'test-user-id',
    club_id: 'test-club-id',
    store_id: 'test-store-id',
    created_at: '2023-07-01T12:00:00Z',
    updated_at: '2023-07-01T12:00:00Z',
    image_url: null,
    thumbnail_url: null,
    medium_url: null,
    image_alt_text: null,
    image_metadata: null,
    ...overrides
  };
}

/**
 * Factory function to create an array of mock events for testing
 */
export function createMockEvents(count: number = 3, baseOverrides = {}): Event[] {
  return Array.from({ length: count }, (_, index) =>
    createMockEvent({
      id: `test-event-id-${index + 1}`,
      title: `Test Event ${index + 1}`,
      ...baseOverrides
    })
  );
}
