/**
 * Serwis wizyt/konsultacji - implementacja REST API
 *
 * Odpowiada za:
 * - Pobieranie wizyt lekarza/pacjenta
 * - Tworzenie nowych rezerwacji
 * - Aktualizację i anulowanie wizyt
 * - Generowanie harmonogramu tygodniowego
 * - Sprawdzanie dostępności slotów
 */

import apiClient, { handleApiError } from '../apiClient';
import type { IAppointmentService } from '../IDataService';
import type {
  Appointment,
  CreateAppointmentDTO,
  UpdateAppointmentDTO,
  WeekSchedule,
} from '../../models';

class AppointmentService implements IAppointmentService {
  /**
   * Pobiera wszystkie wizyty lekarza w określonym zakresie dat
   *
   * @param doctorId - ID lekarza
   * @param startDate - Data początkowa
   * @param endDate - Data końcowa
   * @returns Lista wizyt
   */
  async getAppointmentsByDoctor(
    doctorId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Appointment[]> {
    try {
      const response = await apiClient.get<Appointment[]>('/appointments', {
        params: {
          doctorId,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
      });

      // Konwersja stringów dat na obiekty Date
      return response.data.map(this.parseAppointmentDates);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Pobiera wszystkie wizyty pacjenta
   *
   * @param patientId - ID pacjenta
   * @returns Lista wizyt pacjenta
   */
  async getAppointmentsByPatient(patientId: string): Promise<Appointment[]> {
    try {
      const response = await apiClient.get<Appointment[]>(`/appointments/patient/${patientId}`);
      return response.data.map(this.parseAppointmentDates);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Pobiera szczegóły pojedynczej wizyty
   *
   * @param id - ID wizyty
   * @returns Dane wizyty
   */
  async getAppointmentById(id: string): Promise<Appointment> {
    try {
      const response = await apiClient.get<Appointment>(`/appointments/${id}`);
      return this.parseAppointmentDates(response.data);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Tworzy nową rezerwację wizyty
   *
   * @param data - Dane rezerwacji
   * @returns Utworzona wizyta
   */
  async createAppointment(data: CreateAppointmentDTO): Promise<Appointment> {
    try {
      const response = await apiClient.post<Appointment>('/appointments', data);
      return this.parseAppointmentDates(response.data);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Aktualizuje istniejącą wizytę
   *
   * @param id - ID wizyty
   * @param data - Dane do aktualizacji
   * @returns Zaktualizowana wizyta
   */
  async updateAppointment(id: string, data: UpdateAppointmentDTO): Promise<Appointment> {
    try {
      const response = await apiClient.patch<Appointment>(`/appointments/${id}`, data);
      return this.parseAppointmentDates(response.data);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Anuluje wizytę
   *
   * @param id - ID wizyty
   * @param reason - Opcjonalny powód anulowania
   * @returns Anulowana wizyta
   */
  async cancelAppointment(id: string, reason?: string): Promise<Appointment> {
    try {
      const response = await apiClient.patch<Appointment>(`/appointments/${id}/cancel`, {
        cancelReason: reason,
      });
      return this.parseAppointmentDates(response.data);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Pobiera harmonogram tygodniowy lekarza
   * Zawiera wszystkie sloty (wolne i zajęte) dla danego tygodnia
   *
   * @param doctorId - ID lekarza
   * @param weekStart - Pierwszy dzień tygodnia (poniedziałek)
   * @returns Harmonogram tygodniowy
   */
  async getWeekSchedule(doctorId: string, weekStart: Date): Promise<WeekSchedule> {
    try {
      const response = await apiClient.get<WeekSchedule>('/appointments/schedule/week', {
        params: {
          doctorId,
          weekStart: weekStart.toISOString(),
        },
      });

      // Parsowanie dat w całej strukturze
      const schedule = response.data;

      schedule.weekStart = new Date(schedule.weekStart);
      schedule.weekEnd = new Date(schedule.weekEnd);

      schedule.days = schedule.days.map((day) => ({
        ...day,
        date: new Date(day.date),
        slots: day.slots.map((slot) => ({
          ...slot,
          startTime: new Date(slot.startTime),
          endTime: new Date(slot.endTime),
          appointment: slot.appointment
            ? this.parseAppointmentDates(slot.appointment)
            : undefined,
        })),
      }));

      return schedule;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Sprawdza czy dany slot czasowy jest dostępny
   *
   * @param doctorId - ID lekarza
   * @param startTime - Czas rozpoczęcia
   * @param duration - Długość w minutach
   * @returns true jeśli dostępny, false jeśli zajęty
   */
  async checkSlotAvailability(
    doctorId: string,
    startTime: Date,
    duration: number
  ): Promise<boolean> {
    try {
      const response = await apiClient.get<{ available: boolean }>(
        '/appointments/check-availability',
        {
          params: {
            doctorId,
            startTime: startTime.toISOString(),
            duration,
          },
        }
      );

      return response.data.available;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Pomocnicza metoda - parsuje stringi dat na obiekty Date
   */
  private parseAppointmentDates(appointment: any): Appointment {
    return {
      ...appointment,
      startTime: new Date(appointment.startTime),
      endTime: new Date(appointment.endTime),
      createdAt: new Date(appointment.createdAt),
      updatedAt: new Date(appointment.updatedAt),
      cancelledAt: appointment.cancelledAt ? new Date(appointment.cancelledAt) : undefined,
    };
  }
}

// Singleton
export const appointmentService = new AppointmentService();
export default appointmentService;
