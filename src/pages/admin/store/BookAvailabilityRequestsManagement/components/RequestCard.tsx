import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
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
import { 
  BookAvailabilityRequestData,
  BookAvailabilityRequestStatus,
  formatRequestStatus,
  getStatusColor
} from '@/types/bookAvailabilityRequests';

interface RequestCardProps {
  request: BookAvailabilityRequestData;
  onView: () => void;
  onUpdateStatus: (requestId: string, status: BookAvailabilityRequestStatus, notes?: string) => void;
  onDelete: (requestId: string) => void;
  isUpdating: boolean;
  isDeleting: boolean;
}

export const RequestCard: React.FC<RequestCardProps> = ({
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
        {/* Customer Information */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-bookconnect-brown/60" />
            <span className="font-medium">{request.customer_name}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-bookconnect-brown/70">
            <Mail className="h-4 w-4" />
            <span>{request.customer_email}</span>
          </div>
          
          {request.customer_phone && (
            <div className="flex items-center gap-2 text-sm text-bookconnect-brown/70">
              <Phone className="h-4 w-4" />
              <span>{request.customer_phone}</span>
            </div>
          )}
        </div>

        {/* Request Details */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-bookconnect-brown/70">
            <Calendar className="h-4 w-4" />
            <span>Requested {new Date(request.created_at).toLocaleDateString()}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            {request.request_source === 'authenticated_user' ? (
              <>
                <Users className="h-4 w-4 text-blue-600" />
                <span className="text-blue-600 font-medium">Club Member</span>
              </>
            ) : (
              <>
                <Globe className="h-4 w-4 text-gray-600" />
                <span className="text-gray-600 font-medium">Anonymous</span>
              </>
            )}
          </div>
        </div>

        {/* Description Preview */}
        {request.description && (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-bookconnect-brown/70">
              <MessageSquare className="h-4 w-4" />
              <span>Description</span>
            </div>
            <p className="text-sm text-bookconnect-brown/80 line-clamp-2 pl-6">
              {request.description}
            </p>
          </div>
        )}

        {/* Store Response Preview */}
        {request.store_owner_notes && (
          <div className="space-y-1 bg-bookconnect-cream/30 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-bookconnect-brown/70">
              <BookOpen className="h-4 w-4" />
              <span>Store Response</span>
            </div>
            <p className="text-sm text-bookconnect-brown/80 line-clamp-2">
              {request.store_owner_notes}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onView}
            className="flex-1"
          >
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Button>
          
          {request.status === 'pending' && (
            <Button
              size="sm"
              onClick={() => onUpdateStatus(request.id, 'responded')}
              disabled={isUpdating}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isUpdating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
            </Button>
          )}
          
          {(request.status === 'responded' || request.status === 'resolved') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(request.id)}
              disabled={isDeleting}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
