import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RsvpButton from './RsvpButton';

// Mock modules
vi.mock('@/lib/api/bookclubs/participants', () => ({
  rsvpToEvent: vi.fn().mockResolvedValue({ rsvp_status: 'going' }),
  cancelRsvp: vi.fn().mockResolvedValue({ success: true }),
  getUserRsvpStatus: vi.fn().mockResolvedValue(null)
}));

// Mock the AuthContext
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id' }
  })
}));

// Mock the toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

// Mock react-query
vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({
    data: null,
    isLoading: false
  }),
  useQueryClient: () => ({
    invalidateQueries: vi.fn()
  })
}));

describe('RsvpButton', () => {
  const eventId = 'test-event-id';

  // Reset mocks before each test
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Setup function to customize mocks for specific tests
  const setup = (customProps = {}, customMocks = {}) => {
    // Apply custom mocks if provided
    if (customMocks.useAuth) {
      vi.mock('@/contexts/AuthContext', () => ({
        useAuth: () => customMocks.useAuth
      }));
    }

    if (customMocks.useQuery) {
      vi.mock('@tanstack/react-query', () => ({
        ...vi.importActual('@tanstack/react-query'),
        useQuery: () => customMocks.useQuery,
        useQueryClient: () => ({
          invalidateQueries: vi.fn()
        })
      }));
    }

    // Default props
    const defaultProps = {
      eventId,
      className: 'test-class'
    };

    // Render with merged props
    const utils = render(<RsvpButton {...defaultProps} {...customProps} />);

    return {
      ...utils
    };
  };

  // Rendering tests
  describe('rendering', () => {
    it('renders RSVP button when user is logged in and has not RSVPed', () => {
      setup();

      const button = screen.getByRole('button', { name: /rsvp to event/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('test-class');
    });

    it('renders disabled button when user is not logged in', () => {
      setup({}, {
        useAuth: { user: null }
      });

      const button = screen.getByRole('button', { name: /log in to rsvp/i });
      expect(button).toBeInTheDocument();
      expect(button).toBeDisabled();
    });

    it('renders loading state when fetching RSVP status', () => {
      setup({}, {
        useQuery: { data: null, isLoading: true }
      });

      const button = screen.getByRole('button', { name: /loading/i });
      expect(button).toBeInTheDocument();
      expect(button).toBeDisabled();
    });

    it('renders current RSVP status when user has already RSVPed', () => {
      setup({}, {
        useQuery: {
          data: { rsvp_status: 'going' },
          isLoading: false
        }
      });

      const button = screen.getByRole('button', { name: /going/i });
      expect(button).toBeInTheDocument();

      const cancelButton = screen.getByRole('button', { name: /cancel rsvp/i });
      expect(cancelButton).toBeInTheDocument();
    });
  });

  // Interaction tests
  describe('interactions', () => {
    it('opens dropdown menu when clicked', async () => {
      const user = userEvent.setup();
      setup();

      const button = screen.getByRole('button', { name: /rsvp to event/i });
      await user.click(button);

      // Check that dropdown menu items are visible
      const menuItems = screen.getAllByRole('menuitem');
      expect(menuItems.length).toBeGreaterThan(0);

      // Check for specific text content
      const menuTexts = menuItems.map(item => item.textContent);
      expect(menuTexts.some(text => text?.includes('Going'))).toBe(true);
      expect(menuTexts.some(text => text?.includes('Maybe'))).toBe(true);
      expect(menuTexts.some(text => text?.includes('Not Going'))).toBe(true);
    });

    it('calls rsvpToEvent when a status is selected', async () => {
      const user = userEvent.setup();
      const participants = require('@/lib/api/bookclubs/participants');

      setup();

      // Open dropdown and click "Going"
      const button = screen.getByRole('button', { name: /rsvp to event/i });
      await user.click(button);

      // Find the Going menu item by text content
      const menuItems = screen.getAllByRole('menuitem');
      const goingItem = menuItems.find(item => item.textContent?.includes('Going'));
      expect(goingItem).toBeDefined();

      if (goingItem) {
        await user.click(goingItem);
      }

      // Verify API was called with correct parameters
      expect(participants.rsvpToEvent).toHaveBeenCalledWith('test-user-id', eventId, 'going');
    });

    it('calls cancelRsvp when Cancel RSVP button is clicked', async () => {
      const user = userEvent.setup();
      const participants = require('@/lib/api/bookclubs/participants');

      // Mock the current RSVP status
      vi.mock('@tanstack/react-query', () => ({
        useQuery: () => ({
          data: { rsvp_status: 'going' },
          isLoading: false
        }),
        useQueryClient: () => ({
          invalidateQueries: vi.fn()
        })
      }));

      setup();

      // Find and click the Cancel button
      const buttons = screen.getAllByRole('button');
      const cancelButton = buttons.find(button =>
        button.textContent?.toLowerCase().includes('cancel')
      );

      expect(cancelButton).toBeDefined();

      if (cancelButton) {
        await user.click(cancelButton);
      }

      // Verify API was called with correct parameters
      expect(participants.cancelRsvp).toHaveBeenCalledWith('test-user-id', eventId);
    });
  });
});
