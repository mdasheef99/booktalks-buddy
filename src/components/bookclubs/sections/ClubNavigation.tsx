import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ClubNavigationProps {
  clubId: string;
  isMember: boolean;
  isAdmin: boolean;
  setShowLeaveConfirm: (show: boolean) => void;
}

const ClubNavigation: React.FC<ClubNavigationProps> = ({
  clubId,
  isMember,
  isAdmin,
  setShowLeaveConfirm
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();

  // We don't need to check navigation state anymore
  // The "Back to Book Clubs" button should always go to the book clubs list

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success("You've been successfully signed out");
      navigate('/login');
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Failed to sign out");
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        onClick={() => {
          // Always navigate directly to the book clubs list
          // This ensures consistent behavior regardless of navigation history
          navigate('/book-club', {
            state: { fromClubDetails: true }
          });
        }}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Book Clubs
      </Button>

      {/* Navigation buttons - only show for members */}
      {isMember && (
        <div className="flex justify-center space-x-4 mb-4">
          {/* Only show Members Management to admins */}
          {isAdmin && (
            <Button onClick={() => navigate(`/book-club/${clubId}/members`)}>
              Members Management
            </Button>
          )}
          {!isAdmin && (
            <Button
              variant="outline"
              onClick={() => setShowLeaveConfirm(true)}
              className="border-red-200 text-red-600 hover:bg-red-50"
            >
              Leave Club
            </Button>
          )}
          <Button
            onClick={handleLogout}
            variant="destructive"
            className="bg-bookconnect-brown hover:bg-bookconnect-brown/80 text-white"
          >
            <LogOut className="h-4 w-4 mr-2" /> Logout
          </Button>
        </div>
      )}
    </>
  );
};

export default ClubNavigation;
