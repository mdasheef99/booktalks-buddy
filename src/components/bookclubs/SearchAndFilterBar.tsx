import React, { memo } from 'react';
import { Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SearchAndFilterBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSearch: () => void;
  privacyFilter: 'all' | 'public' | 'private';
  onPrivacyFilterChange: (value: 'all' | 'public' | 'private') => void;
}

const SearchAndFilterBar: React.FC<SearchAndFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  onSearch,
  privacyFilter,
  onPrivacyFilterChange
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-8">
      <div className="flex-1 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search clubs..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label="Search book clubs"
          />
        </div>
        <Button onClick={onSearch}>Search</Button>
      </div>

      <div className="flex items-center gap-2">
        <Filter className="h-5 w-5 text-gray-500" />
        <Select
          value={privacyFilter}
          onValueChange={(value) => onPrivacyFilterChange(value as 'all' | 'public' | 'private')}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by privacy" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clubs</SelectItem>
            <SelectItem value="public">Public Clubs</SelectItem>
            <SelectItem value="private">Private Clubs</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
export default memo(SearchAndFilterBar);
