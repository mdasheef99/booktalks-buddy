import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Settings, Users, MessageSquare, ArrowLeft, Search, Filter, X, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useHasEntitlement } from '@/lib/entitlements/hooks';
import { useStoreManagerAccess } from '@/hooks/store-manager/useStoreManagerAccess';
import { deleteBookClub } from '@/lib/api';
import DestructiveActionDialog from '@/components/common/DestructiveActionDialog';

interface BookClub {
  id: string;
  name: string;
  description: string | null;
  privacy: string | null;
  created_at: string;
  store_id: string;
}

const AdminClubManagementPage: React.FC = () => {
  const [clubs, setClubs] = useState<BookClub[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [privacyFilter, setPrivacyFilter] = useState<string>('all');
  const [clubToDelete, setClubToDelete] = useState<BookClub | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { result: canManageAllClubs, loading: entitlementsLoading } = useHasEntitlement('CAN_MANAGE_ALL_CLUBS');
  const { isStoreManager, storeId, loading: storeAccessLoading } = useStoreManagerAccess();

  useEffect(() => {
    const fetchAllClubs = async () => {
      // Wait for all loading states to complete
      if (entitlementsLoading || storeAccessLoading) return;

      // Check if user has any club management permissions
      const hasClubAccess = canManageAllClubs || isStoreManager;
      if (!hasClubAccess) {
        setLoading(false);
        return;
      }

      try {
        console.log('🏪 Fetching clubs for admin management', {
          canManageAllClubs,
          isStoreManager,
          storeId
        });

        let query = supabase
          .from('book_clubs')
          .select('*')
          .order('created_at', { ascending: false });

        // If user is a Store Manager (but not platform admin), filter by their store
        if (isStoreManager && !canManageAllClubs && storeId) {
          query = query.eq('store_id', storeId);
          console.log('🏪 Filtering clubs by store:', storeId);
        }

        const { data, error } = await query;

        if (error) throw error;

        console.log('✅ Fetched clubs:', data?.length || 0);
        setClubs(data || []);
      } catch (error) {
        console.error('Error fetching clubs:', error);
        toast.error('Failed to load book clubs');
      } finally {
        setLoading(false);
      }
    };

    fetchAllClubs();
  }, [canManageAllClubs, entitlementsLoading, isStoreManager, storeId, storeAccessLoading]);

  // Filter and search clubs
  const filteredClubs = useMemo(() => {
    let filtered = clubs;

    // Apply privacy filter
    if (privacyFilter !== 'all') {
      filtered = filtered.filter(club => club.privacy === privacyFilter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(club =>
        club.name.toLowerCase().includes(query) ||
        (club.description && club.description.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [clubs, searchQuery, privacyFilter]);

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setPrivacyFilter('all');
  };

  const handleCreateClub = () => {
    navigate('/book-club/new');
  };

  const handleEditClub = (clubId: string) => {
    navigate(`/book-club/${clubId}/settings`);
  };

  const handleViewMembers = (clubId: string) => {
    navigate(`/book-club/${clubId}/members`);
  };

  const handleViewDiscussions = (clubId: string) => {
    navigate(`/book-club/${clubId}`);
  };

  const handleDeleteClub = (club: BookClub) => {
    setClubToDelete(club);
  };

  const confirmDeleteClub = async () => {
    if (!clubToDelete || !user) return;

    setIsDeleting(true);
    try {
      await deleteBookClub(user.id, clubToDelete.id);
      toast.success('Book club deleted successfully');

      // Remove the deleted club from the list
      setClubs(clubs.filter(club => club.id !== clubToDelete.id));
      setClubToDelete(null);
    } catch (error) {
      console.error('Error deleting club:', error);
      toast.error('Failed to delete club');
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDeleteClub = () => {
    setClubToDelete(null);
  };

  // Helper function to determine if a club can be deleted by the current admin user
  const canDeleteClub = (club: BookClub): boolean => {
    // Admin users with club management permissions can delete clubs
    return canManageAllClubs;
  };

  if (loading || entitlementsLoading || storeAccessLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-64 bg-gray-300 rounded"></div>
        <div className="h-12 w-32 bg-gray-300 rounded"></div>
        <div className="space-y-4">
          <div className="h-32 bg-gray-300 rounded"></div>
          <div className="h-32 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  // Show access denied if user doesn't have any club management permissions
  const hasClubAccess = canManageAllClubs || isStoreManager;
  if (!hasClubAccess) {
    return (
      <div className="text-center p-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600">You must have club management permissions to access this page.</p>
        <Button
          variant="outline"
          onClick={() => navigate('/admin/dashboard')}
          className="mt-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div>
      <Button
        variant="ghost"
        onClick={() => navigate('/admin/dashboard')}
        className="mb-4 flex items-center gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Button>

      <h1 className="text-3xl font-serif text-bookconnect-brown mb-8">
        {isStoreManager && !canManageAllClubs ? 'Store Club Management' : 'Book Club Management'}
      </h1>

      <Button
        onClick={handleCreateClub}
        className="mb-6 bg-bookconnect-terracotta hover:bg-bookconnect-terracotta/90"
      >
        <Plus className="h-4 w-4 mr-2" />
        Create New Club
      </Button>

      {/* Search and Filter Controls */}
      {clubs.length > 0 && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search clubs by name or description..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Privacy Filter */}
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <Select value={privacyFilter} onValueChange={setPrivacyFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Privacy" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Clubs</SelectItem>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Clear Filters Button */}
              {(searchQuery || privacyFilter !== 'all') && (
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Clear
                </Button>
              )}
            </div>

            {/* Results Summary */}
            <div className="mt-4 text-sm text-gray-600">
              Showing {filteredClubs.length} of {clubs.length} clubs
              {searchQuery && (
                <span> matching "{searchQuery}"</span>
              )}
              {privacyFilter !== 'all' && (
                <span> • {privacyFilter} clubs only</span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {filteredClubs.length > 0 ? (
          filteredClubs.map((club) => (
            <Card key={club.id} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-semibold">{club.name}</h3>
                    <p className="text-muted-foreground mt-1">
                      {club.description || 'No description available'}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs bg-bookconnect-sage/20 text-bookconnect-sage px-2 py-1 rounded-full">
                        {club.privacy || 'public'}
                      </span>
                      <span className="text-xs text-gray-500">
                        Created: {new Date(club.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewMembers(club.id)}
                    >
                      <Users className="h-4 w-4 mr-1" />
                      Members
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDiscussions(club.id)}
                    >
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Discussions
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditClub(club.id)}
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      Settings
                    </Button>
                    {canDeleteClub(club) && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteClub(club)}
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              {clubs.length === 0 ? (
                <>
                  <p className="text-muted-foreground">No book clubs found</p>
                  <Button
                    onClick={handleCreateClub}
                    className="mt-4 bg-bookconnect-terracotta hover:bg-bookconnect-terracotta/90"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Club
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-muted-foreground">
                    No clubs match your current filters
                  </p>
                  <Button
                    onClick={clearFilters}
                    variant="outline"
                    className="mt-4"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear Filters
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <DestructiveActionDialog
        isOpen={!!clubToDelete}
        onClose={cancelDeleteClub}
        onConfirm={confirmDeleteClub}
        title="Delete Book Club"
        description={`Are you sure you want to delete "${clubToDelete?.name}"? This will permanently remove the club and all associated data including members, discussions, and events.`}
        confirmText="Delete Club"
        cancelText="Cancel"
        severity="high"
        isLoading={isDeleting}
        affectedItems={[
          'All club members will be removed',
          'All discussions and posts will be deleted',
          'All club events will be cancelled',
          'This action cannot be undone'
        ]}
        affectedItemsLabel="What will be deleted:"
      />
    </div>
  );
};

export default AdminClubManagementPage;
