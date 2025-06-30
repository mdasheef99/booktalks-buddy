import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Mail, UserPlus, ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { UserTierManager } from '@/components/admin/UserTierManager';
import UserTierBadge from '@/components/common/UserTierBadge';
import { UserSubscriptionInfo } from '@/components/admin/UserSubscriptionInfo';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useStoreOwnerAccess } from '@/hooks/useStoreOwnerAccess';

interface User {
  id: string;
  username: string | null;
  email: string | null;
  favorite_genre: string | null;
  favorite_author: string | null;
  membership_tier: string;
}

const AdminUserListPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [showInviteForm, setShowInviteForm] = useState(false);
  const navigate = useNavigate();

  // Use proper store owner access hook
  const {
    isStoreOwner,
    storeId,
    storeName,
    loading: storeAccessLoading,
    error: storeAccessError
  } = useStoreOwnerAccess();

  // Debug logging for store owner access
  React.useEffect(() => {
    console.log('🔍 AdminUserListPage Debug Info:');
    console.log('  isStoreOwner:', isStoreOwner);
    console.log('  storeId:', storeId);
    console.log('  storeName:', storeName);
    console.log('  storeAccessLoading:', storeAccessLoading);
    console.log('  storeAccessError:', storeAccessError);
  }, [isStoreOwner, storeId, storeName, storeAccessLoading, storeAccessError]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // Fetch users with their membership tiers
        const { data, error } = await supabase
          .from('users')
          .select('id, username, email, favorite_genre, favorite_author, membership_tier')
          .order('username');

        if (error) throw error;
        setUsers(data || []);
        setFilteredUsers(data || []);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error('Failed to load users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = users.filter(user =>
        (user.username && user.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchQuery, users]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inviteEmail) {
      toast.error('Please enter an email address');
      return;
    }

    try {
      // This is a placeholder for actual invite functionality
      // In a real implementation, you would send an invitation email
      toast.success(`Invitation sent to ${inviteEmail}`);
      setInviteEmail('');
      setShowInviteForm(false);
    } catch (error) {
      console.error('Error sending invite:', error);
      toast.error('Failed to send invitation');
    }
  };

  // Show loading state while either users or store access is loading
  if (loading || storeAccessLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-64 bg-gray-300 rounded"></div>
        <div className="h-12 bg-gray-300 rounded"></div>
        <div className="space-y-4">
          <div className="h-20 bg-gray-300 rounded"></div>
          <div className="h-20 bg-gray-300 rounded"></div>
          <div className="h-20 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  // Show error state if there's an issue with store access
  if (storeAccessError) {
    return (
      <div className="max-w-md mx-auto mt-8">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-600 mb-4">
              Unable to verify store owner access: {storeAccessError}
            </p>
            <Button onClick={() => navigate('/admin/dashboard')} variant="outline">
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
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

      <div className="mb-8">
        <h1 className="text-3xl font-serif text-bookconnect-brown">User Management</h1>
        {isStoreOwner && storeName && (
          <p className="text-muted-foreground mt-2">
            Managing users for <span className="font-medium">{storeName}</span>
          </p>
        )}
        {!isStoreOwner && (
          <p className="text-amber-600 mt-2">
            Store Owner access required for tier management features
          </p>
        )}
      </div>

      <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search users..."
            className="pl-10"
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>

        <Button
          onClick={() => setShowInviteForm(!showInviteForm)}
          className="bg-bookconnect-terracotta hover:bg-bookconnect-terracotta/90"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Invite User
        </Button>
      </div>

      {showInviteForm && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <form onSubmit={handleInvite} className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  type="email"
                  placeholder="Email address"
                  className="pl-10"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit">Send Invite</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowInviteForm(false)}
              >
                Cancel
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => (
            <Card key={user.id}>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold">{user.username || 'No username'}</h3>
                    <p className="text-muted-foreground">{user.email || 'No email'}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {user.favorite_genre && (
                        <span className="text-xs bg-bookconnect-sage/20 text-bookconnect-sage px-2 py-1 rounded-full">
                          {user.favorite_genre}
                        </span>
                      )}
                      {user.favorite_author && (
                        <span className="text-xs bg-bookconnect-cream text-bookconnect-brown px-2 py-1 rounded-full">
                          {user.favorite_author}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    {(() => {
                      // Debug logging for conditional rendering
                      console.log('🎨 Conditional Rendering Debug for user:', user.id);
                      console.log('  isStoreOwner:', isStoreOwner);
                      console.log('  storeId:', storeId);
                      console.log('  condition (isStoreOwner && storeId):', isStoreOwner && storeId);

                      if (isStoreOwner && storeId) {
                        console.log('  ✅ Rendering UserTierManager');
                        return (
                          <UserTierManager
                            userId={user.id}
                            currentTier={user.membership_tier || 'MEMBER'}
                            storeId={storeId}
                            onTierUpdated={(newTier) => {
                              // Update the local state when tier changes
                              setUsers(users.map(u =>
                                u.id === user.id ? { ...u, membership_tier: newTier } : u
                              ));
                              setFilteredUsers(filteredUsers.map(u =>
                                u.id === user.id ? { ...u, membership_tier: newTier } : u
                              ));
                            }}
                          />
                        );
                      } else {
                        console.log('  ❌ Rendering UserTierBadge only');
                        return (
                          <div className="flex items-center space-x-2">
                            <UserTierBadge tier={user.membership_tier || 'MEMBER'} showFreeTier={true} />
                            <span className="text-sm text-muted-foreground">
                              {!isStoreOwner
                                ? "(Store Owner access required)"
                                : "(Store required for tier management)"
                              }
                            </span>
                          </div>
                        );
                      }
                    })()}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/user/${user.username}`)}
                    >
                      View Profile
                    </Button>
                  </div>
                </div>

                {/* Subscription information - only show for privileged users */}
                {user.membership_tier && user.membership_tier !== 'MEMBER' && (
                  <Collapsible className="mt-4 border-t pt-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">Subscription Information</h4>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="p-0 h-8 w-8">
                          <ChevronDown className="h-4 w-4" />
                          <span className="sr-only">Toggle subscription info</span>
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                    <CollapsibleContent className="mt-2">
                      <UserSubscriptionInfo userId={user.id} />
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">
                {searchQuery ? 'No users match your search' : 'No users found'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminUserListPage;
