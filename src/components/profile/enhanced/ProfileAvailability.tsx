import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import { UserMetadata, MEETING_TIME_LABELS } from './types';

interface ProfileAvailabilityProps {
  userMetadata: UserMetadata;
}

const ProfileAvailability: React.FC<ProfileAvailabilityProps> = ({ userMetadata }) => {
  return (
    <Card className="border-bookconnect-brown/20 shadow-md">
      <CardHeader>
        <CardTitle className="text-xl font-serif text-bookconnect-brown">Availability</CardTitle>
        <CardDescription>Your preferred meeting times for book club discussions</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div>
          {userMetadata.preferred_meeting_times && userMetadata.preferred_meeting_times.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userMetadata.preferred_meeting_times.map((time: string, index: number) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-bookconnect-cream/30 rounded-lg border border-bookconnect-brown/10">
                  <Calendar className="h-5 w-5 text-bookconnect-terracotta" />
                  <span className="font-serif text-bookconnect-brown">
                    {MEETING_TIME_LABELS[time] || time}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-bookconnect-cream/30 rounded-lg border border-dashed border-bookconnect-brown/20">
              <Calendar className="h-12 w-12 mx-auto text-bookconnect-brown/30 mb-3" />
              <p className="text-gray-600 font-serif">No preferred meeting times specified</p>
              <p className="text-sm text-gray-500 mt-2">Edit your profile to add your availability</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileAvailability;
