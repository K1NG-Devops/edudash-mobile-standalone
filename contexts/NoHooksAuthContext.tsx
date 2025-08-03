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

export interface AuthContextType {
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

// Global auth state - no hooks needed
let globalAuthState: AuthContextType = {
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

const AuthContext = React.createContext<AuthContextType>(globalAuthState);

// Simple auth hook that just returns the global state
export const useAuth = (): AuthContextType => {
  return globalAuthState;
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

    // Update global state
    this.updateGlobalState();
  }

  updateGlobalState = () => {
    globalAuthState = {
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
  };

  componentDidUpdate() {
    this.updateGlobalState();
  }

  signIn = async (email: string, password: string): Promise<{ error?: string }> => {
    try {
      this.setState({ loading: true }, this.updateGlobalState);
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
        }, this.updateGlobalState);
        
        // Try to load profile
        try {
          const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('auth_user_id', data.user.id)
            .single();
            
          if (profile && !profileError) {
            this.setState({ profile }, this.updateGlobalState);
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
      this.setState({ loading: false }, this.updateGlobalState);
    }
  };

  signUp = async (email: string, password: string, userData: any): Promise<{ error?: string }> => {
    try {
      this.setState({ loading: true }, this.updateGlobalState);
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
      this.setState({ loading: false }, this.updateGlobalState);
    }
  };

  signOut = async (): Promise<void> => {
    try {
      this.setState({ loading: true }, this.updateGlobalState);
      await supabase.auth.signOut();
      this.setState({ 
        user: null, 
        profile: null, 
        session: null 
      }, this.updateGlobalState);
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      this.setState({ loading: false }, this.updateGlobalState);
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
          this.setState({ profile }, this.updateGlobalState);
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

// Alternative component-based auth consumer for components that can't use hooks
interface AuthConsumerProps {
  children: (auth: AuthContextType) => React.ReactNode;
}

export class AuthConsumer extends React.Component<AuthConsumerProps> {
  render() {
    return (
      <AuthContext.Consumer>
        {(auth) => this.props.children(auth || globalAuthState)}
      </AuthContext.Consumer>
    );
  }
}
