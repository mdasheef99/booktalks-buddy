/**
 * Core Authentication Functions
 * 
 * This module handles the core authentication operations including
 * sign in, sign up, and sign out functionality.
 * 
 * Part of: AuthContext System Refactoring
 * Created: 2025-01-11
 */

import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { invalidateUserEntitlements } from '@/lib/entitlements/cache';
import { invalidateOnSubscriptionEvent } from '@/lib/api/subscriptions/cache';
import type { User } from '@supabase/supabase-js';
import type { SubscriptionStatus } from '@/lib/api/subscriptions/types';

/**
 * Sign in with email and password
 *
 * @param email - User email
 * @param password - User password
 * @param setLoading - Loading state setter
 * @returns Promise<void>
 */
export async function signIn(
  email: string,
  password: string,
  setLoading: (loading: boolean) => void
): Promise<void> {
  setLoading(true);

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error(error.message || "Failed to sign in");
      return;
    }

    toast.success("Successfully signed in!");

    // Navigate will be handled by the auth state change listener
  } catch (error: any) {
    toast.error(error.message || "An unexpected error occurred");
  } finally {
    setLoading(false);
  }
}

/**
 * Sign up with email, password, and username
 * 
 * @param email - User email
 * @param password - User password
 * @param username - User username
 * @param setLoading - Loading state setter
 * @param navigate - Navigation function
 * @returns Promise<void>
 */
export async function signUp(
  email: string, 
  password: string, 
  username: string,
  setLoading: (loading: boolean) => void,
  navigate: (path: string) => void
): Promise<void> {
  setLoading(true);

  try {
    // Create auth user with username in metadata for database trigger
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username
        }
      }
    });

    if (error) {
      toast.error(error.message || "Failed to sign up");
      return;
    }

    if (data.user) {
      toast.success("Account created! Welcome to BookConnect!");
      navigate('/book-club');
    }
  } catch (error: any) {
    toast.error(error.message || "An unexpected error occurred");
  } finally {
    setLoading(false);
  }
}

/**
 * Sign out the current user
 * 
 * @param user - Current user
 * @param setLoading - Loading state setter
 * @param setEntitlements - Entitlements state setter
 * @param setSubscriptionStatus - Subscription status setter
 * @param navigate - Navigation function
 * @returns Promise<void>
 */
export async function signOut(
  user: User | null,
  setLoading: (loading: boolean) => void,
  setEntitlements: (entitlements: string[]) => void,
  setSubscriptionStatus: (status: SubscriptionStatus | null) => void,
  navigate: (path: string) => void
): Promise<void> {
  setLoading(true);

  try {
    // Invalidate caches if user exists
    if (user?.id) {
      invalidateUserEntitlements(user.id);

      // Invalidate subscription cache using Phase 4A.1 integration
      try {
        await invalidateOnSubscriptionEvent(user.id, 'subscription_expired');
      } catch (error) {
        console.warn('[AuthContext] Failed to invalidate subscription cache on sign out:', error);
        // Non-critical error - continue with sign out
      }
    }

    await supabase.auth.signOut();
    setEntitlements([]);
    setSubscriptionStatus(null);
    toast.success("You've been successfully signed out");
    navigate('/login');
  } catch (error) {
    toast.error("Failed to sign out");
  } finally {
    setLoading(false);
  }
}
