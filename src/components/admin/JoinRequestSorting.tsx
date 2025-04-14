import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, SortAsc, SortDesc } from 'lucide-react';

type SortField = 'date' | 'username' | 'club_name';
type SortOrder = 'asc' | 'desc';

interface JoinRequestSortingProps {
  sortField: SortField;
  onSortFieldChange: (field: SortField) => void;
  sortOrder: SortOrder;
  onSortOrderToggle: () => void;
}

const JoinRequestSorting: React.FC<JoinRequestSortingProps> = ({
  sortField,
  onSortFieldChange,
  sortOrder,
  onSortOrderToggle
}) => {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-500">Sort by:</span>
      <div className="flex gap-1">
        <Button
          variant={sortField === 'date' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onSortFieldChange('date')}
          className="text-xs"
        >
          <Calendar className="h-3 w-3 mr-1" />
          Date
        </Button>
        <Button
          variant={sortField === 'username' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onSortFieldChange('username')}
          className="text-xs"
        >
          User
        </Button>
        <Button
          variant={sortField === 'club_name' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onSortFieldChange('club_name')}
          className="text-xs"
        >
          Club
        </Button>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onSortOrderToggle}
        className="ml-2"
      >
        {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
      </Button>
    </div>
  );
};

export default JoinRequestSorting;
