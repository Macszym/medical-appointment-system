/**
 * Serwis użytkowników - implementacja REST API
 *
 * Odpowiada za:
 * - Pobieranie listy użytkowników (admin)
 * - Pobieranie szczegółów użytkownika
 * - Aktualizację danych użytkownika
 * - Usuwanie użytkownika (admin)
 * - Banowanie/odbanowanie użytkownika (admin)
 */

import apiClient, { handleApiError } from '../apiClient';
import type { IUserService } from '../IDataService';
import type { User } from '../../models';

class UserService implements IUserService {
  /**
   * Pobiera listę wszystkich użytkowników
   * UWAGA: Wymaga uprawnień administratora
   *
   * @returns Lista użytkowników
   */
  async getUsers(): Promise<User[]> {
    try {
      const response = await apiClient.get<User[]>('/users');
      return response.data.map(this.parseUserDates);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Pobiera szczegóły pojedynczego użytkownika
   *
   * @param id - ID użytkownika
   * @returns Dane użytkownika
   */
  async getUserById(id: string): Promise<User> {
    try {
      const response = await apiClient.get<User>(`/users/${id}`);
      return this.parseUserDates(response.data);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Aktualizuje dane użytkownika
   * Użytkownik może aktualizować własne dane
   * Admin może aktualizować dane wszystkich użytkowników
   *
   * @param id - ID użytkownika
   * @param data - Dane do aktualizacji (partial update)
   * @returns Zaktualizowany użytkownik
   */
  async updateUser(id: string, data: Partial<User>): Promise<User> {
    try {
      const response = await apiClient.patch<User>(`/users/${id}`, data);
      return this.parseUserDates(response.data);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Usuwa użytkownika
   * UWAGA: Wymaga uprawnień administratora
   *
   * @param id - ID użytkownika do usunięcia
   */
  async deleteUser(id: string): Promise<void> {
    try {
      await apiClient.delete(`/users/${id}`);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Banuje użytkownika
   * UWAGA: Wymaga uprawnień administratora
   *
   * Zbanowany użytkownik:
   * - Nie może dodawać komentarzy
   * - Nie może oceniać lekarzy
   * - Może nadal przeglądać i rezerwować wizyty
   *
   * @param id - ID użytkownika do zbanowania
   * @returns Zaktualizowany użytkownik (z isBanned: true)
   */
  async banUser(id: string): Promise<User> {
    try {
      const response = await apiClient.patch<User>(`/users/${id}/ban`);
      return this.parseUserDates(response.data);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Odbanowuje użytkownika
   * UWAGA: Wymaga uprawnień administratora
   *
   * @param id - ID użytkownika do odbanowania
   * @returns Zaktualizowany użytkownik (z isBanned: false)
   */
  async unbanUser(id: string): Promise<User> {
    try {
      const response = await apiClient.patch<User>(`/users/${id}/unban`);
      return this.parseUserDates(response.data);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Pobiera listę wszystkich lekarzy
   * Użyteczne dla pacjentów przeglądających dostępnych lekarzy
   *
   * @param specialization - Opcjonalny filtr po specjalizacji
   * @returns Lista lekarzy
   */
  async getDoctors(specialization?: string): Promise<User[]> {
    try {
      const response = await apiClient.get<User[]>('/users/doctors', {
        params: specialization ? { specialization } : undefined,
      });
      return response.data.map(this.parseUserDates);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Pobiera listę wszystkich specjalizacji lekarzy
   * Użyteczne do tworzenia filtrów
   *
   * @returns Lista unikalnych specjalizacji
   */
  async getSpecializations(): Promise<string[]> {
    try {
      const response = await apiClient.get<string[]>('/users/specializations');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Pomocnicza metoda - parsuje stringi dat na obiekty Date
   */
  private parseUserDates(user: any): User {
    return {
      ...user,
      createdAt: new Date(user.createdAt),
      updatedAt: new Date(user.updatedAt),
      dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth) : undefined,
    };
  }

  /**
   * Helper - sprawdza czy użytkownik ma określoną rolę
   */
  hasRole(user: User, role: User['role']): boolean {
    return user.role === role;
  }

  /**
   * Helper - sprawdza czy użytkownik jest adminem
   */
  isAdmin(user: User): boolean {
    return user.role === 'admin';
  }

  /**
   * Helper - sprawdza czy użytkownik jest lekarzem
   */
  isDoctor(user: User): boolean {
    return user.role === 'doctor';
  }

  /**
   * Helper - sprawdza czy użytkownik jest pacjentem
   */
  isPatient(user: User): boolean {
    return user.role === 'patient';
  }

  /**
   * Helper - zwraca pełne imię i nazwisko
   */
  getFullName(user: User): string {
    return `${user.firstName} ${user.lastName}`;
  }

  /**
   * Helper - zwraca tytuł z imieniem i nazwiskiem dla lekarza
   */
  getDoctorTitle(user: User): string {
    if (user.role !== 'doctor') {
      return this.getFullName(user);
    }
    return `Dr ${user.firstName} ${user.lastName}`;
  }
}

// Singleton
export const userService = new UserService();
export default userService;
