import React from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ParticipantListFiltersProps } from '../types';

/**
 * Filters component for the participant list
 */
const ParticipantListFilters: React.FC<ParticipantListFiltersProps> = ({
  searchQuery,
  setSearchQuery,
  itemsPerPage,
  setItemsPerPage,
  isFullyLoading,
  participants,
  filteredParticipants,
  debouncedSearchQuery
}) => {
  return (
    <div className="mt-4 flex flex-col sm:flex-row gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search participants by name or email"
          className="pl-8"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          disabled={isFullyLoading || participants.length === 0}
        />
        {debouncedSearchQuery && (
          <div className="absolute right-2 top-2 text-xs text-muted-foreground">
            {filteredParticipants.length} results
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground whitespace-nowrap">Show:</span>
        <Select
          value={itemsPerPage.toString()}
          onValueChange={(value) => setItemsPerPage(parseInt(value))}
          disabled={isFullyLoading || participants.length === 0}
        >
          <SelectTrigger className="w-[100px] h-10">
            <SelectValue placeholder="10 items" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="5">5 items</SelectItem>
            <SelectItem value="10">10 items</SelectItem>
            <SelectItem value="20">20 items</SelectItem>
            <SelectItem value="50">50 items</SelectItem>
            <SelectItem value="100">100 items</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default ParticipantListFilters;
