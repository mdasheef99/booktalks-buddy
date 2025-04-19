import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ClubMembership } from './types';

interface ProfileBookClubsProps {
  memberships: ClubMembership[];
}

const ProfileBookClubs: React.FC<ProfileBookClubsProps> = ({ memberships }) => {
  return (
    <Card className="border-bookconnect-brown/20 shadow-md">
      <CardHeader>
        <CardTitle className="text-xl font-serif text-bookconnect-brown">My Book Clubs</CardTitle>
        <CardDescription>Book clubs you're a member of</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {memberships.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {memberships.map((membership, index) => (
              <div key={index} className="p-4 border border-bookconnect-brown/10 rounded-lg bg-bookconnect-cream/30">
                <h3 className="font-medium text-bookconnect-brown font-serif">{membership.club_name}</h3>
                <p className="text-sm text-gray-600">Role: {membership.role}</p>
                <p className="text-sm text-gray-600">
                  Joined: {new Date(membership.joined_at).toLocaleDateString()}
                </p>
                {membership.current_book && (
                  <div className="mt-2 pt-2 border-t border-bookconnect-brown/10">
                    <p className="text-sm font-medium">Currently Reading:</p>
                    <p className="text-sm">{membership.current_book.title} by {membership.current_book.author}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-bookconnect-cream/30 rounded-lg border border-dashed border-bookconnect-brown/20">
            <p className="text-gray-600 font-serif">You're not a member of any book clubs yet</p>
            <p className="text-sm text-gray-500 mt-2">Join or create a book club to get started</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfileBookClubs;
