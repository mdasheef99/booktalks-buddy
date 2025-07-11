/**
 * BookListingCard Component
 * 
 * Card component for displaying individual book listing information.
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, Check, X, Trash2 } from 'lucide-react';
import {
  formatBookCondition,
  formatListingStatus,
  getStatusColor
} from '@/types/bookListings';
import { formatSubmissionDate, canUpdateListing, formatPrice } from '../utils/listingUtils';
import type { BookListingCardProps } from '../types';

export const BookListingCard: React.FC<BookListingCardProps> = ({
  listing,
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
            {listing.book_title}
          </CardTitle>
          <Badge className={getStatusColor(listing.status)}>
            {formatListingStatus(listing.status)}
          </Badge>
        </div>
        <p className="text-bookconnect-brown/70">
          by <span>{listing.book_author}</span>
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Book Image */}
        {listing.image_1_url && (
          <div className="aspect-[3/4] w-24 mx-auto">
            <img
              src={listing.image_1_url}
              alt={listing.book_title}
              className="w-full h-full object-cover rounded border"
            />
          </div>
        )}

        {/* Book Details */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Condition:</span>
            <span className="font-medium">{formatBookCondition(listing.book_condition)}</span>
          </div>
          
          {listing.asking_price && (
            <div className="flex justify-between">
              <span className="text-gray-600">Asking Price:</span>
              <span className="font-medium text-green-600">
                {formatPrice(listing.asking_price)}
              </span>
            </div>
          )}

          <div className="flex justify-between">
            <span className="text-gray-600">Submitted:</span>
            <span className="font-medium">
              {formatSubmissionDate(listing.created_at)}
            </span>
          </div>
        </div>

        {/* Customer Info */}
        <div className="pt-2 border-t border-gray-100">
          <p className="text-sm font-medium text-gray-700">{listing.customer_name}</p>
          <p className="text-xs text-gray-500">{listing.customer_email}</p>
        </div>

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

          {canUpdateListing(listing) && (
            <>
              <Button
                size="sm"
                onClick={() => onUpdateStatus(listing.id, 'approved')}
                disabled={isUpdating || isDeleting}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onUpdateStatus(listing.id, 'rejected')}
                disabled={isUpdating || isDeleting}
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          )}

          {/* Delete Button - Always available for store owners */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => onDelete(listing.id)}
            disabled={isUpdating || isDeleting}
            className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
          >
            {isDeleting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
