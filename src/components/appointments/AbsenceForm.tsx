/**
 * Formularz dodawania absencji lekarza
 *
 *
 * Funkcjonalności:
 * - Określenie zakresu dat (od-do)
 * - Powód absencji (urlop, konferencja, choroba, inne)
 * - Opcjonalne notatki
 * - Walidacja dat (data końcowa >= data początkowa)
 */

import React, { useState } from 'react';
import type { CreateAbsenceDTO } from '../../models';
import styles from './AbsenceForm.module.css';

/**
 * Props komponentu
 */
interface AbsenceFormProps {
  doctorId: string;
  onSubmit: (data: CreateAbsenceDTO) => Promise<void>;
  onCancel: () => void;
}

/**
 * Komponent AbsenceForm
 */
const AbsenceForm: React.FC<AbsenceFormProps> = ({ doctorId, onSubmit, onCancel }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('Urlop');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Walidacja formularza
   */
  const validate = (): string | null => {
    if (!startDate) {
      return 'Podaj datę rozpoczęcia absencji';
    }

    if (!endDate) {
      return 'Podaj datę zakończenia absencji';
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) {
      return 'Data zakończenia musi być późniejsza lub równa dacie rozpoczęcia';
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

      const data: CreateAbsenceDTO = {
        doctorId,
        startDate,
        endDate,
        reason: reason || undefined,
        notes: notes || undefined,
      };

      await onSubmit(data);

      // Reset formularza
      setStartDate('');
      setEndDate('');
      setReason('Urlop');
      setNotes('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystąpił błąd');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h2 className={styles.title}>Dodaj absencję</h2>

      {error && <div className={styles.error}>{error}</div>}

      {/* Przedział dat */}
      <div className={styles['form-row']}>
        <div className={styles['form-group']}>
          <label className={styles.label} htmlFor="startDate">
            Data rozpoczęcia <span className={styles.required}>*</span>
          </label>
          <input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className={styles.input}
            required
          />
        </div>

        <div className={styles['form-group']}>
          <label className={styles.label} htmlFor="endDate">
            Data zakończenia <span className={styles.required}>*</span>
          </label>
          <input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className={styles.input}
            required
          />
        </div>
      </div>

      {/* Powód */}
      <div className={styles['form-group']}>
        <label className={styles.label} htmlFor="reason">
          Powód absencji
        </label>
        <select
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className={styles.select}
        >
          <option value="Urlop">Urlop</option>
          <option value="Konferencja">Konferencja / Szkolenie</option>
          <option value="Choroba">Choroba</option>
          <option value="Urlop okolicznościowy">Urlop okolicznościowy</option>
          <option value="Inne">Inne</option>
        </select>
      </div>

      {/* Notatki */}
      <div className={styles['form-group']}>
        <label className={styles.label} htmlFor="notes">
          Notatki (opcjonalnie)
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className={styles.textarea}
          rows={3}
          placeholder="Dodatkowe informacje..."
        />
      </div>

      {/* Przyciski */}
      <div className={styles.actions}>
        <button
          type="button"
          onClick={onCancel}
          className={styles['button-secondary']}
          disabled={isSubmitting}
        >
          Anuluj
        </button>
        <button type="submit" className={styles['button-primary']} disabled={isSubmitting}>
          {isSubmitting ? 'Zapisywanie...' : 'Zapisz absencję'}
        </button>
      </div>
    </form>
  );
};

export default AbsenceForm;
