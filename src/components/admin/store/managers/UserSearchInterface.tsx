/**
 * User Search Interface Component
 * 
 * Implements the user search and selection interface, allowing Store Owners
 * to search through store members and identify candidates for Store Manager appointment
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Search, 
  UserPlus, 
  Users, 
  AlertCircle,
  Loader2
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { supabase } from '@/lib/supabase';
import { userSearchUtils } from '@/services/storeManagers/userSearchService';
import type { UserSearchInterfaceProps, StoreManagerCandidate } from '@/types/storeManagers';

// =========================
// User Candidate Card Component
// =========================

interface UserCandidateCardProps {
  user: StoreManagerCandidate;
  onSelect: (user: StoreManagerCandidate) => void;
  loading?: boolean;
}

const UserCandidateCard: React.FC<UserCandidateCardProps> = ({
  user,
  onSelect,
  loading = false
}) => {
  const formatMembershipTier = (tier: string) => {
    switch (tier) {
      case 'PRIVILEGED':
        return { label: 'Privileged', color: 'bg-blue-100 text-blue-800' };
      case 'PRIVILEGED_PLUS':
        return { label: 'Privileged Plus', color: 'bg-purple-100 text-purple-800' };
      default:
        return { label: 'Member', color: 'bg-gray-100 text-gray-800' };
    }
  };

  const formatJoinDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short'
    });
  };

  const tierInfo = formatMembershipTier(user.membership_tier);

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => !loading && onSelect(user)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage 
                src={user.avatar_thumbnail_url} 
                alt={user.username}
              />
              <AvatarFallback className="bg-bookconnect-brown text-white text-sm">
                {userSearchUtils.getUserInitials(user)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h4 className="font-semibold">
                  {userSearchUtils.formatUserDisplayName(user)}
                </h4>
                <Badge variant="secondary" className={tierInfo.color}>
                  {tierInfo.label}
                </Badge>
              </div>
              
              <div className="text-sm text-muted-foreground">
                @{user.username} • {user.email}
              </div>
              
              <div className="text-xs text-muted-foreground mt-1">
                Member since {formatJoinDate(user.created_at)}
              </div>
            </div>
          </div>
          
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(user);
            }}
            disabled={loading}
            className="bg-bookconnect-terracotta hover:bg-bookconnect-terracotta/90"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <UserPlus className="h-4 w-4 mr-2" />
            )}
            Appoint as Manager
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// =========================
// Search Results Component
// =========================

interface SearchResultsProps {
  candidates: StoreManagerCandidate[];
  onUserSelect: (user: StoreManagerCandidate) => void;
  loading: boolean;
  searchTerm: string;
}

const SearchResults: React.FC<SearchResultsProps> = ({
  candidates,
  onUserSelect,
  loading,
  searchTerm
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-muted-foreground">Searching users...</span>
      </div>
    );
  }

  if (searchTerm && candidates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-muted-foreground text-center">
          No users found matching "{searchTerm}"
        </p>
        <p className="text-sm text-muted-foreground text-center mt-1">
          Try a different search term or check if the user is a member of any clubs in your store.
        </p>
      </div>
    );
  }

  if (!searchTerm && candidates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <Search className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-muted-foreground text-center">
          No users available for appointment
        </p>
        <p className="text-sm text-muted-foreground text-center mt-1">
          All users are either already Store Managers or no users exist
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {candidates.map((user) => (
        <UserCandidateCard
          key={user.id}
          user={user}
          onSelect={onUserSelect}
        />
      ))}
    </div>
  );
};

// =========================
// Main User Search Interface Component
// =========================

export const UserSearchInterface: React.FC<UserSearchInterfaceProps> = ({
  storeId,
  onUserSelect,
  excludeUserIds = [],
  loading: externalLoading = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // EXACT COPY from AdminUserListPage
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // Fetch users with their membership tiers and account status
        const { data, error } = await supabase
          .from('users')
          .select('id, username, email, favorite_genre, favorite_author, membership_tier, account_status, status_changed_at, deleted_at')
          .order('username');

        if (error) throw error;

        const userList = data || [];
        setUsers(userList);
        setFilteredUsers(userList);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // EXACT COPY from AdminUserListPage
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

  const handleUserSelect = (user: StoreManagerCandidate) => {
    onUserSelect(user);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <UserPlus className="h-5 w-5 mr-2" />
          Appoint New Store Manager
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search users..."
            className="pl-10"
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>

        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="lg" />
              <span className="ml-3 text-muted-foreground">Loading users...</span>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredUsers.map((user) => (
                <Card key={user.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onUserSelect({
                  id: user.id,
                  username: user.username,
                  email: user.email,
                  displayname: user.displayname,
                  avatar_thumbnail_url: user.avatar_thumbnail_url,
                  membership_tier: user.membership_tier,
                  created_at: user.created_at
                })}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.avatar_thumbnail_url} alt={user.username} />
                          <AvatarFallback className="bg-bookconnect-brown text-white text-sm">
                            {user.username?.charAt(0).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-semibold">{user.username}</h4>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      <Button size="sm" className="bg-bookconnect-terracotta hover:bg-bookconnect-terracotta/90">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Appoint as Manager
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {filteredUsers.length > 0 && (
          <div className="text-sm text-muted-foreground text-center pt-2 border-t">
            Showing {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserSearchInterface;
