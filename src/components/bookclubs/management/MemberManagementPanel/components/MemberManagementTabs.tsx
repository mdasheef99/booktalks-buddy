/**
 * MemberManagementTabs Component
 * Tab navigation with counts for member management
 */

import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import type { MemberManagementTabsProps } from '../types/memberManagement';

export function MemberManagementTabs({
  activeTab,
  onTabChange,
  memberCount,
  requestCount,
  loading = false
}: MemberManagementTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="members" className="flex items-center space-x-2">
          <span>Members</span>
          {!loading && (
            <Badge variant="secondary" className="ml-1">
              {memberCount}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="requests" className="flex items-center space-x-2">
          <span>Join Requests</span>
          {!loading && requestCount > 0 && (
            <Badge variant="destructive" className="ml-1">
              {requestCount}
            </Badge>
          )}
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

export default MemberManagementTabs;
