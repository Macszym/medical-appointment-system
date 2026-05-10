/**
 * Model koszyka rezerwacji
 *
 * Pacjent może dodawać wizyty do koszyka przed ostatecznym potwierdzeniem.
 * Koszyk jest unikalny dla każdego użytkownika i persystowany między sesjami.
 */

import { Appointment, AppointmentType } from './Appointment';

/**
 * Pozycja w koszyku (wizyta w trakcie rezerwacji)
 */
export interface CartItem {
  _id: string;  // ID pozycji w koszyku (MongoDB subdocument _id)
  doctorId: string;
  doctorName: string;
  doctorSpecialization: string;

  // Informacje czasowe
  startTime: Date;
  endTime: Date;
  duration: number;  // W minutach

  // Typ wizyty
  type: AppointmentType;

  // Dane pacjenta
  patientFirstName: string;
  patientLastName: string;
  patientGender: 'male' | 'female' | 'other';
  patientAge: number;
  patientNotes?: string;

  // Cena (symulacja)
  price: number;

  // Metadane
  addedAt: Date;
}

/**
 * Koszyk użytkownika
 */
export interface Cart {
  userId: string;
  items: CartItem[];
  totalPrice: number;
  itemCount: number;
  createdAt?: Date;
  updatedAt: Date;
}

/**
 * DTO dla dodawania wizyty do koszyka
 */
export interface AddToCartDTO {
  doctorId: string;
  startTime: string;  // ISO date string
  duration: number;
  type: AppointmentType;
  patientFirstName: string;
  patientLastName: string;
  patientGender: 'male' | 'female' | 'other';
  patientAge: number;
  patientNotes?: string;
}

/**
 * Wynik finalizacji koszyka (symulacja płatności)
 */
export interface CheckoutResult {
  success: boolean;
  confirmedAppointments: Appointment[];
  failedItems: {
    cartItemId: string;
    reason: string;  // np. "Slot już zajęty", "Konflikt z absencją"
  }[];
  totalPaid: number;
  transactionId: string;
}

/**
 * Status płatności (symulacja)
 */
export type PaymentStatus = 'pending' | 'completed' | 'failed';

/**
 * Symulowana płatność
 */
export interface PaymentSimulation {
  transactionId: string;
  amount: number;
  status: PaymentStatus;
  timestamp: Date;
}
