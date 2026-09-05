import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserDTO, UserRole } from '@land-digitization/shared';
import apiClient from '../services/api';

interface AuthContextType {
  user: UserDTO | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: UserDTO) => void;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<UserDTO | null>;
  hasRole: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserDTO | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(async () => {
    try {
      if (localStorage.getItem('token')) {
        await apiClient.post('/auth/logout').catch(() => {
          // Ignore server error on logout
        });
      }
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
    }
  }, []);

  const refreshProfile = useCallback(async (): Promise<UserDTO | null> => {
    const savedToken = localStorage.getItem('token');
    if (!savedToken) {
      setUser(null);
      setToken(null);
      return null;
    }

    try {
      const response = await apiClient.get('/auth/me');
      const freshUser: UserDTO = response.data.data;
      setUser(freshUser);
      setToken(savedToken);
      localStorage.setItem('user', JSON.stringify(freshUser));
      return freshUser;
    } catch (err: any) {
      console.warn('Session verification failed, logging out:', err?.response?.status || err.message);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      setToken(null);
      return null;
    }
  }, []);

  // Bootstrap session check on initial mount
  useEffect(() => {
    let isMounted = true;

    const bootstrapAuth = async () => {
      const savedToken = localStorage.getItem('token');
      const savedUserStr = localStorage.getItem('user');

      if (savedToken) {
        // Hydrate from cache first for instant layout
        if (savedUserStr) {
          try {
            const cachedUser = JSON.parse(savedUserStr);
            if (isMounted) {
              setUser(cachedUser);
              setToken(savedToken);
            }
          } catch {
            // Invalid JSON in localStorage
          }
        }

        // Verify with server
        try {
          const response = await apiClient.get('/auth/me');
          if (isMounted) {
            const serverUser: UserDTO = response.data.data;
            setUser(serverUser);
            setToken(savedToken);
            localStorage.setItem('user', JSON.stringify(serverUser));
          }
        } catch (e: any) {
          if (isMounted && e?.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
            setToken(null);
          }
        }
      }

      if (isMounted) {
        setIsLoading(false);
      }
    };

    bootstrapAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = (newToken: string, newUser: UserDTO) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const hasRole = (roles: UserRole[]) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, refreshProfile, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
