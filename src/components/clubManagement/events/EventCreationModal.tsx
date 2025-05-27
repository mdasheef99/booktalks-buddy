/**
 * Event Creation Modal Component
 *
 * Modal for creating new club meetings with form validation.
 */

import React, { useState } from 'react';
import { X, Calendar, Clock, Users, Video, Type, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useClubEvents } from '@/hooks/clubManagement/useClubEvents';
import { CreateMeetingRequest, ClubMeeting } from '@/lib/services/clubManagementService';
import { format, addDays } from 'date-fns';

// =====================================================
// Types
// =====================================================

interface EventCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated: (event: ClubMeeting) => void;
  clubId: string;
}

interface FormData {
  title: string;
  description: string;
  meeting_type: 'discussion' | 'social' | 'planning' | 'author_event' | 'other';
  scheduled_at: string;
  duration_minutes: number;
  virtual_link: string;
  max_attendees: number | null;
}

// =====================================================
// Event Creation Modal Component
// =====================================================

const EventCreationModal: React.FC<EventCreationModalProps> = ({
  isOpen,
  onClose,
  onEventCreated,
  clubId
}) => {
  const { createMeeting } = useClubEvents(clubId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    meeting_type: 'discussion',
    scheduled_at: format(addDays(new Date(), 7), "yyyy-MM-dd'T'HH:mm"), // Default to next week
    duration_minutes: 60,
    virtual_link: '',
    max_attendees: null
  });

  // Form validation
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Meeting title is required';
    }

    if (!formData.scheduled_at) {
      newErrors.scheduled_at = 'Meeting date and time is required';
    } else {
      const scheduledDate = new Date(formData.scheduled_at);
      if (scheduledDate <= new Date()) {
        newErrors.scheduled_at = 'Meeting must be scheduled in the future';
      }
    }

    if (formData.duration_minutes <= 0) {
      newErrors.duration_minutes = 'Duration must be greater than 0';
    }

    if (formData.max_attendees !== null && formData.max_attendees <= 0) {
      newErrors.max_attendees = 'Max attendees must be greater than 0';
    }

    if (formData.virtual_link && !isValidUrl(formData.virtual_link)) {
      newErrors.virtual_link = 'Please enter a valid URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (string: string): boolean => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleInputChange = (field: keyof FormData, value: string | number | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const meetingData: CreateMeetingRequest = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        meeting_type: formData.meeting_type,
        scheduled_at: formData.scheduled_at,
        duration_minutes: formData.duration_minutes,
        virtual_link: formData.virtual_link.trim() || undefined,
        max_attendees: formData.max_attendees || undefined,
        is_recurring: false // For now, we'll implement recurring meetings later
      };

      const newEvent = await createMeeting(meetingData);
      onEventCreated(newEvent);
      handleClose();
    } catch (err) {
      console.error('Error creating meeting:', err);
      setError(err instanceof Error ? err.message : 'Failed to create meeting');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      // Reset form
      setFormData({
        title: '',
        description: '',
        meeting_type: 'discussion',
        scheduled_at: format(addDays(new Date(), 7), "yyyy-MM-dd'T'HH:mm"),
        duration_minutes: 60,
        virtual_link: '',
        max_attendees: null
      });
      setErrors({});
      setError(null);
      onClose();
    }
  };

  const meetingTypes = [
    { value: 'discussion', label: 'Book Discussion', icon: '📚' },
    { value: 'social', label: 'Social Meetup', icon: '☕' },
    { value: 'planning', label: 'Planning Meeting', icon: '📋' },
    { value: 'author_event', label: 'Author Event', icon: '✍️' },
    { value: 'other', label: 'Other', icon: '📅' }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Create New Meeting
          </DialogTitle>
          <DialogDescription>
            Schedule a new meeting or event for your book club members.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Meeting Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="flex items-center gap-2">
              <Type className="h-4 w-4" />
              Meeting Title *
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="e.g., Chapter 5-7 Discussion"
              className={errors.title ? 'border-red-500' : ''}
            />
            {errors.title && (
              <p className="text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          {/* Meeting Type */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Meeting Type
            </Label>
            <Select
              value={formData.meeting_type}
              onValueChange={(value) => handleInputChange('meeting_type', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {meetingTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <span className="flex items-center gap-2">
                      <span>{type.icon}</span>
                      {type.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="scheduled_at" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Date & Time *
              </Label>
              <Input
                id="scheduled_at"
                type="datetime-local"
                value={formData.scheduled_at}
                onChange={(e) => handleInputChange('scheduled_at', e.target.value)}
                className={errors.scheduled_at ? 'border-red-500' : ''}
              />
              {errors.scheduled_at && (
                <p className="text-sm text-red-600">{errors.scheduled_at}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Duration (minutes)
              </Label>
              <Input
                id="duration"
                type="number"
                min="15"
                max="480"
                value={formData.duration_minutes}
                onChange={(e) => handleInputChange('duration_minutes', parseInt(e.target.value) || 60)}
                className={errors.duration_minutes ? 'border-red-500' : ''}
              />
              {errors.duration_minutes && (
                <p className="text-sm text-red-600">{errors.duration_minutes}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Description
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Add meeting agenda, topics to discuss, or any other details..."
              rows={3}
            />
          </div>

          {/* Virtual Link and Max Attendees */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="virtual_link" className="flex items-center gap-2">
                <Video className="h-4 w-4" />
                Virtual Meeting Link
              </Label>
              <Input
                id="virtual_link"
                type="url"
                value={formData.virtual_link}
                onChange={(e) => handleInputChange('virtual_link', e.target.value)}
                placeholder="https://zoom.us/j/..."
                className={errors.virtual_link ? 'border-red-500' : ''}
              />
              {errors.virtual_link && (
                <p className="text-sm text-red-600">{errors.virtual_link}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_attendees" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Max Attendees
              </Label>
              <Input
                id="max_attendees"
                type="number"
                min="1"
                value={formData.max_attendees || ''}
                onChange={(e) => handleInputChange('max_attendees', e.target.value ? parseInt(e.target.value) : null)}
                placeholder="Leave empty for no limit"
                className={errors.max_attendees ? 'border-red-500' : ''}
              />
              {errors.max_attendees && (
                <p className="text-sm text-red-600">{errors.max_attendees}</p>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Creating...
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4" />
                  Create Meeting
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EventCreationModal;
