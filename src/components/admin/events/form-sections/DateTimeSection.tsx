import React, { useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Calendar, Clock, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import FormSection from './FormSection';

interface DateTimeSectionProps {
  startDate: string;
  setStartDate: (value: string) => void;
  startTime: string;
  setStartTime: (value: string) => void;
  endDate: string;
  setEndDate: (value: string) => void;
  endTime: string;
  setEndTime: (value: string) => void;
}

const DateTimeSection: React.FC<DateTimeSectionProps> = ({
  startDate,
  setStartDate,
  startTime,
  setStartTime,
  endDate,
  setEndDate,
  endTime,
  setEndTime,
}) => {
  // Get current date and time for validation
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const currentTime = now.toTimeString().slice(0, 5);

  // Validation logic
  const validation = useMemo(() => {
    const errors: string[] = [];

    if (!startDate || !startTime || !endDate || !endTime) {
      return { errors: [], isValid: true }; // Don't validate incomplete forms
    }

    const startDateTime = new Date(`${startDate}T${startTime}`);
    const endDateTime = new Date(`${endDate}T${endTime}`);
    const nowDateTime = new Date();

    // Check if start date/time is in the past
    if (startDateTime <= nowDateTime) {
      errors.push('Event start time must be in the future');
    }

    // Check if end time is before start time
    if (endDateTime <= startDateTime) {
      errors.push('Event end time must be after start time');
    }

    // Check if event duration is reasonable (at least 15 minutes)
    const durationMs = endDateTime.getTime() - startDateTime.getTime();
    const durationMinutes = durationMs / (1000 * 60);
    if (durationMinutes < 15) {
      errors.push('Event duration must be at least 15 minutes');
    }

    // Check if event is too far in the future (1 year)
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    if (startDateTime > oneYearFromNow) {
      errors.push('Event cannot be scheduled more than 1 year in advance');
    }

    return { errors, isValid: errors.length === 0 };
  }, [startDate, startTime, endDate, endTime]);

  const handleStartDateChange = (value: string) => {
    setStartDate(value);
    // Auto-adjust end date if it's before start date
    if (endDate && value > endDate) {
      setEndDate(value);
    }
  };

  const handleStartTimeChange = (value: string) => {
    setStartTime(value);
    // If same date and end time is before start time, adjust end time
    if (startDate === endDate && endTime && value >= endTime) {
      const [hours, minutes] = value.split(':').map(Number);
      const newEndTime = new Date();
      newEndTime.setHours(hours + 1, minutes);
      setEndTime(newEndTime.toTimeString().slice(0, 5));
    }
  };

  return (
    <FormSection title="Date and Time">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="start-date">Start Date *</Label>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-gray-500" />
              <Input
                id="start-date"
                type="date"
                value={startDate}
                min={today}
                onChange={(e) => handleStartDateChange(e.target.value)}
                required
                className={validation.errors.some(e => e.includes('start')) ? 'border-red-500' : ''}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="start-time">Start Time *</Label>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2 text-gray-500" />
              <Input
                id="start-time"
                type="time"
                value={startTime}
                min={startDate === today ? currentTime : undefined}
                onChange={(e) => handleStartTimeChange(e.target.value)}
                required
                className={validation.errors.some(e => e.includes('start')) ? 'border-red-500' : ''}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="end-date">End Date *</Label>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-gray-500" />
              <Input
                id="end-date"
                type="date"
                value={endDate}
                min={startDate || today}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className={validation.errors.some(e => e.includes('end')) ? 'border-red-500' : ''}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="end-time">End Time *</Label>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2 text-gray-500" />
              <Input
                id="end-time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className={validation.errors.some(e => e.includes('end')) ? 'border-red-500' : ''}
              />
            </div>
          </div>
        </div>

        {/* Validation Messages */}
        {validation.errors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1">
                {validation.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Helper Text */}
        <div className="text-sm text-gray-600">
          <p>• Events must be scheduled at least 15 minutes in the future</p>
          <p>• Minimum event duration is 15 minutes</p>
          <p>• Events cannot be scheduled more than 1 year in advance</p>
        </div>
      </div>
    </FormSection>
  );
};

export default DateTimeSection;
