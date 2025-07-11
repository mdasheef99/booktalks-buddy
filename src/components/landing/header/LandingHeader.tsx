import React, { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import LandingLogo from "./LandingLogo";
import LandingNavigation from "./LandingNavigation";
import MobileMenu from "./MobileMenu";
import HamburgerDropdown from "./HamburgerDropdown";
import { LandingHeaderProps } from "./types";

/**
 * Main header component for the BookTalks Buddy landing page
 * Positioned above CarouselSection as the first element
 */
const LandingHeader: React.FC<LandingHeaderProps> = ({
  onAnonymousChatClick,
  onBookClubsClick,
  onEventsClick,
  onOffersClick,
  onListBookClick,
  onRequestBookClick
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isHamburgerDropdownOpen, setIsHamburgerDropdownOpen] = useState(false);

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleMobileMenuClose = () => {
    setIsMobileMenuOpen(false);
  };

  const handleHamburgerDropdownToggle = () => {
    setIsHamburgerDropdownOpen(!isHamburgerDropdownOpen);
  };

  const handleHamburgerDropdownClose = () => {
    setIsHamburgerDropdownOpen(false);
  };

  return (
    <>
      <header className="bg-bookconnect-cream border-b border-bookconnect-brown/20 shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <LandingLogo />

            {/* Desktop Navigation - Hidden, moved to hamburger dropdown */}
            <LandingNavigation
              onAnonymousChatClick={onAnonymousChatClick}
              onBookClubsClick={onBookClubsClick}
              onEventsClick={onEventsClick}
              onOffersClick={onOffersClick}
            />

            {/* Right side buttons container */}
            <div className="flex items-center gap-2">
              {/* Hamburger Dropdown Button - Always visible */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleHamburgerDropdownToggle}
                  className="text-bookconnect-brown/80 hover:text-bookconnect-terracotta hover:bg-bookconnect-brown/5 transition-colors duration-200"
                  aria-label="Open navigation dropdown"
                  aria-expanded={isHamburgerDropdownOpen}
                >
                  <Menu className="w-6 h-6" />
                </Button>

                {/* Hamburger Dropdown */}
                <HamburgerDropdown
                  isOpen={isHamburgerDropdownOpen}
                  onClose={handleHamburgerDropdownClose}
                  onAnonymousChatClick={onAnonymousChatClick}
                  onBookClubsClick={onBookClubsClick}
                  onEventsClick={onEventsClick}
                  onOffersClick={onOffersClick}
                  onListBookClick={onListBookClick}
                  onRequestBookClick={onRequestBookClick}
                />
              </div>

              {/* Mobile Menu Button - Only visible on mobile */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleMobileMenuToggle}
                className="md:hidden text-bookconnect-brown/80 hover:text-bookconnect-terracotta hover:bg-bookconnect-brown/5"
                aria-label="Open mobile navigation menu"
                aria-expanded={isMobileMenuOpen}
              >
                <Menu className="w-6 h-6" />
              </Button>
            </div>
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
        onListBookClick={onListBookClick}
        onRequestBookClick={onRequestBookClick}
      />
    </>
  );
};

export default LandingHeader;
