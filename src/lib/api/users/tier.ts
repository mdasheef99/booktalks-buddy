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
    .select('membership_tier')
    .eq('id', userId)
    .single();

  if (error) {
    throw new Error('User not found');
  }

  return { tier: data.membership_tier };
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
    console.log('📊 Updating user tier in database...');

    // First check if the user exists and we can access them
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id, membership_tier')
      .eq('id', userId)
      .single();

    if (checkError) {
      console.error('❌ Cannot access user for update:', checkError);
      throw new Error('Cannot access user for tier update: ' + checkError.message);
    }

    console.log('📋 Current user data:', existingUser);

    // Validate tier value
    const validTiers = ['MEMBER', 'PRIVILEGED', 'PRIVILEGED_PLUS'];
    if (!validTiers.includes(tier)) {
      throw new Error(`Invalid tier: ${tier}. Must be one of: ${validTiers.join(', ')}`);
    }

    // Update the user's tier in the database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .update({ membership_tier: tier })
      .eq('id', userId)
      .select();

    if (userError) {
      console.error('❌ Database update failed:', userError);
      throw new Error('Failed to update user tier: ' + userError.message);
    }

    if (!userData || userData.length === 0) {
      console.error('❌ No rows updated');
      throw new Error('No user was updated - check permissions');
    }

    console.log('✅ User tier updated in database:', userData[0]);

    // Invalidate the user's entitlements cache since their tier has changed
    invalidateUserEntitlements(userId);

    // Also invalidate the current user's cache if they're different
    if (currentUserId !== userId) {
      invalidateUserEntitlements(currentUserId);
    }

    // If upgrading to a paid tier, create a subscription and payment record
    if (tier !== 'MEMBER' && subscriptionType) {
      console.log('💳 Creating subscription and payment record...');

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
        console.error('❌ Subscription creation failed:', subscriptionError);
        throw new Error('Failed to create subscription and payment: ' + subscriptionError.message);
      }

      console.log('✅ Subscription and payment created:', subscriptionId);
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
