import { supabase } from '@/lib/supabase';
import { getUserEntitlements, invalidateUserEntitlements } from '@/lib/entitlements/cache';
import { canManageUserTiers } from '@/lib/entitlements';

/**
 * API functions for managing user tiers
 */

/**
 * Get a user's current tier
 * @param userId - ID of the user to get the tier for
 * @returns The user's current tier
 */
export async function getUserTier(userId: string) {
  // Get the authenticated user
  const { data: { session } } = await supabase.auth.getSession();
  const currentUser = session?.user;

  if (!currentUser) {
    throw new Error('Unauthorized');
  }

  // Get the user's tier
  const { data, error } = await supabase
    .from('users')
    .select('account_tier')
    .eq('id', userId)
    .single();

  if (error) {
    throw new Error('User not found');
  }

  return { tier: data.account_tier };
}

/**
 * Update a user's tier
 * @param currentUserId - ID of the user making the change
 * @param userId - ID of the user to update
 * @param tier - New tier ('free', 'privileged', or 'privileged_plus')
 * @param storeId - ID of the store context
 * @param subscriptionType - Type of subscription ('monthly' or 'annual')
 * @param paymentReference - Optional reference for the payment
 * @param amount - Optional payment amount
 * @param notes - Optional notes about the payment
 * @returns The updated user
 */
export async function updateUserTier(
  currentUserId: string,
  userId: string,
  tier: string,
  storeId: string,
  subscriptionType?: 'monthly' | 'annual',
  paymentReference?: string,
  amount?: number,
  notes?: string
) {
  // Validate the tier
  if (!['free', 'privileged', 'privileged_plus'].includes(tier)) {
    throw new Error('Invalid tier. Must be one of: free, privileged, privileged_plus');
  }

  // Check if the current user has permission to manage user tiers
  const entitlements = await getUserEntitlements(currentUserId);
  if (!canManageUserTiers(entitlements, storeId)) {
    throw new Error('You do not have permission to manage user tiers');
  }

  try {
    // Update the user's tier in the database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .update({ account_tier: tier })
      .eq('id', userId)
      .select()
      .single();

    if (userError) {
      throw new Error('Failed to update user tier: ' + userError.message);
    }

    // Invalidate the user's entitlements cache since their tier has changed
    invalidateUserEntitlements(userId);

    // Also invalidate the current user's cache if they're different
    if (currentUserId !== userId) {
      invalidateUserEntitlements(currentUserId);
    }

    // If upgrading to a paid tier, create a subscription and payment record
    if (tier !== 'free' && subscriptionType) {
      // Use the helper function to create subscription and payment in one transaction
      const { data: subscriptionId, error: subscriptionError } = await supabase
        .rpc('create_subscription_with_payment', {
          p_user_id: userId,
          p_store_id: storeId,
          p_tier: tier,
          p_subscription_type: subscriptionType,
          p_recorded_by: currentUserId,
          p_amount: amount,
          p_payment_reference: paymentReference,
          p_notes: notes
        });

      if (subscriptionError) {
        throw new Error('Failed to create subscription and payment: ' + subscriptionError.message);
      }
    }

    return {
      success: true,
      message: 'User tier updated successfully',
      user: {
        id: userData.id,
        account_tier: userData.account_tier
      }
    };
  } catch (error: any) {
    throw error;
  }
}
