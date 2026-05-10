/**
 * Formularz definiowania dostępności lekarza
 *
 *
 * Funkcjonalności:
 * - Dostępność cykliczna: przedział czasowy, maska dni, zakresy godzin
 *   Przykład: od 1.02.2025 do 12.03.2025, poniedziałki/wtorki/czwartki, 8-12:30 i 16-21:30
 * - Dostępność jednorazowa: konkretny dzień, zakresy godzin
 *   Przykład: 15.02.2025, 10-14:00
 * - Walidacja formularza
 * - Dodawanie wielu zakresów czasowych
 */

import React, { useState } from 'react';
import type {
  CreateRecurringAvailabilityDTO,
  CreateOneTimeAvailabilityDTO,
  TimeRange,
  DayOfWeek,
} from '../../models';
import styles from './AvailabilityForm.module.css';

/**
 * Nazwy dni tygodnia
 */
const DAYS_OF_WEEK: { value: DayOfWeek; label: string }[] = [
  { value: 1, label: 'Poniedziałek' },
  { value: 2, label: 'Wtorek' },
  { value: 3, label: 'Środa' },
  { value: 4, label: 'Czwartek' },
  { value: 5, label: 'Piątek' },
  { value: 6, label: 'Sobota' },
  { value: 0, label: 'Niedziela' },
];

/**
 * Props komponentu
 */
interface AvailabilityFormProps {
  doctorId: string;
  onSubmit: (
    data: CreateRecurringAvailabilityDTO | CreateOneTimeAvailabilityDTO
  ) => Promise<void>;
  onCancel: () => void;
}

/**
 * Komponent AvailabilityForm
 */
const AvailabilityForm: React.FC<AvailabilityFormProps> = ({
  doctorId,
  onSubmit,
  onCancel,
}) => {
  // Stan formularza
  const [availabilityType, setAvailabilityType] = useState<'recurring' | 'one-time'>('recurring');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dostępność cykliczna
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([]);

  // Dostępność jednorazowa
  const [specificDate, setSpecificDate] = useState('');

  // Zakresy czasowe
  const [timeRanges, setTimeRanges] = useState<TimeRange[]>([
    { startTime: '08:00', endTime: '12:00' },
  ]);

  /**
   * Dodaj nowy zakres czasowy
   */
  const addTimeRange = () => {
    setTimeRanges([...timeRanges, { startTime: '08:00', endTime: '12:00' }]);
  };

  /**
   * Usuń zakres czasowy
   */
  const removeTimeRange = (index: number) => {
    setTimeRanges(timeRanges.filter((_, i) => i !== index));
  };

  /**
   * Aktualizuj zakres czasowy
   */
  const updateTimeRange = (index: number, field: keyof TimeRange, value: string) => {
    const updated = [...timeRanges];
    updated[index] = { ...updated[index], [field]: value };
    setTimeRanges(updated);
  };

  /**
   * Toggle dzień tygodnia
   */
  const toggleDay = (day: DayOfWeek) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  /**
   * Walidacja formularza
   */
  const validate = (): string | null => {
    // Sprawdź zakresy czasowe
    if (timeRanges.length === 0) {
      return 'Dodaj przynajmniej jeden zakres czasowy';
    }

    for (const range of timeRanges) {
      if (!range.startTime || !range.endTime) {
        return 'Wypełnij wszystkie zakresy czasowe';
      }
      if (range.startTime >= range.endTime) {
        return 'Godzina rozpoczęcia musi być wcześniej niż zakończenia';
      }
    }

    if (availabilityType === 'recurring') {
      if (!startDate || !endDate) {
        return 'Wypełnij daty początku i końca';
      }
      if (startDate >= endDate) {
        return 'Data rozpoczęcia musi być wcześniej niż zakończenia';
      }
      if (selectedDays.length === 0) {
        return 'Wybierz przynajmniej jeden dzień tygodnia';
      }
    } else {
      if (!specificDate) {
        return 'Wybierz datę';
      }
    }

    return null;
  };

  /**
   * Obsługa wysłania formularza
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setIsSubmitting(true);

      if (availabilityType === 'recurring') {
        const data: CreateRecurringAvailabilityDTO = {
          doctorId,
          startDate,
          endDate,
          daysOfWeek: selectedDays,
          timeRanges,
        };
        await onSubmit(data);
      } else {
        const data: CreateOneTimeAvailabilityDTO = {
          doctorId,
          specificDate,
          specificTimeRanges: timeRanges,
        };
        await onSubmit(data);
      }

      // Reset formularza
      setStartDate('');
      setEndDate('');
      setSpecificDate('');
      setSelectedDays([]);
      setTimeRanges([{ startTime: '08:00', endTime: '12:00' }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystąpił błąd');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h2 className={styles.title}>Zdefiniuj dostępność</h2>

      {/* Wybór typu dostępności */}
      <div className={styles['form-group']}>
        <label className={styles.label}>Typ dostępności</label>
        <div className={styles.tabs}>
          <button
            type="button"
            className={`${styles.tab} ${availabilityType === 'recurring' ? styles.active : ''}`}
            onClick={() => setAvailabilityType('recurring')}
          >
            Cykliczna
          </button>
          <button
            type="button"
            className={`${styles.tab} ${availabilityType === 'one-time' ? styles.active : ''}`}
            onClick={() => setAvailabilityType('one-time')}
          >
            Jednorazowa
          </button>
        </div>
      </div>

      {/* Formularz cykliczny */}
      {availabilityType === 'recurring' && (
        <>
          {/* Przedział dat */}
          <div className={styles.row}>
            <div className={styles['form-group']}>
              <label className={styles.label}>Data rozpoczęcia</label>
              <input
                type="date"
                className={styles.input}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className={styles['form-group']}>
              <label className={styles.label}>Data zakończenia</label>
              <input
                type="date"
                className={styles.input}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Maska dni tygodnia */}
          <div className={styles['form-group']}>
            <label className={styles.label}>Dni konsultacji</label>
            <div className={styles['day-picker']}>
              {DAYS_OF_WEEK.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  className={`${styles['day-button']} ${
                    selectedDays.includes(day.value) ? styles.selected : ''
                  }`}
                  onClick={() => toggleDay(day.value)}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Formularz jednorazowy */}
      {availabilityType === 'one-time' && (
        <div className={styles['form-group']}>
          <label className={styles.label}>Data</label>
          <input
            type="date"
            className={styles.input}
            value={specificDate}
            onChange={(e) => setSpecificDate(e.target.value)}
            required
          />
        </div>
      )}

      {/* Zakresy czasowe */}
      <div className={styles['form-group']}>
        <div className={styles['label-with-button']}>
          <label className={styles.label}>Godziny konsultacji</label>
          <button
            type="button"
            className={styles['add-button']}
            onClick={addTimeRange}
          >
            + Dodaj zakres
          </button>
        </div>

        <div className={styles['time-ranges']}>
          {timeRanges.map((range, index) => (
            <div key={index} className={styles['time-range']}>
              <input
                type="time"
                className={styles['time-input']}
                value={range.startTime}
                onChange={(e) => updateTimeRange(index, 'startTime', e.target.value)}
                required
              />
              <span className={styles.separator}>—</span>
              <input
                type="time"
                className={styles['time-input']}
                value={range.endTime}
                onChange={(e) => updateTimeRange(index, 'endTime', e.target.value)}
                required
              />
              {timeRanges.length > 1 && (
                <button
                  type="button"
                  className={styles['remove-button']}
                  onClick={() => removeTimeRange(index)}
                  title="Usuń zakres"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Błąd */}
      {error && <div className={styles.error}>{error}</div>}

      {/* Przyciski akcji */}
      <div className={styles.actions}>
        <button
          type="button"
          className={`${styles.button} ${styles['button-secondary']}`}
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Anuluj
        </button>
        <button
          type="submit"
          className={`${styles.button} ${styles['button-primary']}`}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Zapisywanie...' : 'Zapisz dostępność'}
        </button>
      </div>
    </form>
  );
};

export default AvailabilityForm;
