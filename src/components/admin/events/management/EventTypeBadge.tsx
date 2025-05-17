import React from 'react';
import { Badge } from '@/components/ui/badge';
import { EventTypeBadgeProps } from './types';

/**
 * Component for displaying an event type badge with appropriate styling
 */
const EventTypeBadge: React.FC<EventTypeBadgeProps> = ({ eventType }) => {
  if (!eventType) return null;

  const typeColors: Record<string, string> = {
    discussion: 'bg-blue-100 text-blue-800',
    author_meet: 'bg-purple-100 text-purple-800',
    book_signing: 'bg-green-100 text-green-800',
    festival: 'bg-yellow-100 text-yellow-800',
    reading_marathon: 'bg-red-100 text-red-800',
    book_swap: 'bg-indigo-100 text-indigo-800',
  };

  const typeLabels: Record<string, string> = {
    discussion: 'Discussion',
    author_meet: 'Author Meet',
    book_signing: 'Book Signing',
    festival: 'Festival',
    reading_marathon: 'Reading Marathon',
    book_swap: 'Book Swap',
  };

  const color = typeColors[eventType] || 'bg-gray-100 text-gray-800';
  const label = typeLabels[eventType] || eventType;

  return (
    <Badge className={color}>
      {label}
    </Badge>
  );
};

export default EventTypeBadge;
