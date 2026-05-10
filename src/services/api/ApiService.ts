/**
 * API Service - komunikacja z backendem REST API
 *
 * Implementuje te same metody co LocalStorageService,
 * ale komunikuje się z backendem przez HTTP.
 */

import apiClient from '../apiClient';
import type {
  User,
  Appointment,
  Availability,
  Absence,
} from '../../models';

// Mapowanie MongoDB _id na id dla kompatybilności z frontendem
const mapMongoId = <T extends { _id?: string; id?: string }>(item: T): T => {
  if (item._id) {
    const { _id, ...rest } = item as any;
    return { ...rest, id: _id } as T;
  }
  return item;
};

// Parsowanie dat z JSON na Date objects
const parseDates = <T>(item: any): T => {
  const result = { ...item };

  // Parse common date fields
  if (result.createdAt) result.createdAt = new Date(result.createdAt);
  if (result.updatedAt) result.updatedAt = new Date(result.updatedAt);
  if (result.startTime) result.startTime = new Date(result.startTime);
  if (result.endTime) result.endTime = new Date(result.endTime);
  if (result.startDate) result.startDate = new Date(result.startDate);
  if (result.endDate) result.endDate = new Date(result.endDate);
  if (result.specificDate) result.specificDate = new Date(result.specificDate);
  if (result.dateOfBirth) result.dateOfBirth = new Date(result.dateOfBirth);

  return result as T;
};

// Serwis komunikacji z REST API (backend)
class ApiService {
  // Inicjalizacja (dla kompatybilności z LocalStorageService)
  async initialize(): Promise<void> {
    // ApiService nie wymaga inicjalizacji
  }

  // ============================================
  // USERS
  // ============================================

  /**
   * Pobierz wszystkich użytkowników
   */
  async getAllUsers(): Promise<User[]> {
    const response = await apiClient.get('/users');
    return response.data.data.map((user: any) => parseDates(mapMongoId(user)));
  }

  /**
   * Pobierz użytkownika po ID
   */
  async getUserById(id: string): Promise<User | null> {
    try {
      const response = await apiClient.get(`/users/${id}`);
      return parseDates(mapMongoId(response.data.data));
    } catch (error: any) {
      if (error.response?.status === 404) return null;
      throw error;
    }
  }

  /**
   * Utwórz użytkownika
   */
  async createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const response = await apiClient.post('/users', user);
    return parseDates(mapMongoId(response.data.data));
  }

  /**
   * Aktualizuj użytkownika
   */
  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const response = await apiClient.put(`/users/${id}`, updates);
    return parseDates(mapMongoId(response.data.data));
  }

  /**
   * Usuń użytkownika
   */
  async deleteUser(id: string): Promise<void> {
    await apiClient.delete(`/users/${id}`);
  }

  // ============================================
  // APPOINTMENTS
  // ============================================

  /**
   * Pobierz wizyty z filtrowaniem
   */
  async getAppointments(filters?: {
    doctorId?: string;
    patientId?: string;
    startDate?: Date;
    endDate?: Date;
    status?: string;
  }): Promise<Appointment[]> {

    const params: any = {};
    if (filters?.doctorId) params.doctorId = filters.doctorId;
    if (filters?.patientId) params.patientId = filters.patientId;
    if (filters?.status) params.status = filters.status;
    if (filters?.startDate) params.startDate = filters.startDate.toISOString();
    if (filters?.endDate) params.endDate = filters.endDate.toISOString();

    const response = await apiClient.get('/appointments', { params });
    return response.data.data.map((app: any) => parseDates(mapMongoId(app)));
  }

  /**
   * Pobierz wizytę po ID
   */
  async getAppointmentById(id: string): Promise<Appointment | null> {
    try {
      const response = await apiClient.get(`/appointments/${id}`);
      return parseDates(mapMongoId(response.data.data));
    } catch (error: any) {
      if (error.response?.status === 404) return null;
      throw error;
    }
  }

  /**
   * Utwórz wizytę
   */
  async createAppointment(
    appointment: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Appointment> {
    const response = await apiClient.post('/appointments', appointment);
    return parseDates(mapMongoId(response.data.data));
  }

  /**
   * Aktualizuj wizytę
   */
  async updateAppointment(id: string, updates: Partial<Appointment>): Promise<Appointment> {
    const response = await apiClient.put(`/appointments/${id}`, updates);
    return parseDates(mapMongoId(response.data.data));
  }

  /**
   * Usuń wizytę
   */
  async deleteAppointment(id: string): Promise<void> {
    await apiClient.delete(`/appointments/${id}`);
  }

  // ============================================
  // AVAILABILITIES
  // ============================================

  /**
   * Pobierz dostępności lekarza
   */
  async getAvailabilitiesByDoctor(doctorId: string): Promise<Availability[]> {
    const response = await apiClient.get('/availabilities', {
      params: { doctorId },
    });
    return response.data.data.map((avail: any) => parseDates(mapMongoId(avail)));
  }

  /**
   * Utwórz dostępność
   */
  async createAvailability(
    availability: Omit<Availability, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Availability> {
    const response = await apiClient.post('/availabilities', availability);
    return parseDates(mapMongoId(response.data.data));
  }

  /**
   * Aktualizuj dostępność
   */
  async updateAvailability(id: string, updates: Partial<Availability>): Promise<Availability> {
    const response = await apiClient.put(`/availabilities/${id}`, updates);
    return parseDates(mapMongoId(response.data.data));
  }

  /**
   * Usuń dostępność
   */
  async deleteAvailability(id: string): Promise<void> {
    await apiClient.delete(`/availabilities/${id}`);
  }

  // ============================================
  // ABSENCES
  // ============================================

  /**
   * Pobierz absencje lekarza
   */
  async getAbsencesByDoctor(doctorId: string): Promise<Absence[]> {
    const response = await apiClient.get('/absences', {
      params: { doctorId },
    });
    return response.data.data.map((absence: any) => parseDates(mapMongoId(absence)));
  }

  /**
   * Utwórz absencję
   */
  async createAbsence(
    absence: Omit<Absence, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Absence> {
    const response = await apiClient.post('/absences', absence);
    return parseDates(mapMongoId(response.data.data));
  }

  /**
   * Aktualizuj absencję
   */
  async updateAbsence(id: string, updates: Partial<Absence>): Promise<Absence> {
    const response = await apiClient.put(`/absences/${id}`, updates);
    return parseDates(mapMongoId(response.data.data));
  }

  /**
   * Usuń absencję
   */
  async deleteAbsence(id: string): Promise<void> {
    await apiClient.delete(`/absences/${id}`);
  }

  // ============================================
  // RATINGS
  // ============================================

  /**
   * Oceń lekarza
   */
  async rateDoctor(
    doctorId: string,
    patientId: string,
    rating: number,
    comment?: string
  ): Promise<any> {
    const response = await apiClient.post(`/users/${doctorId}/rate`, {
      rating,
      comment,
    });
    return parseDates(response.data.data);
  }

  /**
   * Pobierz oceny lekarza
   */
  async getDoctorRatings(doctorId: string): Promise<any[]> {
    const response = await apiClient.get(`/users/${doctorId}/ratings`);
    return response.data.data.map((rating: any) => {
      const parsed = parseDates(rating);
      // Jeśli patientId jest obiektem (populated), parsuj też jego daty
      if (parsed.patientId && typeof parsed.patientId === 'object') {
        parsed.patientId = {
          ...parsed.patientId,
          createdAt: parsed.patientId.createdAt ? new Date(parsed.patientId.createdAt) : undefined,
          updatedAt: parsed.patientId.updatedAt ? new Date(parsed.patientId.updatedAt) : undefined,
        };
      }
      return parsed;
    });
  }

  /**
   * Odpowiedz na ocenę jako lekarz
   */
  async replyToRating(
    doctorId: string,
    ratingId: string,
    reply: string,
    currentUserId: string,
    currentUserRole: string
  ): Promise<any> {
    const response = await apiClient.post(`/users/${doctorId}/ratings/${ratingId}/reply`, {
      reply,
    });
    // Zostawiamy _id bez mapowania (Rating używa _id)
    return parseDates(response.data.data);
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;
