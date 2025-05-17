import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Users, Star } from 'lucide-react';
import FormSection from './FormSection';

interface AdditionalSettingsSectionProps {
  maxParticipants: string;
  setMaxParticipants: (value: string) => void;
  featuredOnLanding: boolean;
  setFeaturedOnLanding: (value: boolean) => void;
}

const AdditionalSettingsSection: React.FC<AdditionalSettingsSectionProps> = ({
  maxParticipants,
  setMaxParticipants,
  featuredOnLanding,
  setFeaturedOnLanding,
}) => {
  return (
    <FormSection title="Additional Settings">
      <div className="space-y-2">
        <Label htmlFor="max-participants">Maximum Participants (Optional)</Label>
        <div className="flex items-center">
          <Users className="h-4 w-4 mr-2 text-gray-500" />
          <Input
            id="max-participants"
            type="number"
            min="1"
            value={maxParticipants}
            onChange={(e) => setMaxParticipants(e.target.value)}
            placeholder="Leave blank for unlimited"
          />
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox
          id="featured"
          checked={featuredOnLanding}
          onCheckedChange={(checked) => setFeaturedOnLanding(checked as boolean)}
        />
        <div className="grid gap-1.5 leading-none">
          <Label htmlFor="featured" className="flex items-center">
            <Star className="h-4 w-4 mr-2 text-amber-500" />
            Feature on Landing Page
          </Label>
          <p className="text-sm text-muted-foreground">
            Featured events will be displayed prominently on the landing page
          </p>
        </div>
      </div>
    </FormSection>
  );
};

export default AdditionalSettingsSection;
