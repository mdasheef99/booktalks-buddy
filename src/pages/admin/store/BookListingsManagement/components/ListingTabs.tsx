/**
 * ListingTabs Component
 * 
 * Tab navigation for filtering book listings by status.
 */

import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, Check, X, BookOpen } from 'lucide-react';
import { getTabCounts } from '../utils/listingUtils';
import type { ListingTabsProps } from '../types';

export const ListingTabs: React.FC<ListingTabsProps> = ({
  activeTab,
  onTabChange,
  listings
}) => {
  const counts = getTabCounts(listings);

  return (
    <Tabs value={activeTab} onValueChange={onTabChange}>
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="pending" className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span>Pending</span> <span>({counts.pending})</span>
        </TabsTrigger>
        <TabsTrigger value="approved" className="flex items-center gap-2">
          <Check className="h-4 w-4" />
          <span>Approved</span> <span>({counts.approved})</span>
        </TabsTrigger>
        <TabsTrigger value="rejected" className="flex items-center gap-2">
          <X className="h-4 w-4" />
          <span>Rejected</span> <span>({counts.rejected})</span>
        </TabsTrigger>
        <TabsTrigger value="all" className="flex items-center gap-2">
          <BookOpen className="h-4 w-4" />
          <span>All</span> <span>({counts.all})</span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
};
