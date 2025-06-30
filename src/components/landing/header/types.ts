/**
 * TypeScript interfaces for Landing Page Header components
 */

export interface LandingHeaderProps {
  onAnonymousChatClick: () => void;
  onBookClubsClick: () => void;
  onEventsClick: () => void;
  onOffersClick: () => void;
}

export interface NavigationItemProps {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  isActive?: boolean;
  className?: string;
}

export interface LandingNavigationProps {
  onAnonymousChatClick: () => void;
  onBookClubsClick: () => void;
  onEventsClick: () => void;
  onOffersClick: () => void;
}

export interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onAnonymousChatClick: () => void;
  onBookClubsClick: () => void;
  onEventsClick: () => void;
  onOffersClick: () => void;
}
