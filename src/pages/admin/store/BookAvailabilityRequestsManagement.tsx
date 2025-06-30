import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Search,
  Eye,
  Phone,
  Mail,
  Calendar,
  User,
  BookOpen,
  MessageSquare,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  Users,
  Globe,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { useStoreOwnerAccess } from '@/hooks/useStoreOwnerAccess';
import { supabase } from '@/lib/supabase';
import { 
  BookAvailabilityRequestData,
  BookAvailabilityRequestStatus,
  formatRequestStatus,
  getStatusColor
} from '@/types/bookAvailabilityRequests';

interface BookAvailabilityRequestsManagementProps {}

export const BookAvailabilityRequestsManagement: React.FC<BookAvailabilityRequestsManagementProps> = () => {
  const { storeId: ownerStoreId, isValidOwner, loading: storeAccessLoading } = useStoreOwnerAccess();
  const [storeId, setStoreId] = useState<string | null>(null);
  const [requests, setRequests] = useState<BookAvailabilityRequestData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'club_members' | 'anonymous'>('all');
  const [selectedRequest, setSelectedRequest] = useState<BookAvailabilityRequestData | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Get store ID (either from owner access or first available store)
  useEffect(() => {
    const getStoreId = async () => {
      console.log('Getting store ID...');
      console.log('ownerStoreId:', ownerStoreId);
      console.log('isValidOwner:', isValidOwner);
      console.log('storeAccessLoading:', storeAccessLoading);

      if (ownerStoreId) {
        console.log('Using owner store ID:', ownerStoreId);
        setStoreId(ownerStoreId);
      } else {
        console.log('No owner store ID, fetching first available store...');
        // Fallback: get first available store for admin access
        try {
          const { data: stores, error } = await supabase
            .from('stores')
            .select('id, name')
            .limit(1);

          console.log('Stores query result:', { stores, error });

          if (!error && stores && stores.length > 0) {
            console.log('Using fallback store:', stores[0]);
            setStoreId(stores[0].id);
          } else {
            console.error('No stores found or error:', error);
            setError('No stores available');
          }
        } catch (error) {
          console.error('Error fetching stores:', error);
          setError('Failed to load store information');
        }
      }
    };

    if (!storeAccessLoading) {
      getStoreId();
    }
  }, [ownerStoreId, storeAccessLoading]);

  // Fetch requests directly from Supabase (bypassing problematic API route)
  const fetchRequests = async () => {
    if (!storeId) {
      console.log('No storeId available, skipping fetch');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('Fetching requests directly from Supabase for store:', storeId);

      // Query directly from Supabase
      const { data, error } = await supabase
        .from('book_availability_requests')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

      console.log('Supabase query result:', { data: data?.length || 0, error });

      if (error) {
        console.error('Supabase error:', error);
        throw new Error('Failed to fetch book availability requests');
      }

      setRequests(data || []);
      console.log('Successfully loaded', data?.length || 0, 'requests');
    } catch (err) {
      console.error('Error fetching book availability requests:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch requests');
      toast.error('Failed to fetch book availability requests');
    } finally {
      setLoading(false);
    }
  };

  // Update request status
  const updateRequestStatus = async (requestId: string, status: BookAvailabilityRequestStatus, notes?: string) => {
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

      console.log('Request updated successfully:', data);

      // Update local state
      setRequests(prev => prev.map(req =>
        req.id === requestId ? data : req
      ));

      toast.success('Request updated successfully');

      // Close dialog if open
      if (selectedRequest?.id === requestId) {
        setSelectedRequest(data);
      }
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

      // Delete directly from Supabase
      const { error } = await supabase
        .from('book_availability_requests')
        .delete()
        .eq('id', requestId);

      if (error) {
        console.error('Supabase delete error:', error);
        throw new Error('Failed to delete request');
      }

      console.log('Request deleted successfully');

      // Remove from local state
      setRequests(prev => prev.filter(req => req.id !== requestId));

      toast.success('Request deleted successfully');

      // Close dialog if this request was selected
      if (selectedRequest?.id === requestId) {
        setSelectedRequest(null);
      }
    } catch (err) {
      console.error('Error deleting request:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to delete request');
    } finally {
      setDeleting(null);
    }
  };

  // Filter requests based on active tab and search term
  const getFilteredRequests = () => {
    let filtered = requests;

    // Filter by request source based on active tab
    if (activeTab === 'club_members') {
      filtered = filtered.filter(r => r.request_source === 'authenticated_user');
    } else if (activeTab === 'anonymous') {
      filtered = filtered.filter(r => r.request_source === 'anonymous');
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(request =>
        request.book_title.toLowerCase().includes(searchLower) ||
        request.book_author.toLowerCase().includes(searchLower) ||
        request.customer_name.toLowerCase().includes(searchLower) ||
        request.customer_email.toLowerCase().includes(searchLower)
      );
    }

    // Sort authenticated requests first (priority)
    return filtered.sort((a, b) => {
      if (a.request_source === 'authenticated_user' && b.request_source === 'anonymous') {
        return -1;
      }
      if (a.request_source === 'anonymous' && b.request_source === 'authenticated_user') {
        return 1;
      }
      // Then sort by created date (newest first)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  };

  const filteredRequests = getFilteredRequests();

  // Get request counts for tabs
  const getRequestCounts = () => {
    const clubMemberRequests = requests.filter(r => r.request_source === 'authenticated_user');
    const anonymousRequests = requests.filter(r => r.request_source === 'anonymous');

    return {
      all: requests.length,
      club_members: clubMemberRequests.length,
      anonymous: anonymousRequests.length,
    };
  };

  useEffect(() => {
    fetchRequests();
  }, [storeId, activeTab]);

  // Loading state
  if (storeAccessLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-bookconnect-brown" />
          <p className="text-bookconnect-brown/70">Loading book availability requests...</p>
        </div>
      </div>
    );
  }

  // Show warning if not store owner but still allow access (consistent with other admin pages)
  const showStoreOwnerWarning = !isValidOwner && !storeAccessLoading;

  // Error state
  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
        <Button 
          onClick={fetchRequests} 
          className="mt-4"
          variant="outline"
        >
          Try Again
        </Button>
      </div>
    );
  }

  const counts = getRequestCounts();

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Store Owner Warning */}
      {showStoreOwnerWarning && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            Note: You are viewing this page with limited permissions. Full store management requires store owner access.
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-serif text-bookconnect-brown mb-2">
              Book Availability Requests
            </h1>
            <p className="text-bookconnect-brown/70">
              Manage customer book availability requests and inquiries
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search requests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'all' | 'club_members' | 'anonymous')}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            All Requests ({counts.all})
          </TabsTrigger>
          <TabsTrigger value="club_members" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Club Members ({counts.club_members})
          </TabsTrigger>
          <TabsTrigger value="anonymous" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Anonymous ({counts.anonymous})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredRequests.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  No requests found
                </h3>
                <p className="text-gray-500">
                  {searchTerm
                    ? 'No requests match your search criteria.'
                    : activeTab === 'all'
                      ? 'No requests at this time.'
                      : activeTab === 'club_members'
                        ? 'No requests from club members at this time.'
                        : 'No anonymous requests at this time.'
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredRequests.map((request) => (
                <BookAvailabilityRequestCard
                  key={request.id}
                  request={request}
                  onView={() => setSelectedRequest(request)}
                  onUpdateStatus={updateRequestStatus}
                  onDelete={deleteRequest}
                  isUpdating={updating === request.id}
                  isDeleting={deleting === request.id}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Request Detail Dialog */}
      {selectedRequest && (
        <BookAvailabilityRequestDetailDialog
          request={selectedRequest}
          isOpen={!!selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onUpdateStatus={updateRequestStatus}
          onDelete={deleteRequest}
          isUpdating={updating === selectedRequest.id}
          isDeleting={deleting === selectedRequest.id}
        />
      )}
    </div>
  );
};

// =====================================================
// Request Card Component
// =====================================================

interface BookAvailabilityRequestCardProps {
  request: BookAvailabilityRequestData;
  onView: () => void;
  onUpdateStatus: (requestId: string, status: BookAvailabilityRequestStatus, notes?: string) => void;
  onDelete: (requestId: string) => void;
  isUpdating: boolean;
  isDeleting: boolean;
}

const BookAvailabilityRequestCard: React.FC<BookAvailabilityRequestCardProps> = ({
  request,
  onView,
  onUpdateStatus,
  onDelete,
  isUpdating,
  isDeleting
}) => {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold text-bookconnect-brown line-clamp-2">
            {request.book_title}
          </CardTitle>
          <Badge className={getStatusColor(request.status)}>
            {formatRequestStatus(request.status)}
          </Badge>
        </div>
        <p className="text-bookconnect-brown/70">by {request.book_author}</p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Customer Info */}
        <div className="space-y-2">
          <div className="flex items-center text-sm text-bookconnect-brown/70">
            <User className="h-4 w-4 mr-2 flex-shrink-0" />
            <span className="truncate">{request.customer_name}</span>
          </div>
          <div className="flex items-center text-sm text-bookconnect-brown/70">
            <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
            <span className="truncate">{request.customer_email}</span>
          </div>
          <div className="flex items-center text-sm text-bookconnect-brown/70">
            <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
            <span>{request.customer_phone}</span>
          </div>
        </div>

        {/* Request Date */}
        <div className="flex items-center text-sm text-bookconnect-brown/70">
          <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
          <span>{new Date(request.created_at).toLocaleDateString()}</span>
        </div>

        {/* Description Preview */}
        {request.description && (
          <div className="text-sm text-bookconnect-brown/70">
            <p className="line-clamp-2">{request.description}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onView}
            className="flex-1"
          >
            <Eye className="h-4 w-4 mr-1" />
            View Details
          </Button>

          {request.status === 'pending' && (
            <Button
              size="sm"
              onClick={() => onUpdateStatus(request.id, 'responded')}
              disabled={isUpdating}
              className="bg-bookconnect-terracotta hover:bg-bookconnect-terracotta/90"
            >
              {isUpdating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Mark Responded'
              )}
            </Button>
          )}

          {/* Delete button for responded/resolved requests */}
          {(request.status === 'responded' || request.status === 'resolved') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(request.id)}
              disabled={isDeleting}
              className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// =====================================================
// Request Detail Dialog Component
// =====================================================

interface BookAvailabilityRequestDetailDialogProps {
  request: BookAvailabilityRequestData;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (requestId: string, status: BookAvailabilityRequestStatus, notes?: string) => void;
  onDelete: (requestId: string) => void;
  isUpdating: boolean;
  isDeleting: boolean;
}

const BookAvailabilityRequestDetailDialog: React.FC<BookAvailabilityRequestDetailDialogProps> = ({
  request,
  isOpen,
  onClose,
  onUpdateStatus,
  onDelete,
  isUpdating,
  isDeleting
}) => {
  const [newStatus, setNewStatus] = useState<BookAvailabilityRequestStatus>(request.status);
  const [notes, setNotes] = useState(request.store_owner_notes || '');

  const handleUpdate = () => {
    onUpdateStatus(request.id, newStatus, notes);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-serif text-bookconnect-brown">
            Book Availability Request Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Book Information */}
          <div className="bg-bookconnect-sage/10 p-4 rounded-lg">
            <h3 className="font-semibold text-bookconnect-brown mb-2">Book Information</h3>
            <div className="space-y-2">
              <div>
                <span className="font-medium">Title:</span> {request.book_title}
              </div>
              <div>
                <span className="font-medium">Author:</span> {request.book_author}
              </div>
              {request.description && (
                <div>
                  <span className="font-medium">Additional Details:</span>
                  <p className="mt-1 text-bookconnect-brown/70">{request.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Customer Information */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-bookconnect-brown mb-2">Customer Contact Information</h3>
            <div className="space-y-2">
              <div className="flex items-center">
                <User className="h-4 w-4 mr-2 text-bookconnect-brown/70" />
                <span>{request.customer_name}</span>
              </div>
              <div className="flex items-center">
                <Mail className="h-4 w-4 mr-2 text-bookconnect-brown/70" />
                <a
                  href={`mailto:${request.customer_email}`}
                  className="text-blue-600 hover:underline"
                >
                  {request.customer_email}
                </a>
              </div>
              <div className="flex items-center">
                <Phone className="h-4 w-4 mr-2 text-bookconnect-brown/70" />
                <a
                  href={`tel:${request.customer_phone}`}
                  className="text-blue-600 hover:underline"
                >
                  {request.customer_phone}
                </a>
              </div>
            </div>
          </div>

          {/* Request Status and Management */}
          <div className="space-y-4">
            <h3 className="font-semibold text-bookconnect-brown">Request Management</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-bookconnect-brown mb-2">
                  Status
                </label>
                <Select value={newStatus} onValueChange={(value) => setNewStatus(value as BookAvailabilityRequestStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending Review</SelectItem>
                    <SelectItem value="responded">Responded To</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-bookconnect-brown mb-2">
                  Current Status
                </label>
                <Badge className={getStatusColor(request.status)}>
                  {formatRequestStatus(request.status)}
                </Badge>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-bookconnect-brown mb-2">
                Internal Notes
              </label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add internal notes about this request..."
                rows={3}
              />
            </div>
          </div>

          {/* Request Metadata */}
          <div className="text-sm text-bookconnect-brown/70 space-y-1">
            <div>
              <span className="font-medium">Submitted:</span> {new Date(request.created_at).toLocaleString()}
            </div>
            {request.responded_at && (
              <div>
                <span className="font-medium">First Responded:</span> {new Date(request.responded_at).toLocaleString()}
              </div>
            )}
            <div>
              <span className="font-medium">Last Updated:</span> {new Date(request.updated_at).toLocaleString()}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-4 border-t">
            {/* Delete button for responded/resolved requests */}
            {(request.status === 'responded' || request.status === 'resolved') && (
              <Button
                variant="outline"
                onClick={() => {
                  onDelete(request.id);
                  onClose();
                }}
                disabled={isDeleting}
                className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Request
                  </>
                )}
              </Button>
            )}

            <div className="flex gap-3 ml-auto">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button
                onClick={handleUpdate}
                disabled={isUpdating}
                className="bg-bookconnect-terracotta hover:bg-bookconnect-terracotta/90"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Request'
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookAvailabilityRequestsManagement;
