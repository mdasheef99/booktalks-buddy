import React from "react";
import { MessageCircle, Users, Calendar, Tag } from "lucide-react";
import NavigationItem from "./NavigationItem";
import { LandingNavigationProps } from "./types";

/**
 * Desktop navigation component for the landing page header
 * Contains the main navigation items with icons
 */
const LandingNavigation: React.FC<LandingNavigationProps> = ({
  onAnonymousChatClick,
  onBookClubsClick,
  onEventsClick,
  onOffersClick
}) => {
  return (
    <nav className="hidden md:flex items-center space-x-8" role="navigation" aria-label="Main navigation">
      <NavigationItem
        label="Anonymous Chat"
        onClick={onAnonymousChatClick}
        icon={<MessageCircle className="w-5 h-5" />}
      />
      <NavigationItem
        label="Book Clubs"
        onClick={onBookClubsClick}
        icon={<Users className="w-5 h-5" />}
      />
      <NavigationItem
        label="Events"
        onClick={onEventsClick}
        icon={<Calendar className="w-5 h-5" />}
      />
      <NavigationItem
        label="Offers"
        onClick={onOffersClick}
        icon={<Tag className="w-5 h-5" />}
      />
    </nav>
  );
};

export default LandingNavigation;
