'use client'

import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  error: Error | null;
  loginMutation: {
    mutate: (credentials: LoginData) => Promise<{ success: boolean; message?: string; data?: any }>;
    isPending: boolean;
    error: Error | null;
  };
  logoutMutation: {
    mutate: () => Promise<{ success: boolean; message?: string; data?: any }>;
    isPending: boolean;
    error: Error | null;
  };
  registerMutation: {
    mutate: (credentials: RegisterData) => Promise<{ success: boolean; message?: string; data?: any }>;
    isPending: boolean;
    error: Error | null;
  };
};

type LoginData = {
  username: string;
  password: string;
};

type RegisterData = {
  username: string;
  password: string;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [loginPending, setLoginPending] = useState(false);
  const [logoutPending, setLogoutPending] = useState(false);
  const [registerPending, setRegisterPending] = useState(false);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loginMutation = {
    mutate: async (credentials: LoginData) => {
      setLoginPending(true);
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: credentials.username,
          password: credentials.password,
        });
        
        if (error) {
          // If user doesn't exist, create them
          if (error.message.includes('Invalid login credentials')) {
            console.log('👤 User not found, creating new user...');
            
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
              email: credentials.username,
              password: credentials.password,
            });

            if (signUpError) {
              throw new Error("Failed to create user");
            }

            setUser(signUpData.user!);
            return { success: true, message: "Login successful", data: signUpData };
          }
          throw new Error(error.message);
        }

        setUser(data.user!);
        return { success: true, message: "Login successful", data: data };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return { success: false, message: errorMessage };
      } finally {
        setLoginPending(false);
      }
    },
    isPending: loginPending,
    error: null
  };

  const registerMutation = {
    mutate: async (credentials: RegisterData) => {
      setRegisterPending(true);
      try {
        const { data, error } = await supabase.auth.signUp({
          email: credentials.username,
          password: credentials.password,
        });
        
        if (error) {
          throw new Error(error.message);
        }

        setUser(data.user!);
        // Redirect to welcome page for new users
        if (typeof window !== 'undefined') {
          window.location.href = '/welcome';
        }
        return { success: true, message: "Registration successful", data: data };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return { success: false, message: errorMessage };
      } finally {
        setRegisterPending(false);
      }
    },
    isPending: registerPending,
    error: null
  };

  const logoutMutation = {
    mutate: async () => {
      setLogoutPending(true);
      try {
        const { error } = await supabase.auth.signOut();
        if (error) {
          throw new Error(error.message);
        }
        setUser(null);
        
        // Route to auth page after successful logout
        if (typeof window !== 'undefined') {
          window.location.href = '/auth';
        }
        return { success: true, message: "Logout successful" };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return { success: false, message: errorMessage };
      } finally {
        setLogoutPending(false);
      }
    },
    isPending: logoutPending,
    error: null
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}