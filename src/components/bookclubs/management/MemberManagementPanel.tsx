import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Users, UserPlus, Search, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { getClubJoinRequests, approveJoinRequest, rejectJoinRequest } from '@/lib/api/bookclubs/requests';
import { getClubMembers, removeMember } from '@/lib/api/bookclubs/members';
import { useClubJoinRequests } from '@/hooks/useJoinRequestQuestions';
import JoinRequestReviewModal from '@/components/bookclubs/questions/JoinRequestReviewModal';
import MembersTab from './MembersTab';
import JoinRequestsTab from './JoinRequestsTab';
import MemberRemovalDialog from './MemberRemovalDialog';
import type {
  MemberManagementPanelProps,
  Member,
  JoinRequest,
  EnhancedJoinRequest
} from './types';



/**
 * Member Management Panel Component
 *
 * This component allows club leads to manage members and join requests.
 */
const MemberManagementPanel: React.FC<MemberManagementPanelProps> = ({ clubId }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('members');
  const [members, setMembers] = useState<Member[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<JoinRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [processingAction, setProcessingAction] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);

  // Use the new join requests hook
  const { requests: newJoinRequests, loading: loadingNewRequests, refreshRequests } = useClubJoinRequests(clubId);

  // Load members and join requests
  useEffect(() => {
    async function loadData() {
      if (!clubId || !user?.id) return;

      try {
        setLoading(true);

        // Load members
        const membersData = await getClubMembers(clubId);

        // Process member data to ensure it matches the expected format
        const processedMembers: Member[] = membersData.map(member => {
          // Create a default user object
          const userObj = {
            username: 'Unknown',
            email: '',
            display_name: 'Unknown User'
          };

          // Try to extract user data if available
          try {
            const userValue = member.user;
            if (typeof userValue === 'object' && userValue !== null) {
              // Use type assertion to handle the user object
              const userObject = userValue as any;
              if (userObject.username) userObj.username = userObject.username;
              if (userObject.email) userObj.email = userObject.email;
              if (userObject.display_name) userObj.display_name = userObject.display_name;
            }
          } catch (e) {
            console.error('Error processing user data:', e);
          }

          return {
            user_id: member.user_id,
            club_id: member.club_id,
            role: member.role,
            joined_at: member.joined_at,
            user: userObj
          };
        });

        setMembers(processedMembers);
        setFilteredMembers(processedMembers);

        // Load join requests
        const requestsData = await getClubJoinRequests(clubId);

        // Process join request data to ensure it matches the expected format
        const processedRequests: JoinRequest[] = requestsData.map(request => {
          // Create a default user object
          const userObj = {
            username: 'Unknown',
            email: '',
            display_name: 'Unknown User'
          };

          // Try to extract user data if available
          try {
            const userValue = request.user;
            if (typeof userValue === 'object' && userValue !== null) {
              // Use type assertion to handle the user object
              const userObject = userValue as any;
              if (userObject.username) userObj.username = userObject.username;
              if (userObject.email) userObj.email = userObject.email;
              if (userObject.display_name) userObj.display_name = userObject.display_name;
            }
          } catch (e) {
            console.error('Error processing user data:', e);
          }

          return {
            user_id: request.user_id,
            club_id: request.club_id,
            requested_at: request.requested_at,
            status: request.status,
            user: userObj
          };
        });

        setJoinRequests(processedRequests);
        setFilteredRequests(processedRequests);
      } catch (error) {
        console.error('Error loading club members data:', error);
        toast.error('Failed to load members data');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [clubId, user?.id]);

  // Filter members and requests based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredMembers(members);
      setFilteredRequests(joinRequests);
      return;
    }

    const query = searchQuery.toLowerCase();

    // Filter members
    const matchedMembers = members.filter(member =>
      member.user?.username?.toLowerCase().includes(query) ||
      member.user?.email?.toLowerCase().includes(query) ||
      member.user?.display_name?.toLowerCase().includes(query)
    );
    setFilteredMembers(matchedMembers);

    // Filter join requests
    const matchedRequests = joinRequests.filter(request =>
      request.user?.username?.toLowerCase().includes(query) ||
      request.user?.email?.toLowerCase().includes(query) ||
      request.user?.display_name?.toLowerCase().includes(query)
    );
    setFilteredRequests(matchedRequests);
  }, [searchQuery, members, joinRequests]);

  // Handle member removal
  const handleRemoveMember = async (memberId: string) => {
    if (!clubId || !user?.id) return;

    try {
      setProcessingAction(true);
      await removeMember(user.id, memberId, clubId);

      // Update the members list
      setMembers(members.filter(member => member.user_id !== memberId));
      setFilteredMembers(filteredMembers.filter(member => member.user_id !== memberId));

      toast.success('Member removed successfully');
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Failed to remove member');
    } finally {
      setProcessingAction(false);
      setMemberToRemove(null);
    }
  };

  // Handle viewing join request details
  const handleViewRequest = (request: any) => {
    setSelectedRequest(request);
    setReviewModalOpen(true);
  };

  // Handle join request approval from modal
  const handleApproveFromModal = async () => {
    if (!selectedRequest || !user?.id) return;

    try {
      setProcessingAction(true);
      // Use the existing approval API - we'll need to update this to work with our new schema
      await approveJoinRequest(user.id, clubId, selectedRequest.user_id);

      // Refresh the requests list
      await refreshRequests();

      // Reload members to include the newly approved member
      const membersData = await getClubMembers(clubId);
      const processedMembers: Member[] = membersData.map(member => {
        const userObj = {
          username: 'Unknown',
          email: '',
          display_name: 'Unknown User'
        };

        try {
          const userValue = member.user;
          if (typeof userValue === 'object' && userValue !== null) {
            const userObject = userValue as any;
            if (userObject.username) userObj.username = userObject.username;
            if (userObject.email) userObj.email = userObject.email;
            if (userObject.display_name) userObj.display_name = userObject.display_name;
          }
        } catch (e) {
          console.error('Error processing user data:', e);
        }

        return {
          user_id: member.user_id,
          club_id: member.club_id,
          role: member.role,
          joined_at: member.joined_at,
          user: userObj
        };
      });

      setMembers(processedMembers);
      setFilteredMembers(processedMembers);

      toast.success('Join request approved');
    } catch (error) {
      console.error('Error approving join request:', error);
      toast.error('Failed to approve join request');
    } finally {
      setProcessingAction(false);
    }
  };

  // Handle join request rejection from modal
  const handleRejectFromModal = async () => {
    if (!selectedRequest || !user?.id) return;

    try {
      setProcessingAction(true);
      await rejectJoinRequest(user.id, clubId, selectedRequest.user_id);

      // Refresh the requests list
      await refreshRequests();

      toast.success('Join request rejected');
    } catch (error) {
      console.error('Error rejecting join request:', error);
      toast.error('Failed to reject join request');
    } finally {
      setProcessingAction(false);
    }
  };

  // Handle join request approval (legacy)
  const handleApproveRequest = async (userId: string) => {
    if (!clubId || !user?.id) return;

    try {
      setProcessingAction(true);
      await approveJoinRequest(user.id, clubId, userId);

      // Update the join requests list
      setJoinRequests(joinRequests.filter(request => request.user_id !== userId));
      setFilteredRequests(filteredRequests.filter(request => request.user_id !== userId));

      toast.success('Join request approved');
    } catch (error) {
      console.error('Error approving join request:', error);
      toast.error('Failed to approve join request');
    } finally {
      setProcessingAction(false);
    }
  };

  // Handle join request rejection (legacy)
  const handleRejectRequest = async (userId: string) => {
    if (!clubId || !user?.id) return;

    try {
      setProcessingAction(true);
      await rejectJoinRequest(user.id, clubId, userId);

      // Update the join requests list
      setJoinRequests(joinRequests.filter(request => request.user_id !== userId));
      setFilteredRequests(filteredRequests.filter(request => request.user_id !== userId));

      toast.success('Join request rejected');
    } catch (error) {
      console.error('Error rejecting join request:', error);
      toast.error('Failed to reject join request');
    } finally {
      setProcessingAction(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
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
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="text"
                placeholder="Search members..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="members" className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                Members
                <Badge variant="secondary" className="ml-1">
                  {members.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="requests" className="flex items-center gap-1">
                <UserPlus className="h-4 w-4" />
                Join Requests
                <Badge variant="secondary" className="ml-1">
                  {joinRequests.length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="members">
              <MembersTab
                members={filteredMembers}
                loading={loading}
                processingAction={processingAction}
                currentUserId={user?.id}
                onRemoveMember={setMemberToRemove}
              />
            </TabsContent>

            <TabsContent value="requests">
              <JoinRequestsTab
                legacyRequests={filteredRequests}
                enhancedRequests={newJoinRequests}
                loading={loading}
                processingAction={processingAction}
                onViewRequest={handleViewRequest}
                onApproveRequest={handleApproveRequest}
                onRejectRequest={handleRejectRequest}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Member removal confirmation dialog */}
      <MemberRemovalDialog
        isOpen={!!memberToRemove}
        memberToRemove={memberToRemove}
        processingAction={processingAction}
        onConfirm={handleRemoveMember}
        onCancel={() => setMemberToRemove(null)}
      />

      {/* Join Request Review Modal */}
      {selectedRequest && (
        <JoinRequestReviewModal
          isOpen={reviewModalOpen}
          onClose={() => {
            setReviewModalOpen(false);
            setSelectedRequest(null);
          }}
          joinRequest={{
            user_id: selectedRequest.user_id,
            username: selectedRequest.username,
            display_name: selectedRequest.display_name,
            requested_at: selectedRequest.requested_at,
            answers: selectedRequest.answers || [],
            has_answers: selectedRequest.has_answers || false
          }}
          onApprove={handleApproveFromModal}
          onReject={handleRejectFromModal}
          isLoading={processingAction}
        />
      )}
    </>
  );
};

export default MemberManagementPanel;
