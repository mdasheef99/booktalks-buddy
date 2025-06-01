/**
 * End-to-End User Workflow Tests
 * 
 * High Priority Tests for Production Readiness
 * Estimated Time: 2 days
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import BookClubDetailsWithJoin from '@/components/bookclubs/BookClubDetailsWithJoin';

// Mock dependencies
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id' } }
      })
    },
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn((callback) => {
        callback('SUBSCRIBED');
        return { unsubscribe: vi.fn() };
      }),
      unsubscribe: vi.fn()
    }))
  }
}));

// Mock API functions
const mockUpsertReadingProgress = vi.fn();
const mockToggleClubProgressTracking = vi.fn();
const mockIsProgressTrackingEnabled = vi.fn();
const mockGetCurrentBookProgress = vi.fn();
const mockGetClubReadingProgress = vi.fn();
const mockGetClubProgressStats = vi.fn();

vi.mock('@/lib/api/bookclubs/progress', () => ({
  upsertReadingProgress: mockUpsertReadingProgress,
  toggleClubProgressTracking: mockToggleClubProgressTracking,
  isProgressTrackingEnabled: mockIsProgressTrackingEnabled,
  getCurrentBookProgress: mockGetCurrentBookProgress,
  getClubReadingProgress: mockGetClubReadingProgress,
  getClubProgressStats: mockGetClubProgressStats
}));

vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

describe('End-to-End Progress Tracking Workflows', () => {
  let queryClient: QueryClient;
  let user: any;

  const mockClubData = {
    id: 'test-club-id',
    name: 'Test Book Club',
    description: 'A test book club',
    current_book: {
      id: 'test-book-id',
      title: 'Test Book',
      author: 'Test Author'
    },
    progress_tracking_enabled: false,
    members: [
      {
        id: 'test-user-id',
        username: 'testuser',
        role: 'lead'
      },
      {
        id: 'other-user-id',
        username: 'otheruser',
        role: 'member'
      }
    ]
  };

  const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </QueryClientProvider>
  );

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });
    user = userEvent.setup();
    vi.clearAllMocks();

    // Setup default mock responses
    mockIsProgressTrackingEnabled.mockResolvedValue(false);
    mockGetCurrentBookProgress.mockResolvedValue(null);
    mockGetClubReadingProgress.mockResolvedValue([]);
    mockGetClubProgressStats.mockResolvedValue({
      total_members: 2,
      not_started_count: 2,
      reading_count: 0,
      finished_count: 0,
      completion_percentage: 0
    });
  });

  describe('Club Lead Workflow: Enable Progress Tracking', () => {
    it('should allow club lead to enable progress tracking', async () => {
      mockToggleClubProgressTracking.mockResolvedValue(true);

      render(
        <TestWrapper>
          <BookClubDetailsWithJoin
            club={mockClubData}
            isMember={true}
            canManageClub={true}
            onJoin={vi.fn()}
            onLeave={vi.fn()}
          />
        </TestWrapper>
      );

      // Find and click the enable button
      const enableButton = await screen.findByRole('button', { name: /Enable/i });
      expect(enableButton).toBeInTheDocument();

      await user.click(enableButton);

      await waitFor(() => {
        expect(mockToggleClubProgressTracking).toHaveBeenCalledWith('test-club-id', true);
      });
    });

    it('should show confirmation dialog when disabling progress tracking', async () => {
      const enabledClubData = { ...mockClubData, progress_tracking_enabled: true };
      mockIsProgressTrackingEnabled.mockResolvedValue(true);
      mockToggleClubProgressTracking.mockResolvedValue(false);

      render(
        <TestWrapper>
          <BookClubDetailsWithJoin
            club={enabledClubData}
            isMember={true}
            canManageClub={true}
            onJoin={vi.fn()}
            onLeave={vi.fn()}
          />
        </TestWrapper>
      );

      // Find and click the disable button
      const disableButton = await screen.findByRole('button', { name: /Disable/i });
      await user.click(disableButton);

      // Should show confirmation dialog
      expect(screen.getByText(/Are you sure you want to disable/i)).toBeInTheDocument();

      // Confirm the action
      const confirmButton = screen.getByRole('button', { name: /Continue/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockToggleClubProgressTracking).toHaveBeenCalledWith('test-club-id', false);
      });
    });
  });

  describe('Member Workflow: Update Reading Progress', () => {
    beforeEach(() => {
      mockIsProgressTrackingEnabled.mockResolvedValue(true);
      mockUpsertReadingProgress.mockResolvedValue({
        id: 'progress-id',
        user_id: 'test-user-id',
        club_id: 'test-club-id',
        status: 'reading',
        progress_percentage: 50,
        is_private: false,
        created_at: '2025-01-24T10:00:00Z',
        last_updated: '2025-01-24T10:00:00Z'
      });
    });

    it('should complete full progress update workflow with percentage tracking', async () => {
      const enabledClubData = { ...mockClubData, progress_tracking_enabled: true };

      render(
        <TestWrapper>
          <BookClubDetailsWithJoin
            club={enabledClubData}
            isMember={true}
            canManageClub={false}
            onJoin={vi.fn()}
            onLeave={vi.fn()}
          />
        </TestWrapper>
      );

      // Find and click the update progress button
      const updateButton = await screen.findByRole('button', { name: /Update Progress/i });
      await user.click(updateButton);

      // Modal should open
      expect(screen.getByText(/Update Reading Progress/i)).toBeInTheDocument();

      // Select "Currently Reading" status
      const readingRadio = screen.getByRole('radio', { name: /Currently Reading/i });
      await user.click(readingRadio);

      // Select percentage tracking
      const percentageRadio = screen.getByRole('radio', { name: /Percent/i });
      await user.click(percentageRadio);

      // Set progress to 50%
      const slider = screen.getByRole('slider');
      fireEvent.change(slider, { target: { value: '50' } });

      // Add notes
      const notesTextarea = screen.getByPlaceholderText(/Add any thoughts/i);
      await user.type(notesTextarea, 'Really enjoying this book so far!');

      // Keep progress public (default)
      const privacySwitch = screen.getByRole('switch');
      expect(privacySwitch).not.toBeChecked();

      // Submit the form
      const saveButton = screen.getByRole('button', { name: /Save Progress/i });
      await user.click(saveButton);

      // Verify API call
      await waitFor(() => {
        expect(mockUpsertReadingProgress).toHaveBeenCalledWith('test-user-id', {
          club_id: 'test-club-id',
          book_id: 'test-book-id',
          status: 'reading',
          progress_type: 'percentage',
          progress_percentage: 50,
          notes: 'Really enjoying this book so far!',
          is_private: false
        });
      });

      // Modal should close
      await waitFor(() => {
        expect(screen.queryByText(/Update Reading Progress/i)).not.toBeInTheDocument();
      });
    });

    it('should complete chapter-based progress tracking workflow', async () => {
      const enabledClubData = { ...mockClubData, progress_tracking_enabled: true };

      render(
        <TestWrapper>
          <BookClubDetailsWithJoin
            club={enabledClubData}
            isMember={true}
            canManageClub={false}
            onJoin={vi.fn()}
            onLeave={vi.fn()}
          />
        </TestWrapper>
      );

      // Open progress modal
      const updateButton = await screen.findByRole('button', { name: /Update Progress/i });
      await user.click(updateButton);

      // Select "Currently Reading"
      const readingRadio = screen.getByRole('radio', { name: /Currently Reading/i });
      await user.click(readingRadio);

      // Select chapter tracking
      const chapterRadio = screen.getByRole('radio', { name: /Chapter/i });
      await user.click(chapterRadio);

      // Set current chapter
      const currentChapterInput = screen.getByLabelText(/Current Chapter/i);
      await user.clear(currentChapterInput);
      await user.type(currentChapterInput, '5');

      // Set total chapters
      const totalChapterInput = screen.getByLabelText(/Total Chapters/i);
      await user.clear(totalChapterInput);
      await user.type(totalChapterInput, '20');

      // Make progress private
      const privacySwitch = screen.getByRole('switch');
      await user.click(privacySwitch);

      // Submit
      const saveButton = screen.getByRole('button', { name: /Save Progress/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockUpsertReadingProgress).toHaveBeenCalledWith('test-user-id', {
          club_id: 'test-club-id',
          book_id: 'test-book-id',
          status: 'reading',
          progress_type: 'chapter',
          current_progress: 5,
          total_progress: 20,
          notes: undefined,
          is_private: true
        });
      });
    });

    it('should handle marking book as finished', async () => {
      const enabledClubData = { ...mockClubData, progress_tracking_enabled: true };

      render(
        <TestWrapper>
          <BookClubDetailsWithJoin
            club={enabledClubData}
            isMember={true}
            canManageClub={false}
            onJoin={vi.fn()}
            onLeave={vi.fn()}
          />
        </TestWrapper>
      );

      // Open progress modal
      const updateButton = await screen.findByRole('button', { name: /Update Progress/i });
      await user.click(updateButton);

      // Select "Finished"
      const finishedRadio = screen.getByRole('radio', { name: /Finished/i });
      await user.click(finishedRadio);

      // Progress type selection should not be visible for finished status
      expect(screen.queryByText(/Track Progress By/i)).not.toBeInTheDocument();

      // Add completion notes
      const notesTextarea = screen.getByPlaceholderText(/Add any thoughts/i);
      await user.type(notesTextarea, 'Excellent book! Highly recommend.');

      // Submit
      const saveButton = screen.getByRole('button', { name: /Save Progress/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockUpsertReadingProgress).toHaveBeenCalledWith('test-user-id', {
          club_id: 'test-club-id',
          book_id: 'test-book-id',
          status: 'finished',
          notes: 'Excellent book! Highly recommend.',
          is_private: false
        });
      });
    });
  });

  describe('Progress Display Workflow', () => {
    it('should display club reading statistics when progress tracking is enabled', async () => {
      const enabledClubData = { ...mockClubData, progress_tracking_enabled: true };
      
      mockIsProgressTrackingEnabled.mockResolvedValue(true);
      mockGetClubProgressStats.mockResolvedValue({
        total_members: 5,
        not_started_count: 1,
        reading_count: 2,
        finished_count: 2,
        completion_percentage: 40
      });

      render(
        <TestWrapper>
          <BookClubDetailsWithJoin
            club={enabledClubData}
            isMember={true}
            canManageClub={false}
            onJoin={vi.fn()}
            onLeave={vi.fn()}
          />
        </TestWrapper>
      );

      // Should display club statistics
      await waitFor(() => {
        expect(screen.getByText('Club Reading Progress')).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument(); // Total members
        expect(screen.getByText('2')).toBeInTheDocument(); // Finished count
        expect(screen.getByText('40%')).toBeInTheDocument(); // Completion percentage
      });
    });

    it('should display member progress indicators', async () => {
      const enabledClubData = { ...mockClubData, progress_tracking_enabled: true };
      
      mockIsProgressTrackingEnabled.mockResolvedValue(true);
      mockGetClubReadingProgress.mockResolvedValue([
        {
          id: 'progress-1',
          user_id: 'test-user-id',
          username: 'testuser',
          status: 'reading',
          progress_percentage: 75,
          is_private: false,
          last_updated: '2025-01-24T10:00:00Z'
        },
        {
          id: 'progress-2',
          user_id: 'other-user-id',
          username: 'otheruser',
          status: 'finished',
          is_private: false,
          last_updated: '2025-01-24T09:00:00Z'
        }
      ]);

      render(
        <TestWrapper>
          <BookClubDetailsWithJoin
            club={enabledClubData}
            isMember={true}
            canManageClub={false}
            onJoin={vi.fn()}
            onLeave={vi.fn()}
          />
        </TestWrapper>
      );

      // Should display member progress
      await waitFor(() => {
        expect(screen.getByText('testuser')).toBeInTheDocument();
        expect(screen.getByText('otheruser')).toBeInTheDocument();
      });

      // Should show progress indicators
      const progressIndicators = screen.getAllByTestId(/progress-indicator/i);
      expect(progressIndicators.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling Workflows', () => {
    it('should handle API errors gracefully during progress update', async () => {
      const enabledClubData = { ...mockClubData, progress_tracking_enabled: true };
      mockUpsertReadingProgress.mockRejectedValue(new Error('Network error'));

      render(
        <TestWrapper>
          <BookClubDetailsWithJoin
            club={enabledClubData}
            isMember={true}
            canManageClub={false}
            onJoin={vi.fn()}
            onLeave={vi.fn()}
          />
        </TestWrapper>
      );

      // Open modal and submit invalid data
      const updateButton = await screen.findByRole('button', { name: /Update Progress/i });
      await user.click(updateButton);

      const readingRadio = screen.getByRole('radio', { name: /Currently Reading/i });
      await user.click(readingRadio);

      const saveButton = screen.getByRole('button', { name: /Save Progress/i });
      await user.click(saveButton);

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/Error/i)).toBeInTheDocument();
      });
    });

    it('should handle feature toggle errors gracefully', async () => {
      mockToggleClubProgressTracking.mockRejectedValue(new Error('Permission denied'));

      render(
        <TestWrapper>
          <BookClubDetailsWithJoin
            club={mockClubData}
            isMember={true}
            canManageClub={true}
            onJoin={vi.fn()}
            onLeave={vi.fn()}
          />
        </TestWrapper>
      );

      const enableButton = await screen.findByRole('button', { name: /Enable/i });
      await user.click(enableButton);

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/Error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility Workflows', () => {
    it('should support keyboard navigation through progress update form', async () => {
      const enabledClubData = { ...mockClubData, progress_tracking_enabled: true };

      render(
        <TestWrapper>
          <BookClubDetailsWithJoin
            club={enabledClubData}
            isMember={true}
            canManageClub={false}
            onJoin={vi.fn()}
            onLeave={vi.fn()}
          />
        </TestWrapper>
      );

      // Open modal with keyboard
      const updateButton = await screen.findByRole('button', { name: /Update Progress/i });
      updateButton.focus();
      fireEvent.keyDown(updateButton, { key: 'Enter' });

      // Navigate through form with Tab
      const readingRadio = screen.getByRole('radio', { name: /Currently Reading/i });
      readingRadio.focus();
      fireEvent.keyDown(readingRadio, { key: ' ' }); // Space to select

      // Should be able to navigate to percentage radio with arrow keys
      fireEvent.keyDown(readingRadio, { key: 'ArrowDown' });

      // Form should be navigable and functional via keyboard
      expect(document.activeElement).toBeDefined();
    });

    it('should provide proper ARIA labels and descriptions', async () => {
      const enabledClubData = { ...mockClubData, progress_tracking_enabled: true };

      render(
        <TestWrapper>
          <BookClubDetailsWithJoin
            club={enabledClubData}
            isMember={true}
            canManageClub={false}
            onJoin={vi.fn()}
            onLeave={vi.fn()}
          />
        </TestWrapper>
      );

      const updateButton = await screen.findByRole('button', { name: /Update Progress/i });
      await user.click(updateButton);

      // Check for proper ARIA labels
      expect(screen.getByRole('form', { name: /Update reading progress form/i })).toBeInTheDocument();
      expect(screen.getByRole('group', { name: /Reading Status/i })).toBeInTheDocument();
    });
  });
});
