import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ParticipantListTabsProps } from '../types';
import ParticipantListWithPagination from './ParticipantListWithPagination';

/**
 * Tabs component for the participant list
 */
const ParticipantListTabs: React.FC<ParticipantListTabsProps> = ({
  activeTab,
  setActiveTab,
  counts,
  filteredParticipants,
  currentPage,
  setCurrentPage,
  itemsPerPage,
  loading
}) => {
  return (
    <>
      {loading.counts ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>
      ) : (
        <Tabs
          defaultValue="all"
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as any)}
        >
          <TabsList className="mb-4">
            <TabsTrigger value="all">
              All
              <Badge className="ml-2 bg-gray-100 text-gray-800">{counts.total}</Badge>
            </TabsTrigger>
            <TabsTrigger value="going">
              Going
              <Badge className="ml-2 bg-green-100 text-green-800">{counts.going}</Badge>
            </TabsTrigger>
            <TabsTrigger value="maybe">
              Maybe
              <Badge className="ml-2 bg-yellow-100 text-yellow-800">{counts.maybe}</Badge>
            </TabsTrigger>
            <TabsTrigger value="not_going">
              Not Going
              <Badge className="ml-2 bg-red-100 text-red-800">{counts.not_going}</Badge>
            </TabsTrigger>
          </TabsList>

          {/* We use the same component for all tabs, as filtering is already done in the parent */}
          {['all', 'going', 'maybe', 'not_going'].map((tab) => (
            <TabsContent key={tab} value={tab} className="mt-0">
              <ParticipantListWithPagination
                participants={filteredParticipants}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                itemsPerPage={itemsPerPage}
                loading={loading.participants}
              />
            </TabsContent>
          ))}
        </Tabs>
      )}
    </>
  );
};

export default ParticipantListTabs;
