
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, User, apiCall } from '@/lib/supabase';
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
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast: uiToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSession = async () => {
      console.log("Fetching initial session...");
      const { data: { session } } = await supabase.auth.getSession();
      console.log("Initial session:", session);
      setSession(session);
      
      if (session?.user) {
        console.log("Session user found, fetching profile...");
        try {
          const { data } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          console.log("User profile:", data);
          setUser(data as User);
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      }
      
      setLoading(false);
    };

    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event, session);
        setSession(session);
        
        if (session?.user) {
          try {
            console.log("Fetching user profile after auth state change...");
            const { data } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();
            
            console.log("Updated user profile:", data);
            setUser(data as User);
            
            // If authenticated, ensure we navigate to the book club page
            if (event === 'SIGNED_IN') {
              console.log("User signed in, redirecting to book club");
              toast.success(`Welcome ${data?.username || 'back'}!`);
              navigate('/book-club');
            }
          } catch (error) {
            console.error("Error fetching user profile after auth state change:", error);
          }
        } else {
          setUser(null);
        }
        
        setLoading(false);
      }
    );

    return () => {
      console.log("Cleaning up auth subscription");
      subscription.unsubscribe();
    };
  }, [navigate]);

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
      console.log("Signing out...");
      await supabase.auth.signOut();
      toast.success("You've been successfully signed out");
      navigate('/login');
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Failed to sign out");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut }}>
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
