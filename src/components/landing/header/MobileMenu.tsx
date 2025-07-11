import React, { useEffect } from "react";
import { X, MessageCircle, Users, Calendar, Tag, BookOpen, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import NavigationItem from "./NavigationItem";
import { MobileMenuProps } from "./types";

/**
 * Mobile menu component with backdrop overlay
 * Provides full-screen navigation for mobile devices
 */
const MobileMenu: React.FC<MobileMenuProps> = ({
  isOpen,
  onClose,
  onAnonymousChatClick,
  onBookClubsClick,
  onEventsClick,
  onOffersClick,
  onListBookClick,
  onRequestBookClick
}) => {
  // Handle escape key to close menu
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleItemClick = (callback: () => void) => {
    callback();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Menu Panel */}
      <div className={cn(
        "fixed top-0 left-0 right-0 bg-bookconnect-cream border-b border-bookconnect-brown/20 shadow-lg",
        "transform transition-transform duration-300 ease-in-out",
        isOpen ? "translate-y-0" : "-translate-y-full"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-bookconnect-brown/10">
          <span className="font-serif text-xl font-bold text-bookconnect-brown">
            Navigation
          </span>
          <button
            onClick={onClose}
            className="p-2 rounded-md text-bookconnect-brown/80 hover:text-bookconnect-terracotta hover:bg-bookconnect-brown/5 transition-colors duration-200"
            aria-label="Close navigation menu"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-2" role="navigation" aria-label="Mobile navigation">
          <NavigationItem
            label="Anonymous Chat"
            onClick={() => handleItemClick(onAnonymousChatClick)}
            icon={<MessageCircle className="w-5 h-5" />}
            className="w-full justify-start text-lg py-4 hover:bg-bookconnect-brown/5"
          />
          <NavigationItem
            label="Book Clubs"
            onClick={() => handleItemClick(onBookClubsClick)}
            icon={<Users className="w-5 h-5" />}
            className="w-full justify-start text-lg py-4 hover:bg-bookconnect-brown/5"
          />
          <NavigationItem
            label="Events"
            onClick={() => handleItemClick(onEventsClick)}
            icon={<Calendar className="w-5 h-5" />}
            className="w-full justify-start text-lg py-4 hover:bg-bookconnect-brown/5"
          />
          <NavigationItem
            label="Offers"
            onClick={() => handleItemClick(onOffersClick)}
            icon={<Tag className="w-5 h-5" />}
            className="w-full justify-start text-lg py-4 hover:bg-bookconnect-brown/5"
          />

          {/* Divider */}
          <div className="border-t border-bookconnect-brown/10 my-4"></div>

          {/* Book-related actions */}
          <NavigationItem
            label="List a Book"
            onClick={() => handleItemClick(onListBookClick)}
            icon={<BookOpen className="w-5 h-5" />}
            className="w-full justify-start text-lg py-4 hover:bg-bookconnect-brown/5"
          />
          <NavigationItem
            label="Request a Book"
            onClick={() => handleItemClick(onRequestBookClick)}
            icon={<Search className="w-5 h-5" />}
            className="w-full justify-start text-lg py-4 hover:bg-bookconnect-brown/5"
          />
        </nav>
      </div>
    </div>
  );
};

export default MobileMenu;
