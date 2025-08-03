import React, { createContext, useContext } from 'react';

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
  // Simple fallback - no state, just to prevent crashes
  const mockProfile: UserProfile = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    role: 'teacher',
    phone: null,
    address: null,
    home_address: null,
    is_active: true,
    auth_user_id: '1',
    preschool_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const value: AuthContextType = {
    user: { id: '1', email: 'test@example.com' },
    profile: mockProfile,
    session: { user: { id: '1' } },
    loading: false,
    signIn: async () => ({ error: 'Sign in not available in fallback mode' }),
    signUp: async () => ({ error: 'Sign up not available in fallback mode' }),
    signOut: async () => {},
    refreshProfile: async () => {},
    hasRole: (role: string) => role === 'teacher',
    isRole: (role: string) => role === 'teacher',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
