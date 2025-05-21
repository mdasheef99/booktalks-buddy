import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Users, Shield, MessageSquare, Book } from 'lucide-react';
import ClubSettingsPanel from './ClubSettingsPanel';
import MemberManagementPanel from './MemberManagementPanel';
import ModeratorManagementPanel from './ModeratorManagementPanel';
import ContentModerationPanel from './ContentModerationPanel';
import CurrentBookPanel from './CurrentBookPanel';

interface ClubManagementPanelProps {
  clubId: string;
  open: boolean;
  onClose: () => void;
}

/**
 * Club Management Panel Component
 * 
 * This component provides a tabbed interface for managing various aspects of a book club.
 * It is only accessible to club leads and store administrators.
 */
const ClubManagementPanel: React.FC<ClubManagementPanelProps> = ({
  clubId,
  open,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState('settings');

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Club Management</DialogTitle>
          <DialogDescription>
            Manage your book club settings, members, moderators, and content.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid grid-cols-5 mb-4">
            <TabsTrigger value="settings" className="flex items-center gap-1">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
            <TabsTrigger value="members" className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Members</span>
            </TabsTrigger>
            <TabsTrigger value="moderators" className="flex items-center gap-1">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Moderators</span>
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Content</span>
            </TabsTrigger>
            <TabsTrigger value="current-book" className="flex items-center gap-1">
              <Book className="h-4 w-4" />
              <span className="hidden sm:inline">Current Book</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="space-y-4">
            <ClubSettingsPanel clubId={clubId} />
          </TabsContent>

          <TabsContent value="members" className="space-y-4">
            <MemberManagementPanel clubId={clubId} />
          </TabsContent>

          <TabsContent value="moderators" className="space-y-4">
            <ModeratorManagementPanel clubId={clubId} />
          </TabsContent>

          <TabsContent value="content" className="space-y-4">
            <ContentModerationPanel clubId={clubId} />
          </TabsContent>

          <TabsContent value="current-book" className="space-y-4">
            <CurrentBookPanel clubId={clubId} />
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ClubManagementPanel;
