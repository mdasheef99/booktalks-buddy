
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen } from "lucide-react";
import { ProfileDialog } from "./profile";

const BookConnectHeader = () => {
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);

  return (
    <div className="bg-bookconnect-cream border-b border-bookconnect-brown/20 shadow-sm">
      <div className="container mx-auto py-3 px-4 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2">
          <span className="font-serif text-2xl font-bold text-bookconnect-brown">BookConnect</span>
        </Link>

        <button 
          onClick={() => setIsProfileDialogOpen(true)}
          className="p-2 rounded-full hover:bg-bookconnect-brown/10 transition-colors"
          aria-label="Open profile"
        >
          <BookOpen className="h-6 w-6 text-bookconnect-brown" />
        </button>

        <ProfileDialog 
          open={isProfileDialogOpen} 
          onClose={() => setIsProfileDialogOpen(false)} 
        />
      </div>
    </div>
  );
};

export default BookConnectHeader;
