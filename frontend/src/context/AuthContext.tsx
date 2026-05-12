import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch, getAuthToken, setAuthToken, removeAuthToken } from '../api/client';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (credentials: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!getAuthToken());
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // On mount, verify token existence (a real app would verify validity too)
  useEffect(() => {
    const token = getAuthToken();
    setIsAuthenticated(!!token);
  }, []);

  const login = async (credentials: any) => {
    setLoading(true);
    try {
      const data = await apiFetch('/auth/token/', {
        method: 'POST',
        body: JSON.stringify(credentials),
        requireAuth: false,
      });
      if (data.access) {
        setAuthToken(data.access);
        setIsAuthenticated(true);
        // Navigation handled by the caller (LoginPage)
      }
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: any) => {
    setLoading(true);
    try {
      await apiFetch('/auth/register/', {
        method: 'POST',
        body: JSON.stringify(userData),
        requireAuth: false,
      });
      // After register, automatically login
      await login({ username: userData.username, password: userData.password });
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    removeAuthToken();
    setIsAuthenticated(false);
    navigate('/');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
