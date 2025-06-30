/**
 * Event Validation Module Tests
 */

import { describe, it, expect } from 'vitest';
import {
  validateMeetingData,
  validateMeetingUpdateData,
  validateRSVPStatus,
  validateNotificationType
} from '../event-validation';

describe('Event Validation Module', () => {
  describe('validateMeetingData', () => {
    const validMeetingData = {
      title: 'Test Meeting',
      start_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      end_time: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(), // Tomorrow + 1 hour
      description: 'Test description',
      location: 'Test location',
      is_virtual: false,
      max_participants: 10,
      meeting_type: 'discussion'
    };

    it('should validate correct meeting data', () => {
      const result = validateMeetingData(validMeetingData);
      expect(result.valid).toBe(true);
    });

    it('should reject missing title', () => {
      const data = { ...validMeetingData, title: undefined as any };
      const result = validateMeetingData(data);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Meeting title is required and must be a string');
    });

    it('should reject empty title', () => {
      const data = { ...validMeetingData, title: '' };
      const result = validateMeetingData(data);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Meeting title is required and must be a string');
    });

    it('should reject whitespace-only title', () => {
      const data = { ...validMeetingData, title: '   ' };
      const result = validateMeetingData(data);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Meeting title cannot be empty');
    });

    it('should reject title that is too long', () => {
      const data = { ...validMeetingData, title: 'a'.repeat(201) };
      const result = validateMeetingData(data);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Meeting title is too long (maximum 200 characters)');
    });

    it('should reject missing start time', () => {
      const data = { ...validMeetingData, start_time: undefined as any };
      const result = validateMeetingData(data);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Meeting start time is required');
    });

    it('should reject invalid start time format', () => {
      const data = { ...validMeetingData, start_time: 'invalid-date' };
      const result = validateMeetingData(data);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid start time format');
    });

    it('should reject start time in the past', () => {
      const pastTime = new Date(Date.now() - 60 * 60 * 1000).toISOString(); // 1 hour ago
      const data = { ...validMeetingData, start_time: pastTime };
      const result = validateMeetingData(data);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Meeting start time cannot be in the past');
    });

    it('should reject end time before start time', () => {
      const startTime = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const endTime = new Date(Date.now() + 23 * 60 * 60 * 1000).toISOString(); // Before start
      const data = { ...validMeetingData, start_time: startTime, end_time: endTime };
      const result = validateMeetingData(data);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Meeting end time must be after start time');
    });

    it('should reject meeting duration over 8 hours', () => {
      const startTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const endTime = new Date(startTime.getTime() + 9 * 60 * 60 * 1000); // 9 hours later
      const data = { 
        ...validMeetingData, 
        start_time: startTime.toISOString(), 
        end_time: endTime.toISOString() 
      };
      const result = validateMeetingData(data);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Meeting duration cannot exceed 8 hours');
    });

    it('should reject description that is too long', () => {
      const data = { ...validMeetingData, description: 'a'.repeat(2001) };
      const result = validateMeetingData(data);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Meeting description is too long (maximum 2000 characters)');
    });

    it('should reject invalid virtual link', () => {
      const data = { 
        ...validMeetingData, 
        is_virtual: true, 
        virtual_link: 'not-a-valid-url' 
      };
      const result = validateMeetingData(data);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid virtual meeting link format');
    });

    it('should reject invalid max participants', () => {
      const data = { ...validMeetingData, max_participants: -1 };
      const result = validateMeetingData(data);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Max participants must be a positive integer');
    });

    it('should reject max participants over 1000', () => {
      const data = { ...validMeetingData, max_participants: 1001 };
      const result = validateMeetingData(data);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Max participants cannot exceed 1000');
    });

    it('should reject invalid meeting type', () => {
      const data = { ...validMeetingData, meeting_type: 'invalid_type' as any };
      const result = validateMeetingData(data);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid meeting type');
    });
  });

  describe('validateMeetingUpdateData', () => {
    it('should validate correct update data', () => {
      const updateData = {
        title: 'Updated Meeting',
        description: 'Updated description'
      };
      const result = validateMeetingUpdateData(updateData);
      expect(result.valid).toBe(true);
    });

    it('should reject empty title', () => {
      const updateData = { title: '' };
      const result = validateMeetingUpdateData(updateData);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Meeting title cannot be empty');
    });

    it('should reject invalid status', () => {
      const updateData = { status: 'invalid_status' as any };
      const result = validateMeetingUpdateData(updateData);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid meeting status');
    });

    it('should validate end time after start time when both are updated', () => {
      const startTime = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const endTime = new Date(Date.now() + 23 * 60 * 60 * 1000).toISOString(); // Before start
      const updateData = { start_time: startTime, end_time: endTime };
      const result = validateMeetingUpdateData(updateData);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Meeting end time must be after start time');
    });
  });

  describe('validateRSVPStatus', () => {
    it('should validate correct RSVP statuses', () => {
      const validStatuses = ['going', 'maybe', 'not_going'];
      validStatuses.forEach(status => {
        const result = validateRSVPStatus(status);
        expect(result.valid).toBe(true);
      });
    });

    it('should reject invalid RSVP status', () => {
      const result = validateRSVPStatus('invalid_status');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid RSVP status');
    });
  });

  describe('validateNotificationType', () => {
    it('should validate correct notification types', () => {
      const validTypes = ['meeting_created', 'meeting_updated', 'meeting_cancelled', 'meeting_reminder'];
      validTypes.forEach(type => {
        const result = validateNotificationType(type);
        expect(result.valid).toBe(true);
      });
    });

    it('should reject invalid notification type', () => {
      const result = validateNotificationType('invalid_type');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid notification type');
    });
  });
});
