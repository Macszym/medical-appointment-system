/**
 * Centralna eksportacja wszystkich modeli
 *
 * Umożliwia łatwe importowanie modeli z jednego miejsca:
 * import { User, Appointment, Cart } from '@/models';
 */

// User models
export type { User, UserRole, UserRegistrationDTO, LoginCredentials, AuthResponse } from './User';

// Appointment models
export type {
  Appointment,
  AppointmentType,
  AppointmentStatus,
  AppointmentAttachment,
  CreateAppointmentDTO,
  UpdateAppointmentDTO,
  TimeSlot,
  DaySchedule,
  WeekSchedule,
} from './Appointment';

// Availability models
export type {
  Availability,
  AvailabilityType,
  DayOfWeek,
  TimeRange,
  CreateRecurringAvailabilityDTO,
  CreateOneTimeAvailabilityDTO,
  Absence,
  CreateAbsenceDTO,
  AvailabilityConflict,
} from './Availability';

// Cart models
export type {
  Cart,
  CartItem,
  AddToCartDTO,
  CheckoutResult,
  PaymentStatus,
  PaymentSimulation,
} from './Cart';

// Rating models
export type { Rating, CreateRatingDTO, ReplyToRatingDTO } from './Rating';
