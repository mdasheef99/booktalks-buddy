import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Database } from '@/integrations/supabase/types';
import { useCanManageClub } from '@/lib/entitlements/hooks';
import { ClubManagementPanel } from '../management';
import { supabase } from '@/lib/supabase';
import { ReportButton } from '@/components/reporting/ReportButton';
import { useAuth } from '@/contexts/AuthContext';

type BookClub = Database['public']['Tables']['book_clubs']['Row'];

interface ClubHeaderProps {
  club: BookClub;
  isMember: boolean;
  isPending: boolean;
  clubId: string;
  actionInProgress: boolean;
  handleJoinClub: () => Promise<void>;
  handleCancelRequest: () => Promise<void>;
}

const ClubHeader: React.FC<ClubHeaderProps> = ({
  club,
  isMember,
  isPending,
  clubId,
  actionInProgress,
  handleJoinClub,
  handleCancelRequest
}) => {
  const navigate = useNavigate();
  const [managementPanelOpen, setManagementPanelOpen] = useState(false);
  const { user } = useAuth();

  // Get the store ID for the club dynamically
  const [storeId, setStoreId] = useState<string>('');

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

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div className="flex-1">
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
                className="ml-4 flex-shrink-0"
              />
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 ml-4">
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

          {/* Admin settings button - only visible to users who can manage the club */}
          {canManage && (
            <Button
              variant="outline"
              onClick={() => setManagementPanelOpen(true)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Manage Club
            </Button>
          )}
        </div>
      </div>

      {/* Club Management Panel */}
      {canManage && (
        <ClubManagementPanel
          clubId={clubId}
          open={managementPanelOpen}
          onClose={() => setManagementPanelOpen(false)}
        />
      )}
    </div>
  );
};

export default ClubHeader;
