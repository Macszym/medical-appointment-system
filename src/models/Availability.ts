/**
 * Model dostępności lekarza
 *
 * Lekarz może definiować swoją dostępność na dwa sposoby:
 * 1. Cyklicznie (recurring) - np. każdy poniedziałek 8:00-12:00
 * 2. Jednorazowo (one-time) - konkretny dzień i godziny
 */

/**
 * Typ dostępności
 */
export type AvailabilityType = 'recurring' | 'one-time';

/**
 * Dni tygodnia (0 = Niedziela, 6 = Sobota)
 */
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Zakres czasowy (np. 8:00-12:00)
 */
export interface TimeRange {
  startTime: string;  // Format HH:mm, np. "08:00"
  endTime: string;    // Format HH:mm, np. "12:00"
}

/**
 * Główny interfejs dostępności
 */
export interface Availability {
  id: string;
  doctorId: string;
  type: AvailabilityType;

  // Dla dostępności cyklicznej
  startDate?: Date;     // Od kiedy obowiązuje
  endDate?: Date;       // Do kiedy obowiązuje
  daysOfWeek?: DayOfWeek[];  // Które dni tygodnia
  timeRanges?: TimeRange[];   // Zakresy godzin (może być kilka, np. 8-12 i 16-20)

  // Dla dostępności jednorazowej
  specificDate?: Date;
  specificTimeRanges?: TimeRange[];

  // Metadane
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

/**
 * DTO dla tworzenia cyklicznej dostępności
 */
export interface CreateRecurringAvailabilityDTO {
  doctorId: string;
  startDate: string;    // ISO date string
  endDate: string;      // ISO date string
  daysOfWeek: DayOfWeek[];  // np. [1, 2, 4, 6] = poniedziałek, wtorek, czwartek, sobota
  timeRanges: TimeRange[];   // np. [{ startTime: "08:00", endTime: "12:30" }]
}

/**
 * DTO dla tworzenia jednorazowej dostępności
 */
export interface CreateOneTimeAvailabilityDTO {
  doctorId: string;
  specificDate: string;  // ISO date string
  specificTimeRanges: TimeRange[];
}

/**
 * Absencja lekarza (urlop, choroba, itp.)
 */
export interface Absence {
  id: string;
  doctorId: string;

  // Okres nieobecności (całe dni)
  startDate: Date;
  endDate: Date;

  // Opcjonalny opis
  reason?: string;  // np. "Urlop", "Konferencja", "Choroba"
  notes?: string;   // Dodatkowe informacje

  // Metadane
  createdAt: Date;
  updatedAt: Date;
}

/**
 * DTO dla tworzenia absencji
 */
export interface CreateAbsenceDTO {
  doctorId: string;
  startDate: string;  // ISO date string
  endDate: string;    // ISO date string
  reason?: string;
  notes?: string;
}

/**
 * Konflikt z istniejącymi wizytami
 * Zwracany gdy absencja koliduje z zarezerwowanymi wizytami
 */
export interface AvailabilityConflict {
  absenceId: string;
  conflictingAppointments: string[];  // ID-ki wizyt, które trzeba odwołać
  affectedPatientsCount: number;
}
