import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import { supabase, getCurrentUserWithRole } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  role: 'superadmin' | 'admin' | 'principal' | 'teacher' | 'parent';
  phone: string | null;
  address: string | null;
  home_address: string | null;
  is_active: boolean;
  auth_user_id: string;
  preschool_id: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, userData: any) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  hasRole: (role: string) => boolean;
  isRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  // Initialize with safe defaults
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false); // Start with false to avoid hanging
  const [hasError, setHasError] = useState(false);

  // Safe effect that won't crash
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        if (!mounted) return;
        
        setLoading(true);
        console.log('Initializing Supabase auth...');
        
        // Get initial session with timeout
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session timeout')), 5000)
        );
        
        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]) as any;
        
        if (!mounted) return;
        
        if (session) {
          console.log('Found existing session:', session.user.email);
          setSession(session);
          setUser(session.user);
          
          // Try to load profile
          try {
            const { profile: userProfile, error } = await getCurrentUserWithRole();
            if (!error && userProfile && mounted) {
              setProfile(userProfile as UserProfile);
              console.log('Loaded user profile:', userProfile.name);
            }
          } catch (profileError) {
            console.warn('Profile loading failed:', profileError);
          }
        } else {
          console.log('No existing session found');
        }
        
        // Set up auth listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (!mounted) return;
            
            console.log('Auth state changed:', event);
            setSession(session);
            setUser(session?.user ?? null);
            
            if (session?.user) {
              try {
                const { profile: userProfile } = await getCurrentUserWithRole();
                if (userProfile && mounted) {
                  setProfile(userProfile as UserProfile);
                }
              } catch (error) {
                console.warn('Profile update failed:', error);
              }
            } else {
              setProfile(null);
            }
          }
        );

        return () => subscription.unsubscribe();
        
      } catch (error) {
        console.error('Auth initialization failed:', error);
        setHasError(true);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
      });

      if (error) {
        return { error: error.message };
      }

      return {};
    } catch (error) {
      console.error('Sign in error:', error);
      return { error: 'An unexpected error occurred' };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, userData: any) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password,
        options: {
          data: userData,
        },
      });

      if (error) {
        return { error: error.message };
      }

      if (data.user && !data.user.email_confirmed_at) {
        return { error: 'Please check your email to confirm your account' };
      }

      return {};
    } catch (error) {
      console.error('Sign up error:', error);
      return { error: 'An unexpected error occurred' };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setSession(null);
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      try {
        const { profile: userProfile } = await getCurrentUserWithRole();
        if (userProfile) {
          setProfile(userProfile as UserProfile);
        }
      } catch (error) {
        console.warn('Profile refresh failed:', error);
      }
    }
  };

  const hasRole = (role: string): boolean => {
    return profile?.role === role;
  };

  const isRole = (role: string): boolean => {
    return profile?.role === role;
  };

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    refreshProfile,
    hasRole,
    isRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
