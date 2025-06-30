/**
 * Club Events Index Module Tests
 * Tests for convenience functions and integration
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the individual modules
vi.mock('../event-queries', () => ({
  getMeetings: vi.fn(),
  getMeeting: vi.fn(),
  getClubEventsData: vi.fn()
}));

vi.mock('../event-creation', () => ({
  createMeeting: vi.fn()
}));

vi.mock('../event-management', () => ({
  updateMeeting: vi.fn(),
  deleteMeeting: vi.fn()
}));

vi.mock('../rsvp-management', () => ({
  rsvpToMeeting: vi.fn(),
  getMeetingRSVPList: vi.fn(),
  getRSVPStats: vi.fn()
}));

vi.mock('../event-notifications', () => ({
  createNotification: vi.fn(),
  getNotifications: vi.fn()
}));

describe('Club Events Index Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Convenience Functions', () => {
    it('should call getMeetings with correct parameters', async () => {
      const { getClubMeetings } = await import('../index');
      const { getMeetings } = await import('../event-queries');
      
      (getMeetings as any).mockResolvedValue([]);

      await getClubMeetings('club-123', { upcoming: true }, true);
      
      expect(getMeetings).toHaveBeenCalledWith('club-123', { upcoming: true }, true);
    });

    it('should call getMeeting with correct parameters', async () => {
      const { getClubMeeting } = await import('../index');
      const { getMeeting } = await import('../event-queries');
      
      (getMeeting as any).mockResolvedValue(null);

      await getClubMeeting('club-123', 'meeting-123', true);
      
      expect(getMeeting).toHaveBeenCalledWith('club-123', 'meeting-123', true);
    });

    it('should call createMeeting with correct parameters', async () => {
      const { createClubMeeting } = await import('../index');
      const { createMeeting } = await import('../event-creation');
      
      const meetingData = {
        title: 'Test Meeting',
        start_time: new Date().toISOString()
      };
      
      (createMeeting as any).mockResolvedValue({ id: 'meeting-123' });

      await createClubMeeting('club-123', meetingData, 'user-123');
      
      expect(createMeeting).toHaveBeenCalledWith('club-123', meetingData, 'user-123');
    });

    it('should call updateMeeting with correct parameters', async () => {
      const { updateClubMeeting } = await import('../index');
      const { updateMeeting } = await import('../event-management');
      
      const updates = { title: 'Updated Meeting' };
      
      (updateMeeting as any).mockResolvedValue({ id: 'meeting-123' });

      await updateClubMeeting('club-123', 'meeting-123', updates);
      
      expect(updateMeeting).toHaveBeenCalledWith('club-123', 'meeting-123', updates);
    });

    it('should call deleteMeeting with correct parameters', async () => {
      const { deleteClubMeeting } = await import('../index');
      const { deleteMeeting } = await import('../event-management');
      
      (deleteMeeting as any).mockResolvedValue(undefined);

      await deleteClubMeeting('club-123', 'meeting-123');
      
      expect(deleteMeeting).toHaveBeenCalledWith('club-123', 'meeting-123');
    });

    it('should call getClubEventsData with correct parameters', async () => {
      const { getClubEvents } = await import('../index');
      const { getClubEventsData } = await import('../event-queries');
      
      (getClubEventsData as any).mockResolvedValue([]);

      await getClubEvents('club-123', true);
      
      expect(getClubEventsData).toHaveBeenCalledWith('club-123', true);
    });

    it('should call rsvpToMeeting for createMeetingRSVP', async () => {
      const { createMeetingRSVP } = await import('../index');
      const { rsvpToMeeting } = await import('../rsvp-management');
      
      (rsvpToMeeting as any).mockResolvedValue({ id: 'rsvp-123' });

      await createMeetingRSVP('club-123', 'meeting-123', 'user-123', 'going');
      
      expect(rsvpToMeeting).toHaveBeenCalledWith('club-123', 'meeting-123', 'user-123', 'going');
    });

    it('should call rsvpToMeeting for updateMeetingRSVP', async () => {
      const { updateMeetingRSVP } = await import('../index');
      const { rsvpToMeeting } = await import('../rsvp-management');
      
      (rsvpToMeeting as any).mockResolvedValue({ id: 'rsvp-123' });

      await updateMeetingRSVP('club-123', 'meeting-123', 'user-123', 'maybe');
      
      expect(rsvpToMeeting).toHaveBeenCalledWith('club-123', 'meeting-123', 'user-123', 'maybe');
    });

    it('should call getMeetingRSVPList with correct parameters', async () => {
      const { getMeetingRSVPs } = await import('../index');
      const { getMeetingRSVPList } = await import('../rsvp-management');
      
      (getMeetingRSVPList as any).mockResolvedValue([]);

      await getMeetingRSVPs('club-123', 'meeting-123', true);
      
      expect(getMeetingRSVPList).toHaveBeenCalledWith('club-123', 'meeting-123', true);
    });

    it('should call getRSVPStats with correct parameters', async () => {
      const { getMeetingRSVPStats } = await import('../index');
      const { getRSVPStats } = await import('../rsvp-management');
      
      (getRSVPStats as any).mockResolvedValue({ total_rsvps: 0 });

      await getMeetingRSVPStats('club-123', 'meeting-123', true);
      
      expect(getRSVPStats).toHaveBeenCalledWith('club-123', 'meeting-123', true);
    });

    it('should call createNotification with correct parameters', async () => {
      const { createEventNotification } = await import('../index');
      const { createNotification } = await import('../event-notifications');
      
      (createNotification as any).mockResolvedValue({ id: 'notification-123' });

      await createEventNotification('meeting-123', 'club-123', 'meeting_created', 'Custom message');
      
      expect(createNotification).toHaveBeenCalledWith('meeting-123', 'club-123', 'meeting_created', 'Custom message');
    });

    it('should call getNotifications with correct parameters', async () => {
      const { getEventNotifications } = await import('../index');
      const { getNotifications } = await import('../event-notifications');
      
      (getNotifications as any).mockResolvedValue([]);

      await getEventNotifications('club-123', true);
      
      expect(getNotifications).toHaveBeenCalledWith('club-123', true);
    });
  });
});
