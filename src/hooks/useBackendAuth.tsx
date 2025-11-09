import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useApi } from "@/contexts/ApiContext";

interface User {
  id: string;
  email: string;
  userType: 'FREELANCER' | 'CLIENT' | 'ADMIN';
  isAdmin: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  profile?: {
    id: string;
    fullName: string;
    companyName?: string;
    bio?: string;
    avatarUrl?: string;
    hourlyRate?: number;
    location?: string;
    skills?: any;
    honeyDropsBalance: number;
  };
}

interface AuthContextType {
  user: User | null;
  session: any; // For backward compatibility with Supabase
  userRole: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (data: {
    email: string;
    password: string;
    fullName: string;
    userType: 'FREELANCER' | 'CLIENT';
    companyName?: string;
    cvrNumber?: string;
  }) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useBackendAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useBackendAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const BackendAuthProvider = ({ children }: AuthProviderProps) => {
  const api = useApi();
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setUser(null);
        setUserRole(null);
        setLoading(false);
        return;
      }

      const userData = await api.auth.getCurrentUser();
      setUser(userData);
      setUserRole(userData.userType.toLowerCase());
    } catch (error) {
      console.error('Error fetching user:', error);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
      setUserRole(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await api.auth.login(email, password);
      setUser(response.user);
      setUserRole(response.user.userType.toLowerCase());
    } catch (error: any) {
      console.error('Sign in error:', error);
      
      // Extract error message from various possible locations
      let errorMessage = 'Failed to sign in';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        errorMessage = error.response.data.errors.map((e: any) => e.msg || e.message || e).join(', ');
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please try again later or contact support.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Invalid email or password. Please try again.';
      } else if (!error.response) {
        errorMessage = 'Unable to connect to server. Please check your internet connection.';
      }
      
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (data: {
    email: string;
    password: string;
    fullName: string;
    userType: 'FREELANCER' | 'CLIENT';
    companyName?: string;
    cvrNumber?: string;
  }) => {
    setLoading(true);
    try {
      const response = await api.auth.register(data);
      setUser(response.user);
      setUserRole(response.user.userType.toLowerCase());
    } catch (error: any) {
      console.error('Sign up error:', error);
      throw new Error(error.response?.data?.error || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await api.auth.logout();
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setUser(null);
      setUserRole(null);
      window.location.href = '/auth';
    }
  };

  const refreshUser = async () => {
    await fetchCurrentUser();
  };

  const value = {
    user,
    session: user ? { user } : null, // Mock session for backward compatibility
    userRole,
    loading,
    signIn,
    signUp,
    signOut,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Export both hooks for backward compatibility
export { useBackendAuth as useAuth };

