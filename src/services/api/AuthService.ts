/**
 * Serwis autentykacji - implementacja REST API
 *
 * Odpowiada za:
 * - Rejestrację nowych użytkowników
 * - Logowanie
 * - Wylogowanie
 * - Odświeżanie tokenów JWT
 * - Pobieranie aktualnie zalogowanego użytkownika
 */

import apiClient, { handleApiError } from '../apiClient';
import type { IAuthService } from '../IDataService';
import type { User, UserRegistrationDTO, LoginCredentials, AuthResponse } from '../../models';

class AuthService implements IAuthService {
  /**
   * Rejestracja nowego użytkownika
   *
   * @param data - Dane rejestracyjne użytkownika
   * @returns AuthResponse z danymi użytkownika i tokenami
   */
  async register(data: UserRegistrationDTO): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/register', data);

      // Zapisz tokeny w localStorage
      this.saveAuthData(response.data);

      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Logowanie użytkownika
   *
   * @param credentials - Email i hasło
   * @returns AuthResponse z danymi użytkownika i tokenami
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/login', credentials);

      // Zapisz tokeny w localStorage
      this.saveAuthData(response.data);

      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Wylogowanie użytkownika
   * Usuwa tokeny z localStorage i opcjonalnie wywołuje endpoint wylogowania na serwerze
   */
  async logout(): Promise<void> {
    try {
      // Opcjonalnie: wywołaj endpoint wylogowania na serwerze
      // await apiClient.post('/auth/logout');

      // Usuń dane autentykacji z localStorage
      this.clearAuthData();
    } catch (error) {
      // Mimo błędu, usuń dane lokalne
      this.clearAuthData();
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Pobiera dane aktualnie zalogowanego użytkownika
   *
   * @returns User lub null jeśli nikt nie jest zalogowany
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const token = localStorage.getItem('accessToken');

      if (!token) {
        return null;
      }

      const response = await apiClient.get<User>('/auth/me');
      return response.data;
    } catch (error) {
      // Jeśli błąd 401, użytkownik nie jest zalogowany
      return null;
    }
  }

  /**
   * Odświeża access token używając refresh tokena
   *
   * @returns Nowy access token
   */
  async refreshToken(): Promise<string> {
    try {
      const refreshToken = localStorage.getItem('refreshToken');

      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await apiClient.post<{ token: string }>('/auth/refresh', {
        refreshToken,
      });

      // Zapisz nowy token
      localStorage.setItem('accessToken', response.data.token);

      return response.data.token;
    } catch (error) {
      // Jeśli odświeżenie nie powiodło się, wyloguj użytkownika
      this.clearAuthData();
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Pomocnicza metoda - zapisuje dane autentykacji w localStorage
   */
  private saveAuthData(authResponse: AuthResponse): void {
    localStorage.setItem('accessToken', authResponse.token);

    if (authResponse.refreshToken) {
      localStorage.setItem('refreshToken', authResponse.refreshToken);
    }

    localStorage.setItem('currentUser', JSON.stringify(authResponse.user));
  }

  /**
   * Pomocnicza metoda - usuwa dane autentykacji z localStorage
   */
  private clearAuthData(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('currentUser');
  }

  /**
   * Sprawdza czy użytkownik jest zalogowany (czy istnieje token)
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('accessToken');
  }

  /**
   * Pobiera dane użytkownika z localStorage (bez zapytania do API)
   */
  getCachedUser(): User | null {
    const userJson = localStorage.getItem('currentUser');
    return userJson ? JSON.parse(userJson) : null;
  }
}

// Singleton - jedna instancja serwisu
export const authService = new AuthService();
export default authService;
