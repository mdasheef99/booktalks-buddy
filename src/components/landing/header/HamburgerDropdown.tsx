import React, { useEffect, useRef } from "react";
import { MessageCircle, Users, Calendar, Tag, BookOpen, Search } from "lucide-react";
import NavigationItem from "./NavigationItem";
import { HamburgerDropdownProps } from "./types";
import { cn } from "@/lib/utils";

/**
 * Hamburger dropdown menu component for the landing page header
 * Displays all navigation items in a dropdown when the hamburger button is clicked
 */
const HamburgerDropdown: React.FC<HamburgerDropdownProps> = ({
  isOpen,
  onClose,
  onAnonymousChatClick,
  onBookClubsClick,
  onEventsClick,
  onOffersClick,
  onListBookClick,
  onRequestBookClick
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle clicking outside the dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Handle escape key to close dropdown
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscapeKey);
    }

    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isOpen, onClose]);

  // Handle navigation item clicks - close dropdown after action
  const handleNavigationClick = (action: () => void) => {
    action();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className={cn(
        "absolute top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-bookconnect-brown/20",
        "z-50 py-2 animate-in fade-in-0 zoom-in-95 duration-200",
        "backdrop-blur-sm bg-bookconnect-cream/95"
      )}
      role="menu"
      aria-label="Navigation menu"
    >
      {/* Dropdown arrow */}
      <div className="absolute -top-2 right-4 w-4 h-4 bg-bookconnect-cream/95 border-l border-t border-bookconnect-brown/20 rotate-45"></div>
      
      {/* Navigation Items */}
      <div className="space-y-1 px-2">
        <NavigationItem
          label="Anonymous Chat"
          onClick={() => handleNavigationClick(onAnonymousChatClick)}
          icon={<MessageCircle className="w-5 h-5" />}
          className="w-full justify-start hover:bg-bookconnect-brown/5 rounded-md"
        />
        <NavigationItem
          label="Book Clubs"
          onClick={() => handleNavigationClick(onBookClubsClick)}
          icon={<Users className="w-5 h-5" />}
          className="w-full justify-start hover:bg-bookconnect-brown/5 rounded-md"
        />
        <NavigationItem
          label="Events"
          onClick={() => handleNavigationClick(onEventsClick)}
          icon={<Calendar className="w-5 h-5" />}
          className="w-full justify-start hover:bg-bookconnect-brown/5 rounded-md"
        />
        <NavigationItem
          label="Offers"
          onClick={() => handleNavigationClick(onOffersClick)}
          icon={<Tag className="w-5 h-5" />}
          className="w-full justify-start hover:bg-bookconnect-brown/5 rounded-md"
        />

        {/* Divider */}
        <div className="border-t border-bookconnect-brown/10 my-2"></div>

        {/* Book-related actions */}
        <NavigationItem
          label="List a Book"
          onClick={() => handleNavigationClick(onListBookClick)}
          icon={<BookOpen className="w-5 h-5" />}
          className="w-full justify-start hover:bg-bookconnect-brown/5 rounded-md"
        />
        <NavigationItem
          label="Request a Book"
          onClick={() => handleNavigationClick(onRequestBookClick)}
          icon={<Search className="w-5 h-5" />}
          className="w-full justify-start hover:bg-bookconnect-brown/5 rounded-md"
        />
      </div>
    </div>
  );
};

export default HamburgerDropdown;
