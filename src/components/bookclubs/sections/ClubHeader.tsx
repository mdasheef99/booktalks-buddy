import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Database } from '@/integrations/supabase/types';
import { useCanManageClub } from '@/lib/entitlements/hooks';
import { supabase } from '@/lib/supabase';
import { ReportButton } from '@/components/reporting/ReportButton';
import { useAuth } from '@/contexts/AuthContext';
import ClubPhotoDisplay from '../photos/ClubPhotoDisplay';
import ClubMemberCount from '../ClubMemberCount';

type BookClub = Database['public']['Tables']['book_clubs']['Row'];

interface ClubHeaderProps {
  club: BookClub;
  isMember: boolean;
  isPending: boolean;
  clubId: string;
  actionInProgress: boolean;
  handleJoinClub: () => Promise<void>;
  handleCancelRequest: () => Promise<void>;
  memberCount?: number;
}

const ClubHeader: React.FC<ClubHeaderProps> = ({
  club,
  isMember,
  isPending,
  clubId,
  actionInProgress,
  handleJoinClub,
  handleCancelRequest,
  memberCount = 0
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Get the store ID for the club dynamically
  const [storeId, setStoreId] = React.useState<string>('');

  useEffect(() => {
    const fetchStoreId = async () => {
      try {
        // Use the club prop if it has store_id, otherwise fetch from database
        if (club.store_id) {
          setStoreId(club.store_id);
        } else {
          const { data: clubData } = await supabase
            .from('book_clubs')
            .select('store_id')
            .eq('id', clubId)
            .single();

          setStoreId(clubData?.store_id || '');
        }
      } catch (error) {
        console.error('Error fetching club store ID:', error);
        setStoreId('');
      }
    };

    fetchStoreId();
  }, [clubId, club.store_id]);

  // Check if the user can manage this club using entitlements
  const { result: canManage } = useCanManageClub(clubId, storeId);

  const handleManageClub = () => {
    navigate(`/book-club/${clubId}/manage`);
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      {/* Hero Section with Photo */}
      <div className="relative">
        <div className="h-64 md:h-80">
          <ClubPhotoDisplay
            photoUrl={club.cover_photo_url}
            thumbnailUrl={club.cover_photo_thumbnail_url}
            clubName={club.name}
            size="large"
            aspectRatio="16:9"
            className="w-full h-full"
          />
        </div>

        {/* Overlay with gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        {/* Content overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold mb-2 drop-shadow-lg">
                {club.name}
              </h1>

              <div className="flex items-center gap-4 mb-3">
                <ClubMemberCount
                  clubId={clubId}
                  initialCount={memberCount}
                  size="medium"
                  realTimeUpdates={true}
                  className="text-white"
                />

                <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                  club.privacy === 'private'
                    ? 'bg-yellow-500/80 text-yellow-100'
                    : 'bg-green-500/80 text-green-100'
                }`}>
                  {club.privacy || 'public'}
                </span>
              </div>

              {club.description && (
                <p className="text-gray-200 text-sm md:text-base max-w-2xl drop-shadow">
                  {club.description}
                </p>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Report button - only show to non-creators */}
              {user && club.created_by && user.id !== club.created_by && (
                <ReportButton
                  targetType="club"
                  targetId={club.id}
                  targetUserId={club.created_by}
                  targetTitle={club.name}
                  targetContent={club.description}
                  clubId={club.id}
                  variant="icon-only"
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                />
              )}

              {/* Join/Request buttons for non-members */}
              {!isMember && (
                <div>
                  {isPending ? (
                    <Button
                      variant="outline"
                      onClick={handleCancelRequest}
                      disabled={actionInProgress}
                      className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                    >
                      {actionInProgress ? 'Cancelling...' : 'Cancel Request'}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleJoinClub}
                      disabled={actionInProgress}
                      className="bg-bookconnect-terracotta hover:bg-bookconnect-terracotta/90 text-white border-0"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      {actionInProgress ? 'Processing...' : club.privacy === 'public' ? 'Join Club' : 'Request to Join'}
                    </Button>
                  )}
                </div>
              )}

              {/* Admin settings button - only visible to users who can manage the club */}
              {canManage && (
                <Button
                  variant="outline"
                  onClick={handleManageClub}
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Manage Club
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClubHeader;
