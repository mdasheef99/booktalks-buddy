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
                ${listing.asking_price.toFixed(2)}
              </span>
            </div>
          )}

          <div className="flex justify-between">
            <span className="text-gray-600">Submitted:</span>
            <span className="font-medium">
              {new Date(listing.created_at).toLocaleDateString()}
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

          {listing.status === 'pending' && (
            <>
              <Button
                size="sm"
                onClick={() => onUpdateStatus(listing.id, 'approved')}
                disabled={isUpdating}
                className="bg-green-600 hover:bg-green-700 text-white"
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
          <DialogTitle className="text-xl font-serif text-bookconnect-brown">
            {listing.book_title}
          </DialogTitle>
          <p className="text-bookconnect-brown/70">by {listing.book_author}</p>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Book Images */}
          <div className="space-y-4">
            <h3 className="font-semibold text-bookconnect-brown">Book Photos</h3>
            <div className="grid grid-cols-1 gap-4">
              {[listing.image_1_url, listing.image_2_url, listing.image_3_url]
                .filter(Boolean)
                .map((url, index) => (
                  <img
                    key={index}
                    src={url!}
                    alt={`${listing.book_title} - Photo ${index + 1}`}
                    className="w-full h-64 object-cover rounded border"
                  />
                ))}
            </div>
          </div>

          {/* Book & Customer Details */}
          <div className="space-y-6">
            {/* Book Information */}
            <div>
              <h3 className="font-semibold text-bookconnect-brown mb-3">Book Information</h3>
              <div className="space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-gray-600">Condition:</span>
                  <span className="font-medium">{formatBookCondition(listing.book_condition)}</span>
                </div>
                
                {listing.book_isbn && (
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-gray-600">ISBN:</span>
                    <span className="font-medium">{listing.book_isbn}</span>
                  </div>
                )}
                
                {listing.asking_price && (
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-gray-600">Asking Price:</span>
                    <span className="font-medium text-green-600">
                      ${listing.asking_price.toFixed(2)}
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <span className="text-gray-600">Status:</span>
                  <Badge className={getStatusColor(listing.status)}>
                    {formatListingStatus(listing.status)}
                  </Badge>
                </div>
              </div>

              {listing.book_description && (
                <div className="mt-4">
                  <span className="text-gray-600 text-sm">Description:</span>
                  <p className="text-sm mt-1 p-3 bg-gray-50 rounded border">
                    {listing.book_description}
                  </p>
                </div>
              )}
            </div>

            {/* Customer Information */}
            <div>
              <h3 className="font-semibold text-bookconnect-brown mb-3">Customer Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium">{listing.customer_name}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <a 
                    href={`mailto:${listing.customer_email}`}
                    className="text-blue-600 hover:underline"
                  >
                    {listing.customer_email}
                  </a>
                </div>
                
                {listing.customer_phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <a 
                      href={`tel:${listing.customer_phone}`}
                      className="text-blue-600 hover:underline"
                    >
                      {listing.customer_phone}
                    </a>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">
                    Submitted: {new Date(listing.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Store Owner Notes */}
            <div>
              <h3 className="font-semibold text-bookconnect-brown mb-3">Store Owner Notes</h3>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this listing (optional)"
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">
                {notes.length}/500 characters
              </p>
            </div>

            {/* Actions */}
            {listing.status === 'pending' && (
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  onClick={() => handleStatusUpdate('approved')}
                  disabled={isUpdating}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Approve Listing
                </Button>
                <Button
                  onClick={() => handleStatusUpdate('rejected')}
                  disabled={isUpdating}
                  variant="destructive"
                  className="flex-1"
                >
                  <X className="h-4 w-4 mr-2" />
                  Reject Listing
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookListingsManagement;
