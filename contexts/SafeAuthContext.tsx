import React from 'react';
import { supabase } from '@/lib/supabase';

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
  user: any | null;
  profile: UserProfile | null;
  session: any | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, userData: any) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  hasRole: (role: string) => boolean;
  isRole: (role: string) => boolean;
}

// Create context with a default value to prevent null issues
const defaultAuthValue: AuthContextType = {
  user: null,
  profile: null,
  session: null,
  loading: false,
  signIn: async () => ({ error: 'Auth not initialized' }),
  signUp: async () => ({ error: 'Auth not initialized' }),
  signOut: async () => {},
  refreshProfile: async () => {},
  hasRole: () => false,
  isRole: () => false,
};

const AuthContext = React.createContext<AuthContextType>(defaultAuthValue);

export const useAuth = (): AuthContextType => {
  try {
    const context = React.useContext(AuthContext);
    // Even if context is null/undefined, we return the default value
    return context || defaultAuthValue;
  } catch (error) {
    console.warn('useAuth error, using default value:', error);
    return defaultAuthValue;
  }
};

interface AuthProviderProps {
  children: React.ReactNode;
}

interface AuthState {
  user: any | null;
  profile: UserProfile | null;
  session: any | null;
  loading: boolean;
}

export class AuthProvider extends React.Component<AuthProviderProps, AuthState> {
  constructor(props: AuthProviderProps) {
    super(props);
    this.state = {
      user: null,
      profile: null,
      session: null,
      loading: false,
    };
  }

  signIn = async (email: string, password: string): Promise<{ error?: string }> => {
    try {
      this.setState({ loading: true });
      console.log('Attempting sign in with:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
      });

      if (error) {
        console.error('Sign in error:', error);
        return { error: error.message };
      }

      if (data.user) {
        console.log('Sign in successful:', data.user.email);
        this.setState({ 
          user: data.user, 
          session: data.session 
        });
        
        // Try to load profile
        try {
          const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('auth_user_id', data.user.id)
            .single();
            
          if (profile && !profileError) {
            this.setState({ profile });
            console.log('Loaded user profile:', profile.name);
          } else {
            console.warn('No profile found for user:', data.user.id);
          }
        } catch (profileError) {
          console.warn('Profile loading failed:', profileError);
        }
      }

      return {};
    } catch (error) {
      console.error('Sign in error:', error);
      return { error: 'An unexpected error occurred' };
    } finally {
      this.setState({ loading: false });
    }
  };

  signUp = async (email: string, password: string, userData: any): Promise<{ error?: string }> => {
    try {
      this.setState({ loading: true });
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
      this.setState({ loading: false });
    }
  };

  signOut = async (): Promise<void> => {
    try {
      this.setState({ loading: true });
      await supabase.auth.signOut();
      this.setState({ 
        user: null, 
        profile: null, 
        session: null 
      });
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      this.setState({ loading: false });
    }
  };

  refreshProfile = async (): Promise<void> => {
    if (this.state.user) {
      try {
        const { data: profile, error } = await supabase
          .from('users')
          .select('*')
          .eq('auth_user_id', this.state.user.id)
          .single();
          
        if (profile && !error) {
          this.setState({ profile });
        }
      } catch (error) {
        console.warn('Profile refresh failed:', error);
      }
    }
  };

  hasRole = (role: string): boolean => {
    return this.state.profile?.role === role;
  };

  isRole = (role: string): boolean => {
    return this.state.profile?.role === role;
  };

  render() {
    const value: AuthContextType = {
      user: this.state.user,
      profile: this.state.profile,
      session: this.state.session,
      loading: this.state.loading,
      signIn: this.signIn,
      signUp: this.signUp,
      signOut: this.signOut,
      refreshProfile: this.refreshProfile,
      hasRole: this.hasRole,
      isRole: this.isRole,
    };

    return (
      <AuthContext.Provider value={value}>
        {this.props.children}
      </AuthContext.Provider>
    );
  }
}
