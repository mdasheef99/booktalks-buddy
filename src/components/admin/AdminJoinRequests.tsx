import React from 'react';
import { UserPlus, Check, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Database } from '@/integrations/supabase/types';
import { supabase } from '@/lib/supabase';

type ClubMember = Database['public']['Tables']['club_members']['Row'];

interface AdminJoinRequestsProps {
  clubId: string;
}

export const AdminJoinRequests: React.FC<AdminJoinRequestsProps> = ({ clubId }) => {
  const [requests, setRequests] = React.useState<ClubMember[]>([]);
  const [loading, setLoading] = React.useState(true);
  const { user } = useAuth();

  React.useEffect(() => {
    const fetchRequests = async () => {
      try {
        const { data, error } = await supabase
          .from('club_members')
          .select('*')
          .eq('club_id', clubId)
          .eq('role', 'pending')
          .order('joined_at', { ascending: true });

        if (error) throw error;
        setRequests(data || []);
      } catch (error) {
        console.error('Error fetching join requests:', error);
        toast.error('Failed to load join requests');
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();

    // Subscribe to real-time changes
    const subscription = supabase
      .channel('join_requests_channel')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'club_members',
        filter: `club_id=eq.${clubId}`
      }, () => {
        fetchRequests();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [clubId]);

  const handleRequest = async (memberId: string, approve: boolean) => {
    try {
      if (approve) {
        // Update role to member if approved
        const { error: updateError } = await supabase
          .from('club_members')
          .update({ role: 'member' })
          .eq('user_id', memberId)
          .eq('club_id', clubId);

        if (updateError) throw updateError;
        toast.success('Request approved');
      } else {
        // Delete the record if rejected
        const { error: deleteError } = await supabase
          .from('club_members')
          .delete()
          .eq('user_id', memberId)
          .eq('club_id', clubId);

        if (deleteError) throw deleteError;
        toast.success('Request rejected');
      }
      
      // Update local state
      setRequests(prev => prev.filter(req => req.user_id !== memberId));
    } catch (error) {
      console.error('Error handling join request:', error);
      toast.error('Failed to process request');
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
        <UserPlus className="h-5 w-5" />
        <h2 className="text-xl font-semibold">Join Requests</h2>
      </div>

      <div className="space-y-4">
        {requests.map((request) => (
          <div 
            key={request.user_id}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
          >
            <div>
              <p className="font-medium">{request.user_id}</p>
              <p className="text-sm text-gray-600">
                Requested {new Date(request.joined_at || '').toLocaleDateString()}
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRequest(request.user_id, false)}
              >
                <X className="h-4 w-4 mr-1" />
                Deny
              </Button>
              <Button
                size="sm"
                onClick={() => handleRequest(request.user_id, true)}
              >
                <Check className="h-4 w-4 mr-1" />
                Approve
              </Button>
            </div>
          </div>
        ))}

        {requests.length === 0 && (
          <p className="text-center text-gray-600">No pending join requests</p>
        )}
      </div>
    </Card>
  );
};

export default AdminJoinRequests;