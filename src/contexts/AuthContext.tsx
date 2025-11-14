/**
 * Authentication context for GaavConnect
 * Uses localStorage for local authentication when Supabase is not configured
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { signInUser, signUpUser, signOutUser, getCurrentUser } from '@/utils/supabase';

interface AuthContextType {
  user: any | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial user from localStorage
    const initializeAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const handleSignIn = async (email: string, password: string) => {
    try {
      const { user: newUser } = await signInUser(email, password);
      setUser(newUser);
    } catch (error) {
      console.error('Sign in failed:', error);
      throw error;
    }
  };

  const handleSignUp = async (email: string, password: string) => {
    try {
      const { user: newUser } = await signUpUser(email, password);
      setUser(newUser);
    } catch (error) {
      console.error('Sign up failed:', error);
      throw error;
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
      setUser(null);
    } catch (error) {
      console.error('Sign out failed:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn: handleSignIn,
        signUp: handleSignUp,
        signOut: handleSignOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
