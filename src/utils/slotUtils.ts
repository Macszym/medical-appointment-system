/**
 * Utility functions do generowania i zarządzania slotami czasowymi
 *
 * Slot czasowy = 30 minut (0.5h)
 * Kalendarz pokazuje sloty dla danego tygodnia
 */

import { addMinutes, isBefore, isAfter, isEqual } from 'date-fns';
import type {
  TimeSlot,
  DaySchedule,
  WeekSchedule,
  Appointment,
  Availability,
  Absence,
  TimeRange,
  DayOfWeek,
} from '../models';
import {
  getWeekDays,
  parseTimeString,
  getDayOfWeek,
  isDateInRange,
  isSameDay,
  getStartOfDay,
  getEndOfDay,
  doDateRangesOverlap,
} from './dateUtils';

/**
 * Długość pojedynczego slotu w minutach
 */
export const SLOT_DURATION_MINUTES = 30;

/**
 * Domyślne godziny pracy (8:00 - 20:00)
 */
export const DEFAULT_START_HOUR = 8;
export const DEFAULT_END_HOUR = 20;

/**
 * Domyślna liczba godzin wyświetlanych w kalendarzu (6h)
 */
export const DEFAULT_VISIBLE_HOURS = 6;

/**
 * Generuje pojedynczy slot czasowy
 */
export const createTimeSlot = (
  startTime: Date,
  appointment?: Appointment
): TimeSlot => {
  const endTime = addMinutes(startTime, SLOT_DURATION_MINUTES);

  return {
    startTime,
    endTime,
    isAvailable: !appointment || appointment.status === 'available',
    appointment,
  };
};

/**
 * Generuje wszystkie sloty dla danego dnia i zakresu godzin
 *
 * @param date - Dzień
 * @param startHour - Godzina rozpoczęcia (np. 8)
 * @param endHour - Godzina zakończenia (np. 20)
 * @returns Tablica slotów czasowych
 */
export const generateDaySlots = (
  date: Date,
  startHour: number = DEFAULT_START_HOUR,
  endHour: number = DEFAULT_END_HOUR
): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  const dayStart = new Date(date);
  dayStart.setHours(startHour, 0, 0, 0);

  const dayEnd = new Date(date);
  dayEnd.setHours(endHour, 0, 0, 0);

  let currentTime = dayStart;

  while (isBefore(currentTime, dayEnd)) {
    slots.push(createTimeSlot(new Date(currentTime)));
    currentTime = addMinutes(currentTime, SLOT_DURATION_MINUTES);
  }

  return slots;
};

/**
 * Wypełnia sloty wizytami
 *
 * @param slots - Puste sloty
 * @param appointments - Wizyty do przypisania
 * @returns Sloty z przypisanymi wizytami
 */
export const fillSlotsWithAppointments = (
  slots: TimeSlot[],
  appointments: Appointment[]
): TimeSlot[] => {
  return slots.map((slot) => {
    const appointment = appointments.find((app) =>
      isEqual(app.startTime, slot.startTime)
    );

    if (appointment) {
      return {
        ...slot,
        isAvailable: appointment.status === 'available',
        appointment,
      };
    }

    return slot;
  });
};

/**
 * Generuje harmonogram dla dnia z uwzględnieniem wizyt i absencji
 */
export const generateDaySchedule = (
  date: Date,
  appointments: Appointment[],
  absences: Absence[],
  startHour: number = DEFAULT_START_HOUR,
  endHour: number = DEFAULT_END_HOUR
): DaySchedule => {
  // Sprawdź czy dzień jest dniem absencji
  const isAbsence = absences.some((absence) =>
    isDateInRange(date, absence.startDate, absence.endDate)
  );

  // Generuj sloty
  let slots = generateDaySlots(date, startHour, endHour);

  // Wypełnij wizytami
  const dayAppointments = appointments.filter((app) => isSameDay(app.startTime, date));
  slots = fillSlotsWithAppointments(slots, dayAppointments);

  // Policz potwierdzone wizyty
  const appointmentCount = dayAppointments.filter(
    (app) => app.status === 'confirmed' || app.status === 'reserved'
  ).length;

  return {
    date,
    slots,
    appointmentCount,
    isAbsence,
  };
};

/**
 * Generuje harmonogram tygodniowy
 *
 * @param weekStart - Pierwszy dzień tygodnia (poniedziałek)
 * @param appointments - Wizyty w tym tygodniu
 * @param absences - Absencje lekarza
 * @returns Pełny harmonogram tygodniowy
 */
export const generateWeekSchedule = (
  weekStart: Date,
  appointments: Appointment[],
  absences: Absence[] = []
): WeekSchedule => {
  const days = getWeekDays(weekStart);

  const daySchedules = days.map((day) =>
    generateDaySchedule(day, appointments, absences)
  );

  const weekEnd = days[days.length - 1];

  return {
    weekStart,
    weekEnd,
    days: daySchedules,
  };
};

/**
 * Sprawdza czy slot jest dostępny (nie ma wizyty lub jest w statusie 'available')
 */
export const isSlotAvailable = (slot: TimeSlot): boolean => {
  return slot.isAvailable && (!slot.appointment || slot.appointment.status === 'available');
};

/**
 * Sprawdza czy seria slotów jest dostępna (do rezerwacji wizyty dłuższej niż 30min)
 *
 * @param slots - Wszystkie sloty dnia
 * @param startSlotIndex - Indeks pierwszego slotu
 * @param slotsNeeded - Liczba potrzebnych slotów
 * @returns true jeśli wszystkie sloty są wolne i są obok siebie
 */
export const areConsecutiveSlotsAvailable = (
  slots: TimeSlot[],
  startSlotIndex: number,
  slotsNeeded: number
): boolean => {
  // Sprawdź czy nie wykracza poza zakres
  if (startSlotIndex + slotsNeeded > slots.length) {
    return false;
  }

  // Sprawdź czy wszystkie sloty są dostępne
  for (let i = 0; i < slotsNeeded; i++) {
    if (!isSlotAvailable(slots[startSlotIndex + i])) {
      return false;
    }
  }

  // Sprawdź czy sloty są obok siebie (ciągłe)
  for (let i = 0; i < slotsNeeded - 1; i++) {
    const currentSlot = slots[startSlotIndex + i];
    const nextSlot = slots[startSlotIndex + i + 1];

    if (!isEqual(currentSlot.endTime, nextSlot.startTime)) {
      return false;
    }
  }

  return true;
};

/**
 * Konwertuje długość wizyty (minuty) na liczbę slotów
 */
export const minutesToSlots = (minutes: number): number => {
  return Math.ceil(minutes / SLOT_DURATION_MINUTES);
};

/**
 * Konwertuje liczbę slotów na minuty
 */
export const slotsToMinutes = (slots: number): number => {
  return slots * SLOT_DURATION_MINUTES;
};

/**
 * Sprawdza czy dzień pasuje do maski dni dostępności
 */
export const isDayInAvailabilityMask = (date: Date, daysOfWeek: DayOfWeek[]): boolean => {
  const dayOfWeek = getDayOfWeek(date) as DayOfWeek;
  return daysOfWeek.includes(dayOfWeek);
};

/**
 * Sprawdza czy slot mieści się w zakresie czasowym dostępności
 */
export const isSlotInTimeRange = (slotStart: Date, timeRange: TimeRange): boolean => {
  const rangeStart = parseTimeString(timeRange.startTime, slotStart);
  const rangeEnd = parseTimeString(timeRange.endTime, slotStart);

  return (
    (isAfter(slotStart, rangeStart) || isEqual(slotStart, rangeStart)) &&
    isBefore(slotStart, rangeEnd)
  );
};

/**
 * Sprawdza czy slot jest w czasie dostępności lekarza
 */
export const isSlotInAvailability = (
  slotStart: Date,
  availabilities: Availability[]
): boolean => {
  return availabilities.some((availability) => {
    if (!availability.isActive) return false;

    // Dostępność cykliczna
    if (availability.type === 'recurring') {
      // Sprawdź zakres dat
      if (
        availability.startDate &&
        availability.endDate &&
        !isDateInRange(slotStart, availability.startDate, availability.endDate)
      ) {
        return false;
      }

      // Sprawdź dzień tygodnia
      if (
        availability.daysOfWeek &&
        !isDayInAvailabilityMask(slotStart, availability.daysOfWeek)
      ) {
        return false;
      }

      // Sprawdź zakresy czasowe
      if (availability.timeRanges) {
        return availability.timeRanges.some((range) => isSlotInTimeRange(slotStart, range));
      }
    }

    // Dostępność jednorazowa
    if (availability.type === 'one-time') {
      // Sprawdź czy to ten dzień
      if (!availability.specificDate || !isSameDay(slotStart, availability.specificDate)) {
        return false;
      }

      // Sprawdź zakresy czasowe
      if (availability.specificTimeRanges) {
        return availability.specificTimeRanges.some((range) =>
          isSlotInTimeRange(slotStart, range)
        );
      }
    }

    return false;
  });
};

/**
 * Oznacza sloty jako niedostępne jeśli są poza godzinami pracy lekarza
 */
export const markUnavailableSlots = (
  daySchedule: DaySchedule,
  availabilities: Availability[]
): DaySchedule => {
  const updatedSlots = daySchedule.slots.map((slot) => {
    // Jeśli slot już ma wizytę, nie zmieniaj
    if (slot.appointment) {
      return slot;
    }

    // Sprawdź czy slot jest w dostępności
    const inAvailability = isSlotInAvailability(slot.startTime, availabilities);

    return {
      ...slot,
      isAvailable: inAvailability,
    };
  });

  return {
    ...daySchedule,
    slots: updatedSlots,
  };
};

/**
 * Znajduje konflikty między absencją a zarezerwowanymi wizytami
 */
export const findAbsenceConflicts = (
  absence: Absence,
  appointments: Appointment[]
): Appointment[] => {
  const absenceStart = getStartOfDay(absence.startDate);
  const absenceEnd = getEndOfDay(absence.endDate);

  return appointments.filter((app) => {
    // Tylko potwierdzone i zarezerwowane wizyty
    if (app.status !== 'confirmed' && app.status !== 'reserved') {
      return false;
    }

    // Sprawdź czy wizyta nachodzi na absencję
    return doDateRangesOverlap(
      absenceStart,
      absenceEnd,
      getStartOfDay(app.startTime),
      getEndOfDay(app.endTime)
    );
  });
};

/**
 * Pobiera aktualny slot (w którym jesteśmy teraz)
 */
export const getCurrentTimeSlot = (slots: TimeSlot[]): TimeSlot | undefined => {
  const now = new Date();
  return slots.find(
    (slot) =>
      (isAfter(now, slot.startTime) || isEqual(now, slot.startTime)) &&
      isBefore(now, slot.endTime)
  );
};

/**
 * Pobiera indeks aktualnego slotu
 */
export const getCurrentSlotIndex = (slots: TimeSlot[]): number => {
  const currentSlot = getCurrentTimeSlot(slots);
  if (!currentSlot) return -1;
  return slots.findIndex((slot) => isEqual(slot.startTime, currentSlot.startTime));
};
