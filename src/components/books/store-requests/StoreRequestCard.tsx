/**
 * Store Request Card Component
 * 
 * Individual store request display card
 * Follows BookConnect design system patterns
 */

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  BookOpen,
  MoreHorizontal,
  Trash2,
  ExternalLink,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BookAvailabilityRequest } from '@/services/books/storeRequestsService';
import StoreRequestStatus from './StoreRequestStatus';

interface StoreRequestCardProps {
  request: BookAvailabilityRequest;
  onCancel?: (requestId: string) => void;
  onViewDetails?: (request: BookAvailabilityRequest) => void;
  isCancelling?: boolean;
  className?: string;
}

const StoreRequestCard: React.FC<StoreRequestCardProps> = ({
  request,
  onCancel,
  onViewDetails,
  isCancelling = false,
  className
}) => {
  const [imageError, setImageError] = useState(false);

  const handleCancel = () => {
    if (onCancel && request.status === 'pending') {
      onCancel(request.id);
    }
  };

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(request);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const canCancel = request.status === 'pending' && onCancel;

  return (
    <Card className={cn('group hover:shadow-lg transition-shadow duration-200', className)}>
      <CardContent className="p-4">
        {/* Header with Store Info */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-bookconnect-brown">
              {request.stores?.name || 'Unknown Store'}
            </h3>
            <StoreRequestStatus status={request.status} requestedAt={request.created_at} />
          </div>
          
          {/* Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {onViewDetails && (
                <DropdownMenuItem onClick={handleViewDetails}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Details
                </DropdownMenuItem>
              )}
              
              {canCancel && (
                <DropdownMenuItem 
                  onClick={handleCancel}
                  disabled={isCancelling}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {isCancelling ? 'Cancelling...' : 'Cancel Request'}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Book Information */}
        <div className="flex gap-3 mb-3">
          {/* Book Cover */}
          <div className="flex-shrink-0">
            {request.personal_books?.cover_url && !imageError ? (
              <img
                src={request.personal_books.cover_url}
                alt={request.book_title}
                className="w-12 h-16 object-cover rounded shadow-sm"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-12 h-16 bg-bookconnect-brown/10 rounded flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-bookconnect-brown/50" />
              </div>
            )}
          </div>

          {/* Book Details */}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-bookconnect-brown line-clamp-2 mb-1">
              {request.book_title}
            </h4>
            <p className="text-sm text-bookconnect-brown/70 mb-2">
              by {request.book_author}
            </p>
            
            {request.book_isbn && (
              <p className="text-xs text-bookconnect-brown/60">
                ISBN: {request.book_isbn}
              </p>
            )}
          </div>
        </div>

        {/* Request Details */}
        <div className="space-y-2 text-sm text-bookconnect-brown/70">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>Requested {formatDate(request.created_at)}</span>
          </div>

          {request.responded_at && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Responded {formatDate(request.responded_at)}</span>
            </div>
          )}
        </div>

        {/* Additional Notes */}
        {request.description && (
          <div className="mt-3 p-2 bg-bookconnect-cream/30 rounded text-sm">
            <p className="font-medium text-bookconnect-brown mb-1">Your Notes:</p>
            <p className="text-bookconnect-brown/80 text-xs line-clamp-2">
              {request.description}
            </p>
          </div>
        )}

        {/* Store Response */}
        {request.store_response && (
          <div className="mt-3 p-2 bg-muted/50 rounded text-sm">
            <p className="font-medium text-bookconnect-brown mb-1">Store Response:</p>
            <p className="text-bookconnect-brown/80 text-xs line-clamp-3">
              {request.store_response}
            </p>
          </div>
        )}

        {/* Action Buttons for Responded Books */}
        {request.status === 'responded' && (
          <div className="mt-3 pt-3 border-t border-bookconnect-brown/10">
            <Button
              size="sm"
              className="w-full bg-bookconnect-terracotta hover:bg-bookconnect-terracotta/90"
              onClick={() => {
                // TODO: Implement contact store functionality
                // For now, show a message that the book is available
                alert(`Great! "${request.book_title}" is available at ${request.stores?.name || 'the store'}. Please visit the store or contact them directly.`);
              }}
            >
              Book Available - Visit Store
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StoreRequestCard;
