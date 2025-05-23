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
  const [tier, setTier] = useState(currentTier);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [subscriptionType, setSubscriptionType] = useState<'monthly' | 'annual'>('monthly');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const { result: canManage, loading } = useCanManageUserTiers(storeId);
  const { user } = useAuth();

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
    if (tier === currentTier) return;
    setIsDialogOpen(true);
  };

  const closeConfirmDialog = () => {
    setIsDialogOpen(false);
  };

  const updateTier = async () => {
    if (tier === currentTier) return;
    if (!user) {
      toast.error('You must be logged in to update user tiers');
      return;
    }

    setIsUpdating(true);
    closeConfirmDialog();

    try {
      // Parse payment amount to number if provided
      const amount = paymentAmount ? parseFloat(paymentAmount) : undefined;

      // Call our API function to update the user's tier
      await updateUserTier(
        user.id,
        userId,
        tier,
        storeId,
        tier !== 'free' ? subscriptionType : undefined,
        paymentReference || undefined,
        amount,
        paymentNotes || undefined
      );

      toast.success('User tier updated successfully');

      // Reset payment fields after successful update
      setPaymentReference('');
      setPaymentAmount('');
      setPaymentNotes('');

      if (onTierUpdated) {
        onTierUpdated(tier);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update user tier');
      setTier(currentTier); // Reset to current tier on error
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
          <SelectItem value="free">Free</SelectItem>
          <SelectItem value="privileged">Privileged</SelectItem>
          <SelectItem value="privileged_plus">Privileged Plus</SelectItem>
        </SelectContent>
      </Select>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onClick={openConfirmDialog}
            disabled={isUpdating || tier === currentTier}
          >
            {isUpdating ? 'Updating...' : 'Update'}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Tier Update</DialogTitle>
            <DialogDescription>
              You are about to update this user's tier to <strong>{tier}</strong>.
              {tier !== 'free' && ' Please provide the subscription details below.'}
            </DialogDescription>
          </DialogHeader>

          {tier !== 'free' && (
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
