import { Event } from "@/lib/api/bookclubs/events";

export interface EventManagementListProps {
  events: Event[];
  onRefresh: () => void;
}

export interface EventCardProps {
  event: Event;
  onViewEvent: (eventId: string) => void;
  onEditEvent: (eventId: string) => void;
  onDeleteEvent: (eventId: string) => Promise<void>;
  onToggleFeatured: (eventId: string, featured: boolean) => Promise<void>;
}

export interface EventCardHeaderProps {
  event: Event;
  onViewEvent: (eventId: string) => void;
  onEditEvent: (eventId: string) => void;
  onDeleteEvent: (eventId: string) => Promise<void>;
}

export interface EventCardContentProps {
  event: Event;
}

export interface EventCardFooterProps {
  eventId: string;
  isFeatured: boolean;
  onViewEvent: (eventId: string) => void;
  onToggleFeatured: (eventId: string, featured: boolean) => Promise<void>;
}

export interface EventCardMenuProps {
  eventId: string;
  title: string;
  onViewEvent: (eventId: string) => void;
  onEditEvent: (eventId: string) => void;
  onDeleteEvent: (eventId: string) => Promise<void>;
}

export interface EventTypeBadgeProps {
  eventType: string | null;
}

export interface EmptyStateProps {
  onCreateEvent: () => void;
}

export interface DeleteEventDialogProps {
  isOpen: boolean;
  eventId: string;
  eventTitle: string;
  onClose: () => void;
  onConfirm: (eventId: string) => Promise<void>;
  isLoading?: boolean;
  event?: Event | null;
}
