/**
 * Strona zarządzania dostępnością lekarza
 *
 * - Definiowanie dostępności (recurring/one-time)
 * - Dodawanie absencji
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/SimpleAuthContext';
import AvailabilityForm from '../components/appointments/AvailabilityForm';
import AbsenceForm from '../components/appointments/AbsenceForm';
import type {
  Availability,
  Absence,
  Appointment,
  CreateRecurringAvailabilityDTO,
  CreateOneTimeAvailabilityDTO,
  CreateAbsenceDTO,
} from '../models';
import { getDataService } from '../services/ServiceFactory';
import { formatDateShort, getPolishDayName } from '../utils/dateUtils';
import { findAbsenceConflicts } from '../utils/slotUtils';
import styles from './DoctorAvailabilityPage.module.css';

const DoctorAvailabilityPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [showAvailabilityForm, setShowAvailabilityForm] = useState(false);
  const [showAbsenceForm, setShowAbsenceForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Ładuj dane przy montowaniu
   */
  useEffect(() => {
    loadData();
  }, [currentUser]);

  /**
   * Załaduj dostępności i absencje
   */
  const loadData = async () => {
    if (!currentUser) return;

    try {
      setIsLoading(true);

      const [availData, absData] = await Promise.all([
        getDataService().getAvailabilitiesByDoctor(currentUser.id),
        getDataService().getAbsencesByDoctor(currentUser.id),
      ]);

      setAvailabilities(availData);
      setAbsences(absData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Obsługa dodania dostępności
   */
  const handleSubmitAvailability = async (
    data: CreateRecurringAvailabilityDTO | CreateOneTimeAvailabilityDTO
  ) => {
    if (!currentUser) return;

    try {
      let availabilityData: Omit<Availability, 'id' | 'createdAt' | 'updatedAt'>;

      if ('daysOfWeek' in data) {
        // Recurring availability
        availabilityData = {
          doctorId: currentUser.id,
          type: 'recurring',
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate),
          daysOfWeek: data.daysOfWeek,
          timeRanges: data.timeRanges,
          isActive: true,
        };
      } else {
        // One-time availability
        availabilityData = {
          doctorId: currentUser.id,
          type: 'one-time',
          specificDate: new Date(data.specificDate),
          specificTimeRanges: data.specificTimeRanges,
          isActive: true,
        };
      }

      await getDataService().createAvailability(availabilityData);

      // Odśwież dane
      await loadData();
      setShowAvailabilityForm(false);
    } catch (error) {
      console.error('Failed to create availability:', error);
      alert('Nie udało się dodać dostępności');
    }
  };

  /**
   * Sprawdza konflikty z wizytami i automatycznie je odwołuje
   */
  const handleSubmitAbsence = async (data: CreateAbsenceDTO) => {
    if (!currentUser) return;

    try {
      const absenceData = {
        doctorId: currentUser.id,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        reason: data.reason,
        notes: data.notes,
      };

      // 1. Pobierz wszystkie wizyty lekarza
      const allAppointments = await getDataService().getAppointments({
        doctorId: currentUser.id,
      });

      // 2. Sprawdź konflikty z absencją
      const conflicts = findAbsenceConflicts(absenceData, allAppointments);

      // 3. Jeśli są konflikty, poinformuj użytkownika
      if (conflicts.length > 0) {
        const confirmMessage =
          `UWAGA: Ta absencja koliduje z ${conflicts.length} zarezerwowanymi wizytami.\n\n` +
          `Wizyty zostaną automatycznie odwołane, a pacjenci powinni zostać powiadomieni.\n\n` +
          `Czy na pewno chcesz dodać tę absencję?`;

        if (!confirm(confirmMessage)) {
          return; // Użytkownik anulował
        }

        // 4. Odwołaj wszystkie kolidujące wizyty
        for (const appointment of conflicts) {
          await getDataService().updateAppointment(appointment.id, {
            ...appointment,
            status: 'cancelled',
            cancelReason: `Absencja lekarza: ${data.reason || 'Nieobecność'}`,
          });
        }

        alert(
          `Absencja została dodana.\n\n` +
          `Odwołano ${conflicts.length} wizyt.\n\n` +
          `UWAGA: Należy poinformować pacjentów o odwołaniu wizyt!`
        );
      }

      // 5. Utwórz absencję
      await getDataService().createAbsence(absenceData);

      // Odśwież dane
      await loadData();
      setShowAbsenceForm(false);
    } catch (error) {
      console.error('Failed to create absence:', error);
      alert('Nie udało się dodać absencji');
    }
  };

  /**
   * Usuń dostępność
   */
  const handleDeleteAvailability = async (id: string) => {
    if (!confirm('Czy na pewno chcesz usunąć tę dostępność?')) return;

    try {
      await getDataService().deleteAvailability(id);
      await loadData();
    } catch (error) {
      console.error('Failed to delete availability:', error);
      alert('Nie udało się usunąć dostępności');
    }
  };

  if (!currentUser || currentUser.role !== 'doctor') {
    return (
      <div className={styles.error}>
        <h2>Brak dostępu</h2>
        <p>Ta strona jest dostępna tylko dla lekarzy.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Ładowanie...</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Zarządzanie dostępnością</h1>
          <p className={styles.subtitle}>
            Dr {currentUser.firstName} {currentUser.lastName}
          </p>
        </div>
        <div className={styles['header-actions']}>
          <button onClick={() => setShowAvailabilityForm(true)} className={styles['button-primary']}>
            + Dodaj dostępność
          </button>
        </div>
      </div>

      {/* Lista dostępności */}
      <div className={styles.section}>
        <h2 className={styles['section-title']}>Moje dostępności</h2>

        {availabilities.length === 0 ? (
          <div className={styles.empty}>
            <p>Nie masz jeszcze zdefiniowanych dostępności.</p>
            <p>Kliknij "Dodaj dostępność", aby określić kiedy jesteś dostępny.</p>
          </div>
        ) : (
          <div className={styles.list}>
            {availabilities.map((availability) => (
              <div key={availability.id} className={styles.card}>
                <div className={styles['card-header']}>
                  <span className={styles.badge}>
                    {availability.type === 'recurring' ? 'Cykliczna' : 'Jednorazowa'}
                  </span>
                  {!availability.isActive && (
                    <span className={styles['badge-inactive']}>Nieaktywna</span>
                  )}
                </div>

                <div className={styles['card-body']}>
                  {availability.type === 'recurring' && (
                    <>
                      <p>
                        <strong>Okres:</strong>{' '}
                        {availability.startDate && formatDateShort(new Date(availability.startDate))} -{' '}
                        {availability.endDate && formatDateShort(new Date(availability.endDate))}
                      </p>
                      <p>
                        <strong>Dni tygodnia:</strong>{' '}
                        {availability.daysOfWeek?.map((day) => {
                          const date = new Date();
                          date.setDate(date.getDate() - date.getDay() + day);
                          return getPolishDayName(date, true);
                        }).join(', ')}
                      </p>
                    </>
                  )}

                  {availability.type === 'one-time' && (
                    <p>
                      <strong>Data:</strong>{' '}
                      {availability.specificDate ? formatDateShort(new Date(availability.specificDate)) : 'Brak daty'}
                    </p>
                  )}

                  <p>
                    <strong>Godziny:</strong>
                  </p>
                  <ul className={styles['time-ranges']}>
                    {(availability.type === 'recurring'
                      ? availability.timeRanges
                      : availability.specificTimeRanges
                    )?.map((range, idx) => (
                      <li key={idx}>
                        {range.startTime} - {range.endTime}
                      </li>
                    )) || <li>Brak godzin</li>}
                  </ul>
                </div>

                <div className={styles['card-footer']}>
                  <button
                    onClick={() => handleDeleteAvailability(availability.id)}
                    className={styles['button-delete']}
                  >
                    Usuń
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lista absencji (Zadanie 3) */}
      <div className={styles.section}>
        <div className={styles['section-header']}>
          <h2 className={styles['section-title']}>Absencje i urlopy</h2>
          <button onClick={() => setShowAbsenceForm(true)} className={styles['button-secondary']}>
            + Dodaj absencję
          </button>
        </div>

        {absences.length === 0 ? (
          <div className={styles.empty}>
            <p>Brak zaplanowanych absencji</p>
          </div>
        ) : (
          <div className={styles.list}>
            {absences.map((absence) => (
              <div key={absence.id} className={styles.card}>
                <div className={styles['card-header']}>
                  <span className={styles.badge}>{absence.reason || 'Absencja'}</span>
                </div>
                <div className={styles['card-body']}>
                  <p>
                    <strong>Okres:</strong>{' '}
                    {formatDateShort(new Date(absence.startDate))} - {formatDateShort(new Date(absence.endDate))}
                  </p>
                  {absence.notes && <p className={styles.notes}>{absence.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Formularz dostępności */}
      {showAvailabilityForm && (
        <div className={styles.modal}>
          <div className={styles['modal-content']}>
            <AvailabilityForm
              doctorId={currentUser.id}
              onSubmit={handleSubmitAvailability}
              onCancel={() => setShowAvailabilityForm(false)}
            />
          </div>
        </div>
      )}

      {/* Formularz absencji */}
      {showAbsenceForm && (
        <div className={styles.modal}>
          <div className={styles['modal-content']}>
            <AbsenceForm
              doctorId={currentUser.id}
              onSubmit={handleSubmitAbsence}
              onCancel={() => setShowAbsenceForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorAvailabilityPage;
