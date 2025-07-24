import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Mail, UserPlus, ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { UserTierManager } from '@/components/admin/UserTierManager';
import { UserAccountManager } from '@/components/admin/UserAccountManager';
import UserTierBadge from '@/components/common/UserTierBadge';
import { UserSubscriptionInfo } from '@/components/admin/UserSubscriptionInfo';
import { UserSubscriptionStatus } from '@/components/admin/UserSubscriptionStatus';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useStoreManagerAccess } from '@/hooks/store-manager/useStoreManagerAccess';
import { calculateSubscriptionStatus, requiresAttention } from '@/lib/utils/subscriptionUtils';
import { getUserAccountStatus, type AccountStatus } from '@/lib/api/admin/accountManagement';

interface User {
  id: string;
  username: string | null;
  email: string | null;
  favorite_genre: string | null;
  favorite_author: string | null;
  membership_tier: string;
  account_status?: string | null;
  status_changed_at?: string | null;
  deleted_at?: string | null;
}

interface SubscriptionStats {
  totalPaidUsers: number;
  expiredUsers: number;
  expiringSoonUsers: number;
  activeUsers: number;
}

const StoreManagerUsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [userAccountStatuses, setUserAccountStatuses] = useState<Record<string, AccountStatus>>({});
  const [subscriptionStats, setSubscriptionStats] = useState<SubscriptionStats>({
    totalPaidUsers: 0,
    expiredUsers: 0,
    expiringSoonUsers: 0,
    activeUsers: 0
  });
  const navigate = useNavigate();

  // Use Store Manager access hook instead of Store Owner
  const {
    isStoreManager,
    storeId,
    storeName,
    loading: storeAccessLoading,
    error: storeAccessError
  } = useStoreManagerAccess();

  // Debug logging for store manager access
  React.useEffect(() => {
    console.log('🔍 StoreManagerUsersPage Debug Info:');
    console.log('  isStoreManager:', isStoreManager);
    console.log('  storeId:', storeId);
    console.log('  storeName:', storeName);
    console.log('  storeAccessLoading:', storeAccessLoading);
    console.log('  storeAccessError:', storeAccessError);
  }, [isStoreManager, storeId, storeName, storeAccessLoading, storeAccessError]);

  // Calculate subscription statistics
  const calculateSubscriptionStats = async (userList: User[]): Promise<SubscriptionStats> => {
    const stats: SubscriptionStats = {
      totalPaidUsers: 0,
      expiredUsers: 0,
      expiringSoonUsers: 0,
      activeUsers: 0
    };

    // Get subscription data for all paid users
    const paidUsers = userList.filter(user => user.membership_tier !== 'MEMBER');
    stats.totalPaidUsers = paidUsers.length;

    if (paidUsers.length === 0) {
      return stats;
    }

    try {
      // Fetch subscription data for all paid users
      const { data: subscriptions, error } = await supabase
        .from('user_subscriptions')
        .select('user_id, end_date, is_active')
        .in('user_id', paidUsers.map(user => user.id))
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching subscription stats:', error);
        return stats;
      }

      // Calculate stats for each user
      paidUsers.forEach(user => {
        const subscription = subscriptions?.find(sub => sub.user_id === user.id);
        const status = calculateSubscriptionStatus(subscription?.end_date || null, user.membership_tier);

        switch (status.status) {
          case 'expired':
            stats.expiredUsers++;
            break;
          case 'expiring_soon':
            stats.expiringSoonUsers++;
            break;
          case 'active':
            stats.activeUsers++;
            break;
        }
      });
    } catch (error) {
      console.error('Error calculating subscription stats:', error);
    }

    return stats;
  };

  // Load account statuses for users
  const loadAccountStatuses = async (userList: User[]) => {
    try {
      const statuses: Record<string, AccountStatus> = {};

      // Load account status for each user
      for (const user of userList) {
        try {
          const status = await getUserAccountStatus(user.id);
          statuses[user.id] = status;
        } catch (error) {
          console.error(`Error loading account status for user ${user.id}:`, error);
          // Fallback to user data from database
          statuses[user.id] = {
            account_status: user.account_status as any || 'active',
            status_changed_at: user.status_changed_at,
            deleted_at: user.deleted_at
          };
        }
      }

      setUserAccountStatuses(statuses);
    } catch (error) {
      console.error('Error loading account statuses:', error);
    }
  };

  useEffect(() => {
    const fetchStoreUsers = async () => {
      // Wait for store access loading to complete
      if (storeAccessLoading) return;

      // Only fetch users if user is a store manager
      if (!isStoreManager || !storeId) {
        setLoading(false);
        return;
      }

      try {
        console.log('🔄 Fetching store users for store:', storeId);

        // First, get club IDs for this store
        const { data: storeClubs, error: clubsError } = await supabase
          .from('book_clubs')
          .select('id')
          .eq('store_id', storeId);

        if (clubsError) throw clubsError;

        const clubIds = storeClubs?.map(club => club.id) || [];

        if (clubIds.length === 0) {
          console.log('No clubs found for store:', storeId);
          setUsers([]);
          setFilteredUsers([]);
          setLoading(false);
          return;
        }

        // Get unique user IDs from club memberships
        const { data: memberData, error: memberError } = await supabase
          .from('club_members')
          .select('user_id')
          .in('club_id', clubIds);

        if (memberError) throw memberError;

        const userIds = [...new Set(memberData?.map(member => member.user_id) || [])];

        if (userIds.length === 0) {
          console.log('No users found in store clubs');
          setUsers([]);
          setFilteredUsers([]);
          setLoading(false);
          return;
        }

        // Store-scoped users query: Get user details for store club members
        const { data: storeUsers, error } = await supabase
          .from('users')
          .select('id, username, email, favorite_genre, favorite_author, membership_tier, account_status, status_changed_at, deleted_at')
          .in('id', userIds);

        if (error) throw error;

        // Sort users by username
        const userList = (storeUsers || []).sort((a, b) =>
          (a.username || '').localeCompare(b.username || '')
        );

        console.log('✅ Fetched store users:', userList.length);
        setUsers(userList);
        setFilteredUsers(userList);

        // Calculate subscription statistics
        const stats = await calculateSubscriptionStats(userList);
        setSubscriptionStats(stats);

        // Load account statuses for all users
        await loadAccountStatuses(userList);
      } catch (error) {
        console.error('Error fetching store users:', error);
        toast.error('Failed to load store users');
      } finally {
        setLoading(false);
      }
    };

    fetchStoreUsers();
  }, [isStoreManager, storeId, storeAccessLoading]);

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
              Unable to verify store manager access: {storeAccessError}
            </p>
            <Button onClick={() => navigate('/store-manager/dashboard')} variant="outline">
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
        onClick={() => navigate('/store-manager/dashboard')}
        className="mb-4 flex items-center gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Button>

      <div className="mb-8">
        <h1 className="text-3xl font-serif text-bookconnect-terracotta">User Management</h1>
        {isStoreManager && storeName && (
          <p className="text-muted-foreground mt-2">
            Managing users for <span className="font-medium">{storeName}</span>
          </p>
        )}
        {!isStoreManager && (
          <p className="text-amber-600 mt-2">
            Store Manager access required for user management features
          </p>
        )}

        {/* Subscription Statistics Summary */}
        {users.length > 0 && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
            <h3 className="text-sm font-medium text-gray-900 mb-3">User & Subscription Overview</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-bookconnect-sage">{users.length}</div>
                <div className="text-xs text-gray-600">Total Users</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-bookconnect-terracotta">{subscriptionStats.totalPaidUsers}</div>
                <div className="text-xs text-gray-600">Paid Users</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{subscriptionStats.activeUsers}</div>
                <div className="text-xs text-gray-600">Active</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600">{subscriptionStats.expiringSoonUsers}</div>
                <div className="text-xs text-gray-600">Expiring Soon</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{subscriptionStats.expiredUsers}</div>
                <div className="text-xs text-gray-600">Expired</div>
              </div>
            </div>
            {(subscriptionStats.expiredUsers > 0 || subscriptionStats.expiringSoonUsers > 0) && (
              <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded text-sm text-amber-800">
                <strong>Action Required:</strong> {subscriptionStats.expiredUsers + subscriptionStats.expiringSoonUsers} users need subscription attention
              </div>
            )}
          </div>
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
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{user.username || 'No username'}</h3>
                    <p className="text-muted-foreground">{user.email || 'No email'}</p>

                    {/* Subscription Status - prominently displayed for paid tiers */}
                    {user.membership_tier && user.membership_tier !== 'MEMBER' && (
                      <div className="mt-3">
                        <UserSubscriptionStatus
                          userId={user.id}
                          membershipTier={user.membership_tier}
                        />
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 mt-2">
                      {user.favorite_genre && (
                        <span className="text-xs bg-bookconnect-sage/20 text-bookconnect-sage px-2 py-1 rounded-full">
                          {user.favorite_genre}
                        </span>
                      )}
                      {user.favorite_author && (
                        <span className="text-xs bg-bookconnect-cream text-bookconnect-terracotta px-2 py-1 rounded-full">
                          {user.favorite_author}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    {/* Account Management */}
                    <UserAccountManager
                      userId={user.id}
                      currentStatus={userAccountStatuses[user.id] || { account_status: user.account_status as any || 'active' }}
                      username={user.username || undefined}
                      storeId={storeId}
                      onStatusChange={(newStatus) => {
                        // Update the account status cache
                        setUserAccountStatuses(prev => ({
                          ...prev,
                          [user.id]: newStatus
                        }));

                        // Update the user list with new status
                        const updateUser = (u: User) =>
                          u.id === user.id
                            ? { ...u, account_status: newStatus.account_status, status_changed_at: newStatus.status_changed_at }
                            : u;

                        setUsers(users.map(updateUser));
                        setFilteredUsers(filteredUsers.map(updateUser));
                      }}
                    />

                    {/* Tier Management */}
                    {(() => {
                      if (isStoreManager && storeId) {
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
                              {!isStoreManager
                                ? "(Store Manager access required)"
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
                {searchQuery ? 'No users match your search' : 'No users found in this store'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default StoreManagerUsersPage;
