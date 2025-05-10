import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useCanManageClub } from '@/lib/entitlements/hooks';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

type Moderator = {
  user_id: string;
  assigned_at: string;
  assigned_by_user_id: string;
  users: {
    username: string;
    email: string;
  };
};

type ClubMember = {
  user_id: string;
  username: string;
};

type ClubModeratorsProps = {
  clubId: string;
  storeId: string;
};

/**
 * Component for displaying and managing club moderators
 */
export function ClubModerators({ clubId, storeId }: ClubModeratorsProps) {
  const [moderators, setModerators] = useState<Moderator[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { user } = useAuth();
  const { result: canManage, loading: loadingPermission } = useCanManageClub(clubId, storeId);
  
  const fetchModerators = async () => {
    setLoading(true);
    
    try {
      const response = await fetch(`/api/clubs/${clubId}/moderators`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch moderators');
      }
      
      const data = await response.json();
      setModerators(data.moderators || []);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch moderators');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchModerators();
  }, [clubId]);
  
  const handleRemoveModerator = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this moderator?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/clubs/${clubId}/moderators/${userId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to remove moderator');
      }
      
      toast.success('Moderator removed successfully');
      fetchModerators();
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove moderator');
    }
  };
  
  if (loadingPermission) {
    return <div>Loading permissions...</div>;
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Club Moderators</CardTitle>
        <CardDescription>Manage moderators for this club</CardDescription>
      </CardHeader>
      <CardContent>
        {canManage && (
          <div className="mb-4">
            <AddModeratorDialog 
              clubId={clubId} 
              onModeratorAdded={fetchModerators}
              isOpen={isAddDialogOpen}
              setIsOpen={setIsAddDialogOpen}
            />
          </div>
        )}
        
        {loading ? (
          <div>Loading moderators...</div>
        ) : moderators.length === 0 ? (
          <div>No moderators found</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Assigned At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {moderators.map((moderator) => (
                <TableRow key={moderator.user_id}>
                  <TableCell>{moderator.users.username}</TableCell>
                  <TableCell>{moderator.users.email}</TableCell>
                  <TableCell>{new Date(moderator.assigned_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {canManage && (
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => handleRemoveModerator(moderator.user_id)}
                      >
                        Remove
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

type AddModeratorDialogProps = {
  clubId: string;
  onModeratorAdded: () => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
};

function AddModeratorDialog({ clubId, onModeratorAdded, isOpen, setIsOpen }: AddModeratorDialogProps) {
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);
  
  const fetchClubMembers = async () => {
    setLoadingMembers(true);
    
    try {
      const response = await fetch(`/api/clubs/${clubId}/members`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch club members');
      }
      
      const data = await response.json();
      
      // Filter out members who are already moderators
      const moderatorsResponse = await fetch(`/api/clubs/${clubId}/moderators`);
      
      if (!moderatorsResponse.ok) {
        throw new Error('Failed to fetch moderators');
      }
      
      const moderatorsData = await moderatorsResponse.json();
      const moderatorIds = new Set(moderatorsData.moderators.map((m: Moderator) => m.user_id));
      
      const eligibleMembers = data.members.filter((m: any) => !moderatorIds.has(m.user_id));
      setMembers(eligibleMembers);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch club members');
    } finally {
      setLoadingMembers(false);
    }
  };
  
  useEffect(() => {
    if (isOpen) {
      fetchClubMembers();
    }
  }, [isOpen, clubId]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedMemberId) {
      toast.error('Please select a member');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`/api/clubs/${clubId}/moderators`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedMemberId,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add moderator');
      }
      
      toast.success('Moderator added successfully');
      setIsOpen(false);
      setSelectedMemberId('');
      onModeratorAdded();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add moderator');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>Add Moderator</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Moderator</DialogTitle>
          <DialogDescription>
            Add a new moderator to this club
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="member" className="text-right">
                Member
              </Label>
              {loadingMembers ? (
                <div className="col-span-3">Loading members...</div>
              ) : members.length === 0 ? (
                <div className="col-span-3">No eligible members found</div>
              ) : (
                <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a member" />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((member) => (
                      <SelectItem key={member.user_id} value={member.user_id}>
                        {member.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="submit" 
              disabled={isSubmitting || loadingMembers || members.length === 0 || !selectedMemberId}
            >
              {isSubmitting ? 'Adding...' : 'Add Moderator'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
