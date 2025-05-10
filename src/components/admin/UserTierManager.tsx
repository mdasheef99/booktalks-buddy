import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { UserTierBadge } from './UserTierBadge';
import { useCanManageUserTiers } from '@/lib/entitlements/hooks';

type UserTierManagerProps = {
  userId: string;
  currentTier: string;
  storeId: string;
  onTierUpdated?: (newTier: string) => void;
};

/**
 * Component for managing a user's account tier
 */
export function UserTierManager({ userId, currentTier, storeId, onTierUpdated }: UserTierManagerProps) {
  const [tier, setTier] = useState(currentTier);
  const [isUpdating, setIsUpdating] = useState(false);
  const { result: canManage, loading } = useCanManageUserTiers(storeId);
  
  const handleTierChange = (value: string) => {
    setTier(value);
  };
  
  const updateTier = async () => {
    if (tier === currentTier) return;
    
    setIsUpdating(true);
    
    try {
      const response = await fetch(`/api/users/${userId}/tier`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tier,
          storeId,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update user tier');
      }
      
      toast.success('User tier updated successfully');
      
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
      
      <Button 
        variant="outline" 
        size="sm" 
        onClick={updateTier} 
        disabled={isUpdating || tier === currentTier}
      >
        {isUpdating ? 'Updating...' : 'Update'}
      </Button>
    </div>
  );
}
