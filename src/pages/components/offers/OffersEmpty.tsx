import React from 'react';
import { Tag, Calendar, Clock } from 'lucide-react';

interface OffersEmptyProps {
  filterBy: 'all' | 'active' | 'upcoming';
}

/**
 * Empty state component for the Offers page
 * Displays when no offers match the current filter
 */
export const OffersEmpty: React.FC<OffersEmptyProps> = ({ filterBy }) => {
  const getEmptyMessage = () => {
    switch (filterBy) {
      case 'active':
        return {
          icon: <Tag className="w-12 h-12 text-bookconnect-brown/40" />,
          title: 'No active offers',
          description: 'There are currently no active promotional offers available. Check back later for new deals!'
        };
      case 'upcoming':
        return {
          icon: <Clock className="w-12 h-12 text-bookconnect-brown/40" />,
          title: 'No upcoming offers',
          description: 'There are no scheduled promotional offers at the moment. Stay tuned for exciting deals coming soon!'
        };
      default:
        return {
          icon: <Calendar className="w-12 h-12 text-bookconnect-brown/40" />,
          title: 'No offers available',
          description: 'There are currently no promotional offers available. Check back later for special deals and discounts!'
        };
    }
  };

  const { icon, title, description } = getEmptyMessage();

  return (
    <div className="text-center py-16">
      <div className="mx-auto mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-bookconnect-brown mb-2">
        {title}
      </h3>
      <p className="text-bookconnect-brown/70 max-w-md mx-auto">
        {description}
      </p>
    </div>
  );
};
