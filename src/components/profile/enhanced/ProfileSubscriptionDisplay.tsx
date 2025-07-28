/**
 * Profile Subscription Display Component
 *
 * Read-only subscription information display for the main profile page
 * Shows subscription details without edit capabilities (manual upgrades by store owner)
 * Enhanced with alert system integration for subscription notifications
 * Extended with account management and self-deletion functionality
 */

import React, { useState } from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Crown,
  Star,
  User,
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle,
  Info,
  Trash2,
  AlertTriangle,
  Shield,
  Receipt
} from 'lucide-react';
import { useUserSubscriptionAlerts } from '@/contexts/AlertContext';
import { useAlerts } from '@/hooks/useAlerts';
import { SubscriptionAlertBanner } from '@/components/alerts/SubscriptionAlertBanner';
import { deleteUser } from '@/lib/api/admin/accountManagement';
import { validateAccountAction } from '@/lib/api/admin/accountValidation';
import { createSelfDeletionRequest, checkUserClubOwnership } from '@/lib/api/admin/selfDeletionRequests';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { CompactPaymentHistory } from '@/components/user/CompactPaymentHistory';
import { PaymentHistoryModal } from '@/components/user/PaymentHistoryModal';


interface ProfileSubscriptionDisplayProps {
  className?: string;
}

export default function ProfileSubscriptionDisplay({ className = '' }: ProfileSubscriptionDisplayProps) {
  const {
    user,
    subscriptionLoading,
    getSubscriptionStatusWithContext,
    signOut
  } = useAuth();

  const statusContext = getSubscriptionStatusWithContext();
  const subscriptionAlerts = useUserSubscriptionAlerts();
  const { dismissAlert } = useAlerts();
  const navigate = useNavigate();

  // Account deletion state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Payment history state
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);

  // Debug logging
  console.log('🔍 ProfileSubscriptionDisplay Debug:', {
    subscriptionAlertsCount: subscriptionAlerts.length,
    subscriptionAlerts: subscriptionAlerts,
    statusContext: statusContext
  });

  // Handle contact store action
  const handleContactStore = () => {
    // This could open a contact modal or redirect to contact page
    // For now, we'll show a simple alert
    alert('Please contact your store owner directly to upgrade your membership or make payments.');
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    if (!user?.id) return;

    setIsDeleting(true);
    try {
      // Check if user owns any clubs
      const clubCheck = await checkUserClubOwnership(user.id);

      if (clubCheck.ownsClubs) {
        // User owns clubs - create deletion request instead
        const result = await createSelfDeletionRequest(user.id, deleteReason);

        if (result.success) {
          toast.success(result.message);
          setShowDeleteDialog(false);
          setDeletePassword('');
          setDeleteReason('');
        } else {
          toast.error(result.message);
        }
        return;
      }

      // User owns no clubs - proceed with immediate deletion
      // Validate the deletion action
      const validation = await validateAccountAction({
        adminId: user.id,
        targetUserId: user.id,
        action: 'delete',
        reason: deleteReason || 'User requested account deletion'
      });

      if (!validation.isValid) {
        toast.error(`Cannot delete account: ${validation.errors.join(', ')}`);
        return;
      }

      // Execute immediate deletion (soft delete by default)
      await deleteUser(user.id, user.id, {
        reason: deleteReason || 'User requested account deletion',
        type: 'soft',
        backup_data: true
      });

      // Show success message
      toast.success('Account deleted successfully. You will be logged out.');

      // Sign out and redirect
      await signOut();
      navigate('/');

    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error(`Failed to delete account: ${error.message}`);
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
      setDeletePassword('');
      setDeleteReason('');
    }
  };

  // Handle delete dialog open
  const handleDeleteDialogOpen = () => {
    setDeletePassword('');
    setDeleteReason('');
    setShowDeleteDialog(true);
  };

  // Validate deletion form (only password required)
  const isDeleteFormValid = () => {
    return deletePassword.length >= 6;
  };



  // Get tier-specific configuration
  const getTierConfig = (tier: string) => {
    switch (tier) {
      case 'PRIVILEGED_PLUS':
        return {
          icon: Crown,
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200',
          gradientColor: 'from-purple-500 to-pink-500',
          label: 'Privileged Plus',
          description: 'Premium membership with unlimited access',
          monthlyAmount: '$19.99'
        };
      case 'PRIVILEGED':
        return {
          icon: Star,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          gradientColor: 'from-blue-500 to-cyan-500',
          label: 'Privileged',
          description: 'Enhanced membership with premium features',
          monthlyAmount: '$9.99'
        };
      default:
        return {
          icon: User,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          gradientColor: 'from-gray-400 to-gray-500',
          label: 'Member',
          description: 'Basic membership with community access',
          monthlyAmount: 'Free'
        };
    }
  };

  const tierConfig = getTierConfig(statusContext.tier);
  const TierIcon = tierConfig.icon;

  // Calculate days remaining
  const getDaysRemaining = () => {
    if (!statusContext.expiryDate) return null;
    const today = new Date();
    const expiry = new Date(statusContext.expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays; // Return actual value (negative for expired)
  };

  const daysRemaining = getDaysRemaining();

  // Loading state
  if (subscriptionLoading) {
    return (
      <Card className={`${className} animate-pulse`}>
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>

      {/* Subscription Alert Banners */}
      {subscriptionAlerts.length > 0 && (
        <div className="mb-6 space-y-3">
          {subscriptionAlerts.map((alert) => (
            <SubscriptionAlertBanner
              key={alert.id}
              alert={alert}
              onDismiss={dismissAlert}
              onContactStore={handleContactStore}
            />
          ))}
        </div>
      )}

      <Card className="border-bookconnect-brown/20 shadow-md">
        <CardHeader className={`bg-gradient-to-r ${tierConfig.gradientColor} text-white rounded-t-lg`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <TierIcon className="h-6 w-6" />
            <div>
              <CardTitle className="text-xl font-serif">{tierConfig.label}</CardTitle>
              <CardDescription className="text-white/90 text-sm">
                {tierConfig.description}
              </CardDescription>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold">{tierConfig.monthlyAmount}</div>
            {tierConfig.monthlyAmount !== 'Free' && (
              <div className="text-xs text-white/80">per month</div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Membership Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Current Status */}
          <div className="space-y-3">
            <h4 className="font-medium text-bookconnect-brown flex items-center">
              <CheckCircle className="h-4 w-4 mr-2" />
              Membership Status
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Current Tier</span>
                <Badge 
                  variant="outline" 
                  className={`${tierConfig.bgColor} ${tierConfig.borderColor} ${tierConfig.color}`}
                >
                  {tierConfig.label}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status</span>
                <div className="flex items-center space-x-1">
                  {statusContext.hasActiveSubscription ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <Badge 
                    variant={statusContext.hasActiveSubscription ? 'default' : 'destructive'}
                    className="text-xs"
                  >
                    {statusContext.hasActiveSubscription ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="space-y-3">
            <h4 className="font-medium text-bookconnect-brown flex items-center">
              <DollarSign className="h-4 w-4 mr-2" />
              Payment Information
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Monthly Amount</span>
                <span className="font-medium">{tierConfig.monthlyAmount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Payment Method</span>
                <span className="text-sm text-gray-500">Direct to Store Owner</span>
              </div>
            </div>
          </div>
        </div>

        <Separator className="bg-bookconnect-brown/20" />

        {/* Membership Timeline */}
        {statusContext.expiryDate && (
          <div className="space-y-3">
            <h4 className="font-medium text-bookconnect-brown flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              Membership Timeline
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">
                  {new Date(statusContext.expiryDate) < new Date() ? 'Expired On' : 'Expires On'}
                </div>
                <div className="font-medium">
                  {new Date(statusContext.expiryDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
              
              {daysRemaining !== null && (
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">
                    {daysRemaining < 0 ? 'Days Since Expiry' : 'Days Remaining'}
                  </div>
                  <div className={`font-medium ${Math.abs(daysRemaining) <= 7 ? 'text-red-600' : Math.abs(daysRemaining) <= 30 ? 'text-amber-600' : 'text-green-600'}`}>
                    {Math.abs(daysRemaining)} days
                  </div>
                </div>
              )}

              {statusContext.lastValidated && (
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Last Updated</div>
                  <div className="font-medium text-xs">
                    {new Date(statusContext.lastValidated).toLocaleDateString()}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Membership Benefits */}
        <div className="space-y-3">
          <h4 className="font-medium text-bookconnect-brown flex items-center">
            <Star className="h-4 w-4 mr-2" />
            Your Membership Benefits
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {statusContext.tier === 'PRIVILEGED_PLUS' && (
              <>
                <div className="flex items-center space-x-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Unlimited club creation</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Exclusive content access</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Priority support</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Advanced features</span>
                </div>
              </>
            )}
            
            {statusContext.tier === 'PRIVILEGED' && (
              <>
                <div className="flex items-center space-x-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Create up to 3 clubs</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Premium content access</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Unlimited club joins</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Direct messaging</span>
                </div>
              </>
            )}
            
            {statusContext.tier === 'MEMBER' && (
              <>
                <div className="flex items-center space-x-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Join up to 5 clubs</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Basic discussions</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Public content access</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Profile customization</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Payment Model Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <div className="font-medium text-blue-800 mb-1">Payment Information</div>
              <div className="text-blue-700">
                Membership upgrades are processed manually by the store owner.
                Contact the store owner directly to upgrade your membership or make payments.
              </div>
            </div>
          </div>
        </div>

        {/* Payment History Section */}
        <div className="mt-6">
          <Separator className="mb-4" />
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-bookconnect-brown" />
              <h3 className="text-lg font-semibold text-bookconnect-brown">Payment History</h3>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPaymentHistory(true)}
              className="flex items-center gap-2"
            >
              <Receipt className="h-4 w-4" />
              View All Payments
            </Button>
          </div>

          <CompactPaymentHistory
            maxItems={3}
            title="Recent Payments"
            showViewAllButton={false}
            className="mb-6"
          />


        </div>

        {/* Account Management Section */}
        <div className="mt-6">
          <Separator className="mb-4" />
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Account Management</h3>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="font-medium text-red-800 mb-2">Delete Account</div>
                <div className="text-sm text-red-700 mb-3">
                  Permanently delete your account and all associated data. This action cannot be undone.
                  Your account will be soft-deleted and retained for 30 days for recovery purposes.
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteDialogOpen}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete My Account
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    {/* Account Deletion Confirmation Dialog */}
    <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Confirm Account Deletion
          </DialogTitle>
          <DialogDescription>
            This will permanently delete your account and all associated data.
            This action cannot be undone. Your account will be soft-deleted and retained for 30 days.
            <br /><br />
            <strong>Note:</strong> If you own book clubs, account deletion will take up to 3 business days to allow for club leadership transfer.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="text-sm text-red-800">
              <strong>What will be deleted:</strong>
              <ul className="mt-1 ml-4 list-disc">
                <li>Your profile and personal information</li>
                <li>Your club memberships and discussions</li>
                <li>Your book reviews and ratings</li>
                <li>Your direct messages and conversations</li>
              </ul>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="delete-password">Confirm your password</Label>
            <Input
              id="delete-password"
              type="password"
              placeholder="Enter your password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              className={deletePassword.length > 0 && deletePassword.length < 6 ? 'border-red-500' : ''}
            />
            {deletePassword.length > 0 && deletePassword.length < 6 && (
              <p className="text-sm text-red-500">Password must be at least 6 characters</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="delete-reason">Reason for deletion (optional)</Label>
            <Textarea
              id="delete-reason"
              placeholder="Tell us why you're deleting your account (minimum 10 characters)..."
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              rows={3}
              className={deleteReason.length > 0 && deleteReason.length < 10 ? 'border-red-500' : ''}
            />
            {deleteReason.length > 0 && deleteReason.length < 10 && (
              <p className="text-sm text-red-500">Reason must be at least 10 characters</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setShowDeleteDialog(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeleteAccount}
            disabled={!isDeleteFormValid() || isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete Account'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Payment History Modal */}
    <PaymentHistoryModal
      isOpen={showPaymentHistory}
      onClose={() => setShowPaymentHistory(false)}
      title="Payment History"
    />
    </div>
  );
}
