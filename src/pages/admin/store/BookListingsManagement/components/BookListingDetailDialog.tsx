/**
 * BookListingDetailDialog Component
 * 
 * Modal dialog for viewing and managing detailed book listing information.
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Trash2 } from 'lucide-react';
import { 
  formatBookCondition,
  formatListingStatus,
  getStatusColor
} from '@/types/bookListings';
import {
  hasImages,
  getImageUrls,
  formatReviewDate,
  canUpdateListing,
  formatPrice
} from '../utils/listingUtils';
import type { BookListingDetailDialogProps } from '../types';

export const BookListingDetailDialog: React.FC<BookListingDetailDialogProps> = ({
  listing,
  open,
  onClose,
  onUpdateStatus,
  onDelete,
  isUpdating,
  isDeleting
}) => {
  const [notes, setNotes] = useState(listing.store_owner_notes || '');

  const handleStatusUpdate = (status: 'approved' | 'rejected' | 'pending') => {
    onUpdateStatus(listing.id, status, notes.trim() || undefined);
  };

  const imageUrls = getImageUrls(listing);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-serif text-bookconnect-brown">
            {listing.book_title}
          </DialogTitle>
          <p className="text-bookconnect-brown/70">by {listing.book_author}</p>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Book Images */}
          <div className="space-y-4">
            <h3 className="font-semibold text-bookconnect-brown">Book Photos</h3>
            {hasImages(listing) ? (
              <div className="grid grid-cols-1 gap-4">
                {imageUrls.map((url, index) => (
                  <img
                    key={index}
                    src={url}
                    alt={`${listing.book_title} - Photo ${index + 1}`}
                    className="w-full h-64 object-cover rounded border"
                  />
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No images provided</p>
            )}
          </div>

          {/* Book Details */}
          <div className="space-y-6">
            {/* Book Information */}
            <div>
              <h3 className="font-semibold text-bookconnect-brown mb-4">Book Information</h3>
              <div className="space-y-3">
                {listing.book_isbn && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">ISBN</label>
                    <p className="text-bookconnect-brown">{listing.book_isbn}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-600">Condition</label>
                  <p className="text-bookconnect-brown">{formatBookCondition(listing.book_condition)}</p>
                </div>
                {listing.asking_price && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Asking Price</label>
                    <p className="text-bookconnect-brown font-medium">{formatPrice(listing.asking_price)}</p>
                  </div>
                )}
                {listing.book_description && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Description</label>
                    <p className="text-bookconnect-brown">{listing.book_description}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Customer Information */}
            <div>
              <h3 className="font-semibold text-bookconnect-brown mb-4">Customer Information</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">Name</label>
                  <p className="text-bookconnect-brown">{listing.customer_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Email</label>
                  <p className="text-bookconnect-brown">{listing.customer_email}</p>
                </div>
                {listing.customer_phone && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Phone</label>
                    <p className="text-bookconnect-brown">{listing.customer_phone}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Status and Notes */}
            <div>
              <h3 className="font-semibold text-bookconnect-brown mb-4">Status & Notes</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Current Status</label>
                  <div className="mt-1">
                    <Badge className={getStatusColor(listing.status)}>
                      {formatListingStatus(listing.status)}
                    </Badge>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Store Owner Notes</label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add notes about this listing..."
                    className="mt-1"
                    rows={4}
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {notes.length}/500 characters
                  </p>
                </div>

                {listing.reviewed_at && (
                  <div className="text-sm text-gray-600">
                    Last reviewed: {formatReviewDate(listing.reviewed_at)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between pt-6 border-t">
          {/* Delete Button - Left side */}
          <Button
            onClick={() => onDelete(listing.id)}
            disabled={isUpdating || isDeleting}
            variant="outline"
            className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
          >
            {isDeleting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Listing
              </>
            )}
          </Button>

          {/* Status and Close Buttons - Right side */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>

            {canUpdateListing(listing) && (
              <>
                <Button
                  onClick={() => handleStatusUpdate('rejected')}
                  disabled={isUpdating || isDeleting}
                  variant="destructive"
                >
                  {isUpdating ? 'Updating...' : 'Reject'}
                </Button>
                <Button
                  onClick={() => handleStatusUpdate('approved')}
                  disabled={isUpdating || isDeleting}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isUpdating ? 'Updating...' : 'Approve'}
                </Button>
              </>
            )}

            {!canUpdateListing(listing) && (
              <Button
                onClick={() => handleStatusUpdate('pending')}
                disabled={isUpdating || isDeleting}
                variant="outline"
              >
                {isUpdating ? 'Updating...' : 'Reset to Pending'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
