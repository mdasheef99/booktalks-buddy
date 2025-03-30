
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, User, apiCall } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { Session } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';

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
  const { toast } = useToast();
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
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      toast({
        title: "Error signing in",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Welcome back!",
        description: "You've successfully signed in.",
      });
      navigate('/');
    }
  };

  const signUp = async (email: string, password: string, username: string) => {
    setLoading(true);
    
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setLoading(false);
      toast({
        title: "Error signing up",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    if (data.user) {
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
        toast({
          title: "Error creating profile",
          description: profileError.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Account created!",
          description: "Welcome to BookConnect!",
        });
        navigate('/');
      }
    }

    setLoading(false);
  };

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setLoading(false);
    toast({
      title: "Signed out",
      description: "You've been successfully signed out.",
    });
    navigate('/login');
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
