import React from 'react';
import { ThumbsUp, SortAsc, SortDesc, Grid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface NominationsControlsProps {
  status: 'active' | 'selected' | 'archived' | 'all';
  sortOrder: 'likes' | 'newest';
  viewMode: 'list' | 'grid';
  onStatusChange: (status: 'active' | 'selected' | 'archived' | 'all') => void;
  onSortOrderChange: (order: 'likes' | 'newest') => void;
  onViewModeChange: (mode: 'list' | 'grid') => void;
}

const NominationsControls: React.FC<NominationsControlsProps> = ({
  status,
  sortOrder,
  viewMode,
  onStatusChange,
  onSortOrderChange,
  onViewModeChange
}) => {
  return (
    <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
      <Tabs
        value={status}
        onValueChange={(value) => onStatusChange(value as 'active' | 'selected' | 'archived' | 'all')}
        className="flex-grow md:flex-grow-0"
      >
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="selected">Selected</TabsTrigger>
          <TabsTrigger value="archived">Archived</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex items-center gap-2">
        <div className="flex border rounded-md overflow-hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewModeChange('list')}
            className={`rounded-none ${viewMode === 'list' ? 'bg-gray-100' : ''}`}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewModeChange('grid')}
            className={`rounded-none ${viewMode === 'grid' ? 'bg-gray-100' : ''}`}
          >
            <Grid className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex border rounded-md overflow-hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSortOrderChange('likes')}
            className={`rounded-none ${sortOrder === 'likes' ? 'bg-gray-100' : ''}`}
          >
            <ThumbsUp className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSortOrderChange('newest')}
            className={`rounded-none ${sortOrder === 'newest' ? 'bg-gray-100' : ''}`}
          >
            {sortOrder === 'newest' ? (
              <SortDesc className="h-4 w-4" />
            ) : (
              <SortAsc className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NominationsControls;
