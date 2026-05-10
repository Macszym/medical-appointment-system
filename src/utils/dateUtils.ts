/**
 * Utility functions do operacji na datach
 *
 * Używamy biblioteki date-fns dla bezpiecznych operacji na datach
 */

import {
  startOfWeek,
  endOfWeek,
  addDays,
  addWeeks,
  subWeeks,
  format,
  parse,
  isWithinInterval,
  isSameDay,
  set,
  getDay,
  differenceInMinutes,
  addMinutes,
  startOfDay,
  endOfDay,
} from 'date-fns';
import { pl } from 'date-fns/locale';

// Re-export isSameDay for use in other utility modules
export { isSameDay };

/**
 * Pobiera pierwszy dzień tygodnia (poniedziałek) dla danej daty
 */
export const getWeekStart = (date: Date): Date => {
  return startOfWeek(date, { weekStartsOn: 1 }); // 1 = Poniedziałek
};

/**
 * Pobiera ostatni dzień tygodnia (niedziela) dla danej daty
 */
export const getWeekEnd = (date: Date): Date => {
  return endOfWeek(date, { weekStartsOn: 1 });
};

/**
 * Generuje tablicę 7 dni dla danego tygodnia
 */
export const getWeekDays = (weekStart: Date): Date[] => {
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    days.push(addDays(weekStart, i));
  }
  return days;
};

/**
 * Przechodzi do następnego tygodnia
 */
export const goToNextWeek = (currentWeekStart: Date): Date => {
  return addWeeks(currentWeekStart, 1);
};

/**
 * Przechodzi do poprzedniego tygodnia
 */
export const goToPreviousWeek = (currentWeekStart: Date): Date => {
  return subWeeks(currentWeekStart, 1);
};

/**
 * Formatuje datę do polskiego formatu (np. "Poniedziałek, 27 stycznia 2025")
 */
export const formatDatePolish = (date: Date): string => {
  return format(date, 'EEEE, d MMMM yyyy', { locale: pl });
};

/**
 * Formatuje datę do krótkiego formatu (np. "27.01.2025")
 */
export const formatDateShort = (date: Date): string => {
  return format(date, 'dd.MM.yyyy');
};

/**
 * Formatuje godzinę (np. "09:30")
 */
export const formatTime = (date: Date): string => {
  return format(date, 'HH:mm');
};

/**
 * Formatuje datę i godzinę (np. "27.01.2025 09:30")
 */
export const formatDateTime = (date: Date): string => {
  return format(date, 'dd.MM.yyyy HH:mm');
};

/**
 * Parsuje string czasu (HH:mm) na obiekt Date dla danego dnia
 */
export const parseTimeString = (timeString: string, baseDate: Date): Date => {
  const [hours, minutes] = timeString.split(':').map(Number);
  return set(baseDate, { hours, minutes, seconds: 0, milliseconds: 0 });
};

/**
 * Sprawdza czy data jest dzisiaj
 */
export const isToday = (date: Date): boolean => {
  return isSameDay(date, new Date());
};

/**
 * Sprawdza czy data jest w przeszłości
 */
export const isPast = (date: Date): boolean => {
  return date < new Date();
};

/**
 * Sprawdza czy data jest w przyszłości
 */
export const isFuture = (date: Date): boolean => {
  return date > new Date();
};

/**
 * Sprawdza czy data jest w danym przedziale
 */
export const isDateInRange = (date: Date, start: Date, end: Date): boolean => {
  return isWithinInterval(date, { start, end });
};

/**
 * Pobiera dzień tygodnia (0 = Niedziela, 6 = Sobota)
 */
export const getDayOfWeek = (date: Date): number => {
  return getDay(date);
};

/**
 * Konwertuje ISO date string na Date object
 */
export const parseISODate = (isoString: string): Date => {
  return new Date(isoString);
};

/**
 * Konwertuje Date object na ISO string
 */
export const toISOString = (date: Date): string => {
  return date.toISOString();
};

/**
 * Oblicza różnicę w minutach między dwiema datami
 */
export const getMinutesDifference = (start: Date, end: Date): number => {
  return differenceInMinutes(end, start);
};

/**
 * Dodaje minuty do daty
 */
export const addMinutesToDate = (date: Date, minutes: number): Date => {
  return addMinutes(date, minutes);
};

/**
 * Początek dnia (00:00:00)
 */
export const getStartOfDay = (date: Date): Date => {
  return startOfDay(date);
};

/**
 * Koniec dnia (23:59:59)
 */
export const getEndOfDay = (date: Date): Date => {
  return endOfDay(date);
};

/**
 * Nazwy dni tygodnia po polsku
 */
export const POLISH_DAYS = [
  'Niedziela',
  'Poniedziałek',
  'Wtorek',
  'Środa',
  'Czwartek',
  'Piątek',
  'Sobota',
];

/**
 * Skrócone nazwy dni tygodnia po polsku
 */
export const POLISH_DAYS_SHORT = ['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So'];

/**
 * Pobiera polską nazwę dnia tygodnia
 */
export const getPolishDayName = (date: Date, short: boolean = false): string => {
  const dayIndex = getDayOfWeek(date);
  return short ? POLISH_DAYS_SHORT[dayIndex] : POLISH_DAYS[dayIndex];
};

/**
 * Sprawdza czy dwie daty reprezentują ten sam slot czasowy
 */
export const isSameTimeSlot = (date1: Date, date2: Date): boolean => {
  return date1.getTime() === date2.getTime();
};

/**
 * Sprawdza czy dwie daty nakładają się
 */
export const doDateRangesOverlap = (
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date
): boolean => {
  return start1 < end2 && start2 < end1;
};
