/**
 * Member Management Panel Component (Refactored)
 * 
 * This component allows club leads to manage members and join requests.
 * Refactored from the original 424-line file into a modular structure.
 */

import React from 'react';
import { Loader2, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TabsContent } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';

// Import modular components
import { MemberSearchFilter } from './components/MemberSearchFilter';
import { MemberManagementTabs } from './components/MemberManagementTabs';
import { MemberActionModals } from './components/MemberActionModals';

// Import existing sub-components (maintain backward compatibility)
import MembersTab from '../MembersTab';
import JoinRequestsTab from '../JoinRequestsTab';

// Import hooks
import { useMemberData } from './hooks/useMemberData';
import { useMemberFiltering } from './hooks/useMemberFiltering';
import { useMemberManagement } from './hooks/useMemberManagement';
import { useJoinRequestManagement } from './hooks/useJoinRequestManagement';

// Import types
import type { MemberManagementPanelProps } from './types/memberManagement';

const MemberManagementPanel: React.FC<MemberManagementPanelProps> = ({ clubId }) => {
  const { user } = useAuth();

  // Data management hook
  const {
    members,
    joinRequests,
    loading,
    error,
    refreshData,
    updateMembers,
    updateJoinRequests
  } = useMemberData({ clubId });

  // Filtering and search hook
  const {
    searchQuery,
    filteredMembers,
    filteredRequests,
    activeTab,
    setSearchQuery,
    setActiveTab
  } = useMemberFiltering({ members, joinRequests });

  // Member management hook
  const {
    processingAction: memberProcessing,
    memberToRemove,
    handleRemoveMember,
    confirmRemoveMember,
    cancelRemoveMember
  } = useMemberManagement({
    clubId,
    members,
    onMembersUpdate: updateMembers,
    onRefreshData: refreshData
  });

  // Join request management hook
  const {
    processingAction: requestProcessing,
    reviewModalOpen,
    selectedRequest,
    enhancedRequests,
    legacyRequests,
    handleApproveRequest,
    handleRejectRequest,
    handleViewRequest,
    closeReviewModal,
    approveFromModal,
    rejectFromModal
  } = useJoinRequestManagement({
    clubId,
    joinRequests,
    onJoinRequestsUpdate: updateJoinRequests,
    onRefreshData: refreshData
  });

  // Combine processing states
  const processingAction = memberProcessing || requestProcessing;

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 border rounded-md">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Member Management
          </CardTitle>
          <CardDescription>
            Manage club members and join requests.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search Filter */}
          <div className="mb-4">
            <MemberSearchFilter
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              placeholder="Search members..."
              disabled={processingAction}
            />
          </div>

          {/* Tab Navigation */}
          <MemberManagementTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            memberCount={members.length}
            requestCount={joinRequests.length}
            loading={loading}
          />

          {/* Tab Content */}
          <div className="mt-4">
            {activeTab === 'members' && (
              <MembersTab
                members={filteredMembers}
                loading={loading}
                processingAction={processingAction}
                currentUserId={user?.id}
                onRemoveMember={handleRemoveMember}
              />
            )}

            {activeTab === 'requests' && (
              <JoinRequestsTab
                legacyRequests={filteredRequests}
                enhancedRequests={enhancedRequests}
                loading={loading}
                processingAction={processingAction}
                onViewRequest={handleViewRequest}
                onApproveRequest={handleApproveRequest}
                onRejectRequest={handleRejectRequest}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Modals */}
      <MemberActionModals
        memberToRemove={memberToRemove}
        reviewModalOpen={reviewModalOpen}
        selectedRequest={selectedRequest}
        processingAction={processingAction}
        onConfirmRemoval={confirmRemoveMember}
        onCancelRemoval={cancelRemoveMember}
        onCloseReviewModal={closeReviewModal}
        onApproveFromModal={approveFromModal}
        onRejectFromModal={rejectFromModal}
      />
    </>
  );
};

export default MemberManagementPanel;
