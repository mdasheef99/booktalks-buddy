import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Database } from '@/integrations/supabase/types';

type BookClub = Database['public']['Tables']['book_clubs']['Row'];

interface ClubHeaderProps {
  club: BookClub;
  isAdmin: boolean;
  isMember: boolean;
  isPending: boolean;
  clubId: string;
  actionInProgress: boolean;
  handleJoinClub: () => Promise<void>;
  handleCancelRequest: () => Promise<void>;
}

const ClubHeader: React.FC<ClubHeaderProps> = ({
  club,
  isAdmin,
  isMember,
  isPending,
  clubId,
  actionInProgress,
  handleJoinClub,
  handleCancelRequest
}) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">{club.name}</h1>
          <p className="text-gray-600 mt-2">{club.description}</p>
          <div className="mt-2">
            <span className={`text-xs px-2 py-1 rounded-full ${
              club.privacy === 'private'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-green-100 text-green-800'
            }`}>
              {club.privacy || 'public'}
            </span>
          </div>
        </div>

        {/* Join/Request buttons for non-members */}
        {!isMember && (
          <div>
            {isPending ? (
              <Button
                variant="outline"
                onClick={handleCancelRequest}
                disabled={actionInProgress}
              >
                {actionInProgress ? 'Cancelling...' : 'Cancel Request'}
              </Button>
            ) : (
              <Button
                onClick={handleJoinClub}
                disabled={actionInProgress}
                className="bg-bookconnect-terracotta hover:bg-bookconnect-terracotta/90"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                {actionInProgress ? 'Processing...' : club.privacy === 'public' ? 'Join Club' : 'Request to Join'}
              </Button>
            )}
          </div>
        )}

        {/* Admin settings button */}
        {isAdmin && (
          <Button
            variant="outline"
            onClick={() => navigate(`/book-club/${clubId}/settings`)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Manage Club
          </Button>
        )}
      </div>
    </div>
  );
};

export default ClubHeader;
