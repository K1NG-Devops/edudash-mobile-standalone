import { supabase } from '@/lib/supabase';
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
      
      console.log('🔍 [AUTH-DEBUG] Session data:', {
        hasSession: !!data.session,
        hasUser: !!data.session?.user,
        userId: data.session?.user?.id || 'none',
        userEmail: data.session?.user?.email || 'none'
      });
      
      this.setState({
        session: data.session,
        user: data.session?.user || null,
      });

      // Only load profile if we have a session, and set loading to false after
      if (data.session?.user) {
        console.log('🔍 [AUTH-DEBUG] User found, loading profile for ID:', data.session.user.id);
        await this.loadProfile(data.session.user.id);
      } else {
        console.log('🔍 [AUTH-DEBUG] No user session found');
        this.setState({ loading: false });
      }

      // Listen for auth changes
      const { data: listener } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('🔄 Auth state changed:', event);
          
          // Prevent duplicate profile loading
          if (event === 'SIGNED_IN' && session?.user) {
            // Only load profile if the user changed
            if (this.state.user?.id !== session.user.id) {
              console.log('🆕 New user signed in, loading profile...');
              this.setState({
                session,
                user: session.user,
              });
              await this.loadProfile(session.user.id);
            } else {
              console.log('🔄 Same user, updating session only');
              this.setState({
                session,
                user: session.user,
              });
            }
          } else if (event === 'SIGNED_OUT') {
            console.log('👋 User signed out');
            this.setState({ 
              session: null,
              user: null,
              profile: null,
              loading: false
            });
            
            // Disable automatic redirect on sign out to prevent interference
            // with password reset and other flows. The welcome screen (index.tsx)
            // will handle showing appropriate auth screens when needed.
            console.log('🚫 Skipping automatic redirect on SIGNED_OUT - letting app handle navigation');
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
      console.log('🔍 [DEBUG] Loading profile for userId:', userId);
      console.log('🔍 [DEBUG] Current profile state before load:', this.state.profile?.role || 'none');
      
      // Set loading state immediately
      this.setState({ loading: true });
      
      // Use direct query with auth.uid() check
      console.log('📡 [DEBUG] Executing query: SELECT * FROM users WHERE auth_user_id =', userId);
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', userId)
        .single();
      
      console.log('🔍 [DEBUG] Profile query result:', { 
        hasData: !!data, 
        dataKeys: data ? Object.keys(data) : 'none',
        error: error?.message || 'none',
        errorCode: error?.code || 'none',
        errorDetails: error?.details || 'none',
        errorHint: error?.hint || 'none'
      });
      
      if (error) {
        console.error('❌ [DEBUG] Supabase error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        
        // If we get a policy error, let's try a different approach
        if (error.message?.includes('policy') || error.message?.includes('recursion')) {
          console.log('🔄 [DEBUG] Policy/recursion error detected, trying alternative approach');
          // For now, set a basic profile to prevent blocking
          this.setState({ 
            profile: null,
            loading: false 
          });
          return;
        }
      }
      
      if (!error && data) {
        console.log('✅ [DEBUG] Profile loaded successfully:');
        console.log('  - ID:', data.id || 'Unknown');
        console.log('  - Name:', data.name || 'Unknown');
        console.log('  - Role:', data.role || 'Unknown');
        console.log('  - Preschool ID:', data.preschool_id || 'None');
        console.log('  - Email:', data.email || 'Unknown');
        console.log('  - Is Active:', data.is_active);
        console.log('  - Auth User ID:', data.auth_user_id);
        
        // Create a complete profile with all fields from database
        const profileData: UserProfile = {
          id: data.id,
          email: data.email,
          name: data.name,
          role: data.role as 'superadmin' | 'preschool_admin' | 'teacher' | 'parent',
          preschool_id: data.preschool_id,
          auth_user_id: data.auth_user_id,
          is_active: data.is_active,
          avatar_url: data.avatar_url,
          phone: data.phone,
          home_address: data.home_address,
          home_city: data.home_city,
          home_postal_code: data.home_postal_code,
          work_company: data.work_company,
          work_position: data.work_position,
          work_address: data.work_address,
          work_phone: data.work_phone,
          emergency_contact_1_name: data.emergency_contact_1_name,
          emergency_contact_1_phone: data.emergency_contact_1_phone,
          emergency_contact_1_relationship: data.emergency_contact_1_relationship,
          emergency_contact_2_name: data.emergency_contact_2_name,
          emergency_contact_2_phone: data.emergency_contact_2_phone,
          emergency_contact_2_relationship: data.emergency_contact_2_relationship,
          relationship_to_child: data.relationship_to_child,
          pickup_authorized: data.pickup_authorized,
          profile_completed_at: data.profile_completed_at,
          profile_completion_status: (data.profile_completion_status as 'incomplete' | 'in_progress' | 'complete') || 'incomplete',
          created_at: data.created_at,
          updated_at: data.updated_at
        };
        
        // Update profile state
        this.setState({ 
          profile: profileData,
          loading: false 
        }, () => {
          console.log('✅ [DEBUG] Profile state updated. New role:', this.state.profile?.role);
          console.log('✅ [DEBUG] Profile state updated. New preschool_id:', this.state.profile?.preschool_id);
        });
      } else {
        console.error('❌ [DEBUG] Failed to load profile - no data returned');
        console.log('❌ [DEBUG] User ID we searched for:', userId);
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
      console.log('🚪 Starting sign out process...');
      this.setState({ loading: true });
      
      // Clear local state immediately to ensure UI updates
      this.setState({ 
        session: null,
        user: null,
        profile: null,
      });
      
      // Call Supabase sign out
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ Supabase sign out error:', error);
        // Even if Supabase sign out fails, we've already cleared local state
      } else {
        console.log('✅ Supabase sign out successful');
      }
      
      // Force navigation to sign-in screen
      setTimeout(() => {
        try {
          console.log('🧭 Navigating to sign-in screen...');
          router.replace('/(auth)/sign-in');
        } catch (navError) {
          console.warn('Navigation error:', navError);
          // Try alternative navigation methods
          try {
            router.push('/(auth)/sign-in');
          } catch (pushError) {
            console.warn('Push navigation failed:', pushError);
            // As a last resort, try to go to the root
            try {
              router.replace('/');
            } catch (rootError) {
              console.error('All navigation attempts failed:', rootError);
            }
          }
        }
      }, 50);
      
    } catch (error) {
      console.error('❌ Sign out process error:', error);
      // Even on error, clear the local state
      this.setState({ 
        session: null,
        user: null,
        profile: null,
      });
    } finally {
      this.setState({ loading: false });
    }
  };

  resetPassword = async (email: string): Promise<{ error?: string }> => {
    try {
      this.setState({ loading: true });
      
      // For development, use a web URL that will redirect back to the app
      // In production, use the native deep link
      const isDevelopment = __DEV__;
      
      const redirectTo = isDevelopment 
        ? 'http://localhost:8081/reset-password'  // Web version for development
        : 'edudashpro://auth/reset-password';     // Deep link for production
      
      console.log('🔧 Reset password redirect URL:', redirectTo);
      console.log('🔧 Development mode:', isDevelopment);
      
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

