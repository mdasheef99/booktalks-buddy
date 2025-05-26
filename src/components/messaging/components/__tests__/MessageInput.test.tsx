/**
 * MessageInput Component Tests
 * 
 * Tests for the MessageInput component including text input,
 * send functionality, character limits, and keyboard interactions.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MessageInput } from '../MessageInput';

// Mock UI components
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, className, ...props }: any) => (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      className={className}
      {...props}
    >
      {children}
    </button>
  )
}));

vi.mock('@/components/ui/textarea', () => ({
  Textarea: ({ value, onChange, onKeyPress, onFocus, onBlur, placeholder, disabled, className, ...props }: any) => (
    <textarea
      value={value}
      onChange={onChange}
      onKeyDown={onKeyPress} // Note: using onKeyDown instead of onKeyPress for better testing
      onFocus={onFocus}
      onBlur={onBlur}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
      {...props}
    />
  )
}));

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  Send: () => <span data-testid="send-icon">Send</span>,
  Loader2: () => <span data-testid="loader-icon">Loading</span>
}));

describe('MessageInput', () => {
  const mockOnSendMessage = vi.fn();

  const setup = (props = {}) => {
    const defaultProps = {
      onSendMessage: mockOnSendMessage,
      disabled: false,
      placeholder: 'Type a message...',
      maxLength: 1000,
      className: ''
    };

    const mergedProps = { ...defaultProps, ...props };
    const utils = render(<MessageInput {...mergedProps} />);

    return {
      ...utils,
      textarea: screen.getByRole('textbox'),
      sendButton: screen.getByRole('button'),
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders textarea with correct placeholder', () => {
      const { textarea } = setup({ placeholder: 'Custom placeholder...' });

      expect(textarea).toBeInTheDocument();
      expect(textarea).toHaveAttribute('placeholder', 'Custom placeholder...');
    });

    it('renders send button', () => {
      const { sendButton } = setup();

      expect(sendButton).toBeInTheDocument();
      expect(screen.getByTestId('send-icon')).toBeInTheDocument();
    });

    it('shows character count when focused', async () => {
      const user = userEvent.setup();
      const { textarea } = setup();

      await user.click(textarea);

      expect(screen.getByText('1000 characters remaining')).toBeInTheDocument();
    });

    it('shows helper text when focused', async () => {
      const user = userEvent.setup();
      const { textarea } = setup();

      await user.click(textarea);

      expect(screen.getByText('Press Enter to send, Shift+Enter for new line')).toBeInTheDocument();
    });
  });

  describe('text input', () => {
    it('allows typing in the textarea', async () => {
      const user = userEvent.setup();
      const { textarea } = setup();

      await user.type(textarea, 'Hello world!');

      expect(textarea).toHaveValue('Hello world!');
    });

    it('respects character limit', async () => {
      const user = userEvent.setup();
      const { textarea } = setup({ maxLength: 10 });

      await user.type(textarea, 'This is a very long message that exceeds the limit');

      expect(textarea).toHaveValue('This is a '); // Should be truncated to 10 characters
    });

    it('updates character count as user types', async () => {
      const user = userEvent.setup();
      const { textarea } = setup({ maxLength: 20 });

      await user.click(textarea); // Focus to show character count
      await user.type(textarea, 'Hello');

      expect(screen.getByText('15 characters remaining')).toBeInTheDocument();
    });

    it('shows warning styling when near character limit', async () => {
      const user = userEvent.setup();
      const { textarea } = setup({ maxLength: 10 });

      await user.click(textarea);
      await user.type(textarea, 'Hello wo'); // 8 characters, within 50 of limit

      const characterCount = screen.getByText('2 characters remaining');
      expect(characterCount).toHaveClass('text-red-500');
    });
  });

  describe('send functionality', () => {
    it('calls onSendMessage when send button is clicked', async () => {
      const user = userEvent.setup();
      const { textarea, sendButton } = setup();

      await user.type(textarea, 'Test message');
      await user.click(sendButton);

      expect(mockOnSendMessage).toHaveBeenCalledWith('Test message');
    });

    it('clears textarea after sending message', async () => {
      const user = userEvent.setup();
      const { textarea, sendButton } = setup();

      await user.type(textarea, 'Test message');
      await user.click(sendButton);

      expect(textarea).toHaveValue('');
    });

    it('trims whitespace from message before sending', async () => {
      const user = userEvent.setup();
      const { textarea, sendButton } = setup();

      await user.type(textarea, '  Test message  ');
      await user.click(sendButton);

      expect(mockOnSendMessage).toHaveBeenCalledWith('Test message');
    });

    it('does not send empty or whitespace-only messages', async () => {
      const user = userEvent.setup();
      const { textarea, sendButton } = setup();

      await user.type(textarea, '   ');
      await user.click(sendButton);

      expect(mockOnSendMessage).not.toHaveBeenCalled();
    });

    it('disables send button when message is empty', () => {
      const { sendButton } = setup();

      expect(sendButton).toBeDisabled();
    });

    it('enables send button when message has content', async () => {
      const user = userEvent.setup();
      const { textarea, sendButton } = setup();

      await user.type(textarea, 'Hello');

      expect(sendButton).not.toBeDisabled();
    });
  });

  describe('keyboard interactions', () => {
    it('sends message when Enter is pressed', async () => {
      const user = userEvent.setup();
      const { textarea } = setup();

      await user.type(textarea, 'Test message');
      await user.keyboard('{Enter}');

      expect(mockOnSendMessage).toHaveBeenCalledWith('Test message');
    });

    it('does not send message when Shift+Enter is pressed', async () => {
      const user = userEvent.setup();
      const { textarea } = setup();

      await user.type(textarea, 'Test message');
      await user.keyboard('{Shift>}{Enter}{/Shift}');

      expect(mockOnSendMessage).not.toHaveBeenCalled();
    });

    it('adds new line when Shift+Enter is pressed', async () => {
      const user = userEvent.setup();
      const { textarea } = setup();

      await user.type(textarea, 'Line 1');
      await user.keyboard('{Shift>}{Enter}{/Shift}');
      await user.type(textarea, 'Line 2');

      expect(textarea).toHaveValue('Line 1\nLine 2');
    });
  });

  describe('disabled state', () => {
    it('disables textarea when disabled prop is true', () => {
      const { textarea } = setup({ disabled: true });

      expect(textarea).toBeDisabled();
    });

    it('disables send button when disabled prop is true', () => {
      const { sendButton } = setup({ disabled: true });

      expect(sendButton).toBeDisabled();
    });

    it('shows loading icon when disabled', () => {
      setup({ disabled: true });

      expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
    });

    it('does not call onSendMessage when disabled', async () => {
      const user = userEvent.setup();
      const { textarea, sendButton } = setup({ disabled: true });

      await user.type(textarea, 'Test message');
      await user.click(sendButton);

      expect(mockOnSendMessage).not.toHaveBeenCalled();
    });
  });

  describe('styling and layout', () => {
    it('applies custom className when provided', () => {
      const { container } = setup({ className: 'custom-class' });

      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('applies focus styling when textarea is focused', async () => {
      const user = userEvent.setup();
      const { textarea } = setup();

      await user.click(textarea);

      const focusContainer = textarea.closest('.ring-2');
      expect(focusContainer).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has proper aria-label for textarea', () => {
      const { textarea } = setup();

      expect(textarea).toHaveAttribute('aria-label', 'Type your message');
    });

    it('has proper aria-label for send button', () => {
      const { sendButton } = setup();

      expect(sendButton).toHaveAttribute('aria-label', 'Send message');
    });
  });
});
