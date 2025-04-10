
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { UserRound } from "lucide-react";
import { ProfileDialog } from "./profile";

interface BookConnectHeaderProps {
  externalProfileDialog?: {
    isOpen: boolean;
    setOpen: (isOpen: boolean) => void;
  };
}

const BookConnectHeader: React.FC<BookConnectHeaderProps> = ({ externalProfileDialog }) => {
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);

  // Use external profile dialog state if provided
  const profileOpen = externalProfileDialog ? externalProfileDialog.isOpen : isProfileDialogOpen;
  const setProfileOpen = externalProfileDialog ? externalProfileDialog.setOpen : setIsProfileDialogOpen;

  return (
    <div className="bg-bookconnect-cream border-b border-bookconnect-brown/20 shadow-sm">
      <div className="container mx-auto py-3 px-4 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2">
          <span className="font-serif text-2xl font-bold text-bookconnect-brown">BookConnect</span>
        </Link>

        {/* Profile icon and dialog removed for authenticated Book Club */}
      </div>
    </div>
  );
};

export default BookConnectHeader;
