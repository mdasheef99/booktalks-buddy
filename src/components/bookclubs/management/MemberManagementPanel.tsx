import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Users, UserPlus, UserX, Check, X, Search, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { getClubJoinRequests, approveJoinRequest, rejectJoinRequest } from '@/lib/api/bookclubs/requests';
import { getClubMembers, removeMember } from '@/lib/api/bookclubs/members';

interface Member {
  user_id: string;
  club_id: string;
  role: string;
  joined_at: string;
  user?: {
    username?: string;
    email?: string;
    display_name?: string;
  };
}

interface JoinRequest {
  user_id: string;
  club_id: string;
  requested_at: string;
  status: string;
  user?: {
    username?: string;
    email?: string;
    display_name?: string;
  };
}

interface MemberManagementPanelProps {
  clubId: string;
}

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

  // Handle join request approval
  const handleApproveRequest = async (userId: string) => {
    if (!clubId || !user?.id) return;

    try {
      setProcessingAction(true);
      await approveJoinRequest(user.id, clubId, userId);

      // Update the join requests list
      setJoinRequests(joinRequests.filter(request => request.user_id !== userId));
      setFilteredRequests(filteredRequests.filter(request => request.user_id !== userId));

      // Reload members to include the newly approved member
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

      toast.success('Join request approved');
    } catch (error) {
      console.error('Error approving join request:', error);
      toast.error('Failed to approve join request');
    } finally {
      setProcessingAction(false);
    }
  };

  // Handle join request rejection
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
              {filteredMembers.length > 0 ? (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Member</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMembers.map((member) => (
                        <TableRow key={member.user_id}>
                          <TableCell className="font-medium">
                            {member.user?.display_name || member.user?.username || 'Unknown User'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={member.role === 'admin' ? 'default' : 'outline'}>
                              {member.role === 'admin' ? 'Admin' : 'Member'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(member.joined_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setMemberToRemove(member.user_id)}
                              disabled={processingAction || member.user_id === user?.id}
                            >
                              <UserX className="h-4 w-4 mr-1" />
                              Remove
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center p-8 border rounded-md">
                  <p className="text-gray-500">No members found</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="requests">
              {filteredRequests.length > 0 ? (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Requested</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRequests.map((request) => (
                        <TableRow key={request.user_id}>
                          <TableCell className="font-medium">
                            {request.user?.display_name || request.user?.username || 'Unknown User'}
                          </TableCell>
                          <TableCell>
                            {new Date(request.requested_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleApproveRequest(request.user_id)}
                                disabled={processingAction}
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleRejectRequest(request.user_id)}
                                disabled={processingAction}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center p-8 border rounded-md">
                  <p className="text-gray-500">No pending join requests</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Confirmation dialog for member removal */}
      <AlertDialog open={!!memberToRemove} onOpenChange={(open) => !open && setMemberToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this member from the club? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processingAction}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => memberToRemove && handleRemoveMember(memberToRemove)}
              disabled={processingAction}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {processingAction ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Removing...
                </>
              ) : (
                <>Remove</>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default MemberManagementPanel;
