import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';

interface RequestFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
  isSearchActive: boolean;
  resultsCount: number;
  totalCount: number;
}

export const RequestFilters: React.FC<RequestFiltersProps> = ({
  searchTerm,
  onSearchChange,
  onClearSearch,
  isSearchActive,
  resultsCount,
  totalCount
}) => {
  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-bookconnect-brown/50" />
        <Input
          placeholder="Search by book title, author, customer name, or email..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 pr-10"
        />
        {isSearchActive && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSearch}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-bookconnect-brown/10"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Search Results Info */}
      {isSearchActive && (
        <div className="text-sm text-bookconnect-brown/70">
          Showing {resultsCount} of {totalCount} requests
          {resultsCount === 0 && (
            <span className="text-bookconnect-brown/50 ml-2">
              - No requests match your search criteria
            </span>
          )}
        </div>
      )}
    </div>
  );
};
