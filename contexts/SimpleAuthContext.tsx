import * as React from 'react';

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

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

interface AuthProviderState {
  user: any | null;
  profile: UserProfile | null;
  session: any | null;
  loading: boolean;
}

export class AuthProvider extends React.Component<AuthProviderProps, AuthProviderState> {
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
    this.setState({ loading: true });
    try {
      // For testing - simulate successful login
      const mockUser = { id: '1', email };
      const mockProfile: UserProfile = {
        id: '1',
        email,
        name: 'Test User',
        role: 'teacher',
        phone: null,
        address: null,
        home_address: null,
        is_active: true,
        auth_user_id: '1',
        preschool_id: '1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      this.setState({
        user: mockUser,
        profile: mockProfile,
        session: { user: mockUser },
        loading: false
      });
      
      return {};
    } catch (error) {
      this.setState({ loading: false });
      return { error: 'Sign in failed' };
    }
  };

  signUp = async (email: string, password: string, userData: any): Promise<{ error?: string }> => {
    return { error: 'Sign up not implemented yet' };
  };

  signOut = async (): Promise<void> => {
    this.setState({
      user: null,
      profile: null,
      session: null,
    });
  };

  refreshProfile = async (): Promise<void> => {
    // No-op for now
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
