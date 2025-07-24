/**
 * User Account Manager Component
 * 
 * Provides dropdown-based account management actions for admin interfaces.
 * Follows the established UserTierManager pattern for consistency.
 * 
 * Created: 2025-01-17
 * Part of: Phase 3 - Admin Interface Integration
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  MoreHorizontal, 
  UserX, 
  UserCheck, 
  Trash2, 
  Shield, 
  AlertTriangle,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useCanManageUserTiers } from '@/lib/entitlements/hooks';
import {
  suspendUser,
  suspendFromClub,
  deleteUser,
  activateUser,
  getUserAccountStatus,
  getUserClubSuspensions,
  validateAccountAction,
  type AccountStatus,
  type ClubSuspension,
  type SuspensionOptions,
  type DeletionOptions
} from '@/lib/api/admin/accountManagement';

// =========================
// Types and Interfaces
// =========================

interface UserAccountManagerProps {
  userId: string;
  currentStatus: AccountStatus;
  username?: string;
  storeId?: string;
  onStatusChange?: (newStatus: AccountStatus) => void;
}

type ActionType = 'suspend' | 'club_suspend' | 'delete' | 'activate';

interface ActionDialogState {
  isOpen: boolean;
  action: ActionType | null;
  title: string;
  description: string;
}

// =========================
// Main Component
// =========================

export function UserAccountManager({ 
  userId, 
  currentStatus, 
  username,
  storeId,
  onStatusChange 
}: UserAccountManagerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [clubSuspensions, setClubSuspensions] = useState<ClubSuspension[]>([]);
  const [dialogState, setDialogState] = useState<ActionDialogState>({
    isOpen: false,
    action: null,
    title: '',
    description: ''
  });

  // Form states for different actions
  const [suspensionForm, setSuspensionForm] = useState({
    reason: '',
    severity: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    duration_hours: '',
    notify_user: false
  });

  const [deletionForm, setDeletionForm] = useState({
    reason: '',
    type: 'soft' as 'soft' | 'hard',
    backup_data: true
  });

  const [activationReason, setActivationReason] = useState('');

  const { user } = useAuth();
  const { result: canManage, loading: permissionLoading } = useCanManageUserTiers(storeId || '');

  // Load club suspensions on mount
  useEffect(() => {
    loadClubSuspensions();
  }, [userId]);

  const loadClubSuspensions = async () => {
    try {
      const suspensions = await getUserClubSuspensions(userId);
      setClubSuspensions(suspensions);
    } catch (error) {
      console.error('Error loading club suspensions:', error);
    }
  };

  // Get current account status for display
  const getStatusDisplay = () => {
    const status = currentStatus.account_status || 'active';
    
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>;
      case 'suspended':
        return <Badge variant="destructive">Suspended</Badge>;
      case 'deleted':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Deleted</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  // Handle action selection
  const handleActionSelect = (action: ActionType) => {
    let title = '';
    let description = '';

    switch (action) {
      case 'suspend':
        title = 'Suspend User Account';
        description = `Suspend ${username || 'this user'}'s account platform-wide. They will be unable to access any features.`;
        break;
      case 'delete':
        title = 'Delete User Account';
        description = `Delete ${username || 'this user'}'s account. This action may be irreversible depending on the deletion type.`;
        break;
      case 'activate':
        title = 'Activate User Account';
        description = `Restore ${username || 'this user'}'s account access and remove any active suspensions.`;
        break;
      default:
        return;
    }

    setDialogState({
      isOpen: true,
      action,
      title,
      description
    });
  };

  // Handle action execution
  const handleActionExecute = async () => {
    if (!dialogState.action || !user?.id) return;

    setIsLoading(true);
    try {
      // Validate action first
      const validation = await validateAccountAction(
        user.id,
        userId,
        dialogState.action
      );

      if (!validation.isValid) {
        toast.error(`Action failed: ${validation.errors.join(', ')}`);
        return;
      }

      // Execute the action
      switch (dialogState.action) {
        case 'suspend':
          const suspensionOptions: SuspensionOptions = {
            reason: suspensionForm.reason,
            severity: suspensionForm.severity,
            duration_hours: suspensionForm.duration_hours && suspensionForm.duration_hours !== 'permanent' ? parseInt(suspensionForm.duration_hours) : undefined,
            notify_user: suspensionForm.notify_user
          };
          await suspendUser(user.id, userId, suspensionOptions);
          toast.success('User suspended successfully');
          break;

        case 'delete':
          const deletionOptions: DeletionOptions = {
            reason: deletionForm.reason,
            type: deletionForm.type,
            backup_data: deletionForm.backup_data
          };
          await deleteUser(user.id, userId, deletionOptions);
          toast.success(`User ${deletionForm.type} deleted successfully`);
          break;

        case 'activate':
          await activateUser(user.id, userId, activationReason);
          toast.success('User activated successfully');
          break;
      }

      // Refresh account status
      const newStatus = await getUserAccountStatus(userId);
      onStatusChange?.(newStatus);

      // Close dialog and reset forms
      setDialogState({ isOpen: false, action: null, title: '', description: '' });
      resetForms();

    } catch (error) {
      console.error('Error executing account action:', error);
      toast.error(`Failed to ${dialogState.action} user: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForms = () => {
    setSuspensionForm({
      reason: '',
      severity: 'medium',
      duration_hours: '',
      notify_user: false
    });
    setDeletionForm({
      reason: '',
      type: 'soft',
      backup_data: true
    });
    setActivationReason('');
  };

  // Don't render if user doesn't have permissions
  if (permissionLoading) {
    return <div className="w-8 h-8 animate-pulse bg-gray-200 rounded"></div>;
  }

  if (!canManage) {
    return (
      <div className="flex items-center space-x-2">
        {getStatusDisplay()}
        <span className="text-sm text-muted-foreground">
          (Insufficient permissions)
        </span>
      </div>
    );
  }

  const currentAccountStatus = currentStatus.account_status || 'active';

  return (
    <>
      <div className="flex items-center space-x-2">
        {getStatusDisplay()}
        
        {clubSuspensions.length > 0 && (
          <Badge variant="outline" className="text-xs">
            {clubSuspensions.length} club suspension{clubSuspensions.length > 1 ? 's' : ''}
          </Badge>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={isLoading}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          
          <DropdownMenuContent align="end">
            {currentAccountStatus === 'active' && (
              <>
                <DropdownMenuItem onClick={() => handleActionSelect('suspend')}>
                  <UserX className="h-4 w-4 mr-2" />
                  Suspend User
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleActionSelect('delete')}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Account
                </DropdownMenuItem>
              </>
            )}
            
            {currentAccountStatus === 'suspended' && (
              <DropdownMenuItem onClick={() => handleActionSelect('activate')}>
                <UserCheck className="h-4 w-4 mr-2" />
                Activate User
              </DropdownMenuItem>
            )}
            
            {currentAccountStatus !== 'deleted' && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled>
                  <Shield className="h-4 w-4 mr-2" />
                  View Audit Trail
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Action Dialog */}
      <Dialog open={dialogState.isOpen} onOpenChange={(open) => 
        setDialogState(prev => ({ ...prev, isOpen: open }))
      }>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {dialogState.action === 'delete' && <AlertTriangle className="h-5 w-5 text-red-500" />}
              {dialogState.title}
            </DialogTitle>
            <DialogDescription>
              {dialogState.description}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {dialogState.action === 'suspend' && (
              <SuspensionForm 
                form={suspensionForm} 
                onChange={setSuspensionForm} 
              />
            )}
            
            {dialogState.action === 'delete' && (
              <DeletionForm 
                form={deletionForm} 
                onChange={setDeletionForm} 
              />
            )}
            
            {dialogState.action === 'activate' && (
              <div className="space-y-2">
                <Label htmlFor="activation-reason">Reason for activation</Label>
                <Textarea
                  id="activation-reason"
                  placeholder="Enter reason for activating this account..."
                  value={activationReason}
                  onChange={(e) => setActivationReason(e.target.value)}
                  rows={3}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogState(prev => ({ ...prev, isOpen: false }))}
            >
              Cancel
            </Button>
            <Button
              onClick={handleActionExecute}
              disabled={isLoading || !getFormValidation()}
              variant={dialogState.action === 'delete' ? 'destructive' : 'default'}
            >
              {isLoading ? 'Processing...' : `Confirm ${dialogState.action}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );

  // Form validation helper
  function getFormValidation(): boolean {
    switch (dialogState.action) {
      case 'suspend':
        return suspensionForm.reason.length >= 10;
      case 'delete':
        return deletionForm.reason.length >= 10;
      case 'activate':
        return activationReason.length >= 10;
      default:
        return false;
    }
  }
}

// =========================
// Form Components
// =========================

interface SuspensionFormProps {
  form: {
    reason: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    duration_hours: string;
    notify_user: boolean;
  };
  onChange: (form: any) => void;
}

function SuspensionForm({ form, onChange }: SuspensionFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="suspension-reason">Reason for suspension *</Label>
        <Textarea
          id="suspension-reason"
          placeholder="Enter detailed reason for suspension (minimum 10 characters)..."
          value={form.reason}
          onChange={(e) => onChange({ ...form, reason: e.target.value })}
          rows={3}
          className={form.reason.length > 0 && form.reason.length < 10 ? 'border-red-500' : ''}
        />
        {form.reason.length > 0 && form.reason.length < 10 && (
          <p className="text-sm text-red-500">Reason must be at least 10 characters</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Severity Level</Label>
        <RadioGroup
          value={form.severity}
          onValueChange={(value) => onChange({ ...form, severity: value as any })}
          className="flex flex-wrap gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="low" id="severity-low" />
            <Label htmlFor="severity-low" className="text-sm">Low</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="medium" id="severity-medium" />
            <Label htmlFor="severity-medium" className="text-sm">Medium</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="high" id="severity-high" />
            <Label htmlFor="severity-high" className="text-sm">High</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="critical" id="severity-critical" />
            <Label htmlFor="severity-critical" className="text-sm">Critical</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label htmlFor="suspension-duration">Duration (hours)</Label>
        <Select
          value={form.duration_hours}
          onValueChange={(value) => onChange({ ...form, duration_hours: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select suspension duration" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="permanent">Permanent Suspension</SelectItem>
            <SelectItem value="1">1 hour</SelectItem>
            <SelectItem value="6">6 hours</SelectItem>
            <SelectItem value="24">1 day</SelectItem>
            <SelectItem value="72">3 days</SelectItem>
            <SelectItem value="168">1 week</SelectItem>
            <SelectItem value="720">1 month</SelectItem>
            <SelectItem value="4320">6 months</SelectItem>
            <SelectItem value="8760">1 year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="notify-user"
          checked={form.notify_user}
          onChange={(e) => onChange({ ...form, notify_user: e.target.checked })}
          className="rounded border-gray-300"
        />
        <Label htmlFor="notify-user" className="text-sm">
          Notify user via email (if implemented)
        </Label>
      </div>
    </div>
  );
}

interface DeletionFormProps {
  form: {
    reason: string;
    type: 'soft' | 'hard';
    backup_data: boolean;
  };
  onChange: (form: any) => void;
}

function DeletionForm({ form, onChange }: DeletionFormProps) {
  return (
    <div className="space-y-4">
      <div className="p-3 bg-red-50 border border-red-200 rounded-md">
        <div className="flex items-center gap-2 text-red-800 text-sm font-medium">
          <AlertTriangle className="h-4 w-4" />
          Warning: Account Deletion
        </div>
        <p className="text-red-700 text-sm mt-1">
          This action will remove the user's access and may be irreversible depending on the deletion type.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="deletion-reason">Reason for deletion *</Label>
        <Textarea
          id="deletion-reason"
          placeholder="Enter detailed reason for account deletion (minimum 10 characters)..."
          value={form.reason}
          onChange={(e) => onChange({ ...form, reason: e.target.value })}
          rows={3}
          className={form.reason.length > 0 && form.reason.length < 10 ? 'border-red-500' : ''}
        />
        {form.reason.length > 0 && form.reason.length < 10 && (
          <p className="text-sm text-red-500">Reason must be at least 10 characters</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Deletion Type</Label>
        <RadioGroup
          value={form.type}
          onValueChange={(value) => onChange({ ...form, type: value as 'soft' | 'hard' })}
          className="space-y-2"
        >
          <div className="flex items-start space-x-2">
            <RadioGroupItem value="soft" id="deletion-soft" className="mt-1" />
            <div>
              <Label htmlFor="deletion-soft" className="text-sm font-medium">
                Soft Delete (Recommended)
              </Label>
              <p className="text-xs text-muted-foreground">
                Mark account as deleted but preserve data for 30 days. Can be recovered if needed.
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <RadioGroupItem value="hard" id="deletion-hard" className="mt-1" />
            <div>
              <Label htmlFor="deletion-hard" className="text-sm font-medium text-red-600">
                Hard Delete (Permanent)
              </Label>
              <p className="text-xs text-muted-foreground">
                Permanently remove user data. This action cannot be undone.
              </p>
            </div>
          </div>
        </RadioGroup>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="backup-data"
          checked={form.backup_data}
          onChange={(e) => onChange({ ...form, backup_data: e.target.checked })}
          className="rounded border-gray-300"
        />
        <Label htmlFor="backup-data" className="text-sm">
          Create data backup before deletion
        </Label>
      </div>
    </div>
  );
}
