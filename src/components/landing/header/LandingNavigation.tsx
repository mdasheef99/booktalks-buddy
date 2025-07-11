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
    // Desktop navigation is now hidden - all navigation moved to hamburger dropdown
    <nav className="hidden" role="navigation" aria-label="Main navigation">
      {/* Navigation items moved to HamburgerDropdown component */}
    </nav>
  );
};

export default LandingNavigation;
