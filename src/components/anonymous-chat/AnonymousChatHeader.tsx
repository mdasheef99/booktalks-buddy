import React, { useState } from "react";
import { Link } from "react-router-dom";
import { UserRound } from "lucide-react";
import { Button } from "../ui/button";
import { SimpleProfileDialog } from "./SimpleProfileDialog";

interface AnonymousChatHeaderProps {
  externalProfileDialog?: {
    isOpen: boolean;
    setOpen: (isOpen: boolean) => void;
  };
}

const AnonymousChatHeader: React.FC<AnonymousChatHeaderProps> = ({ externalProfileDialog }) => {
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);

  // Use external profile dialog state if provided
  const profileOpen = externalProfileDialog ? externalProfileDialog.isOpen : isProfileDialogOpen;
  const setProfileOpen = externalProfileDialog ? externalProfileDialog.setOpen : setIsProfileDialogOpen;

  return (
    <div className="bg-bookconnect-sage border-b border-bookconnect-brown/20 shadow-sm">
      <div className="container mx-auto py-3 px-4 flex justify-between items-center">
        <Link to="/chat-selection" className="flex items-center gap-2">
          <span className="font-serif text-2xl font-bold text-white">Anonymous Chat</span>
        </Link>

        {/* Profile icon button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setProfileOpen(true)}
          className="rounded-full hover:bg-bookconnect-sage/80 text-white"
          aria-label="Open profile"
        >
          <UserRound className="h-5 w-5" />
        </Button>

        {/* Simple profile dialog for anonymous chat - controlled by external state if provided */}
        {!externalProfileDialog && (
          <SimpleProfileDialog open={profileOpen} onClose={() => setProfileOpen(false)} />
        )}
      </div>
    </div>
  );
};

export default AnonymousChatHeader;
