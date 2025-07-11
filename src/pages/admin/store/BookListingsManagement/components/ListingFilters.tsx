/**
 * ListingFilters Component
 * 
 * Search and filter controls for book listings.
 */

import React from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import type { ListingFiltersProps } from '../types';

export const ListingFilters: React.FC<ListingFiltersProps> = ({
  searchTerm,
  onSearchChange
}) => {
  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Search by book title"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 w-64"
        />
      </div>
    </div>
  );
};
