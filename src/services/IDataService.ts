/**
 * Interfejsy abstrakcyjne dla serwisów danych
 *
 * Aplikacja wspiera
 * dynamiczną zmianę źródła danych:
 * - Lokalny JSON
 * - Firebase (opcjonalnie)
 * - Własny backend REST API
 *
 * Wzorzec Repository/Service umożliwia łatwą podmianę implementacji.
 */

import type {
  User,
  UserRegistrationDTO,
  LoginCredentials,
  AuthResponse,
  Appointment,
  CreateAppointmentDTO,
  UpdateAppointmentDTO,
  WeekSchedule,
  Availability,
  CreateRecurringAvailabilityDTO,
  CreateOneTimeAvailabilityDTO,
  Absence,
  CreateAbsenceDTO,
  AvailabilityConflict,
  Cart,
  AddToCartDTO,
  CheckoutResult,
} from '../models';

/**
 * Interfejs serwisu autentykacji
 */
export interface IAuthService {
  register(data: UserRegistrationDTO): Promise<AuthResponse>;
  login(credentials: LoginCredentials): Promise<AuthResponse>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<User | null>;
  refreshToken(): Promise<string>;
}

/**
 * Interfejs serwisu użytkowników
 */
export interface IUserService {
  getUsers(): Promise<User[]>;
  getUserById(id: string): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User>;
  deleteUser(id: string): Promise<void>;
  banUser(id: string): Promise<User>;
  unbanUser(id: string): Promise<User>;
}

/**
 * Interfejs serwisu wizyt/konsultacji
 */
export interface IAppointmentService {
  // Pobieranie wizyt
  getAppointmentsByDoctor(doctorId: string, startDate: Date, endDate: Date): Promise<Appointment[]>;
  getAppointmentsByPatient(patientId: string): Promise<Appointment[]>;
  getAppointmentById(id: string): Promise<Appointment>;

  // Tworzenie i aktualizacja
  createAppointment(data: CreateAppointmentDTO): Promise<Appointment>;
  updateAppointment(id: string, data: UpdateAppointmentDTO): Promise<Appointment>;
  cancelAppointment(id: string, reason?: string): Promise<Appointment>;

  // Harmonogram tygodniowy
  getWeekSchedule(doctorId: string, weekStart: Date): Promise<WeekSchedule>;

  // Sprawdzanie dostępności
  checkSlotAvailability(doctorId: string, startTime: Date, duration: number): Promise<boolean>;
}

/**
 * Interfejs serwisu dostępności lekarza
 */
export interface IAvailabilityService {
  // Pobieranie dostępności
  getAvailabilitiesByDoctor(doctorId: string): Promise<Availability[]>;
  getAvailabilityById(id: string): Promise<Availability>;

  // Tworzenie dostępności
  createRecurringAvailability(data: CreateRecurringAvailabilityDTO): Promise<Availability>;
  createOneTimeAvailability(data: CreateOneTimeAvailabilityDTO): Promise<Availability>;

  // Usuwanie
  deleteAvailability(id: string): Promise<void>;

  // Absencje
  getAbsencesByDoctor(doctorId: string): Promise<Absence[]>;
  createAbsence(data: CreateAbsenceDTO): Promise<{ absence: Absence; conflicts?: AvailabilityConflict }>;
  deleteAbsence(id: string): Promise<void>;
}

/**
 * Interfejs serwisu koszyka
 */
export interface ICartService {
  // Pobieranie koszyka
  getCart(userId: string): Promise<Cart>;

  // Zarządzanie pozycjami
  addToCart(userId: string, item: AddToCartDTO): Promise<Cart>;
  removeFromCart(userId: string, itemId: string): Promise<Cart>;
  clearCart(userId: string): Promise<void>;

  // Finalizacja (symulacja płatności)
  checkout(userId: string): Promise<CheckoutResult>;
}

/**
 * Typ źródła danych
 */
export type DataSource = 'local-json' | 'rest-api';

/**
 * Fabryka serwisów - zwraca odpowiednią implementację w zależności od źródła danych
 */
export interface IServiceFactory {
  getAuthService(): IAuthService;
  getUserService(): IUserService;
  getAppointmentService(): IAppointmentService;
  getAvailabilityService(): IAvailabilityService;
  getCartService(): ICartService;
}
