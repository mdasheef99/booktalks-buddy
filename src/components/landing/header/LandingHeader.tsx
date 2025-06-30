import React, { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import LandingLogo from "./LandingLogo";
import LandingNavigation from "./LandingNavigation";
import MobileMenu from "./MobileMenu";
import { LandingHeaderProps } from "./types";

/**
 * Main header component for the BookTalks Buddy landing page
 * Positioned above CarouselSection as the first element
 */
const LandingHeader: React.FC<LandingHeaderProps> = ({
  onAnonymousChatClick,
  onBookClubsClick,
  onEventsClick,
  onOffersClick
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleMobileMenuClose = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <header className="bg-bookconnect-cream border-b border-bookconnect-brown/20 shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <LandingLogo />

            {/* Desktop Navigation */}
            <LandingNavigation
              onAnonymousChatClick={onAnonymousChatClick}
              onBookClubsClick={onBookClubsClick}
              onEventsClick={onEventsClick}
              onOffersClick={onOffersClick}
            />

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleMobileMenuToggle}
              className="md:hidden text-bookconnect-brown/80 hover:text-bookconnect-terracotta hover:bg-bookconnect-brown/5"
              aria-label="Open navigation menu"
              aria-expanded={isMobileMenuOpen}
            >
              <Menu className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={handleMobileMenuClose}
        onAnonymousChatClick={onAnonymousChatClick}
        onBookClubsClick={onBookClubsClick}
        onEventsClick={onEventsClick}
        onOffersClick={onOffersClick}
      />
    </>
  );
};

export default LandingHeader;
