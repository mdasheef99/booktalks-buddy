import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import UserTierBadge from '@/components/common/UserTierBadge';
import { useCanManageUserTiers } from '@/lib/entitlements/hooks';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { updateUserTier } from '@/lib/api/users/tier';
import { useAuth } from '@/contexts/AuthContext';

type UserTierManagerProps = {
  userId: string;
  currentTier: string;
  storeId: string;
  onTierUpdated?: (newTier: string) => void;
};

type SubscriptionType = 'monthly' | 'annual';

/**
 * Component for managing a user's account tier
 */
export function UserTierManager({ userId, currentTier, storeId, onTierUpdated }: UserTierManagerProps) {
  // Convert legacy tier to new tier format for display
  const convertToNewTier = (legacyTier: string) => {
    switch (legacyTier) {
      case 'free': return 'MEMBER';
      case 'privileged': return 'PRIVILEGED';
      case 'privileged_plus': return 'PRIVILEGED_PLUS';
      default: return legacyTier;
    }
  };

  const [tier, setTier] = useState(convertToNewTier(currentTier));
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [subscriptionType, setSubscriptionType] = useState<'monthly' | 'annual'>('monthly');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const { result: canManage, loading } = useCanManageUserTiers(storeId);
  const { user } = useAuth();

  // Debug logging for UserTierManager
  React.useEffect(() => {
    console.log('🎯 UserTierManager Debug Info:');
    console.log('  userId:', userId);
    console.log('  currentTier:', currentTier);
    console.log('  storeId:', storeId);
    console.log('  canManage:', canManage);
    console.log('  loading:', loading);
    console.log('  currentUser:', user?.id);
  }, [userId, currentTier, storeId, canManage, loading, user?.id]);

  const handleTierChange = (value: string) => {
    setTier(value);
  };

  const handleSubscriptionTypeChange = (value: 'monthly' | 'annual') => {
    setSubscriptionType(value);
  };

  const handlePaymentReferenceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPaymentReference(e.target.value);
  };

  const handlePaymentAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers and decimal point
    const value = e.target.value.replace(/[^0-9.]/g, '');
    setPaymentAmount(value);
  };

  const handlePaymentNotesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPaymentNotes(e.target.value);
  };

  const openConfirmDialog = () => {
    if (tier === convertToNewTier(currentTier)) return;
    setIsDialogOpen(true);
  };

  const closeConfirmDialog = () => {
    setIsDialogOpen(false);
  };

  const updateTier = async () => {
    if (tier === convertToNewTier(currentTier)) return;
    if (!user) {
      toast.error('You must be logged in to update user tiers');
      return;
    }

    setIsUpdating(true);
    closeConfirmDialog();

    try {
      // Parse payment amount to number if provided
      const amount = paymentAmount ? parseFloat(paymentAmount) : undefined;

      console.log('🔄 Starting tier update process:');
      console.log('  Current user:', user.id);
      console.log('  Target user:', userId);
      console.log('  From tier:', currentTier);
      console.log('  To tier:', tier);
      console.log('  Store ID:', storeId);
      console.log('  Subscription type:', tier !== 'MEMBER' ? subscriptionType : 'none');
      console.log('  Payment amount:', amount);
      console.log('  Payment reference:', paymentReference);
      console.log('  Notes:', paymentNotes);

      // Call our API function to update the user's tier
      await updateUserTier(
        user.id,
        userId,
        tier,
        storeId,
        tier !== 'MEMBER' ? subscriptionType : undefined,
        paymentReference || undefined,
        amount,
        paymentNotes || undefined
      );

      console.log('✅ Tier update completed successfully');
      toast.success('User tier updated successfully');

      // Reset payment fields after successful update
      setPaymentReference('');
      setPaymentAmount('');
      setPaymentNotes('');

      if (onTierUpdated) {
        onTierUpdated(tier);
      }
    } catch (error: any) {
      console.error('❌ Tier update failed:', error);
      toast.error(error.message || 'Failed to update user tier');
      setTier(convertToNewTier(currentTier)); // Reset to current tier on error
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!canManage) {
    return (
      <div className="flex items-center space-x-2">
        <UserTierBadge tier={currentTier} />
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <Select value={tier} onValueChange={handleTierChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select tier" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="MEMBER">Member (Free)</SelectItem>
          <SelectItem value="PRIVILEGED">Privileged</SelectItem>
          <SelectItem value="PRIVILEGED_PLUS">Privileged Plus</SelectItem>
        </SelectContent>
      </Select>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onClick={openConfirmDialog}
            disabled={isUpdating || tier === convertToNewTier(currentTier)}
          >
            {isUpdating ? 'Updating...' : 'Update'}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Tier Update</DialogTitle>
            <DialogDescription>
              You are about to update this user's tier to <strong>{tier}</strong>.
              {tier !== 'MEMBER' && ' Please provide the subscription details below.'}
            </DialogDescription>
          </DialogHeader>

          {tier !== 'MEMBER' && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="subscription-type">Subscription Type</Label>
                <RadioGroup
                  id="subscription-type"
                  value={subscriptionType}
                  onValueChange={handleSubscriptionTypeChange}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="monthly" id="monthly" />
                    <Label htmlFor="monthly">Monthly</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="annual" id="annual" />
                    <Label htmlFor="annual">Annual</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="payment-amount">Payment Amount (Optional)</Label>
                <Input
                  id="payment-amount"
                  type="text"
                  value={paymentAmount}
                  onChange={handlePaymentAmountChange}
                  placeholder="e.g., 9.99"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="payment-reference">Payment Reference (Optional)</Label>
                <Input
                  id="payment-reference"
                  value={paymentReference}
                  onChange={handlePaymentReferenceChange}
                  placeholder="e.g., Transaction ID, Receipt Number"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="payment-notes">Notes (Optional)</Label>
                <Input
                  id="payment-notes"
                  value={paymentNotes}
                  onChange={handlePaymentNotesChange}
                  placeholder="e.g., Payment received via bank transfer"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeConfirmDialog}>Cancel</Button>
            <Button onClick={updateTier} disabled={isUpdating}>
              {isUpdating ? 'Updating...' : 'Confirm Update'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
