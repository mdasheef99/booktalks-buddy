import React from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Filter } from 'lucide-react';

interface Club {
  id: string;
  name: string;
}

interface JoinRequestFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filterClub: string;
  onFilterClubChange: (clubId: string) => void;
  availableClubs: Club[];
}

const JoinRequestFilters: React.FC<JoinRequestFiltersProps> = ({
  searchQuery,
  onSearchChange,
  filterClub,
  onFilterClubChange,
  availableClubs
}) => {
  return (
    <div className="flex flex-col md:flex-row gap-4">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Search by username or club..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* Club Filter */}
      <div className="w-full md:w-64">
        <Select
          value={filterClub}
          onValueChange={onFilterClubChange}
        >
          <SelectTrigger>
            <div className="flex items-center">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by club" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clubs</SelectItem>
            {availableClubs.map(club => (
              <SelectItem key={club.id} value={club.id}>
                {club.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default JoinRequestFilters;
