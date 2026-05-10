/**
 * Auth Context - Zarządzanie stanem autentykacji
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/auth/AuthService';
import type { User } from '../models';

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: () => boolean;
  isDoctor: () => boolean;
  isPatient: () => boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Inicjalizacja - sprawdź czy użytkownik jest zalogowany
   */
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Sprawdź czy mamy token
        if (!authService.isAuthenticated()) {
          setCurrentUser(null);
          setIsLoading(false);
          return;
        }

        // Pobierz dane użytkownika z localStorage/sessionStorage
        const cachedUser = authService.getCurrentUser();
        if (cachedUser) {
          setCurrentUser(cachedUser);
        }

        // Opcjonalnie: odśwież dane z API
        try {
          const freshUser = await authService.fetchCurrentUser();
          if (freshUser) {
            setCurrentUser(freshUser);
          }
        } catch (error) {
          console.error('Failed to fetch fresh user data:', error);
          // Jeśli API zwróci błąd, zostaw cached user
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setCurrentUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  /**
   * Wylogowanie
   */
  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setCurrentUser(null);
    }
  };

  /**
   * Odśwież dane użytkownika z API
   */
  const refreshUser = async () => {
    try {
      const user = await authService.fetchCurrentUser();
      if (user) {
        setCurrentUser(user);
      }
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  };

  const value: AuthContextType = {
    currentUser,
    isAuthenticated: !!currentUser && authService.isAuthenticated(),
    isLoading,
    isAdmin: () => currentUser?.role === 'admin',
    isDoctor: () => currentUser?.role === 'doctor',
    isPatient: () => currentUser?.role === 'patient',
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
