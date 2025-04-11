

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, apiCall } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import { useToast } from '@/components/ui/use-toast';
import { Session } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;

  // New: club membership info
  clubRoles: Record<string, string>; // clubId -> role
  fetchClubRoles: () => Promise<void>;
  isAdmin: (clubId: string) => boolean;
  isMember: (clubId: string) => boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Session['user'] | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [clubRoles, setClubRoles] = useState<Record<string, string>>({});
  const { toast: uiToast } = useToast();
  const navigate = useNavigate();

  const fetchClubRoles = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('club_members')
        .select('club_id, role')
        .eq('user_id', user.id);

      if (error) {
        toast.error('Failed to load club membership data');
        return;
      }

      const rolesMap: Record<string, string> = {};
      data?.forEach((row: any) => {
        rolesMap[row.club_id] = row.role;
      });
      setClubRoles(rolesMap);
    } catch (err) {
      toast.error('Failed to load club membership data');
    }
  };

  const isAdmin = (clubId: string) => {
    return clubRoles[clubId] === 'admin';
  };

  const isMember = (clubId: string) => {
    return clubRoles.hasOwnProperty(clubId);
  };

  // Main auth session effect - only depends on navigate
  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);

      if (session?.user) {
        setUser(session?.user);
      }

      setLoading(false);
    };

    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);

        if (session?.user) {
          setUser(session?.user);

          if (event === 'SIGNED_IN') {
            toast.success(`Welcome back!`);
            navigate('/book-club');
          }
        } else {
          setUser(null);
          setClubRoles({});
        }

        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]); // Removed user?.id dependency to prevent circular updates

  // Separate effect for fetching club roles when user changes
  useEffect(() => {
    if (user?.id) {
      console.log("User ID changed, fetching club roles");
      fetchClubRoles();
    }
  }, [user?.id]);

  const signIn = async (email: string, password: string) => {
    setLoading(true);

    try {
      console.log("Starting sign in process with email:", email);
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Sign in error:", error);
        toast.error(error.message || "Failed to sign in");
        return;
      }

      console.log("Sign in successful, user:", data.user);
      toast.success("Successfully signed in!");

      // Navigate will be handled by the auth state change listener
    } catch (error: any) {
      console.error("Unexpected error during sign in:", error);
      toast.error(error.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, username: string) => {
    setLoading(true);

    try {
      console.log("Starting sign up process with email:", email);
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        console.error("Sign up error:", error);
        toast.error(error.message || "Failed to sign up");
        return;
      }

      if (data.user) {
        console.log("User created, now creating profile");
        // Create a record in the users table
        const { error: profileError } = await supabase
          .from('users')
          .insert([
            {
              id: data.user.id,
              email,
              username
            }
          ]);

        if (profileError) {
          console.error("Error creating profile:", profileError);
          toast.error(profileError.message || "Failed to create profile");
        } else {
          console.log("Profile created successfully");
          toast.success("Account created! Welcome to BookConnect!");
          navigate('/book-club');
        }
      }
    } catch (error: any) {
      console.error("Unexpected error during sign up:", error);
      toast.error(error.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      toast.success("You've been successfully signed out");
      navigate('/login');
    } catch (error) {
      toast.error("Failed to sign out");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      signIn,
      signUp,
      signOut,
      clubRoles,
      fetchClubRoles,
      isAdmin,
      isMember
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
