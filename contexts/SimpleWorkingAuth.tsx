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

// Non-crashing fallback for when useAuth is called outside of AuthProvider
// This helps prevent full-app crashes while we isolate provider issues on device
const AuthContextFallback: AuthContextType = {
  user: null,
  profile: null,
  session: null,
  loading: true,
  signIn: async () => ({ error: 'AuthProvider not mounted' }),
  signUp: async () => ({ error: 'AuthProvider not mounted' }),
  signOut: async () => {},
  refreshProfile: async () => {},
  resetPassword: async () => ({ error: 'AuthProvider not mounted' }),
  updatePassword: async () => ({ error: 'AuthProvider not mounted' }),
  hasRole: () => false,
  isRole: () => false,
};

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
        console.log('🔍 [AUTH-DEBUG] User found; ensuring profile and loading it for ID:', data.session.user.id);
        await this.ensureUserProfile(data.session.user);
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
              console.log('🆕 New user signed in; ensuring profile and loading it...');
              this.setState({
                session,
                user: session.user,
              });
              await this.ensureUserProfile(session.user);
              await this.loadProfile(session.user.id);
            } else {
              console.log('🔄 Same user, updating session only and ensuring profile');
              this.setState({
                session,
                user: session.user,
              });
              await this.ensureUserProfile(session.user);
            }
          } else if (event === 'SIGNED_OUT') {
            console.log('👋 User signed out');
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

  // Helper to detect policy recursion errors from Supabase/PostgREST
  private isPolicyRecursionError(err: any): boolean {
    if (!err) return false;
    const msg = String(err.message || err?.toString?.() || '').toLowerCase();
    const code = String((err.code || '')).toUpperCase();
    return (
      code === '42P17' ||
      msg.includes('policy') ||
      msg.includes('recursion') ||
      msg.includes('infinite recursion')
    );
  }

  // Build a minimal in-memory profile derived from the authenticated user
  private async buildMinimalProfileFromAuth(): Promise<UserProfile | null> {
    try {
      const { data } = await supabase.auth.getUser();
      const au = data?.user;
      if (!au) return null;
      const md: any = (au as any).user_metadata || {};
      const first = md.first_name || (md.name ? String(md.name).split(' ')[0] : undefined) || (au.email ? String(au.email).split('@')[0] : 'User');
      const last = md.last_name || (md.name ? String(md.name).split(' ').slice(1).join(' ') : undefined) || '';
      const displayName = [first, last].filter(Boolean).join(' ').trim();
      const role = (md.role as UserProfile['role']) || 'parent';
      const now = new Date().toISOString();

      // Note: id here cannot be the DB profile id (unknown due to RLS). We use the auth id to keep UI flowing.
      // Components should prefer profile.auth_user_id for identity-sensitive operations.
      const prof: UserProfile = {
        id: au.id, // fallback identifier for UI; not a DB profile id
        email: au.email || md.email || 'unknown@example.com',
        name: displayName,
        role,
        preschool_id: (md.preschool_id as string | null) || null,
        avatar_url: (md.avatar_url as string | null) || null,
        phone: (md.phone as string | null) || null,
        is_active: true,
        auth_user_id: au.id,
        home_address: null,
        home_city: null,
        home_postal_code: null,
        work_company: null,
        work_position: null,
        work_address: null,
        work_phone: null,
        emergency_contact_1_name: null,
        emergency_contact_1_phone: null,
        emergency_contact_1_relationship: null,
        emergency_contact_2_name: null,
        emergency_contact_2_phone: null,
        emergency_contact_2_relationship: null,
        relationship_to_child: null,
        pickup_authorized: null,
        profile_completed_at: null,
        profile_completion_status: 'incomplete',
        created_at: now,
        updated_at: now,
      };
      return prof;
    } catch {
      return null;
    }
  }

  loadProfile = async (userId: string) => {
    try {
      console.log('🔍 [DEBUG] Loading profile for userId:', userId);
      console.log('🔍 [DEBUG] Current profile state before load:', this.state.profile?.role || 'none');

      // Set loading state immediately
      this.setState({ loading: true });

      // Try direct query with auth_user_id using maybeSingle (safer approach)
      console.log('📡 [DEBUG] Executing query: SELECT * FROM users WHERE auth_user_id =', userId);

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', userId)
        .maybeSingle(); // Use maybeSingle to avoid errors for no matches

      console.log('🔍 [DEBUG] Profile query result:', {
        hasData: !!data,
        dataKeys: data ? Object.keys(data) : 'none',
        error: error?.message || 'none',
        errorCode: error?.code || 'none',
        errorDetails: error?.details || 'none',
        errorHint: error?.hint || 'none'
      });

      if (!error && data) {
        console.log('✅ [DEBUG] Profile loaded successfully via direct query');
        this.handleProfileData(data);
        return;
      } else if (error) {
        console.error('❌ [DEBUG] Supabase error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });

        // If we get a policy recursion error, fallback to minimal in-memory profile
        if (this.isPolicyRecursionError(error)) {
          console.log('🔄 [DEBUG] Policy/recursion error detected; building minimal in-memory profile from auth');
          const minimal = await this.buildMinimalProfileFromAuth();
          this.setState({
            profile: minimal, // may be null if auth not ready
            loading: false
          });
          return;
        }
      }

      // If no data found, log detailed information for debugging
      if (!data) {
        console.log('⚠️ [DEBUG] No profile found for auth_user_id:', userId);
        console.log('⚠️ [DEBUG] This could mean:');
        console.log('  1. User profile not created yet');
        console.log('  2. auth_user_id mismatch in database');
        console.log('  3. User deleted or inactive');
        console.log('⚠️ [DEBUG] Setting profile to null - dashboard will default to parent role');
      }

      // Set profile to null if no data found
      this.setState({
        profile: null,
        loading: false
      });

    } catch (error) {
      console.error('❌ [DEBUG] Exception in loadProfile:', error);
      this.setState({
        profile: null,
        loading: false
      });
    }
  };

  // Helper method to handle profile data consistently
  handleProfileData = (data: any) => {
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
  };

  // Ensure a minimal user profile exists for the current auth user (idempotent)
  ensureUserProfile = async (authUser: User) => {
    try {
      // Check if profile exists
      const { data: existing, error: selectError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', authUser.id)
        .maybeSingle();

      if (selectError) {
        console.warn('⚠️ ensureUserProfile: select error', selectError.message);
        // If selection failed due to RLS recursion/policy, do NOT attempt to insert
        if (this.isPolicyRecursionError(selectError)) {
          console.warn('⚠️ ensureUserProfile: skipping insert due to policy recursion (profile likely exists but is unreadable via current policy)');
          return;
        }
      }

      if (existing && existing.id) {
        // Profile exists; do nothing to avoid overwriting invite-provisioned data
        return;
      }

      const md = (authUser as any).user_metadata || {};
      const first = md.first_name || (md.name ? String(md.name).split(' ')[0] : undefined) || (authUser.email ? String(authUser.email).split('@')[0] : 'User');
      const last = md.last_name || (md.name ? String(md.name).split(' ').slice(1).join(' ') : undefined) || '';
      const displayName = [first, last].filter(Boolean).join(' ').trim();
      const role = md.role || 'parent';

      const insertPayload: any = {
        auth_user_id: authUser.id,
        email: authUser.email,
        name: displayName,
        role,
        is_active: true,
      };

      const { error: insertError } = await supabase
        .from('users')
        .insert(insertPayload);

      if (insertError) {
        // Gracefully ignore duplicate key conflicts; profile already exists
        if (String(insertError?.code || '').toUpperCase() === '23505' || /duplicate key/i.test(String(insertError?.message || ''))) {
          console.warn('⚠️ ensureUserProfile: profile already exists (duplicate key)');
          return;
        }
        console.warn('⚠️ ensureUserProfile: insert error', insertError.message);
      } else {
        console.log('✅ ensureUserProfile: profile created');
      }
    } catch (e: any) {
      console.warn('⚠️ ensureUserProfile: unexpected error', e?.message || e);
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

  resetPassword = async (email: string): Promise<{ error?: string }> => {
    try {
      this.setState({ loading: true });

      // Use localhost for development (mobile app)
      const redirectTo = 'http://localhost:3000/auth/reset-password';

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
    // Do not crash the whole app; return a safe fallback and log for diagnostics
    try {
      // eslint-disable-next-line no-console
      console.error('[Auth] useAuth called outside AuthProvider. Using fallback context.');
    } catch {}
    return AuthContextFallback;
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

