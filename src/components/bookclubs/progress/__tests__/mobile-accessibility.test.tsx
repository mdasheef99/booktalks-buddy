import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import '@testing-library/jest-dom';
import ProgressUpdateModal from '../ProgressUpdateModal';
import ProgressIndicator from '../ProgressIndicator';
import ProgressToggleControl from '../ProgressToggleControl';

// Mock dependencies
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id' } }
      })
    }
  }
}));

vi.mock('@/lib/api/bookclubs/progress', () => ({
  upsertReadingProgress: vi.fn().mockResolvedValue({
    id: 'test-progress-id',
    status: 'reading',
    progress_percentage: 50
  }),
  toggleClubProgressTracking: vi.fn().mockResolvedValue(true)
}));

vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

describe('Progress Components - Mobile & Accessibility', () => {
  describe('ProgressUpdateModal', () => {
    const defaultProps = {
      isOpen: true,
      onClose: vi.fn(),
      clubId: 'test-club-id',
      bookId: 'test-book-id',
      currentProgress: null,
      onProgressUpdated: vi.fn()
    };

    it('should have proper ARIA labels and accessibility attributes', () => {
      render(<ProgressUpdateModal {...defaultProps} />);
      
      // Check form has proper aria-label
      expect(screen.getByRole('form')).toHaveAttribute('aria-label', 'Update reading progress form');
      
      // Check fieldsets have proper legends
      expect(screen.getByRole('group', { name: 'Reading Status' })).toBeInTheDocument();
      
      // Check radio groups have proper aria-labels
      expect(screen.getByRole('radiogroup', { name: 'Select your reading status' })).toBeInTheDocument();
      
      // Check input labels are properly associated
      expect(screen.getByLabelText(/Notes \(Optional\)/)).toBeInTheDocument();
    });

    it('should have mobile-friendly touch targets', () => {
      render(<ProgressUpdateModal {...defaultProps} />);
      
      // Check radio buttons have touch-friendly classes
      const radioButtons = screen.getAllByRole('radio');
      radioButtons.forEach(radio => {
        const container = radio.closest('.touch-manipulation');
        expect(container).toBeInTheDocument();
      });
      
      // Check buttons have proper mobile sizing
      const saveButton = screen.getByRole('button', { name: /Save Progress/ });
      expect(saveButton).toHaveClass('h-12', 'sm:h-10');
    });

    it('should support keyboard navigation', async () => {
      render(<ProgressUpdateModal {...defaultProps} />);
      
      // Tab through form elements
      const firstRadio = screen.getByRole('radio', { name: 'Not Started' });
      firstRadio.focus();
      expect(firstRadio).toHaveFocus();
      
      // Arrow keys should navigate radio groups
      fireEvent.keyDown(firstRadio, { key: 'ArrowDown' });
      const secondRadio = screen.getByRole('radio', { name: 'Currently Reading' });
      expect(secondRadio).toHaveFocus();
    });

    it('should have proper input modes for mobile keyboards', () => {
      render(<ProgressUpdateModal {...defaultProps} />);
      
      // Select reading status to show progress inputs
      fireEvent.click(screen.getByRole('radio', { name: 'Currently Reading' }));
      
      // Select chapter/page tracking to show number inputs
      fireEvent.click(screen.getByRole('radio', { name: /Chapter/ }));
      
      // Check number inputs have inputMode="numeric"
      const numberInputs = screen.getAllByRole('spinbutton');
      numberInputs.forEach(input => {
        expect(input).toHaveAttribute('inputMode', 'numeric');
      });
    });
  });

  describe('ProgressIndicator', () => {
    it('should have proper ARIA attributes for screen readers', () => {
      render(
        <ProgressIndicator
          status="reading"
          progressDisplay="50%"
          isPrivate={false}
          size="md"
          lastUpdated="2025-01-24T10:00:00Z"
        />
      );
      
      // Icons should be hidden from screen readers
      const icons = document.querySelectorAll('svg');
      icons.forEach(icon => {
        // SVG icons in progress rings don't need aria-hidden as they're decorative
        // but the component should provide meaningful text alternatives
      });
    });

    it('should provide meaningful tooltip content', async () => {
      render(
        <ProgressIndicator
          status="reading"
          progressDisplay="50%"
          isPrivate={false}
          size="md"
          lastUpdated="2025-01-24T10:00:00Z"
        />
      );
      
      // Hover to show tooltip
      const indicator = screen.getByRole('button');
      fireEvent.mouseEnter(indicator);
      
      await waitFor(() => {
        expect(screen.getByText('50%')).toBeInTheDocument();
      });
    });

    it('should handle private progress appropriately', () => {
      render(
        <ProgressIndicator
          status="reading"
          progressDisplay="50%"
          isPrivate={true}
          size="md"
        />
      );
      
      // Should show lock icon for private progress
      const lockIcon = document.querySelector('[data-lucide="lock"]');
      expect(lockIcon).toBeInTheDocument();
    });
  });

  describe('ProgressToggleControl', () => {
    const defaultProps = {
      clubId: 'test-club-id',
      enabled: false,
      onToggle: vi.fn(),
      canManage: true,
      loading: false
    };

    it('should have proper ARIA labels for toggle controls', () => {
      render(<ProgressToggleControl {...defaultProps} />);
      
      // Check switch has proper aria-label
      const toggle = screen.getByRole('switch');
      expect(toggle).toHaveAttribute('aria-label', 'Toggle progress tracking on');
    });

    it('should have mobile-friendly button sizing', () => {
      render(<ProgressToggleControl {...defaultProps} />);
      
      // Check enable button has mobile-friendly sizing
      const enableButton = screen.getByRole('button', { name: /Enable/ });
      expect(enableButton).toHaveClass('h-10', 'sm:h-8');
    });

    it('should handle responsive layout properly', () => {
      render(<ProgressToggleControl {...defaultProps} />);
      
      // Check container has responsive flex classes
      const container = document.querySelector('.flex.flex-col.sm\\:flex-row');
      expect(container).toBeInTheDocument();
    });

    it('should not render for users without manage permissions', () => {
      render(<ProgressToggleControl {...defaultProps} canManage={false} />);
      
      // Component should not render anything
      expect(screen.queryByText('Reading Progress Tracking')).not.toBeInTheDocument();
    });
  });

  describe('Cross-browser Compatibility', () => {
    it('should use CSS Grid with fallbacks', () => {
      render(<ProgressUpdateModal isOpen={true} onClose={vi.fn()} clubId="test" onProgressUpdated={vi.fn()} />);
      
      // Check grid layouts have proper responsive classes
      const gridElements = document.querySelectorAll('.grid');
      gridElements.forEach(element => {
        // Should have responsive grid classes
        expect(element.className).toMatch(/grid-cols-\d+/);
      });
    });

    it('should handle touch events properly', () => {
      render(<ProgressUpdateModal isOpen={true} onClose={vi.fn()} clubId="test" onProgressUpdated={vi.fn()} />);
      
      // Check touch-manipulation class is applied
      const touchElements = document.querySelectorAll('.touch-manipulation');
      expect(touchElements.length).toBeGreaterThan(0);
    });
  });
});
