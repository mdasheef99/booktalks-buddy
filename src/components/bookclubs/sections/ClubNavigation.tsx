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
      {isMember && (
        <div className="flex flex-wrap justify-center gap-3 mb-6 bg-white/80 p-4 rounded-xl shadow-sm border border-bookconnect-brown/10">
          {/* Only show Members Management to admins */}
          {isAdmin && (
            <Button
              onClick={() => navigate(`/book-club/${clubId}/members`)}
              className="bg-bookconnect-terracotta hover:bg-bookconnect-terracotta/90 transition-all duration-200 shadow-sm hover:shadow"
            >
              Members Management
            </Button>
          )}
          {!isAdmin && (
            <Button
              variant="outline"
              onClick={() => setShowLeaveConfirm(true)}
              className="border-red-200 text-red-600 hover:bg-red-50 transition-all duration-200 shadow-sm hover:shadow"
            >
              Leave Club
            </Button>
          )}
          <Button
            onClick={handleLogout}
            variant="outline"
            className="border-bookconnect-brown/20 text-bookconnect-brown hover:bg-bookconnect-brown/5 transition-all duration-200 shadow-sm hover:shadow"
          >
            <LogOut className="h-4 w-4 mr-2" /> Logout
          </Button>
        </div>
      )}
    </>
  );
};

export default ClubNavigation;
