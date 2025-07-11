/**
 * Profile Reading List Search Component
 * 
 * Provides search and filter functionality for viewing other users' public reading lists
 * Optimized for profile viewing context with appropriate messaging and features
 */

import React, { useState, useMemo } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ReadingListItem } from '@/services/books';

interface ProfileReadingListSearchProps {
  readingList: ReadingListItem[];
  username: string; // For display context
  isCurrentUser: boolean; // To adjust messaging
  onFilteredItemsChange: (filteredItems: ReadingListItem[]) => void;
  className?: string;
}

type ReadingStatus = 'all' | 'want_to_read' | 'currently_reading' | 'completed';

export const ProfileReadingListSearch: React.FC<ProfileReadingListSearchProps> = ({
  readingList,
  username,
  isCurrentUser,
  onFilteredItemsChange,
  className = ''
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReadingStatus>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Filter reading list items based on search term and status
  const filteredItems = useMemo(() => {
    let filtered = readingList;

    // Apply text search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(item => {
        const book = item.personal_books;
        if (!book) return false;
        
        return (
          book.title.toLowerCase().includes(searchLower) ||
          book.author.toLowerCase().includes(searchLower) ||
          (book.description && book.description.toLowerCase().includes(searchLower)) ||
          (item.review_text && item.review_text.toLowerCase().includes(searchLower))
        );
      });
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    return filtered;
  }, [readingList, searchTerm, statusFilter]);

  // Update parent component when filtered items change
  React.useEffect(() => {
    onFilteredItemsChange(filteredItems);
  }, [filteredItems, onFilteredItemsChange]);

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
  };

  // Check if any filters are active
  const hasActiveFilters = searchTerm.trim() !== '' || statusFilter !== 'all';

  // Get status counts for display
  const statusCounts = useMemo(() => {
    const counts = {
      all: readingList.length,
      want_to_read: 0,
      currently_reading: 0,
      completed: 0
    };

    readingList.forEach(item => {
      counts[item.status]++;
    });

    return counts;
  }, [readingList]);

  // Don't render search if no books to search
  if (readingList.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-bookconnect-brown/50" />
        <Input
          type="text"
          placeholder={`Search ${isCurrentUser ? 'your' : `${username}'s`} reading list...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 border-bookconnect-brown/20 focus:border-bookconnect-brown focus:ring-bookconnect-brown/20"
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSearchTerm('')}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-bookconnect-brown/10"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Filter Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="border-bookconnect-brown/20 text-bookconnect-brown hover:bg-bookconnect-brown/5"
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-2 bg-bookconnect-terracotta text-white">
              {statusFilter !== 'all' ? 1 : 0}
            </Badge>
          )}
        </Button>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-bookconnect-brown/70 hover:text-bookconnect-brown hover:bg-bookconnect-brown/5"
          >
            <X className="h-4 w-4 mr-1" />
            Clear filters
          </Button>
        )}

        {/* Results count */}
        <span className="text-sm text-bookconnect-brown/70">
          {filteredItems.length} of {readingList.length} books
        </span>
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <div className="bg-bookconnect-cream/30 p-4 rounded-lg border border-bookconnect-brown/10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Reading Status Filter */}
            <div>
              <label className="text-sm font-medium text-bookconnect-brown mb-2 block">
                Reading Status
              </label>
              <Select value={statusFilter} onValueChange={(value: ReadingStatus) => setStatusFilter(value)}>
                <SelectTrigger className="border-bookconnect-brown/20">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Books ({statusCounts.all})</SelectItem>
                  <SelectItem value="want_to_read">Want to Read ({statusCounts.want_to_read})</SelectItem>
                  <SelectItem value="currently_reading">Currently Reading ({statusCounts.currently_reading})</SelectItem>
                  <SelectItem value="completed">Completed ({statusCounts.completed})</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-bookconnect-brown/70">Active filters:</span>
          
          {searchTerm && (
            <Badge variant="outline" className="border-bookconnect-brown/30 text-bookconnect-brown">
              Search: "{searchTerm}"
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchTerm('')}
                className="ml-1 h-4 w-4 p-0 hover:bg-bookconnect-brown/10"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          
          {statusFilter !== 'all' && (
            <Badge variant="outline" className="border-bookconnect-brown/30 text-bookconnect-brown">
              Status: {statusFilter.replace('_', ' ')}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStatusFilter('all')}
                className="ml-1 h-4 w-4 p-0 hover:bg-bookconnect-brown/10"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};
