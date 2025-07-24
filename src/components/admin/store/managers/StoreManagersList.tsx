/**
 * Store Managers List Component
 * 
 * Displays the current list of appointed Store Managers with their details,
 * appointment dates, and removal actions
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Users, 
  UserMinus, 
  Calendar, 
  Mail, 
  RefreshCw,
  AlertCircle,
  Crown
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import type { StoreManagersListProps, StoreManager } from '@/types/storeManagers';
import { userSearchUtils } from '@/services/storeManagers/userSearchService';

// =========================
// Store Manager Card Component
// =========================

interface StoreManagerCardProps {
  manager: StoreManager;
  onRemove: (userId: string) => void;
  removing: boolean;
}

const StoreManagerCard: React.FC<StoreManagerCardProps> = ({
  manager,
  onRemove,
  removing
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getUserInitials = (manager: StoreManager) => {
    const name = manager.users.displayname || manager.users.username;
    return userSearchUtils.getUserInitials({
      id: manager.user_id,
      username: manager.users.username,
      email: manager.users.email,
      displayname: manager.users.displayname,
      avatar_thumbnail_url: manager.users.avatar_thumbnail_url,
      membership_tier: '',
      created_at: ''
    });
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <Avatar className="h-12 w-12">
              <AvatarImage 
                src={manager.users.avatar_thumbnail_url} 
                alt={manager.users.username}
              />
              <AvatarFallback className="bg-bookconnect-brown text-white">
                {getUserInitials(manager)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="text-lg font-semibold">
                  {manager.users.displayname || manager.users.username}
                </h3>
                <Badge variant="secondary" className="bg-bookconnect-terracotta/10 text-bookconnect-terracotta">
                  <Crown className="h-3 w-3 mr-1" />
                  Store Manager
                </Badge>
              </div>
              
              <div className="flex items-center text-sm text-muted-foreground mb-2">
                <Mail className="h-4 w-4 mr-1" />
                {manager.users.email}
              </div>
              
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="h-4 w-4 mr-1" />
                Appointed on {formatDate(manager.assigned_at)}
              </div>
            </div>
          </div>
          
          <div className="flex flex-col space-y-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onRemove(manager.user_id)}
              disabled={removing}
              className="bg-red-600 hover:bg-red-700"
            >
              {removing ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : (
                <UserMinus className="h-4 w-4 mr-2" />
              )}
              Remove Manager
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// =========================
// Empty State Component
// =========================

const EmptyState: React.FC<{ onRefresh: () => void }> = ({ onRefresh }) => (
  <Card className="border-dashed">
    <CardContent className="flex flex-col items-center justify-center py-12">
      <Users className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold mb-2">No Store Managers Appointed</h3>
      <p className="text-muted-foreground text-center mb-4 max-w-md">
        You haven't appointed any Store Managers yet. Use the search interface below 
        to find and appoint users as Store Managers.
      </p>
      <Button variant="outline" onClick={onRefresh}>
        <RefreshCw className="h-4 w-4 mr-2" />
        Refresh
      </Button>
    </CardContent>
  </Card>
);

// =========================
// Error State Component
// =========================

const ErrorState: React.FC<{ onRefresh: () => void }> = ({ onRefresh }) => (
  <Card className="border-red-200 bg-red-50">
    <CardContent className="flex flex-col items-center justify-center py-12">
      <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
      <h3 className="text-lg font-semibold text-red-900 mb-2">Failed to Load Store Managers</h3>
      <p className="text-red-700 text-center mb-4 max-w-md">
        There was an error loading the Store Managers list. Please try refreshing.
      </p>
      <Button variant="outline" onClick={onRefresh} className="border-red-300 text-red-700">
        <RefreshCw className="h-4 w-4 mr-2" />
        Try Again
      </Button>
    </CardContent>
  </Card>
);

// =========================
// Main Store Managers List Component
// =========================

export const StoreManagersList: React.FC<StoreManagersListProps> = ({
  storeId,
  managers,
  loading,
  onRemoveManager,
  onRefresh
}) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Current Store Managers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
            <span className="ml-3 text-muted-foreground">Loading Store Managers...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Current Store Managers
              {managers.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {managers.length}
                </Badge>
              )}
            </CardTitle>
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {managers.length === 0 ? (
            <EmptyState onRefresh={onRefresh} />
          ) : (
            <div className="space-y-4">
              {managers.map((manager) => (
                <StoreManagerCard
                  key={manager.user_id}
                  manager={manager}
                  onRemove={onRemoveManager}
                  removing={false} // This will be managed by parent component
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StoreManagersList;
