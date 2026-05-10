/**
 * Auth Service - Autentykacja JWT
 *
 * Komunikacja z backend /api/auth endpoints
 */

import axios from 'axios';
import type { User } from '../../models';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/**
 * DTO dla rejestracji
 */
export interface RegisterDTO {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  pesel: string;
}

/**
 * DTO dla logowania
 */
export interface LoginDTO {
  email: string;
  password: string;
}

/**
 * Odpowiedź z auth endpointów
 */
export interface AuthResponse {
  success: boolean;
  message?: string;
  data?: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
}

/**
 * Odpowiedź z refresh endpoint
 */
export interface RefreshResponse {
  success: boolean;
  data?: {
    accessToken: string;
  };
}

/**
 * Persistence mode dla tokenów (
 */
export type PersistenceMode = 'LOCAL' | 'SESSION' | 'NONE';

class AuthService {
  private persistenceMode: PersistenceMode = 'LOCAL';

  /**
   * Ustaw tryb persystencji tokenów
   */
  setPersistenceMode(mode: PersistenceMode): void {
    this.persistenceMode = mode;
    console.log(`🔐 Persistence mode set to: ${mode}`);
  }

  /**
   * Pobierz aktualny tryb persystencji
   */
  getPersistenceMode(): PersistenceMode {
    return this.persistenceMode;
  }

  /**
   * Pobierz storage na podstawie trybu persystencji
   */
  private getStorage(): Storage | null {
    switch (this.persistenceMode) {
      case 'LOCAL':
        return localStorage;
      case 'SESSION':
        return sessionStorage;
      case 'NONE':
        return null;
      default:
        return localStorage;
    }
  }

  /**
   * Zapisz token
   */
  private saveToken(key: string, value: string): void {
    const storage = this.getStorage();
    if (storage) {
      storage.setItem(key, value);
    }
  }

  /**
   * Pobierz token
   */
  private getToken(key: string): string | null {
    const storage = this.getStorage();
    if (!storage) return null;

    // Sprawdź też drugi storage (fallback dla migracji)
    let token = storage.getItem(key);
    if (!token && storage === sessionStorage) {
      token = localStorage.getItem(key);
    } else if (!token && storage === localStorage) {
      token = sessionStorage.getItem(key);
    }
    return token;
  }

  /**
   * Usuń token
   */
  private removeToken(key: string): void {
    // Usuń z obu storages na wszelki wypadek
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  }

  /**
   * Zapisz access token
   */
  setAccessToken(token: string): void {
    this.saveToken('accessToken', token);
  }

  /**
   * Pobierz access token
   */
  getAccessToken(): string | null {
    return this.getToken('accessToken');
  }

  /**
   * Zapisz refresh token
   */
  setRefreshToken(token: string): void {
    this.saveToken('refreshToken', token);
  }

  /**
   * Pobierz refresh token
   */
  getRefreshToken(): string | null {
    return this.getToken('refreshToken');
  }

  /**
   * Zapisz dane użytkownika
   */
  setCurrentUser(user: User): void {
    this.saveToken('currentUser', JSON.stringify(user));
  }

  /**
   * Pobierz dane użytkownika
   */
  getCurrentUser(): User | null {
    const userData = this.getToken('currentUser');
    if (!userData) return null;

    try {
      const user = JSON.parse(userData);

      // Mapuj MongoDB _id na id
      if (user._id && !user.id) {
        user.id = user._id;
      }

      // Parsuj daty
      if (user.createdAt) user.createdAt = new Date(user.createdAt);
      if (user.updatedAt) user.updatedAt = new Date(user.updatedAt);
      if (user.dateOfBirth) user.dateOfBirth = new Date(user.dateOfBirth);
      return user;
    } catch (error) {
      console.error('Failed to parse user data:', error);
      return null;
    }
  }

  /**
   * Wyczyść wszystkie tokeny i dane użytkownika
   */
  clearAuth(): void {
    this.removeToken('accessToken');
    this.removeToken('refreshToken');
    this.removeToken('currentUser');
  }

  /**
   * Sprawdź czy użytkownik jest zalogowany
   */
  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  /**
   * Rejestracja nowego użytkownika
   */
  async register(data: RegisterDTO): Promise<AuthResponse> {
    try {
      const response = await axios.post<AuthResponse>(
        `${BASE_URL}/auth/register`,
        data
      );

      // Zapisz tokeny i dane użytkownika
      if (response.data.success && response.data.data) {
        const { accessToken, refreshToken, user } = response.data.data;

        // Mapuj MongoDB _id na id
        if (user._id && !user.id) {
          user.id = user._id;
        }

        this.setAccessToken(accessToken);
        this.setRefreshToken(refreshToken);
        this.setCurrentUser(user);
      }

      return response.data;
    } catch (error: any) {
      console.error('Register error:', error);
      throw error.response?.data || error;
    }
  }

  /**
   * Logowanie użytkownika
   */
  async login(data: LoginDTO): Promise<AuthResponse> {
    try {
      const response = await axios.post<AuthResponse>(
        `${BASE_URL}/auth/login`,
        data
      );

      // Zapisz tokeny i dane użytkownika
      if (response.data.success && response.data.data) {
        const { accessToken, refreshToken, user } = response.data.data;

        // Mapuj MongoDB _id na id
        if (user._id && !user.id) {
          user.id = user._id;
        }

        this.setAccessToken(accessToken);
        this.setRefreshToken(refreshToken);
        this.setCurrentUser(user);
      }

      return response.data;
    } catch (error: any) {
      console.error('Login error:', error);
      throw error.response?.data || error;
    }
  }

  /**
   * Wylogowanie użytkownika
   */
  async logout(): Promise<void> {
    try {
      await axios.post(`${BASE_URL}/auth/logout`);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Zawsze czyść lokalne dane
      this.clearAuth();
    }
  }

  /**
   * Odświeżanie access token
   */
  async refreshAccessToken(): Promise<string | null> {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await axios.post<RefreshResponse>(
        `${BASE_URL}/auth/refresh`,
        { refreshToken }
      );

      if (response.data.success && response.data.data) {
        const { accessToken } = response.data.data;
        this.setAccessToken(accessToken);
        return accessToken;
      }

      return null;
    } catch (error) {
      console.error('Refresh token error:', error);
      // Jeśli refresh nie działa, wyloguj użytkownika
      this.clearAuth();
      return null;
    }
  }

  /**
   * Pobierz aktualnego użytkownika z API
   */
  async fetchCurrentUser(): Promise<User | null> {
    try {
      const token = this.getAccessToken();
      if (!token) return null;

      const response = await axios.get(`${BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success && response.data.data) {
        const user = response.data.data;

        // Mapuj MongoDB _id na id
        if (user._id && !user.id) {
          user.id = user._id;
        }

        this.setCurrentUser(user);
        return user;
      }

      return null;
    } catch (error) {
      console.error('Fetch current user error:', error);
      return null;
    }
  }
}

// Singleton instance
export const authService = new AuthService();
export default authService;
