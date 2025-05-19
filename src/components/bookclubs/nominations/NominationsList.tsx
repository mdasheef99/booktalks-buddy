import React from 'react';
import { BookPlus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Nomination } from '@/lib/api/bookclubs/nominations';
import NominationCard from './NominationCard';

interface NominationsListProps {
  nominations: Nomination[];
  loading: boolean;
  isAdmin: boolean;
  onRefresh: () => void;
  clubId: string;
}

const NominationsList: React.FC<NominationsListProps> = ({
  nominations,
  loading,
  isAdmin,
  onRefresh,
  clubId
}) => {
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, index) => (
          <Card key={index} className="p-4">
            <div className="flex animate-pulse">
              <div className="w-16 h-24 bg-gray-200 rounded mr-4"></div>
              <div className="flex-1">
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (nominations.length === 0) {
    return (
      <Card className="p-6 text-center">
        <BookPlus className="h-12 w-12 mx-auto text-gray-300 mb-2" />
        <h3 className="text-lg font-medium mb-2">No book nominations yet</h3>
        <p className="text-gray-500 mb-4">
          Nominate books for your club to read next!
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {nominations.map((nomination) => (
        <NominationCard
          key={nomination.id}
          nomination={nomination}
          isAdmin={isAdmin}
          onRefresh={onRefresh}
          clubId={clubId}
        />
      ))}
    </div>
  );
};

export default NominationsList;
