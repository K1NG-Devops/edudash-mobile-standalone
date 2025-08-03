import React from 'react';
import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import { router } from 'expo-router';

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

const AuthContext = React.createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: React.ReactNode;
}

interface AuthProviderState {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
}

class AuthProviderClass extends React.Component<AuthProviderProps, AuthProviderState> {
  private authListener: any;

  constructor(props: AuthProviderProps) {
    super(props);
    this.state = {
      user: null,
      profile: null,
      session: null,
      loading: true,
    };
  }

  async componentDidMount() {
    // Get initial session
    const { data } = await supabase.auth.getSession();
    this.setState({
      session: data.session,
      user: data.session?.user || null,
    });

    if (data.session?.user) {
      await this.loadProfile(data.session.user.id);
    }
    this.setState({ loading: false });

    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        this.setState({
          session,
          user: session?.user || null,
        });

        if (event === 'SIGNED_IN' && session?.user) {
          await this.loadProfile(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          this.setState({ profile: null });
          // Navigate to welcome screen after sign out - try multiple approaches for platform compatibility
          setTimeout(() => {
            try {
              // Try replace first
              router.replace('/');
            } catch (error) {
              console.warn('Replace failed, trying push:', error);
              try {
                // Fallback to push
                router.push('/');
              } catch (pushError) {
                console.warn('Push failed, trying dismissAll:', pushError);
                try {
                  // Last resort - dismiss all and navigate
                  router.dismissAll();
                  router.navigate('/');
                } catch (navError) {
                  console.error('All navigation methods failed:', navError);
                }
              }
            }
          }, 100);
        }
      }
    );
    this.authListener = listener;
  }

  componentWillUnmount() {
    if (this.authListener && this.authListener.subscription) {
      this.authListener.subscription.unsubscribe();
    }
  }

  loadProfile = async (userId: string) => {
    try {
      console.log('🔍 [DEBUG] Loading profile for userId:', userId);
      console.log('🔍 [DEBUG] Current profile state before load:', this.state.profile?.role || 'none');
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', userId)
        .single();
      
      console.log('🔍 [DEBUG] Profile query result:', { data: data ? 'Data received' : 'No data', error });
      
      if (!error && data) {
        console.log('✅ [DEBUG] Profile loaded successfully:');
        console.log('  - Name:', data.name || 'Unknown');
        console.log('  - Role:', data.role || 'Unknown');
        console.log('  - Preschool ID:', data.preschool_id || 'None');
        console.log('  - Email:', data.email || 'Unknown');
        console.log('  - Is Active:', data.is_active);
        console.log('  - Auth User ID:', data.auth_user_id);
        
        // Set loading to true during profile update to prevent race conditions
        this.setState({ loading: true }, () => {
          // Update profile and then set loading to false
          this.setState({ 
            profile: data,
            loading: false 
          }, () => {
            console.log('✅ [DEBUG] Profile state updated. New role:', this.state.profile?.role);
            console.log('✅ [DEBUG] Profile state updated. New preschool_id:', this.state.profile?.preschool_id);
          });
        });
      } else {
        console.error('❌ [DEBUG] Failed to load profile:', error);
        this.setState({ loading: false });
      }
    } catch (error) {
      console.error('❌ [DEBUG] Exception in loadProfile:', error);
      this.setState({ loading: false });
    }
  };

  signIn = async (email: string, password: string) => {
    try {
      this.setState({ loading: true });
      const { error } = await supabase.auth.signInWithPassword({
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
      this.setState({ loading: false });
    }
  };

  signUp = async (email: string, password: string, userData: any) => {
    try {
      this.setState({ loading: true });
      const { error } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password,
        options: { data: userData },
      });
      
      if (error) {
        return { error: error.message };
      }
      return {};
    } catch (error) {
      console.error('Sign up error:', error);
      return { error: 'An unexpected error occurred' };
    } finally {
      this.setState({ loading: false });
    }
  };

  signOut = async () => {
    try {
      this.setState({ loading: true });
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      this.setState({ loading: false });
    }
  };

  refreshProfile = async () => {
    if (this.state.user) {
      await this.loadProfile(this.state.user.id);
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

export const AuthProvider = (props: AuthProviderProps) => {
  return <AuthProviderClass {...props} />;
};

// Consumer component to use auth without hooks
export class AuthConsumer extends React.Component<{
  children: (auth: AuthContextType) => React.ReactNode;
}> {
  render() {
    return (
      <AuthContext.Consumer>
        {(context) => {
          if (!context) {
            throw new Error('AuthConsumer must be used within an AuthProvider');
          }
          return this.props.children(context);
        }}
      </AuthContext.Consumer>
    );
  }
}

