/**
 * Session Management Functions
 * 
 * This module handles session state management, auth state changes,
 * and user session persistence.
 * 
 * Part of: AuthContext System Refactoring
 * Created: 2025-01-11
 */

import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { Session, User } from '@supabase/supabase-js';
import type { SubscriptionStatus } from '@/lib/api/subscriptions/types';

/**
 * Initialize session and set up auth state change listener
 * 
 * @param setSession - Session state setter
 * @param setUser - User state setter
 * @param setLoading - Loading state setter
 * @param setClubRoles - Club roles state setter
 * @param setSubscriptionStatus - Subscription status setter
 * @param setSubscriptionLoading - Subscription loading setter
 * @param lastKnownUserId - Last known user ID ref
 * @param setLastKnownUserId - Last known user ID setter
 * @param navigate - Navigation function
 * @returns Cleanup function
 */
export function initializeSession(
  setSession: (session: Session | null) => void,
  setUser: (user: User | null) => void,
  setLoading: (loading: boolean) => void,
  setClubRoles: (roles: Record<string, string>) => void,
  setSubscriptionStatus: (status: SubscriptionStatus | null) => void,
  setSubscriptionLoading: (loading: boolean) => void,
  lastKnownUserId: string | null,
  setLastKnownUserId: (id: string | null) => void,
  navigate: (path: string) => void
): () => void {
  // Track if this is the initial session fetch
  let isInitialMount = true;

  const fetchSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setSession(session);

    if (session?.user) {
      setUser(session?.user);
      // Store the user ID when we first load the session
      setLastKnownUserId(session.user.id);
    }

    setLoading(false);
  };

  fetchSession();

  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      // Only update session if it's a meaningful change
      setSession(session);

      if (session?.user) {
        setUser(session?.user);

        // Only show welcome message and navigate on a genuine new sign-in
        // This happens when the user ID changes from null to a value
        const isGenuineSignIn = event === 'SIGNED_IN' &&
                              !isInitialMount &&
                              lastKnownUserId === null;

        if (isGenuineSignIn) {
          toast.success(`Welcome back!`);
          navigate('/book-club');
          // Update the last known user ID
          setLastKnownUserId(session.user.id);
        } else if (lastKnownUserId !== session.user.id) {
          // Update the last known user ID without navigation
          // This handles user changes without tab switching
          setLastKnownUserId(session.user.id);
        }
      } else {
        // User signed out
        setUser(null);
        setClubRoles({});
        setLastKnownUserId(null);
        // Clear subscription data on sign out
        setSubscriptionStatus(null);
        setSubscriptionLoading(false);
      }

      setLoading(false);
      // After the first auth state change, we're no longer in the initial mount
      isInitialMount = false;
    }
  );

  return () => {
    subscription.unsubscribe();
  };
}
