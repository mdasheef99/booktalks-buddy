import { supabase } from '../../supabase';
import { isClubAdmin } from '../auth';
import { getUserEntitlements, invalidateUserEntitlements } from '@/lib/entitlements/cache';
import { canManageUserTiers } from '@/lib/entitlements';

/**
 * Admin Management Functions
 */

/**
 * List all members for admin view
 */
export async function listAdminMembers(userId: string) {
  // Check if user is a global admin (assumed via Auth metadata or separate check)
  // For now, assume all authenticated users can list members (adjust as needed)
  const { data, error } = await supabase.from('users').select('*');
  if (error) throw error;
  return data;
}

/**
 * Remove a member from a club (admin only)
 * Note: This is duplicated in bookclubs/members.ts for organizational purposes
 */
export async function removeMember(adminId: string, userIdToRemove: string, clubId: string) {
  if (!(await isClubAdmin(adminId, clubId))) throw new Error('Unauthorized');

  const { error } = await supabase
    .from('club_members')
    .delete()
    .eq('user_id', userIdToRemove)
    .eq('club_id', clubId);

  if (error) throw error;
  return { success: true };
}

/**
 * Invite a member to a club (admin only)
 * Note: This is duplicated in bookclubs/members.ts for organizational purposes
 */
export async function inviteMember(adminId: string, clubId: string, inviteeEmail: string) {
  if (!(await isClubAdmin(adminId, clubId))) throw new Error('Unauthorized');

  // Implement invite logic (e.g., insert into invites table or send email)
  // Placeholder implementation:
  return { success: true, message: 'Invite sent (placeholder)' };
}

/**
 * Update a user's account tier
 * @param adminId - ID of the admin making the change
 * @param userId - ID of the user to update
 * @param tier - New tier ('free', 'privileged', or 'privileged_plus')
 * @param storeId - ID of the store context
 * @param subscriptionType - Type of subscription ('monthly' or 'annual')
 * @param paymentReference - Optional reference for the payment
 * @param amount - Optional payment amount
 * @param notes - Optional notes about the payment
 */
export async function updateUserTier(
  adminId: string,
  userId: string,
  tier: string,
  storeId: string,
  subscriptionType?: 'monthly' | 'annual',
  paymentReference?: string,
  amount?: number,
  notes?: string
) {
  // Check if the admin has permission to manage user tiers
  const entitlements = await getUserEntitlements(adminId);
  if (!canManageUserTiers(entitlements, storeId)) {
    throw new Error('You do not have permission to manage user tiers');
  }

  // Validate the tier
  if (!['free', 'privileged', 'privileged_plus'].includes(tier)) {
    throw new Error('Invalid tier. Must be one of: free, privileged, privileged_plus');
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

    // Also invalidate the admin's cache if they're different
    if (adminId !== userId) {
      invalidateUserEntitlements(adminId);
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
          p_recorded_by: adminId,
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
