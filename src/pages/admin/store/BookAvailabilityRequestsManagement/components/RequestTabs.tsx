import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Users, Globe, List } from 'lucide-react';

interface RequestCounts {
  all: number;
  club_members: number;
  anonymous: number;
}

interface RequestTabsProps {
  activeTab: 'all' | 'club_members' | 'anonymous';
  onTabChange: (tab: 'all' | 'club_members' | 'anonymous') => void;
  counts: RequestCounts;
}

export const RequestTabs: React.FC<RequestTabsProps> = ({
  activeTab,
  onTabChange,
  counts
}) => {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-3 bg-bookconnect-cream/30">
        <TabsTrigger 
          value="all" 
          className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-bookconnect-brown"
        >
          <List className="h-4 w-4" />
          <span>All Requests</span>
          <Badge 
            variant="secondary" 
            className="ml-1 bg-bookconnect-brown/10 text-bookconnect-brown"
          >
            {counts.all}
          </Badge>
        </TabsTrigger>
        
        <TabsTrigger 
          value="club_members" 
          className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-bookconnect-brown"
        >
          <Users className="h-4 w-4" />
          <span>Club Members</span>
          <Badge 
            variant="secondary" 
            className="ml-1 bg-blue-100 text-blue-700"
          >
            {counts.club_members}
          </Badge>
        </TabsTrigger>
        
        <TabsTrigger 
          value="anonymous" 
          className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-bookconnect-brown"
        >
          <Globe className="h-4 w-4" />
          <span>Anonymous</span>
          <Badge 
            variant="secondary" 
            className="ml-1 bg-gray-100 text-gray-700"
          >
            {counts.anonymous}
          </Badge>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
};
