
import React, { useState, memo, useCallback } from "react";
import { ArrowLeft, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface BookDiscussionHeaderProps {
  title: string;
  author: string;
  onBack: () => void;
  onlineUsers?: string[];
}

const BookDiscussionHeader: React.FC<BookDiscussionHeaderProps> = ({
  title,
  author,
  onBack,
  onlineUsers = []
}) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const navigate = useNavigate();

  const uniqueUsers = [...new Set(onlineUsers)];
  const onlineCount = uniqueUsers.length;

  return (
    <header className="sticky top-0 z-10 bg-bookconnect-brown shadow-md py-1.5 px-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="mr-1 text-white hover:bg-bookconnect-brown/20 h-7 w-7 p-0 focus-visible"
            aria-label="Go back to explore books"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <h1 className="font-serif text-base md:text-lg text-bookconnect-cream line-clamp-1">
            <span className="font-bold">{title}</span>
            {author && <span className="italic font-normal text-xs"> by {author}</span>}
          </h1>
        </div>

        <div className="flex items-center">
          <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-bookconnect-cream hover:bg-bookconnect-brown/20 flex items-center h-7"
              >
                <span className="relative mr-1">
                  <span className="absolute top-0 left-0 w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  <Users className="h-3.5 w-3.5" />
                </span>
                <span className="hidden sm:inline-block ml-1 text-xs">
                  {onlineCount > 0 ? `${onlineCount} Online` : "Online"}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2" align="end">
              <div className="space-y-1">
                <h4 className="text-sm font-medium mb-2 font-serif text-bookconnect-brown">Online Users</h4>
                {uniqueUsers.length > 0 ? (
                  <div className="max-h-48 overflow-y-auto">
                    {uniqueUsers.map((username, idx) => (
                      <div
                        key={`user-${idx}`}
                        className="flex items-center gap-2 py-1.5 px-2"
                      >
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        <span className="text-sm font-serif text-bookconnect-brown">{username}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic font-serif">No users currently online</p>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </header>
  );
};

export default memo(BookDiscussionHeader);
