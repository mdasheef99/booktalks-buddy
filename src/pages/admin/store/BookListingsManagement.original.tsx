import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft, 
  BookOpen, 
  Eye, 
  Check, 
  X, 
  Clock, 
  Search,
  Mail,
  Phone,
  DollarSign,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useStoreOwnerAccess } from '@/hooks/useStoreOwnerAccess';
import { BookListingService } from '@/lib/services/bookListingService';
import { 
  BookListingData, 
  BookListingStatus,
  formatBookCondition,
  formatListingStatus,
  getStatusColor
} from '@/types/bookListings';

const BookListingsManagement: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isStoreOwner, storeId, loading: storeAccessLoading } = useStoreOwnerAccess();
  
  const [listings, setListings] = useState<BookListingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedListing, setSelectedListing] = useState<BookListingData | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);

  // Load listings
  const loadListings = async () => {
    if (!storeId) return;

    try {
      setLoading(true);
      setError(null);
      
      const statusFilter = activeTab === 'all' ? undefined : activeTab as BookListingStatus;
      const data = await BookListingService.getStoreBookListings(storeId, statusFilter);
      setListings(data);
    } catch (err) {
      console.error('Error loading book listings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load book listings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (storeId && !storeAccessLoading) {
      loadListings();
    }
  }, [storeId, storeAccessLoading, activeTab]);

  // Update listing status
  const updateListingStatus = async (
    listingId: string, 
    status: BookListingStatus, 
    notes?: string
  ) => {
    if (!storeId) return;

    try {
      setUpdating(listingId);
      
      await BookListingService.updateBookListingStatus(
        listingId,
        { status, store_owner_notes: notes },
        user?.id || ''
      );

      toast.success(`Listing ${status === 'approved' ? 'approved' : 'rejected'} successfully`);
      
      // Reload listings
      await loadListings();
      
      // Close dialog if open
      setSelectedListing(null);
    } catch (err) {
      console.error('Error updating listing:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to update listing');
    } finally {
      setUpdating(null);
    }
  };

  // Filter listings based on search
  const filteredListings = listings.filter(listing => 
    listing.book_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    listing.book_author.toLowerCase().includes(searchTerm.toLowerCase()) ||
    listing.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Loading state
  if (storeAccessLoading || loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // Access denied
  if (!isStoreOwner) {
    return (
      <div className="p-8 text-center">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to access book listings management.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={loadListings} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/admin/store-management')}
          className="mb-4 flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Store Management
        </Button>

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-serif text-bookconnect-brown mb-2">
              Book Listings Management
            </h1>
            <p className="text-bookconnect-brown/70">
              Review and manage customer book submissions
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search listings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="mb-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pending ({listings.filter(l => l.status === 'pending').length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex items-center gap-2">
            <Check className="h-4 w-4" />
            Approved ({listings.filter(l => l.status === 'approved').length})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="flex items-center gap-2">
            <X className="h-4 w-4" />
            Rejected ({listings.filter(l => l.status === 'rejected').length})
          </TabsTrigger>
          <TabsTrigger value="all" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            All ({listings.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredListings.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  No listings found
                </h3>
                <p className="text-gray-500">
                  {searchTerm 
                    ? 'No listings match your search criteria.' 
                    : `No ${activeTab === 'all' ? '' : activeTab} listings at this time.`
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredListings.map((listing) => (
                <BookListingCard
                  key={listing.id}
                  listing={listing}
                  onView={() => setSelectedListing(listing)}
                  onUpdateStatus={updateListingStatus}
                  isUpdating={updating === listing.id}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Listing Detail Dialog */}
      {selectedListing && (
        <BookListingDetailDialog
          listing={selectedListing}
          open={!!selectedListing}
          onClose={() => setSelectedListing(null)}
          onUpdateStatus={updateListingStatus}
          isUpdating={updating === selectedListing.id}
        />
      )}
    </div>
  );
};

// Book Listing Card Component
interface BookListingCardProps {
  listing: BookListingData;
  onView: () => void;
  onUpdateStatus: (id: string, status: BookListingStatus, notes?: string) => void;
  isUpdating: boolean;
}

const BookListingCard: React.FC<BookListingCardProps> = ({
  listing,
  onView,
  onUpdateStatus,
  isUpdating
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
        <p className="text-bookconnect-brown/70">by {listing.book_author}</p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Customer Info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Mail className="h-4 w-4" />
            <span>{listing.customer_name}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Mail className="h-4 w-4" />
            <span>{listing.customer_email}</span>
          </div>
          {listing.customer_phone && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="h-4 w-4" />
              <span>{listing.customer_phone}</span>
            </div>
          )}
        </div>

        {/* Book Details */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Condition:</span>
            <span className="font-medium">{formatBookCondition(listing.book_condition)}</span>
          </div>
          {listing.asking_price && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Asking Price:</span>
              <div className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                <span className="font-medium">{listing.asking_price.toFixed(2)}</span>
              </div>
            </div>
          )}
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Submitted:</span>
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{new Date(listing.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
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

          {listing.status === 'pending' && (
            <>
              <Button
                size="sm"
                onClick={() => onUpdateStatus(listing.id, 'approved')}
                disabled={isUpdating}
                className="bg-green-600 hover:bg-green-700"
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onUpdateStatus(listing.id, 'rejected')}
                disabled={isUpdating}
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Book Listing Detail Dialog Component
interface BookListingDetailDialogProps {
  listing: BookListingData;
  open: boolean;
  onClose: () => void;
  onUpdateStatus: (id: string, status: BookListingStatus, notes?: string) => void;
  isUpdating: boolean;
}

const BookListingDetailDialog: React.FC<BookListingDetailDialogProps> = ({
  listing,
  open,
  onClose,
  onUpdateStatus,
  isUpdating
}) => {
  const [notes, setNotes] = useState(listing.store_owner_notes || '');

  const handleStatusUpdate = (status: BookListingStatus) => {
    onUpdateStatus(listing.id, status, notes.trim() || undefined);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-bookconnect-brown">
            Book Listing Details
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Book Information */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-bookconnect-brown mb-4">Book Information</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">Title</label>
                  <p className="text-bookconnect-brown font-medium">{listing.book_title}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Author</label>
                  <p className="text-bookconnect-brown">{listing.book_author}</p>
                </div>
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
                    <p className="text-bookconnect-brown font-medium">${listing.asking_price.toFixed(2)}</p>
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
              <h3 className="text-lg font-semibold text-bookconnect-brown mb-4">Customer Information</h3>
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
          </div>

          {/* Images and Status */}
          <div className="space-y-6">
            {/* Images */}
            {(listing.image_1_url || listing.image_2_url || listing.image_3_url) && (
              <div>
                <h3 className="text-lg font-semibold text-bookconnect-brown mb-4">Images</h3>
                <div className="grid grid-cols-2 gap-4">
                  {listing.image_1_url && (
                    <img
                      src={listing.image_1_url}
                      alt="Book image 1"
                      className="w-full h-32 object-cover rounded-lg border"
                    />
                  )}
                  {listing.image_2_url && (
                    <img
                      src={listing.image_2_url}
                      alt="Book image 2"
                      className="w-full h-32 object-cover rounded-lg border"
                    />
                  )}
                  {listing.image_3_url && (
                    <img
                      src={listing.image_3_url}
                      alt="Book image 3"
                      className="w-full h-32 object-cover rounded-lg border"
                    />
                  )}
                </div>
              </div>
            )}

            {/* Status and Notes */}
            <div>
              <h3 className="text-lg font-semibold text-bookconnect-brown mb-4">Status & Notes</h3>
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
                  />
                </div>

                {listing.reviewed_at && (
                  <div className="text-sm text-gray-600">
                    Last reviewed: {new Date(listing.reviewed_at).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-6 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>

          {listing.status === 'pending' && (
            <>
              <Button
                onClick={() => handleStatusUpdate('rejected')}
                disabled={isUpdating}
                variant="destructive"
              >
                {isUpdating ? 'Updating...' : 'Reject'}
              </Button>
              <Button
                onClick={() => handleStatusUpdate('approved')}
                disabled={isUpdating}
                className="bg-green-600 hover:bg-green-700"
              >
                {isUpdating ? 'Updating...' : 'Approve'}
              </Button>
            </>
          )}

          {listing.status !== 'pending' && (
            <Button
              onClick={() => handleStatusUpdate('pending')}
              disabled={isUpdating}
              variant="outline"
            >
              {isUpdating ? 'Updating...' : 'Reset to Pending'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookListingsManagement;
