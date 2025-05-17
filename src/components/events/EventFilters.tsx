import React from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Tabs, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { EventFilter, EventSort } from '@/hooks/useEvents';
import { useAuth } from '@/contexts/AuthContext';

interface EventFiltersProps {
  filter: EventFilter;
  setFilter: (filter: EventFilter) => void;
  sort: EventSort;
  setSort: (sort: EventSort) => void;
  className?: string;
}

/**
 * Component for filtering and sorting events
 */
const EventFilters: React.FC<EventFiltersProps> = ({
  filter,
  setFilter,
  sort,
  setSort,
  className = ''
}) => {
  const { user } = useAuth();

  return (
    <div className={`flex flex-col sm:flex-row justify-between gap-4 ${className}`}>
      <Tabs 
        value={filter} 
        onValueChange={(value) => setFilter(value as EventFilter)}
        className="w-full sm:w-auto"
      >
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
          <TabsTrigger value="featured">Featured</TabsTrigger>
          {user && <TabsTrigger value="my-clubs">My Clubs</TabsTrigger>}
        </TabsList>
      </Tabs>
      
      <div className="w-full sm:w-48">
        <Select value={sort} onValueChange={(value) => setSort(value as EventSort)}>
          <SelectTrigger>
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="upcoming">Upcoming First</SelectItem>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="club">By Club</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default EventFilters;
