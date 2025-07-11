import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { 
  BookAvailabilityRequestData,
  BookAvailabilityRequestStatus
} from '@/types/bookAvailabilityRequests';

interface UseRequestManagementProps {
  storeId: string | null;
  onRequestsUpdate: (requests: BookAvailabilityRequestData[]) => void;
}

export const useRequestManagement = ({ storeId, onRequestsUpdate }: UseRequestManagementProps) => {
  const [updating, setUpdating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Update request status
  const updateRequestStatus = async (
    requestId: string, 
    status: BookAvailabilityRequestStatus, 
    notes?: string
  ) => {
    try {
      setUpdating(requestId);

      console.log('Updating request:', { requestId, status, notes });

      // Update directly in Supabase
      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (notes) {
        updateData.store_owner_notes = notes;
        updateData.responded_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('book_availability_requests')
        .update(updateData)
        .eq('id', requestId)
        .select()
        .single();

      if (error) {
        console.error('Supabase update error:', error);
        throw new Error('Failed to update request');
      }

      console.log('Successfully updated request:', data);
      toast.success('Request updated successfully');

      // Refresh the requests list
      await refreshRequests();

    } catch (err) {
      console.error('Error updating request:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to update request');
    } finally {
      setUpdating(null);
    }
  };

  // Delete request
  const deleteRequest = async (requestId: string) => {
    try {
      setDeleting(requestId);

      console.log('Deleting request:', requestId);

      const { error } = await supabase
        .from('book_availability_requests')
        .delete()
        .eq('id', requestId);

      if (error) {
        console.error('Supabase delete error:', error);
        throw new Error('Failed to delete request');
      }

      console.log('Successfully deleted request');
      toast.success('Request deleted successfully');

      // Refresh the requests list
      await refreshRequests();

    } catch (err) {
      console.error('Error deleting request:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to delete request');
    } finally {
      setDeleting(null);
    }
  };

  // Refresh requests from database
  const refreshRequests = async () => {
    if (!storeId) {
      console.log('No storeId available, skipping refresh');
      return;
    }

    try {
      console.log('Refreshing requests for store:', storeId);

      const { data, error } = await supabase
        .from('book_availability_requests')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase refresh error:', error);
        throw new Error('Failed to refresh requests');
      }

      onRequestsUpdate(data || []);
      console.log('Successfully refreshed', data?.length || 0, 'requests');

    } catch (err) {
      console.error('Error refreshing requests:', err);
      toast.error('Failed to refresh requests');
    }
  };

  return {
    updating,
    deleting,
    updateRequestStatus,
    deleteRequest,
    refreshRequests
  };
};
