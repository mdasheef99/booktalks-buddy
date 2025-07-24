/**
 * Appoint Manager Modal Component
 * 
 * Confirmation dialog that appears when a Store Owner attempts to appoint
 * a user as Store Manager, providing details about the appointment and
 * requiring explicit confirmation
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
import { Separator } from '@/components/ui/separator';
import { 
  Crown, 
  UserPlus, 
  Shield, 
  Users, 
  BarChart, 
  Calendar,
  MessageSquare,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import type { AppointManagerModalProps } from '@/types/storeManagers';
import { STORE_MANAGER_PERMISSIONS } from '@/types/storeManagers';
import { userSearchUtils } from '@/services/storeManagers/userSearchService';

// =========================
// Permission Category Icons
// =========================

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'user_management':
      return Users;
    case 'club_management':
      return Shield;
    case 'content_moderation':
      return MessageSquare;
    case 'analytics':
      return BarChart;
    case 'events':
      return Calendar;
    default:
      return CheckCircle;
  }
};

// =========================
// Permission List Component
// =========================

const PermissionsList: React.FC = () => {
  const groupedPermissions = STORE_MANAGER_PERMISSIONS.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, typeof STORE_MANAGER_PERMISSIONS>);

  const categoryLabels = {
    user_management: 'User Management',
    club_management: 'Club Management',
    content_moderation: 'Content Moderation',
    analytics: 'Analytics & Reporting',
    events: 'Event Management'
  };

  return (
    <div className="space-y-4">
      {Object.entries(groupedPermissions).map(([category, permissions]) => {
        const IconComponent = getCategoryIcon(category);
        
        return (
          <div key={category} className="space-y-2">
            <div className="flex items-center space-x-2">
              <IconComponent className="h-4 w-4 text-bookconnect-brown" />
              <h4 className="font-medium text-sm">
                {categoryLabels[category as keyof typeof categoryLabels]}
              </h4>
            </div>
            <div className="space-y-1 ml-6">
              {permissions.map((permission) => (
                <div key={permission.key} className="flex items-start space-x-2">
                  <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{permission.name}</p>
                    <p className="text-xs text-muted-foreground">{permission.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// =========================
// User Info Section Component
// =========================

interface UserInfoSectionProps {
  user: NonNullable<AppointManagerModalProps['user']>;
}

const UserInfoSection: React.FC<UserInfoSectionProps> = ({ user }) => {
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

  const tierInfo = formatMembershipTier(user.membership_tier);

  return (
    <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
      <Avatar className="h-12 w-12">
        <AvatarImage src={user.avatar_thumbnail_url} alt={user.username} />
        <AvatarFallback className="bg-bookconnect-brown text-white">
          {userSearchUtils.getUserInitials(user)}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1">
        <div className="flex items-center space-x-2 mb-1">
          <h3 className="font-semibold text-lg">
            {userSearchUtils.formatUserDisplayName(user)}
          </h3>
          <Badge variant="secondary" className={tierInfo.color}>
            {tierInfo.label}
          </Badge>
        </div>
        
        <p className="text-sm text-muted-foreground">@{user.username}</p>
        <p className="text-sm text-muted-foreground">{user.email}</p>
      </div>
      
      <div className="text-right">
        <Crown className="h-8 w-8 text-bookconnect-terracotta mx-auto mb-1" />
        <p className="text-xs font-medium text-bookconnect-terracotta">Store Manager</p>
      </div>
    </div>
  );
};

// =========================
// Main Appoint Manager Modal Component
// =========================

export const AppointManagerModal: React.FC<AppointManagerModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  user,
  loading
}) => {
  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <UserPlus className="h-5 w-5 text-bookconnect-terracotta" />
            <span>Appoint Store Manager</span>
          </DialogTitle>
          <DialogDescription>
            You are about to appoint this user as a Store Manager. They will gain administrative 
            privileges and be able to manage users, clubs, and content within your store.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Information */}
          <UserInfoSection user={user} />

          {/* Important Notice */}
          <div className="flex items-start space-x-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-amber-900 mb-1">Important Notice</h4>
              <ul className="text-sm text-amber-800 space-y-1">
                <li>• Store Managers have significant administrative privileges</li>
                <li>• They can manage users, moderate content, and access analytics</li>
                <li>• This appointment will be effective immediately</li>
                <li>• You can remove Store Manager privileges at any time</li>
              </ul>
            </div>
          </div>

          <Separator />

          {/* Permissions Overview */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center">
              <Shield className="h-4 w-4 mr-2" />
              Store Manager Permissions
            </h3>
            <div className="max-h-64 overflow-y-auto border rounded-lg p-4">
              <PermissionsList />
            </div>
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
            onClick={onConfirm}
            disabled={loading}
            className="bg-bookconnect-terracotta hover:bg-bookconnect-terracotta/90"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Appointing...
              </>
            ) : (
              <>
                <Crown className="h-4 w-4 mr-2" />
                Confirm Appointment
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AppointManagerModal;
