/**
 * User Store Requests Component
 * 
 * View and manage user's submitted store requests
 * Follows BookConnect design system patterns
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Store, 
  Loader2, 
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  Package
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { 
  BookAvailabilityRequest,
  getUserStoreRequests,
  cancelStoreRequest,
  getUserRequestStats
} from '@/services/books/storeRequestsService';
import StoreRequestCard from './StoreRequestCard';

interface UserStoreRequestsProps {
  className?: string;
}

const UserStoreRequests: React.FC<UserStoreRequestsProps> = ({ className }) => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<BookAvailabilityRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalRequests: 0,
    pendingRequests: 0,
    respondedRequests: 0,
    resolvedRequests: 0
  });

  useEffect(() => {
    if (user) {
      loadRequests();
      loadStats();
    }
  }, [user]);

  const loadRequests = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const userRequests = await getUserStoreRequests(user.id);
      setRequests(userRequests);
    } catch (error) {
      console.error('Error loading store requests:', error);
      toast.error('Failed to load your store requests');
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    if (!user) return;

    try {
      const requestStats = await getUserRequestStats(user.id);
      setStats(requestStats);
    } catch (error) {
      console.error('Error loading request stats:', error);
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    if (!user) return;

    setCancellingId(requestId);
    try {
      const success = await cancelStoreRequest(user.id, requestId);
      
      if (success) {
        // Remove from local state
        setRequests(prev => prev.filter(req => req.id !== requestId));
        toast.success('Request cancelled successfully');
        
        // Reload stats
        loadStats();
      } else {
        toast.error('Failed to cancel request');
      }
    } catch (error) {
      console.error('Error cancelling request:', error);
      toast.error('Failed to cancel request');
    } finally {
      setCancellingId(null);
    }
  };

  const handleRefresh = () => {
    loadRequests();
    loadStats();
  };

  const filterRequests = (status?: string) => {
    if (!status || status === 'all') return requests;
    return requests.filter(req => req.status === status);
  };

  const getTabCounts = () => {
    return {
      all: requests.length,
      pending: requests.filter(r => r.status === 'pending').length,
      responded: requests.filter(r => r.status === 'responded').length,
      resolved: requests.filter(r => r.status === 'resolved').length
    };
  };

  const tabCounts = getTabCounts();
  const filteredRequests = filterRequests(activeTab);

  if (!user) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <Store className="h-12 w-12 text-bookconnect-brown/30 mx-auto mb-4" />
          <p className="text-bookconnect-brown/70">
            Please sign in to view your store requests.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      {/* Header with Stats */}
      <Card className="mb-6">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="font-serif text-bookconnect-brown flex items-center gap-2">
              <Store className="h-5 w-5" />
              Your Store Requests
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-bookconnect-brown">{stats.totalRequests}</div>
              <div className="text-sm text-bookconnect-brown/70">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600">{stats.pendingRequests}</div>
              <div className="text-sm text-bookconnect-brown/70">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.respondedRequests}</div>
              <div className="text-sm text-bookconnect-brown/70">Responded</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.resolvedRequests}</div>
              <div className="text-sm text-bookconnect-brown/70">Resolved</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requests Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all" className="flex items-center gap-2">
            All ({tabCounts.all})
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pending ({tabCounts.pending})
          </TabsTrigger>
          <TabsTrigger value="responded" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Responded ({tabCounts.responded})
          </TabsTrigger>
          <TabsTrigger value="resolved" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Resolved ({tabCounts.resolved})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-bookconnect-brown" />
              <span className="ml-2 text-bookconnect-brown/70">Loading requests...</span>
            </div>
          ) : filteredRequests.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Store className="h-12 w-12 text-bookconnect-brown/30 mx-auto mb-4" />
                <h3 className="font-serif text-lg font-semibold text-bookconnect-brown mb-2">
                  No {activeTab === 'all' ? '' : activeTab} requests found
                </h3>
                <p className="text-bookconnect-brown/70">
                  {activeTab === 'all' 
                    ? "You haven't made any store requests yet. Start by searching for books and requesting them from local stores."
                    : `You don't have any ${activeTab} requests at the moment.`
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRequests.map((request) => (
                <StoreRequestCard
                  key={request.id}
                  request={request}
                  onCancel={handleCancelRequest}
                  isCancelling={cancellingId === request.id}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserStoreRequests;
