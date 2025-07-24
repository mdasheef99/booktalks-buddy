/**
 * Remove Manager Modal Component
 * 
 * Confirmation dialog for removing Store Manager privileges, ensuring Store Owners
 * understand the implications of the action before proceeding
 */

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  UserMinus, 
  Crown, 
  AlertTriangle,
  Calendar,
  Shield,
  Info
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import type { RemoveManagerModalProps } from '@/types/storeManagers';
import { userSearchUtils } from '@/services/storeManagers/userSearchService';

// =========================
// Manager Info Section Component
// =========================

interface ManagerInfoSectionProps {
  manager: NonNullable<RemoveManagerModalProps['manager']>;
}

const ManagerInfoSection: React.FC<ManagerInfoSectionProps> = ({ manager }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getUserInitials = () => {
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
    <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
      <Avatar className="h-12 w-12">
        <AvatarImage 
          src={manager.users.avatar_thumbnail_url} 
          alt={manager.users.username} 
        />
        <AvatarFallback className="bg-bookconnect-brown text-white">
          {getUserInitials()}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1">
        <div className="flex items-center space-x-2 mb-1">
          <h3 className="font-semibold text-lg">
            {manager.users.displayname || manager.users.username}
          </h3>
          <Badge variant="secondary" className="bg-bookconnect-terracotta/10 text-bookconnect-terracotta">
            <Crown className="h-3 w-3 mr-1" />
            Store Manager
          </Badge>
        </div>
        
        <p className="text-sm text-muted-foreground">@{manager.users.username}</p>
        <p className="text-sm text-muted-foreground">{manager.users.email}</p>
        
        <div className="flex items-center text-xs text-muted-foreground mt-2">
          <Calendar className="h-3 w-3 mr-1" />
          Appointed on {formatDate(manager.assigned_at)}
        </div>
      </div>
      
      <div className="text-right">
        <UserMinus className="h-8 w-8 text-red-500 mx-auto mb-1" />
        <p className="text-xs font-medium text-red-600">Remove Access</p>
      </div>
    </div>
  );
};

// =========================
// Consequences List Component
// =========================

const ConsequencesList: React.FC = () => {
  const consequences = [
    {
      icon: Shield,
      title: 'Administrative Access Removed',
      description: 'User will lose all Store Manager privileges immediately'
    },
    {
      icon: Crown,
      title: 'Role Downgrade',
      description: 'User will return to regular member status within the store'
    },
    {
      icon: Info,
      title: 'Club Memberships Retained',
      description: 'User will remain a member of their existing book clubs'
    }
  ];

  return (
    <div className="space-y-3">
      {consequences.map((consequence, index) => {
        const IconComponent = consequence.icon;
        return (
          <div key={index} className="flex items-start space-x-3">
            <IconComponent className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">{consequence.title}</p>
              <p className="text-xs text-muted-foreground">{consequence.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// =========================
// Main Remove Manager Modal Component
// =========================

export const RemoveManagerModal: React.FC<RemoveManagerModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  manager,
  loading
}) => {
  if (!manager) return null;

  const displayName = manager.users.displayname || manager.users.username;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <UserMinus className="h-5 w-5 text-red-600" />
            <span>Remove Store Manager</span>
          </DialogTitle>
          <DialogDescription>
            You are about to remove Store Manager privileges from {displayName}. 
            This action will take effect immediately.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Manager Information */}
          <ManagerInfoSection manager={manager} />

          {/* Warning Notice */}
          <div className="flex items-start space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-red-900 mb-1">Confirm Removal</h4>
              <p className="text-sm text-red-800">
                This action will immediately revoke all Store Manager privileges. 
                The user will be notified of this change.
              </p>
            </div>
          </div>

          {/* What Happens Next */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center">
              <Info className="h-4 w-4 mr-2" />
              What happens when you remove this Store Manager?
            </h3>
            <div className="border rounded-lg p-4">
              <ConsequencesList />
            </div>
          </div>

          {/* Reversible Action Notice */}
          <div className="text-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <Info className="h-4 w-4 inline mr-1" />
              You can re-appoint this user as a Store Manager at any time in the future.
            </p>
          </div>
        </div>

        <DialogFooter className="flex space-x-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Removing...
              </>
            ) : (
              <>
                <UserMinus className="h-4 w-4 mr-2" />
                Remove Manager
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RemoveManagerModal;
