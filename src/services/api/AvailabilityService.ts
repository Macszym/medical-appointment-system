/**
 * Serwis dostępności lekarza - implementacja REST API
 *
 * Odpowiada za:
 * - Zarządzanie dostępnością lekarza (cykliczną i jednorazową)
 * - Zarządzanie absencjami (urlopy, nieobecności)
 * - Wykrywanie konfliktów z zarezerwowanymi wizytami
 */

import apiClient, { handleApiError } from '../apiClient';
import type { IAvailabilityService } from '../IDataService';
import type {
  Availability,
  CreateRecurringAvailabilityDTO,
  CreateOneTimeAvailabilityDTO,
  Absence,
  CreateAbsenceDTO,
  AvailabilityConflict,
} from '../../models';

class AvailabilityService implements IAvailabilityService {
  /**
   * Pobiera wszystkie dostępności danego lekarza
   *
   * @param doctorId - ID lekarza
   * @returns Lista dostępności
   */
  async getAvailabilitiesByDoctor(doctorId: string): Promise<Availability[]> {
    try {
      const response = await apiClient.get<Availability[]>(`/availability/doctor/${doctorId}`);
      return response.data.map(this.parseAvailabilityDates);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Pobiera szczegóły pojedynczej dostępności
   *
   * @param id - ID dostępności
   * @returns Dane dostępności
   */
  async getAvailabilityById(id: string): Promise<Availability> {
    try {
      const response = await apiClient.get<Availability>(`/availability/${id}`);
      return this.parseAvailabilityDates(response.data);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Tworzy cykliczną dostępność lekarza
   * Np. każdy poniedziałek i środa, 8:00-12:00 i 16:00-20:00
   *
   * @param data - Dane cyklicznej dostępności
   * @returns Utworzona dostępność
   */
  async createRecurringAvailability(
    data: CreateRecurringAvailabilityDTO
  ): Promise<Availability> {
    try {
      const response = await apiClient.post<Availability>('/availability/recurring', data);
      return this.parseAvailabilityDates(response.data);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Tworzy jednorazową dostępność lekarza
   * Np. tylko w piątek 2025-03-15, 10:00-14:00
   *
   * @param data - Dane jednorazowej dostępności
   * @returns Utworzona dostępność
   */
  async createOneTimeAvailability(data: CreateOneTimeAvailabilityDTO): Promise<Availability> {
    try {
      const response = await apiClient.post<Availability>('/availability/one-time', data);
      return this.parseAvailabilityDates(response.data);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Usuwa dostępność
   *
   * @param id - ID dostępności do usunięcia
   */
  async deleteAvailability(id: string): Promise<void> {
    try {
      await apiClient.delete(`/availability/${id}`);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Pobiera wszystkie absencje danego lekarza
   *
   * @param doctorId - ID lekarza
   * @returns Lista absencji
   */
  async getAbsencesByDoctor(doctorId: string): Promise<Absence[]> {
    try {
      const response = await apiClient.get<Absence[]>(`/absences/doctor/${doctorId}`);
      return response.data.map(this.parseAbsenceDates);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Tworzy nową absencję (urlop, choroba, itp.)
   *
   * WAŻNE: Jeśli absencja koliduje z zarezerwowanymi wizytami,
   * backend automatycznie anuluje te wizyty i zwraca informacje o konfliktach
   *
   * @param data - Dane absencji
   * @returns Utworzona absencja + ewentualne konflikty
   */
  async createAbsence(
    data: CreateAbsenceDTO
  ): Promise<{ absence: Absence; conflicts?: AvailabilityConflict }> {
    try {
      const response = await apiClient.post<{
        absence: Absence;
        conflicts?: AvailabilityConflict;
      }>('/absences', data);

      return {
        absence: this.parseAbsenceDates(response.data.absence),
        conflicts: response.data.conflicts,
      };
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Usuwa absencję
   *
   * @param id - ID absencji do usunięcia
   */
  async deleteAbsence(id: string): Promise<void> {
    try {
      await apiClient.delete(`/absences/${id}`);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Pomocnicza metoda - parsuje stringi dat na obiekty Date (Availability)
   */
  private parseAvailabilityDates(availability: any): Availability {
    return {
      ...availability,
      startDate: availability.startDate ? new Date(availability.startDate) : undefined,
      endDate: availability.endDate ? new Date(availability.endDate) : undefined,
      specificDate: availability.specificDate ? new Date(availability.specificDate) : undefined,
      createdAt: new Date(availability.createdAt),
      updatedAt: new Date(availability.updatedAt),
    };
  }

  /**
   * Pomocnicza metoda - parsuje stringi dat na obiekty Date (Absence)
   */
  private parseAbsenceDates(absence: any): Absence {
    return {
      ...absence,
      startDate: new Date(absence.startDate),
      endDate: new Date(absence.endDate),
      createdAt: new Date(absence.createdAt),
      updatedAt: new Date(absence.updatedAt),
    };
  }
}

// Singleton
export const availabilityService = new AvailabilityService();
export default availabilityService;
