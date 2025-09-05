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
}

const AuthContext = React.createContext<AuthContextType | null>(null);

interface AuthProviderState {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
}

class SimpleAuthProvider extends React.Component<
  { children: React.ReactNode },
  AuthProviderState
> {
  private authListener: any;

  constructor(props: { children: React.ReactNode }) {
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
      console.log('🔍 [SimpleAuth] Initializing...');
      
      // Get initial session with timeout
      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise<any>((_, reject) => 
        setTimeout(() => reject(new Error('Session timeout')), 5000)
      );

      try {
        const { data } = await Promise.race([sessionPromise, timeoutPromise]);
        console.log('🔍 [SimpleAuth] Session loaded:', !!data.session);
        
        if (data.session?.user) {
          this.setState({
            session: data.session,
            user: data.session.user,
          });
          
          // Load profile with timeout
          await this.loadProfileSafe(data.session.user.id);
        }
      } catch (sessionError) {
        console.warn('⚠️ [SimpleAuth] Session timeout, continuing without auth');
      }

      // Set up auth listener
      const { data: listener } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('🔄 [SimpleAuth] Auth state changed:', event);
          
          if (event === 'SIGNED_IN' && session?.user) {
            this.setState({
              session,
              user: session.user,
            });
            await this.loadProfileSafe(session.user.id);
          } else if (event === 'SIGNED_OUT') {
            this.setState({
              session: null,
              user: null,
              profile: null,
            });
            
            // Navigate to landing after sign out
            setTimeout(() => {
              try {
                router.replace('/');
              } catch (error) {
                console.warn('Navigation failed:', error);
              }
            }, 100);
          }
        }
      );
      
      this.authListener = listener;
    } catch (error) {
      console.error('❌ [SimpleAuth] Init error:', error);
    } finally {
      this.setState({ loading: false });
    }
  }

  componentWillUnmount() {
    if (this.authListener && this.authListener.subscription) {
      this.authListener.subscription.unsubscribe();
    }
  }

  loadProfileSafe = async (userId: string) => {
    try {
      console.log('🔍 [SimpleAuth] Loading profile for:', userId);
      
      // Load profile with timeout
      const profilePromise = supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', userId)
        .single();
      
      const timeoutPromise = new Promise<any>((_, reject) => 
        setTimeout(() => reject(new Error('Profile timeout')), 5000)
      );

      const { data: profile, error } = await Promise.race([
        profilePromise,
        timeoutPromise
      ]);

      if (profile && !error) {
        console.log('✅ [SimpleAuth] Profile loaded:', profile.role);
        this.setState({ profile, loading: false });
      } else if (error) {
        console.warn('⚠️ [SimpleAuth] Profile error:', error.message);
        
        // Create a minimal profile from user metadata if DB query fails
        const user = this.state.user;
        if (user) {
          const md = (user as any).user_metadata || {};
          const minimalProfile: UserProfile = {
            id: userId,
            email: user.email || 'unknown@example.com',
            name: md.name || md.first_name || 'User',
            role: md.role || 'parent',
            preschool_id: md.preschool_id || null,
            avatar_url: md.avatar_url || null,
            phone: md.phone || null,
            is_active: true,
            auth_user_id: userId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          
          console.log('🔄 [SimpleAuth] Using minimal profile from metadata');
          this.setState({ profile: minimalProfile, loading: false });
        }
      }
    } catch (error) {
      console.error('❌ [SimpleAuth] Profile load failed:', error);
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
      await this.loadProfileSafe(this.state.user.id);
    }
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
    };

    return (
      <AuthContext.Provider value={value}>
        {this.props.children}
      </AuthContext.Provider>
    );
  }
}

export const useSimpleAuth = (): AuthContextType => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useSimpleAuth must be used within SimpleAuthProvider');
  }
  return context;
};

export { SimpleAuthProvider };
