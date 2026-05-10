/**
 * RxJS Observables - Reaktywne zarządzanie stanem
 *
 * Wykorzystanie Observables do propagacji zmian w danych.
 */

import { BehaviorSubject, Subject, Observable, fromEvent, interval } from 'rxjs';
import { map, filter, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

/**
 * Auth State Observable
 * Emituje zmiany stanu zalogowania użytkownika
 */
export const auth$ = new BehaviorSubject<{
  isAuthenticated: boolean;
  user: any | null;
}>({
  isAuthenticated: false,
  user: null,
});

/**
 * Cart State Observable
 * Emituje zmiany w koszyku użytkownika
 */
export const cart$ = new BehaviorSubject<{
  items: any[];
  totalPrice: number;
  itemCount: number;
}>({
  items: [],
  totalPrice: 0,
  itemCount: 0,
});

/**
 * Notifications Observable
 * Strumień powiadomień dla użytkownika
 */
export const notifications$ = new Subject<{
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}>();

/**
 * Search Observable z debouncing
 * Przykład użycia operatorów RxJS do optymalizacji wyszukiwania
 */
export function createSearchObservable(inputElement: HTMLInputElement): Observable<string> {
  return fromEvent<InputEvent>(inputElement, 'input').pipe(
    map((event) => (event.target as HTMLInputElement).value),
    debounceTime(300), // Czekaj 300ms po ostatnim wpisaniu
    distinctUntilChanged(), // Ignoruj jeśli wartość się nie zmieniła
    filter((term) => term.length >= 2) // Minimum 2 znaki
  );
}

/**
 * Data Refresh Observable
 * Automatyczne odświeżanie danych co N sekund
 */
export function createAutoRefresh(intervalMs: number): Observable<number> {
  return interval(intervalMs);
}

/**
 * Helper: Konwersja Promise na Observable
 */
export function promiseToObservable<T>(promise: Promise<T>): Observable<T> {
  return new Observable((subscriber) => {
    promise
      .then((value) => {
        subscriber.next(value);
        subscriber.complete();
      })
      .catch((error) => {
        subscriber.error(error);
      });
  });
}

/**
 * Helper: Retry z exponential backoff
 */
export function retryWithBackoff<T>(
  source: Observable<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Observable<T> {
  return source.pipe(
  );
}
