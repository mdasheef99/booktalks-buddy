import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
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
import { 
  BookAvailabilityRequestData,
  BookAvailabilityRequestStatus,
  formatRequestStatus,
  getStatusColor
} from '@/types/bookAvailabilityRequests';

interface RequestDetailDialogProps {
  request: BookAvailabilityRequestData;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (requestId: string, status: BookAvailabilityRequestStatus, notes?: string) => void;
  onDelete: (requestId: string) => void;
  isUpdating: boolean;
  isDeleting: boolean;
}

export const RequestDetailDialog: React.FC<RequestDetailDialogProps> = ({
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
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-bookconnect-brown flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Book Information
            </h3>
            <div className="bg-bookconnect-cream/20 p-4 rounded-lg space-y-2">
              <div>
                <span className="font-medium text-bookconnect-brown">Title:</span>
                <p className="text-bookconnect-brown/80">{request.book_title}</p>
              </div>
              <div>
                <span className="font-medium text-bookconnect-brown">Author:</span>
                <p className="text-bookconnect-brown/80">{request.book_author}</p>
              </div>
              {request.description && (
                <div>
                  <span className="font-medium text-bookconnect-brown">Description:</span>
                  <p className="text-bookconnect-brown/80 whitespace-pre-wrap">{request.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Customer Information */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-bookconnect-brown flex items-center gap-2">
              <User className="h-5 w-5" />
              Customer Information
            </h3>
            <div className="bg-bookconnect-cream/20 p-4 rounded-lg space-y-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-bookconnect-brown/60" />
                <span className="font-medium">{request.customer_name}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-bookconnect-brown/60" />
                <span>{request.customer_email}</span>
              </div>
              
              {request.customer_phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-bookconnect-brown/60" />
                  <span>{request.customer_phone}</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                {request.request_source === 'authenticated_user' ? (
                  <>
                    <Users className="h-4 w-4 text-blue-600" />
                    <span className="text-blue-600 font-medium">Club Member</span>
                  </>
                ) : (
                  <>
                    <Globe className="h-4 w-4 text-gray-600" />
                    <span className="text-gray-600 font-medium">Anonymous Request</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Request Status and Timeline */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-bookconnect-brown flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Request Status
            </h3>
            <div className="bg-bookconnect-cream/20 p-4 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">Current Status:</span>
                <Badge className={getStatusColor(request.status)}>
                  {formatRequestStatus(request.status)}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-bookconnect-brown/70">
                <Calendar className="h-4 w-4" />
                <span>Requested on {new Date(request.created_at).toLocaleDateString()}</span>
              </div>
              
              {request.responded_at && (
                <div className="flex items-center gap-2 text-sm text-bookconnect-brown/70">
                  <CheckCircle className="h-4 w-4" />
                  <span>Responded on {new Date(request.responded_at).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Store Response Section */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-bookconnect-brown flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Store Response
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-bookconnect-brown mb-2">
                  Update Status
                </label>
                <Select value={newStatus} onValueChange={(value: BookAvailabilityRequestStatus) => setNewStatus(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-yellow-600" />
                        Pending
                      </div>
                    </SelectItem>
                    <SelectItem value="responded">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                        Responded
                      </div>
                    </SelectItem>
                    <SelectItem value="resolved">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Resolved
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-bookconnect-brown mb-2">
                  Response Notes
                </label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add your response or notes for the customer..."
                  rows={4}
                  className="resize-none"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={handleUpdate}
              disabled={isUpdating}
              className="flex-1"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Update Request
                </>
              )}
            </Button>
            
            {(request.status === 'responded' || request.status === 'resolved') && (
              <Button
                variant="outline"
                onClick={() => onDelete(request.id)}
                disabled={isDeleting}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </>
                )}
              </Button>
            )}
            
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
