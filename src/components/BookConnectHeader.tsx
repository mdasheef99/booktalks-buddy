import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { UserRound } from "lucide-react";

interface BookConnectHeaderProps {
  externalProfileDialog?: {
    isOpen: boolean;
    setOpen: (isOpen: boolean) => void;
  };
}

const BookConnectHeader: React.FC<BookConnectHeaderProps> = ({ externalProfileDialog }) => {
  return (
    <div className="bg-bookconnect-cream border-b border-bookconnect-brown/20 shadow-sm">
      <div className="container mx-auto py-3 px-4 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2">
          <span className="font-serif text-2xl font-bold text-bookconnect-brown">BookConnect</span>
        </Link>

        {/* Anonymous profile button for explore books page */}
        {externalProfileDialog && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => externalProfileDialog.setOpen(true)}
            className="border-bookconnect-brown/30 text-bookconnect-brown hover:bg-bookconnect-brown/10"
          >
            <UserRound className="h-4 w-4 mr-2" />
            Profile
          </Button>
        )}
      </div>
    </div>
  );
};

export default BookConnectHeader;
