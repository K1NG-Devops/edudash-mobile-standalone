import { supabase, safeSignOut } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import { router } from 'expo-router';
import React from 'react';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'superadmin' | 'preschool_admin' | 'teacher' | 'parent';
  preschool_id: string | null;
  avatar_url: string | null;
  phone: string | null;
  is_active: boolean;
  auth_user_id: string;

  // Address information
  home_address: string | null;
  home_city: string | null;
  home_postal_code: string | null;

  // Work information
  work_company: string | null;
  work_position: string | null;
  work_address: string | null;
  work_phone: string | null;

  // Emergency contacts
  emergency_contact_1_name: string | null;
  emergency_contact_1_phone: string | null;
  emergency_contact_1_relationship: string | null;
  emergency_contact_2_name: string | null;
  emergency_contact_2_phone: string | null;
  emergency_contact_2_relationship: string | null;

  // Additional parent information
  relationship_to_child: string | null;
  pickup_authorized: string | null;

  // Profile completion tracking
  profile_completed_at: string | null;
  profile_completion_status: 'incomplete' | 'in_progress' | 'complete';

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
  resetPassword: (email: string) => Promise<{ error?: string }>;
  updatePassword: (password: string) => Promise<{ error?: string }>;
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
    try {
      // Get initial session
      const { data } = await supabase.auth.getSession();


      this.setState({
        session: data.session,
        user: data.session?.user || null,
      });

      // Only load profile if we have a session, and set loading to false after
      if (data.session?.user) {
        await this.loadProfile(data.session.user.id);
      } else {
        this.setState({ loading: false });
      }

      // Listen for auth changes
      const { data: listener } = supabase.auth.onAuthStateChange(
        async (event, session) => {

          // Prevent duplicate profile loading
          if (event === 'SIGNED_IN' && session?.user) {
            // Only load profile if the user changed
            if (this.state.user?.id !== session.user.id) {
              this.setState({
                session,
                user: session.user,
              });
              await this.loadProfile(session.user.id);
            } else {
              this.setState({
                session,
                user: session.user,
              });
            }
          } else if (event === 'SIGNED_OUT') {
            this.setState({
              session: null,
              user: null,
              profile: null,
              loading: false
            });

            // Navigate to welcome screen after sign out
            setTimeout(() => {
              try {
                router.replace('/');
              } catch (error) {
                console.warn('Navigation failed:', error);
                try {
                  router.push('/');
                } catch (pushError) {
                  console.warn('Fallback navigation failed:', pushError);
                }
              }
            }, 100);
          } else {
            // For other events, just update session/user
            this.setState({
              session,
              user: session?.user || null,
            });
          }
        }
      );
      this.authListener = listener;
    } catch (error) {
      console.error('❌ Error in componentDidMount:', error);
      this.setState({ loading: false });
    }
  }

  componentWillUnmount() {
    if (this.authListener && this.authListener.subscription) {
      this.authListener.subscription.unsubscribe();
    }
  }

  loadProfile = async (userId: string) => {
    try {
      // Set loading state immediately
      this.setState({ loading: true });

      // Clear any existing profile state to force fresh load
      this.setState({ profile: null });

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', userId)
        .single();

      if (error) {
        console.error('❌ [DEBUG] Supabase error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });

        // If we get a policy error, let's try a different approach
        if (error.message?.includes('policy') || error.message?.includes('recursion')) {
          // For now, set a basic profile to prevent blocking
          this.setState({
            profile: null,
            loading: false
          });
          return;
        }
      }

      if (!error && data) {

        // Create a complete profile with all fields from database
        const profileData: UserProfile = {
          id: data.id,
          email: data.email,
          name: data.name,
          role: data.role as 'superadmin' | 'preschool_admin' | 'teacher' | 'parent',
          preschool_id: data.preschool_id,
          auth_user_id: data.auth_user_id || '',
          is_active: !!data.is_active,
          avatar_url: data.profile_picture_url || null,
          phone: data.phone,
          home_address: data.street_address || null,
          home_city: data.city || null,
          home_postal_code: data.postal_code || null,
          work_company: data.institution_name || null,
          work_position: data.position_title || null,
          work_address: data.street_address || null,
          work_phone: data.phone || null,
          emergency_contact_1_name: data.emergency_contact_name || null,
          emergency_contact_1_phone: data.emergency_contact_phone || null,
          emergency_contact_1_relationship: data.emergency_contact_relationship || null,
          emergency_contact_2_name: null, // Not supported in current schema
          emergency_contact_2_phone: null, // Not supported in current schema
          emergency_contact_2_relationship: null, // Not supported in current schema
          relationship_to_child: null, // Not supported in current schema
          pickup_authorized: null, // Not supported in current schema
          profile_completed_at: null, // Not supported in current schema
          profile_completion_status: (data.profile_completion_status as 'incomplete' | 'in_progress' | 'complete') || 'incomplete',
          created_at: data.created_at || new Date().toISOString(),
          updated_at: data.updated_at || new Date().toISOString()
        };

        // Update profile state
        this.setState({
          profile: profileData,
          loading: false
        }, () => {
        });
      } else {
        console.error('❌ [DEBUG] Failed to load profile - no data returned');
        this.setState({
          profile: null,
          loading: false
        });
      }
    } catch (error) {
      console.error('❌ [DEBUG] Exception in loadProfile:', error);
      this.setState({
        profile: null,
        loading: false
      });
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
      await safeSignOut();
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      this.setState({ loading: false });
    }
  };

  resetPassword = async (email: string): Promise<{ error?: string }> => {
    try {
      this.setState({ loading: true });

      // Use correct localhost for development (Expo web)
      const redirectTo = 'http://localhost:8081/reset-password';

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (error) {
        return { error: error.message };
      }

      return {};
    } catch (error) {
      console.error('Reset password error:', error);
      return { error: 'An unexpected error occurred' };
    } finally {
      this.setState({ loading: false });
    }
  };

  updatePassword = async (password: string): Promise<{ error?: string }> => {
    try {
      this.setState({ loading: true });

      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        return { error: error.message };
      }

      return {};
    } catch (error) {
      console.error('Update password error:', error);
      return { error: 'An unexpected error occurred' };
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
      resetPassword: this.resetPassword,
      updatePassword: this.updatePassword,
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

// Hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
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

