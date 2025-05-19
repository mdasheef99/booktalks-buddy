import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EventForm from './EventForm';

// Mock the dependencies
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn()
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id' }
  })
}));

vi.mock('@/lib/api/bookclubs/events/core', () => ({
  createEvent: vi.fn().mockResolvedValue({ id: 'new-event-id' }),
  updateEvent: vi.fn().mockResolvedValue({ id: 'updated-event-id' })
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn()
  }
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      then: vi.fn().mockImplementation(callback => {
        callback({
          data: [
            { id: 'club-1', name: 'Book Club 1' },
            { id: 'club-2', name: 'Book Club 2' }
          ],
          error: null
        });
        return Promise.resolve();
      })
    })
  }
}));

// Mock the form section components
vi.mock('./form-sections/BasicInfoSection', () => ({
  default: ({ title, setTitle, description, setDescription, eventType, setEventType, clubId, setClubId }) => (
    <div data-testid="basic-info-section">
      <input
        data-testid="title-input"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <textarea
        data-testid="description-input"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <select
        data-testid="event-type-select"
        value={eventType}
        onChange={(e) => setEventType(e.target.value)}
      >
        <option value="discussion">Discussion</option>
      </select>
      <select
        data-testid="club-id-select"
        value={clubId}
        onChange={(e) => setClubId(e.target.value)}
      >
        <option value="none">None</option>
        <option value="club-1">Book Club 1</option>
      </select>
    </div>
  )
}));

vi.mock('./form-sections/DateTimeSection', () => ({
  default: ({ startDate, setStartDate, startTime, setStartTime, endDate, setEndDate, endTime, setEndTime }) => (
    <div data-testid="date-time-section">
      <input
        data-testid="start-date-input"
        type="date"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
      />
      <input
        data-testid="start-time-input"
        type="time"
        value={startTime}
        onChange={(e) => setStartTime(e.target.value)}
      />
      <input
        data-testid="end-date-input"
        type="date"
        value={endDate}
        onChange={(e) => setEndDate(e.target.value)}
      />
      <input
        data-testid="end-time-input"
        type="time"
        value={endTime}
        onChange={(e) => setEndTime(e.target.value)}
      />
    </div>
  )
}));

vi.mock('./form-sections/LocationSection', () => ({
  default: ({ isVirtual, setIsVirtual, location, setLocation, virtualMeetingLink, setVirtualMeetingLink }) => (
    <div data-testid="location-section">
      <input
        data-testid="is-virtual-checkbox"
        type="checkbox"
        checked={isVirtual}
        onChange={(e) => setIsVirtual(e.target.checked)}
      />
      <input
        data-testid="location-input"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
      />
      {isVirtual && (
        <input
          data-testid="virtual-link-input"
          value={virtualMeetingLink}
          onChange={(e) => setVirtualMeetingLink(e.target.value)}
        />
      )}
    </div>
  )
}));

vi.mock('./form-sections/AdditionalSettingsSection', () => ({
  default: ({ maxParticipants, setMaxParticipants, featuredOnLanding, setFeaturedOnLanding }) => (
    <div data-testid="additional-settings-section">
      <input
        data-testid="max-participants-input"
        value={maxParticipants}
        onChange={(e) => setMaxParticipants(e.target.value)}
      />
      <input
        data-testid="featured-checkbox"
        type="checkbox"
        checked={featuredOnLanding}
        onChange={(e) => setFeaturedOnLanding(e.target.checked)}
      />
    </div>
  )
}));

vi.mock('./form-sections/TempImageSection', () => ({
  default: ({ selectedFile, onImageSelected, onImageRemoved }) => (
    <div data-testid="temp-image-section">
      <button
        data-testid="select-image-button"
        onClick={() => onImageSelected(new File(['test'], 'test.jpg', { type: 'image/jpeg' }))}
      >
        Select Image
      </button>
      <button
        data-testid="remove-image-button"
        onClick={onImageRemoved}
      >
        Remove Image
      </button>
    </div>
  )
}));

vi.mock('./form-sections/ImageSection', () => ({
  default: ({ eventId, imageUrl, thumbnailUrl, imageAltText, onImageUploaded, onImageRemoved }) => (
    <div data-testid="image-section">
      <button
        data-testid="upload-image-button"
        onClick={() => onImageUploaded('image-url', 'thumbnail-url', 'medium-url')}
      >
        Upload Image
      </button>
      <button
        data-testid="remove-image-button"
        onClick={onImageRemoved}
      >
        Remove Image
      </button>
    </div>
  )
}));

describe('EventForm', () => {
  // Reset mocks before each test
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Setup function
  const setup = (props = {}) => {
    const utils = render(<EventForm {...props} />);
    return {
      ...utils
    };
  };

  // Rendering tests
  describe('rendering', () => {
    it('renders the form with correct title for creating a new event', async () => {
      setup();

      await waitFor(() => {
        expect(screen.getByText('Create New Event')).toBeInTheDocument();
        expect(screen.getByText('Fill in the details to create a new event')).toBeInTheDocument();
      });
    });

    it('renders the form with correct title for editing an event', async () => {
      setup({
        isEditing: true,
        event: {
          id: 'test-event-id',
          title: 'Test Event',
          description: 'Test Description',
          date: '2023-07-15',
          start_time: '2023-07-15T18:00:00Z',
          end_time: '2023-07-15T20:00:00Z',
          location: 'Test Location',
          is_virtual: false,
          virtual_meeting_link: null,
          max_participants: 20,
          featured_on_landing: false,
          created_by: 'test-user-id',
          club_id: 'club-1',
          store_id: 'test-store-id',
          created_at: '2023-07-01T12:00:00Z',
          updated_at: '2023-07-01T12:00:00Z',
          image_url: null,
          thumbnail_url: null,
          medium_url: null,
          image_alt_text: null,
          image_metadata: null,
          event_type: 'discussion'
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Edit Event')).toBeInTheDocument();
        expect(screen.getByText('Update the details of your event')).toBeInTheDocument();
      });
    });

    it('renders all form sections', async () => {
      setup();

      await waitFor(() => {
        expect(screen.getByTestId('basic-info-section')).toBeInTheDocument();
        expect(screen.getByTestId('date-time-section')).toBeInTheDocument();
        expect(screen.getByTestId('location-section')).toBeInTheDocument();
        expect(screen.getByTestId('additional-settings-section')).toBeInTheDocument();
        expect(screen.getByTestId('temp-image-section')).toBeInTheDocument();
      });
    });
  });

  // Interaction tests
  describe('interactions', () => {
    it('updates form fields when user enters data', async () => {
      const user = userEvent.setup();
      setup();

      // Wait for the form to be fully rendered
      await waitFor(() => {
        expect(screen.getByTestId('title-input')).toBeInTheDocument();
      });

      // Fill in the form fields
      await user.type(screen.getByTestId('title-input'), 'New Event Title');
      await user.type(screen.getByTestId('description-input'), 'New Event Description');

      // Check that the values were updated
      expect(screen.getByTestId('title-input')).toHaveValue('New Event Title');
      expect(screen.getByTestId('description-input')).toHaveValue('New Event Description');
    });

    it('toggles virtual event fields when is-virtual is checked', async () => {
      const user = userEvent.setup();
      setup();

      // Wait for the form to be fully rendered
      await waitFor(() => {
        expect(screen.getByTestId('is-virtual-checkbox')).toBeInTheDocument();
      });

      // Initially, virtual meeting link should not be visible
      expect(screen.queryByTestId('virtual-link-input')).not.toBeInTheDocument();

      // Check the is-virtual checkbox
      await user.click(screen.getByTestId('is-virtual-checkbox'));

      // Now the virtual meeting link should be visible
      expect(screen.getByTestId('virtual-link-input')).toBeInTheDocument();
    });

    it('handles image selection and removal', async () => {
      const user = userEvent.setup();
      setup();

      // Wait for the form to be fully rendered
      await waitFor(() => {
        expect(screen.getByTestId('select-image-button')).toBeInTheDocument();
      });

      // Click the select image button
      await user.click(screen.getByTestId('select-image-button'));

      // Click the remove image button
      await user.click(screen.getByTestId('remove-image-button'));
    });

    it('submits the form with correct data', async () => {
      const user = userEvent.setup();

      // Mock the API function
      const createEvent = vi.fn().mockResolvedValue({ id: 'new-event-id' });
      vi.mock('@/lib/api/bookclubs/events/core', () => ({
        createEvent
      }));

      // Mock the navigation
      const navigate = vi.fn();
      vi.mock('react-router-dom', () => ({
        useNavigate: () => navigate
      }));

      setup();

      // Wait for the form to be fully rendered
      await waitFor(() => {
        expect(screen.getByTestId('title-input')).toBeInTheDocument();
      });

      // Fill in the required fields
      await user.type(screen.getByTestId('title-input'), 'New Event Title');
      await user.type(screen.getByTestId('description-input'), 'New Event Description');

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /create event/i });
      expect(submitButton).toBeInTheDocument();
      await user.click(submitButton);

      // Verify form submission
      expect(createEvent).toHaveBeenCalled();
    });
  });
});
