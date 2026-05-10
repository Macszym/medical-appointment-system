/**
 * Service Factory - Wzorzec Factory
 *
 * Zgodnie z wymaganiami :
 * Zwraca odpowiednią implementację serwisu w zależności od wybranego źródła danych.
 *
 * Wspiera:
 * - LocalStorageService (local-json)
 * - ApiService (rest-api)
 */

import type { DataSource } from '../contexts/DataSourceContext';
import { localStorageService } from './local/LocalStorageService';
import { apiService } from './api/ApiService';

/**
 * Interfejs bazowy dla wszystkich serwisów danych
 */
export interface IDataService {
  initialize(): Promise<void>;

  // Users
  getAllUsers(): Promise<any[]>;
  getUserById(id: string): Promise<any | null>;
  createUser(user: any): Promise<any>;
  updateUser(id: string, updates: any): Promise<any>;
  deleteUser(id: string): Promise<void>;

  // Appointments
  getAppointments(filters?: any): Promise<any[]>;
  getAppointmentById(id: string): Promise<any | null>;
  createAppointment(appointment: any): Promise<any>;
  updateAppointment(id: string, updates: any): Promise<any>;
  deleteAppointment(id: string): Promise<void>;

  // Availabilities
  getAvailabilitiesByDoctor(doctorId: string): Promise<any[]>;
  createAvailability(availability: any): Promise<any>;
  updateAvailability(id: string, updates: any): Promise<any>;
  deleteAvailability(id: string): Promise<void>;

  // Absences
  getAbsencesByDoctor(doctorId: string): Promise<any[]>;
  createAbsence(absence: any): Promise<any>;
  updateAbsence(id: string, updates: any): Promise<any>;
  deleteAbsence(id: string): Promise<void>;

  // Ratings
  rateDoctor(doctorId: string, patientId: string, rating: number, comment?: string): Promise<any>;
  getDoctorRatings(doctorId: string): Promise<any[]>;
  replyToRating(
    doctorId: string,
    ratingId: string,
    reply: string,
    currentUserId: string,
    currentUserRole: string
  ): Promise<any>;
}

/**
 * Service Factory
 *
 * Zwraca odpowiednią implementację serwisu w zależności od źródła danych
 */
class ServiceFactory {
  private currentSource: DataSource = 'rest-api';
  private currentService: IDataService = apiService;

  /**
   * Ustawia aktywne źródło danych
   */
  setDataSource(source: DataSource): void {
    this.currentSource = source;

    switch (source) {
      case 'local-json':
        this.currentService = localStorageService as unknown as IDataService;
        break;
      case 'rest-api':
        this.currentService = apiService as unknown as IDataService;
        break;
      default:
        console.error(`Unknown data source: ${source}`);
        this.currentService = apiService as unknown as IDataService;
    }
  }

  /**
   * Zwraca aktywny serwis
   */
  getService(): IDataService {
    return this.currentService;
  }

  /**
   * Zwraca informację o aktywnym źródle
   */
  getCurrentSource(): DataSource {
    return this.currentSource;
  }
}

// Singleton instance
export const serviceFactory = new ServiceFactory();

/**
 * Hook do pobierania aktywnego serwisu
 *
 * @example
 * const dataService = useDataService();
 * const users = await dataService.getAllUsers();
 */
export const getDataService = (): IDataService => {
  return serviceFactory.getService();
};
