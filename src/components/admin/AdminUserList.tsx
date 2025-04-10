import React from 'react';
import { Users, Ban, Check } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Database } from '@/integrations/supabase/types';
import { supabase } from '@/lib/supabase';

type ClubMember = Database['public']['Tables']['club_members']['Row'];

interface AdminUserListProps {
  clubId: string;
}

export const AdminUserList: React.FC<AdminUserListProps> = ({ clubId }) => {
  const [members, setMembers] = React.useState<ClubMember[]>([]);
  const [loading, setLoading] = React.useState(true);
  const { user } = useAuth();

  React.useEffect(() => {
    const fetchMembers = async () => {
      try {
        const { data, error } = await supabase
          .from('club_members')
          .select('*')
          .eq('club_id', clubId)
          .order('joined_at', { ascending: true });

        if (error) throw error;
        setMembers(data || []);
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

  const handleBanUser = async (memberId: string, isBanned: boolean) => {
    try {
      const { error } = await supabase
        .from('club_members')
        .update({ role: isBanned ? 'banned' : 'member' })
        .eq('user_id', memberId)
        .eq('club_id', clubId);

      if (error) throw error;

      toast.success(`User ${isBanned ? 'banned' : 'unbanned'} successfully`);
    } catch (error) {
      console.error('Error updating member status:', error);
      toast.error('Failed to update member status');
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
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Users className="h-5 w-5" />
        <h2 className="text-xl font-semibold">Manage Members</h2>
      </div>

      <div className="space-y-4">
        {members.map((member) => (
          <div 
            key={member.user_id}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
          >
            <div>
              <p className="font-medium">{member.user_id}</p>
              <p className="text-sm text-gray-600">
                Joined {new Date(member.joined_at || '').toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-600">
                Role: {member.role}
              </p>
            </div>

            {member.user_id !== user?.id && member.role !== 'admin' && (
              <Button
                variant={member.role === 'banned' ? 'default' : 'destructive'}
                size="sm"
                onClick={() => handleBanUser(member.user_id, member.role !== 'banned')}
              >
                {member.role === 'banned' ? (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Unban
                  </>
                ) : (
                  <>
                    <Ban className="h-4 w-4 mr-1" />
                    Ban
                  </>
                )}
              </Button>
            )}
          </div>
        ))}

        {members.length === 0 && (
          <p className="text-center text-gray-600">No members found</p>
        )}
      </div>
    </Card>
  );
};

export default AdminUserList;