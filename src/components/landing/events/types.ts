import { Event } from "@/lib/api/bookclubs/events";

export interface EventCardProps {
  event: Event;
  index: number;
  onViewDetails: (eventId: string) => void;
}

export interface EventCarouselProps {
  events: Event[];
  currentSlide: number;
  onPrevSlide: () => void;
  onNextSlide: () => void;
  onSlideChange: (index: number) => void;
  onViewDetails: (eventId: string) => void;
}

export interface EventsSectionProps {
  handleEventsClick: () => void;
}

export interface EventsHeaderProps {
  title: string;
  description: string;
}

export interface EventsEmptyStateProps {
  onViewAllClick: () => void;
}

export interface EventsErrorStateProps {
  onViewAllClick: () => void;
}

export interface EventsLoadingStateProps {}

export interface FormattedDateTime {
  date: string;
  time: string | null;
  timestamp: Date | null;
}
