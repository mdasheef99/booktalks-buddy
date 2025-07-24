/**
 * Ultra-Simple Self-Deletion Requests Management
 * For BookTalks Buddy - Store owner interface
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, Trash2, User, Calendar, MessageSquare, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useStoreOwnerAccess } from '@/hooks/useStoreOwnerAccess';
import {
  getSelfDeletionRequests,
  processSelfDeletionRequest,
  deleteSelfDeletionRequest,
  type SelfDeletionRequestWithUser
} from '@/lib/api/admin/selfDeletionRequests';

export default function SelfDeletionRequests() {
  const { user } = useAuth();
  const { isStoreOwner, storeId, storeName, loading: storeAccessLoading } = useStoreOwnerAccess();
  const [requests, setRequests] = useState<SelfDeletionRequestWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Load requests when store access is ready
  useEffect(() => {
    if (!storeAccessLoading) {
      loadRequests();
    }
  }, [storeAccessLoading]);

  const loadRequests = async () => {
    // Don't load if store access is still loading
    if (storeAccessLoading) return;

    try {
      setLoading(true);
      const data = await getSelfDeletionRequests();
      setRequests(data);
    } catch (error) {
      console.error('Error loading deletion requests:', error);
      toast.error('Failed to load deletion requests');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async (request: SelfDeletionRequestWithUser) => {
    if (!user?.id) return;

    // Confirm action
    const confirmed = window.confirm(
      `Are you sure you want to delete ${request.user_name}'s account?\n\n` +
      `This will:\n` +
      `1. Check if they still own any clubs\n` +
      `2. Delete their account if no clubs owned\n` +
      `3. Remove this deletion request\n\n` +
      `If they still own clubs, you'll get an error message with club names.`
    );

    if (!confirmed) return;

    try {
      setProcessingId(request.id);
      const result = await processSelfDeletionRequest(request.id, user.id);

      if (result.success) {
        toast.success(result.message);
        // Remove the processed request from the list
        setRequests(prev => prev.filter(r => r.id !== request.id));
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error processing deletion request:', error);
      toast.error('Failed to process deletion request');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectRequest = async (request: SelfDeletionRequestWithUser) => {
    const confirmed = window.confirm(
      `Are you sure you want to reject ${request.user_name}'s deletion request?\n\n` +
      `This will remove the request without deleting their account.`
    );

    if (!confirmed) return;

    try {
      setProcessingId(request.id);
      await deleteSelfDeletionRequest(request.id);
      toast.success('Deletion request rejected and removed');
      
      // Remove the rejected request from the list
      setRequests(prev => prev.filter(r => r.id !== request.id));
    } catch (error) {
      console.error('Error rejecting deletion request:', error);
      toast.error('Failed to reject deletion request');
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Show loading state while checking store access or loading requests
  if (storeAccessLoading || loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bookconnect-brown mx-auto mb-4"></div>
          <p className="text-gray-600">
            {storeAccessLoading ? 'Verifying access...' : 'Loading deletion requests...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Self-Deletion Requests</h1>
          <p className="text-gray-600 mt-1">
            Manage user account deletion requests
            {storeName && ` for ${storeName}`}
          </p>
        </div>
        <Badge variant="secondary" className="text-lg px-3 py-1">
          {requests.length} Pending
        </Badge>
      </div>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Deletion Requests</h3>
            <p className="text-gray-600">
              There are currently no pending account deletion requests.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <Card key={request.id} className="border-l-4 border-l-red-500">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-gray-500" />
                    <div>
                      <CardTitle className="text-lg">{request.user_name}</CardTitle>
                      <p className="text-sm text-gray-600">{request.user_email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="h-4 w-4" />
                    {formatDate(request.created_at)}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Reason */}
                {request.reason && (
                  <div className="flex items-start gap-2">
                    <MessageSquare className="h-4 w-4 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Reason:</p>
                      <p className="text-sm text-gray-600">{request.reason}</p>
                    </div>
                  </div>
                )}

                {/* Owned Clubs */}
                {request.clubs_owned && request.clubs_owned.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <p className="text-sm font-medium text-amber-800">
                        User owns {request.clubs_owned.length} club{request.clubs_owned.length > 1 ? 's' : ''}:
                      </p>
                    </div>
                    <div className="space-y-1">
                      {request.clubs_owned.map((club, index) => (
                        <div key={club.id} className="text-sm text-amber-700">
                          • {club.name}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-amber-600 mt-2">
                      Transfer club leadership before deleting the account.
                      Use Admin → Clubs → Members to change club leads.
                    </p>
                  </div>
                )}

                <Separator />

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Click "Delete Account" to check club ownership and process deletion
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRejectRequest(request)}
                      disabled={processingId === request.id}
                    >
                      Reject Request
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteAccount(request)}
                      disabled={processingId === request.id}
                      className="flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      {processingId === request.id ? 'Processing...' : 'Delete Account'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
