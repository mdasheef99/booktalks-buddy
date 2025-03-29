
import React from "react";
import { ArrowLeft, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BookDiscussionHeaderProps {
  title: string;
  author: string;
  onBack: () => void;
}

const BookDiscussionHeader: React.FC<BookDiscussionHeaderProps> = ({ 
  title, 
  author, 
  onBack 
}) => {
  return (
    <header className="sticky top-0 z-10 bg-bookconnect-brown shadow-md py-2 px-4">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack} 
            className="mr-1 text-white hover:bg-bookconnect-brown/20 h-8 w-8 p-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          
          <h1 className="font-serif text-lg md:text-xl text-bookconnect-cream">
            <span className="font-bold">{title}</span>
            {author && <span className="italic font-normal text-sm"> by {author}</span>}
          </h1>
        </div>
        
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-bookconnect-cream hover:bg-bookconnect-brown/20 flex items-center h-8"
          >
            <span className="relative mr-1">
              <span className="absolute top-0 left-0 w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <Users className="h-4 w-4" />
            </span>
            <span className="hidden sm:inline-block ml-1 text-xs">Online</span>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default BookDiscussionHeader;
