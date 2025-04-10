import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, UserMinus } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { getClubMembers, removeMember } from '@/lib/api';
import { supabase } from '@/lib/supabase';

interface ClubMember {
  user_id: string;
  club_id: string;
  role: string;
  joined_at: string;
}

const BookClubMembers: React.FC = () => {
  const { clubId } = useParams<{ clubId: string }>();
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const isClubAdmin = clubId ? isAdmin(clubId) : false;

  useEffect(() => {
    const fetchMembers = async () => {
      if (!clubId) return;
      
      try {
        const memberData = await getClubMembers(clubId);
        setMembers(memberData);
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

  const handleRemoveMember = async (memberId: string) => {
    if (!clubId || !user?.id) return;
    
    try {
      await removeMember(user.id, memberId, clubId);
      toast.success('Member removed successfully');
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Failed to remove member');
    }
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
      
      <div className="space-y-4">
        {members.length > 0 ? (
          members.map((member) => (
            <Card key={member.user_id} className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">User ID: {member.user_id}</p>
                  <p className="text-sm text-gray-500">
                    Role: {member.role}
                  </p>
                  <p className="text-xs text-gray-400">
                    Joined: {new Date(member.joined_at).toLocaleDateString()}
                  </p>
                </div>
                {isClubAdmin && member.user_id !== user?.id && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemoveMember(member.user_id)}
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
    </div>
  );
};

export default BookClubMembers;
