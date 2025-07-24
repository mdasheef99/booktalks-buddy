/**
 * Manager Permissions View Component
 * 
 * Informational component that displays what permissions and capabilities
 * Store Managers will have, helping Store Owners understand what they're granting
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
import { Separator } from '@/components/ui/separator';
import { 
  Shield, 
  Users, 
  BarChart, 
  Calendar,
  MessageSquare,
  CheckCircle,
  Info,
  Crown
} from 'lucide-react';
import type { ManagerPermissionsViewProps } from '@/types/storeManagers';
import { STORE_MANAGER_PERMISSIONS } from '@/types/storeManagers';

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
// Permission Category Component
// =========================

interface PermissionCategoryProps {
  category: string;
  title: string;
  permissions: typeof STORE_MANAGER_PERMISSIONS;
}

const PermissionCategory: React.FC<PermissionCategoryProps> = ({
  category,
  title,
  permissions
}) => {
  const IconComponent = getCategoryIcon(category);
  
  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <IconComponent className="h-5 w-5 text-bookconnect-brown" />
        <h3 className="font-semibold">{title}</h3>
      </div>
      
      <div className="space-y-2 ml-7">
        {permissions.map((permission) => (
          <div key={permission.key} className="flex items-start space-x-2">
            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">{permission.name}</p>
              <p className="text-xs text-muted-foreground">{permission.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// =========================
// Main Manager Permissions View Component
// =========================

export const ManagerPermissionsView: React.FC<ManagerPermissionsViewProps> = ({
  isOpen,
  onClose
}) => {
  // Group permissions by category
  const groupedPermissions = STORE_MANAGER_PERMISSIONS.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, typeof STORE_MANAGER_PERMISSIONS>);

  // Category labels
  const categoryLabels = {
    user_management: 'User Management',
    club_management: 'Club Management',
    content_moderation: 'Content Moderation',
    analytics: 'Analytics & Reporting',
    events: 'Event Management'
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Crown className="h-5 w-5 text-bookconnect-terracotta" />
            <span>Store Manager Permissions</span>
          </DialogTitle>
          <DialogDescription>
            Store Managers have administrative privileges to help you manage your store.
            Below is a comprehensive list of permissions granted to Store Managers.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Information Notice */}
          <div className="flex items-start space-x-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-blue-900 mb-1">About Store Managers</h4>
              <p className="text-sm text-blue-800">
                Store Managers are trusted users who help you administer your store. 
                They have significant administrative capabilities but cannot perform 
                certain owner-only actions like appointing other Store Managers or 
                changing store settings.
              </p>
            </div>
          </div>

          {/* User Management */}
          {groupedPermissions.user_management && (
            <PermissionCategory
              category="user_management"
              title={categoryLabels.user_management}
              permissions={groupedPermissions.user_management}
            />
          )}

          <Separator />

          {/* Club Management */}
          {groupedPermissions.club_management && (
            <PermissionCategory
              category="club_management"
              title={categoryLabels.club_management}
              permissions={groupedPermissions.club_management}
            />
          )}

          <Separator />

          {/* Content Moderation */}
          {groupedPermissions.content_moderation && (
            <PermissionCategory
              category="content_moderation"
              title={categoryLabels.content_moderation}
              permissions={groupedPermissions.content_moderation}
            />
          )}

          <Separator />

          {/* Analytics & Events */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Analytics */}
            {groupedPermissions.analytics && (
              <PermissionCategory
                category="analytics"
                title={categoryLabels.analytics}
                permissions={groupedPermissions.analytics}
              />
            )}

            {/* Events */}
            {groupedPermissions.events && (
              <PermissionCategory
                category="events"
                title={categoryLabels.events}
                permissions={groupedPermissions.events}
              />
            )}
          </div>

          {/* Limitations Notice */}
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h4 className="font-medium mb-2 flex items-center">
              <Shield className="h-4 w-4 mr-2 text-bookconnect-brown" />
              Store Manager Limitations
            </h4>
            <p className="text-sm text-muted-foreground mb-3">
              Store Managers <strong>cannot</strong> perform the following actions:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 ml-6">
              <li className="list-disc">Appoint or remove other Store Managers</li>
              <li className="list-disc">Change store settings or billing information</li>
              <li className="list-disc">Delete the store or transfer ownership</li>
              <li className="list-disc">Access store financial information</li>
              <li className="list-disc">Modify store branding or identity</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ManagerPermissionsView;
