import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { MapPin, Link as LinkIcon } from 'lucide-react';
import FormSection from './FormSection';

interface LocationSectionProps {
  isVirtual: boolean;
  setIsVirtual: (value: boolean) => void;
  location: string;
  setLocation: (value: string) => void;
  virtualMeetingLink: string;
  setVirtualMeetingLink: (value: string) => void;
}

const LocationSection: React.FC<LocationSectionProps> = ({
  isVirtual,
  setIsVirtual,
  location,
  setLocation,
  virtualMeetingLink,
  setVirtualMeetingLink,
}) => {
  return (
    <FormSection title="Location">
      <div className="flex items-center space-x-2">
        <Checkbox
          id="is-virtual"
          checked={isVirtual}
          onCheckedChange={(checked) => setIsVirtual(checked as boolean)}
        />
        <Label htmlFor="is-virtual">This is a virtual event</Label>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="location">
          {isVirtual ? 'Event Host Location (Optional)' : 'Location *'}
        </Label>
        <div className="flex items-center">
          <MapPin className="h-4 w-4 mr-2 text-gray-500" />
          <Input
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder={isVirtual ? 'Optional location' : 'Enter event location'}
            required={!isVirtual}
          />
        </div>
      </div>
      
      {isVirtual && (
        <div className="space-y-2">
          <Label htmlFor="virtual-link">Virtual Meeting Link *</Label>
          <div className="flex items-center">
            <LinkIcon className="h-4 w-4 mr-2 text-gray-500" />
            <Input
              id="virtual-link"
              value={virtualMeetingLink}
              onChange={(e) => setVirtualMeetingLink(e.target.value)}
              placeholder="Enter meeting link (Zoom, Teams, etc.)"
              required={isVirtual}
            />
          </div>
        </div>
      )}
    </FormSection>
  );
};

export default LocationSection;
