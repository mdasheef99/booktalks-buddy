import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCanManageClub } from '@/lib/entitlements/hooks';
import { supabase } from '@/lib/supabase';

interface ClubNavigationProps {
  clubId: string;
  isMember: boolean;
  setShowLeaveConfirm: (show: boolean) => void;
}

const ClubNavigation: React.FC<ClubNavigationProps> = ({
  clubId,
  isMember,
  setShowLeaveConfirm
}) => {
  const navigate = useNavigate();

  // Get the store ID for the club dynamically
  const [storeId, setStoreId] = useState<string>('');

  useEffect(() => {
    const fetchStoreId = async () => {
      try {
        const { data: club } = await supabase
          .from('book_clubs')
          .select('store_id')
          .eq('id', clubId)
          .single();

        setStoreId(club?.store_id || '');
      } catch (error) {
        console.error('Error fetching club store ID:', error);
        setStoreId('');
      }
    };

    fetchStoreId();
  }, [clubId]);

  // Check if the user can manage this club using entitlements
  const { result: canManage } = useCanManageClub(clubId, storeId);

  // We don't need to check navigation state anymore
  // The "Back to Book Clubs" button should always go to the book clubs list



  return (
    <>
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => {
            // Always navigate directly to the book clubs list
            // This ensures consistent behavior regardless of navigation history
            navigate('/book-club', {
              state: { fromClubDetails: true }
            });
          }}
          className="rounded-lg border border-bookconnect-brown/10 shadow-sm hover:shadow transition-all duration-200 bg-white/80 hover:bg-white"
        >
          <ArrowLeft className="h-4 w-4 mr-2 text-bookconnect-brown" />
          <span className="text-bookconnect-brown font-medium">Back to Book Clubs</span>
        </Button>
      </div>

      {/* Navigation buttons - only show for members */}
      {isMember && !canManage && (
        <div className="flex flex-wrap justify-center gap-3 mb-6 bg-white/80 p-4 rounded-xl shadow-sm border border-bookconnect-brown/10">
          <Button
            variant="outline"
            onClick={() => setShowLeaveConfirm(true)}
            className="border-red-200 text-red-600 hover:bg-red-50 transition-all duration-200 shadow-sm hover:shadow"
          >
            Leave Club
          </Button>
        </div>
      )}
    </>
  );
};

export default ClubNavigation;
