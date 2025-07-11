/**
 * Store Requests Section Component
 * 
 * Store request interface and history for Books Section
 */

import React from 'react';
import { TabsContent } from '@/components/ui/tabs';
import { UserStoreRequests } from '@/components/books/store-requests';

interface StoreRequestsSectionProps {
  className?: string;
}

export const StoreRequestsSection: React.FC<StoreRequestsSectionProps> = ({
  className
}) => {
  return (
    <TabsContent value="store-requests" className="space-y-6">
      <UserStoreRequests className={className} />
    </TabsContent>
  );
};
