import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, UserMinus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfiles, useLoadProfiles } from '@/contexts/UserProfileContext';
import { getClubMembers, removeMember } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import UserAvatar from '@/components/common/UserAvatar';
import UserName from '@/components/common/UserName';
import ConfirmationDialog from '@/components/common/ConfirmationDialog';

interface ClubMember {
  user_id: string;
  club_id: string;
  role: string;
  joined_at: string;
}

const BookClubMembers: React.FC = () => {
  const { clubId } = useParams<{ clubId: string }>();
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<ClubMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [removingMember, setRemovingMember] = useState(false);
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const isClubAdmin = clubId ? isAdmin(clubId) : false;

  // Load profiles for all members
  useLoadProfiles(members, (member) => member.user_id);

  useEffect(() => {
    const fetchMembers = async () => {
      if (!clubId) return;

      try {
        const memberData = await getClubMembers(clubId);
        setMembers(memberData);
        setFilteredMembers(memberData);
      } catch (error) {
        console.error('Error fetching members:', error);
        toast.error('Failed to load members');
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();

    // Subscribe to real-time changes
    const subscription = supabase
      .channel('members_channel')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'club_members',
        filter: `club_id=eq.${clubId}`
      }, () => {
        fetchMembers();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [clubId]);

  // Filter members when search query changes
  useEffect(() => {
    if (!members.length) return;

    if (!searchQuery) {
      setFilteredMembers(members);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = members.filter(member => {
      // This is a simple filter by user ID, but will be enhanced by the UserName component
      // which will display the actual username
      return member.user_id.toLowerCase().includes(query) ||
             member.role.toLowerCase().includes(query);
    });

    setFilteredMembers(filtered);
  }, [members, searchQuery]);

  const handleRemoveMember = async (memberId: string) => {
    if (!clubId || !user?.id) return;

    setRemovingMember(true);

    try {
      await removeMember(user.id, memberId, clubId);
      toast.success('Member removed successfully');
      setConfirmRemove(null);
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Failed to remove member');
    } finally {
      setRemovingMember(false);
    }
  };

  const openRemoveConfirmation = (memberId: string) => {
    setConfirmRemove(memberId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-pulse">
          <div className="h-12 w-12 rounded-full bg-gray-300 mb-4"></div>
          <div className="h-4 w-32 bg-gray-300"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Button
        variant="ghost"
        onClick={() => navigate(`/book-club/${clubId}`)}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Book Club
      </Button>

      <h1 className="text-2xl font-bold mb-6">Book Club Members</h1>

      {/* Search input */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Search members..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        {filteredMembers.length > 0 ? (
          filteredMembers.map((member) => (
            <Card key={member.user_id} className="p-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <UserAvatar userId={member.user_id} size="md" />
                  <div>
                    <UserName
                      userId={member.user_id}
                      linkToProfile
                      className="font-medium"
                      withRole={member.role}
                    />
                    <p className="text-xs text-gray-400">
                      Joined: {new Date(member.joined_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {isClubAdmin && member.user_id !== user?.id && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => openRemoveConfirmation(member.user_id)}
                  >
                    <UserMinus className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                )}
              </div>
            </Card>
          ))
        ) : (
          <p className="text-center text-gray-500">No members found</p>
        )}
      </div>

      {/* Confirmation Dialog */}
      {confirmRemove && (
        <ConfirmationDialog
          isOpen={!!confirmRemove}
          onClose={() => setConfirmRemove(null)}
          onConfirm={() => handleRemoveMember(confirmRemove)}
          title="Remove Member"
          description="Are you sure you want to remove this member from the book club? This action cannot be undone."
          confirmText="Remove"
          variant="destructive"
          isLoading={removingMember}
        />
      )}
    </div>
  );
};

export default BookClubMembers;
