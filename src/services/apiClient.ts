/**
 * Konfiguracja klienta API (Axios)
 *
 * Centralna konfiguracja dla wszystkich zapytań HTTP.
 * Zawiera interceptory dla:
 * - Automatycznego dodawania JWT token do nagłówków
 * - Obsługi błędów autentykacji (401) i automatycznego odświeżania tokena
 * - Obsługi błędów sieciowych
 */

import axios from 'axios';
import type { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { authService } from './auth/AuthService';

/**
 * Bazowy URL API - pobierany ze zmiennych środowiskowych
 * Domyślnie: http://localhost:3001/api (backend Node.js)
 */
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/**
 * Instancja Axios z konfiguracją
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,  // 10 sekund timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request Interceptor
 * Automatycznie dodaje JWT token do każdego zapytania
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = authService.getAccessToken();

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * Obsługuje błędy autentykacji i automatyczne odświeżanie tokena
 */
apiClient.interceptors.response.use(
  // Odpowiedź bez błędów - zwracamy dane
  (response) => response,

  // Obsługa błędów
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const responseData = error.response?.data as { sessionExpired?: boolean; message?: string };

    // 401 Unauthorized - sprawdź czy to wygasła sesja (single session enforcement)
    if (error.response?.status === 401) {
      // Jeśli sesja została unieważniona (logowanie z innego urządzenia)
      if (responseData?.sessionExpired) {
        // Wyloguj użytkownika i pokaż komunikat
        authService.clearAuth();
        alert(responseData.message || 'Sesja została unieważniona (logowanie z innego urządzenia)');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      // Normalny wygasły token - spróbuj odświeżyć
      if (!originalRequest._retry) {
        originalRequest._retry = true;

        try {
          // Próba odświeżenia tokena przez AuthService
          const newAccessToken = await authService.refreshAccessToken();

          if (!newAccessToken) {
            throw new Error('Failed to refresh token');
          }

          // Powtórz oryginalne zapytanie z nowym tokenem
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          }

          return apiClient(originalRequest);
        } catch (refreshError) {
          // Odświeżenie nie powiodło się - wyloguj użytkownika
          authService.clearAuth();

          // Przekieruj do strony logowania
          window.location.href = '/login';

          return Promise.reject(refreshError);
        }
      }
    }

    // 403 Forbidden - brak uprawnień
    if (error.response?.status === 403) {
      console.error('Access forbidden - insufficient permissions');
      // Możesz tutaj dodać redirect do strony błędu lub pokazać toast
    }

    // Inne błędy
    return Promise.reject(error);
  }
);

// Obsługa błędów API
export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string }>;

    if (axiosError.response) {
      // Serwer odpowiedział z błędem
      return axiosError.response.data?.message || `Error: ${axiosError.response.status}`;
    } else if (axiosError.request) {
      // Zapytanie zostało wysłane, ale nie otrzymano odpowiedzi
      return 'Network error - no response from server';
    } else {
      // Błąd podczas konfiguracji zapytania
      return axiosError.message || 'Unknown error occurred';
    }
  }

  return 'An unexpected error occurred';
};

export default apiClient;
