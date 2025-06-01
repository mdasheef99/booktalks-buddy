/**
 * BookClubPreferencesSection Component
 * Handles preferred meeting times and book club preferences
 */

import React from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

// Meeting time options
const MEETING_TIMES = [
  { value: 'weekday_mornings', label: 'Weekday Mornings' },
  { value: 'weekday_afternoons', label: 'Weekday Afternoons' },
  { value: 'weekday_evenings', label: 'Weekday Evenings' },
  { value: 'weekend_mornings', label: 'Weekend Mornings' },
  { value: 'weekend_afternoons', label: 'Weekend Afternoons' },
  { value: 'weekend_evenings', label: 'Weekend Evenings' }
];

interface BookClubPreferencesSectionProps {
  preferredMeetingTimes: string[];
  onToggleMeetingTime: (time: string) => void;
}

const BookClubPreferencesSection: React.FC<BookClubPreferencesSectionProps> = ({
  preferredMeetingTimes,
  onToggleMeetingTime
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-bookconnect-brown">BookClub Preferences</h3>

      <div className="space-y-2">
        <Label className="text-bookconnect-brown">Preferred Meeting Times</Label>
        <p className="text-xs text-gray-500 mb-3">
          Select the times when you're most likely to be available for book club meetings
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {MEETING_TIMES.map((time) => (
            <div key={time.value} className="flex items-center space-x-2">
              <Checkbox
                id={`time-${time.value}`}
                checked={preferredMeetingTimes.includes(time.value)}
                onCheckedChange={() => onToggleMeetingTime(time.value)}
                className="text-bookconnect-terracotta border-bookconnect-brown/30"
              />
              <label
                htmlFor={`time-${time.value}`}
                className="text-sm font-serif leading-none text-bookconnect-brown cursor-pointer select-none"
              >
                {time.label}
              </label>
            </div>
          ))}
        </div>

        {preferredMeetingTimes.length === 0 && (
          <p className="text-sm text-gray-500 italic mt-2">
            No meeting times selected. You can always update this later.
          </p>
        )}

        {preferredMeetingTimes.length > 0 && (
          <div className="mt-3 p-3 bg-bookconnect-cream/30 rounded-md">
            <p className="text-xs text-bookconnect-brown">
              <strong>Selected times:</strong> {preferredMeetingTimes.length} time{preferredMeetingTimes.length !== 1 ? 's' : ''} selected
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookClubPreferencesSection;
