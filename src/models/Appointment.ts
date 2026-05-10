/**
 * Model konsultacji/wizyty lekarskiej
 *
 * Reprezentuje zarówno zarezerwowane wizyty jak i wolne sloty czasowe
 */

/**
 * Typ konsultacji
 */
export type AppointmentType =
  | 'first_visit'      // Pierwsza wizyta
  | 'follow_up'        // Wizyta kontrolna
  | 'chronic_disease'  // Choroba przewlekła
  | 'prescription'     // Recepta
  | 'consultation'     // Konsultacja ogólna
  | 'emergency'        // Wizyta pilna
  | 'procedure';       // Zabieg

/**
 * Status konsultacji
 */
export type AppointmentStatus =
  | 'available'   // Wolny slot
  | 'reserved'    // Zarezerwowane (w koszyku, ale nie potwierdzone)
  | 'confirmed'   // Potwierdzone (po "płatności")
  | 'completed'   // Odbyła się
  | 'cancelled'   // Odwołana
  | 'no_show';    // Pacjent się nie stawił

/**
 * Główny interfejs konsultacji
 */
export interface Appointment {
  id: string;
  doctorId: string;
  patientId?: string;  // Brak jeśli slot wolny

  // Informacje czasowe
  startTime: Date;
  endTime: Date;
  duration: number;    // Długość w minutach (wielokrotność 30)

  // Status i typ
  status: AppointmentStatus;
  type?: AppointmentType;

  // Dane pacjenta (wypełniane przy rezerwacji)
  patientFirstName?: string;
  patientLastName?: string;
  patientGender?: 'male' | 'female' | 'other';
  patientAge?: number;
  patientNotes?: string;  // Informacje dla lekarza

  // Załączniki
  attachments?: AppointmentAttachment[];

  // Metadane
  createdAt: Date;
  updatedAt: Date;
  cancelledAt?: Date;
  cancelReason?: string;
}

/**
 * Załącznik do wizyty (np. wyniki badań)
 */
export interface AppointmentAttachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
}

/**
 * DTO dla tworzenia nowej rezerwacji
 */
export interface CreateAppointmentDTO {
  doctorId: string;
  startTime: string;  // ISO date string
  duration: number;   // Liczba slotów * 30 minut
  type: AppointmentType;

  // Dane pacjenta
  patientFirstName: string;
  patientLastName: string;
  patientGender: 'male' | 'female' | 'other';
  patientAge: number;
  patientNotes?: string;
}

/**
 * DTO dla aktualizacji rezerwacji
 */
export interface UpdateAppointmentDTO {
  status?: AppointmentStatus;
  type?: AppointmentType;
  patientNotes?: string;
  cancelReason?: string;
}

/**
 * Slot czasowy w kalendarzu (30 minut)
 */
export interface TimeSlot {
  startTime: Date;
  endTime: Date;
  isAvailable: boolean;
  appointment?: Appointment;  // Jeśli zajęty
}

/**
 * Dzień w kalendarzu z wszystkimi slotami
 */
export interface DaySchedule {
  date: Date;
  slots: TimeSlot[];
  appointmentCount: number;  // Liczba zarezerwowanych wizyt tego dnia
  isAbsence: boolean;        // Czy lekarz jest nieobecny tego dnia
}

/**
 * Tydzień w kalendarzu (7 dni)
 */
export interface WeekSchedule {
  weekStart: Date;
  weekEnd: Date;
  days: DaySchedule[];
}
