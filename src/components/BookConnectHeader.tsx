import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { UserRound } from "lucide-react";
import { ProfileDialog } from "./profile";
import { Button } from "./ui/button";

interface BookConnectHeaderProps {
  externalProfileDialog?: {
    isOpen: boolean;
    setOpen: (isOpen: boolean) => void;
  };
}

const BookConnectHeader: React.FC<BookConnectHeaderProps> = ({ externalProfileDialog }) => {
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const location = useLocation();

  // Check if current page is events-related
  const isEventsPage = location.pathname.startsWith('/events');

  // Use external profile dialog state if provided
  const profileOpen = externalProfileDialog ? externalProfileDialog.isOpen : isProfileDialogOpen;
  const setProfileOpen = externalProfileDialog ? externalProfileDialog.setOpen : setIsProfileDialogOpen;

  return (
    <div className="bg-bookconnect-cream border-b border-bookconnect-brown/20 shadow-sm">
      <div className="container mx-auto py-3 px-4 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2">
          <span className="font-serif text-2xl font-bold text-bookconnect-brown">BookConnect</span>
        </Link>

        {/* Profile icon button - hidden on events pages */}
        {!isEventsPage && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setProfileOpen(true)}
            className="rounded-full hover:bg-bookconnect-terracotta/10 text-bookconnect-brown"
            aria-label="Open profile"
          >
            <UserRound className="h-5 w-5" />
          </Button>
        )}

        {/* Profile dialog - controlled by external state if provided */}
        {!externalProfileDialog && !isEventsPage && (
          <ProfileDialog open={profileOpen} onClose={() => setProfileOpen(false)} />
        )}
      </div>
    </div>
  );
};

export default BookConnectHeader;
