import React from 'react';
import { NavLink } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import NotificationBadge from './NotificationBadge';
import { useEventNotifications } from '@/hooks/useEventNotifications';

interface EventsNavItemProps {
  collapsed?: boolean;
}

/**
 * Navigation item for Events with notification badge
 */
const EventsNavItem: React.FC<EventsNavItemProps> = ({ collapsed = false }) => {
  const { unreadCount } = useEventNotifications();

  const linkContent = (isActive: boolean) => (
    <div className={`
      flex items-center p-2 rounded-lg relative
      ${isActive
        ? 'bg-bookconnect-brown/15 text-bookconnect-brown shadow-sm border border-bookconnect-brown/10'
        : 'text-gray-700 hover:bg-bookconnect-brown/5 hover:border hover:border-bookconnect-brown/5'}
      ${collapsed ? 'justify-center' : ''}
      transition-all duration-200
    `}>
      <div className={`${isActive ? 'text-bookconnect-brown' : 'text-bookconnect-brown/70'}`}>
        <Calendar className="h-5 w-5" />
      </div>
      {!collapsed && <span className={`ml-3 font-medium ${isActive ? 'text-bookconnect-brown' : 'text-gray-700'}`}>Events</span>}
      
      {/* Position the badge differently based on collapsed state */}
      <div className={`absolute ${collapsed ? 'top-0 right-0' : 'top-1 right-1'}`}>
        <NotificationBadge 
          count={unreadCount} 
          tooltipText={`${unreadCount} unread event${unreadCount === 1 ? '' : 's'}`}
        />
      </div>
    </div>
  );

  return collapsed ? (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <NavLink to="/events" className={({ isActive }) => linkContent(isActive)}>
            {({ isActive }) => linkContent(isActive)}
          </NavLink>
        </TooltipTrigger>
        <TooltipContent side="right">Events</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ) : (
    <NavLink to="/events" className={({ isActive }) => linkContent(isActive)}>
      {({ isActive }) => linkContent(isActive)}
    </NavLink>
  );
};

export default EventsNavItem;
