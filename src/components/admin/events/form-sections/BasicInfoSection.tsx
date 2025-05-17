import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import FormSection from './FormSection';

interface BasicInfoSectionProps {
  title: string;
  setTitle: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  eventType: string;
  setEventType: (value: string) => void;
  clubId: string;
  setClubId: (value: string) => void;
  bookClubs: { id: string; name: string }[];
  eventTypes: { value: string; label: string }[];
}

const BasicInfoSection: React.FC<BasicInfoSectionProps> = ({
  title,
  setTitle,
  description,
  setDescription,
  eventType,
  setEventType,
  clubId,
  setClubId,
  bookClubs,
  eventTypes,
}) => {
  return (
    <FormSection title="Basic Information">
      <div className="space-y-2">
        <Label htmlFor="title">Event Title *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter event title"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter event description"
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="event-type">Event Type</Label>
        <Select value={eventType} onValueChange={setEventType}>
          <SelectTrigger id="event-type">
            <SelectValue placeholder="Select event type" />
          </SelectTrigger>
          <SelectContent>
            {eventTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="club-id">Associated Book Club (Optional)</Label>
        <Select value={clubId} onValueChange={setClubId}>
          <SelectTrigger id="club-id">
            <SelectValue placeholder="Select a book club" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None (Store-wide event)</SelectItem>
            {bookClubs.map((club) => (
              <SelectItem key={club.id} value={club.id}>
                {club.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </FormSection>
  );
};

export default BasicInfoSection;
