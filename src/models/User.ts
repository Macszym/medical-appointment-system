/**
 * Model użytkownika systemu
 *
 * Reprezentuje wszystkie typy użytkowników w aplikacji:
 * - guest: niezalogowany użytkownik
 * - patient: pacjent (może rezerwować wizyty)
 * - doctor: lekarz (może zarządzać harmonogramem)
 * - admin: administrator (pełne uprawnienia)
 */

export type UserRole = 'guest' | 'patient' | 'doctor' | 'admin';

export interface User {
  id: string;
  email: string;
  password?: string; // Opcjonalne - nie przesyłane z backendu
  role: UserRole;
  firstName: string;
  lastName: string;
  createdAt: Date;
  updatedAt: Date;

  // Pola specyficzne dla lekarza
  specialization?: string; // np. "Kardiolog", "Dermatolog"

  // Pola specyficzne dla pacjenta
  pesel?: string;

  // Status konta
  isActive: boolean;
  isBanned: boolean; // Admin może zbanować użytkownika

  // Oceny lekarza (tylko dla lekarzy)
  doctorRating?: {
    totalRating: number;
    numberOfRatings: number;
    averageRating: number;
  };

  // Session ID (do single session enforcement)
  sessionId?: string;
}

/**
 * DTO dla rejestracji nowego użytkownika
 */
export interface UserRegistrationDTO {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'patient' | 'doctor'; // Rejestracja tylko dla pacjentów i lekarzy

  // Opcjonalne pola
  specialization?: string;
  pesel?: string;
}

/**
 * DTO dla logowania
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Odpowiedź z backendu po zalogowaniu
 */
export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
}
