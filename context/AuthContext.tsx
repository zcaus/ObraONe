import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { storageService } from '../services/storageService';
import { supabase } from '../services/supabaseClient';

interface AuthContextType {
  user: User | null;
  login: (username: string, pass: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check session on mount
    const checkSession = () => {
      const sessionStr = localStorage.getItem('obraone_session');
      if (sessionStr) {
        setUser(JSON.parse(sessionStr));
      }
      setIsLoading(false);
    };
    checkSession();
  }, []);

  const login = async (username: string, pass: string): Promise<boolean> => {
    try {
      // Query app_users table directly
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('username', username)
        .eq('password', pass) // NOTE: In a real production app, use proper hashing!
        .single();

      if (error || !data) {
        return false;
      }

      const loggedUser: User = {
        id: data.id,
        name: data.name,
        username: data.username,
        role: data.role as UserRole
      };

      setUser(loggedUser);
      localStorage.setItem('obraone_session', JSON.stringify(loggedUser));
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('obraone_session');
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      isLoading,
      isAuthenticated: !!user,
      isAdmin: user?.role === UserRole.ADMIN
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};