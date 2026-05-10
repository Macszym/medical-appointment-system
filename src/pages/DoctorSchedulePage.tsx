/**
 * Strona harmonogramu lekarza
 *
 * Główna strona dla lekarza - wyświetla kalendarz tygodniowy
 * z możliwością zarządzania wizytami
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/SimpleAuthContext';
import WeekCalendar from '../components/calendar/WeekCalendar';
import AppointmentDetailsModal from '../components/calendar/AppointmentDetailsModal';
import type { Appointment, Absence, TimeSlot } from '../models';
import { getDataService } from '../services/ServiceFactory';
import styles from './DoctorSchedulePage.module.css';

const DoctorSchedulePage: React.FC = () => {
  const { currentUser } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Ładuj dane przy montowaniu
   */
  useEffect(() => {
    loadData();
  }, [currentUser]);

  /**
   * Ładuj wizyty i absencje lekarza
   */
  const loadData = async () => {
    if (!currentUser) return;

    try {
      setIsLoading(true);

      // Pobierz wizyty lekarza z ostatnich 30 dni i następnych 90 dni
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 90);

      const [appointmentsData, absencesData] = await Promise.all([
        getDataService().getAppointments({
          doctorId: currentUser.id,
          startDate,
          endDate,
        }),
        getDataService().getAbsencesByDoctor(currentUser.id),
      ]);

      setAppointments(appointmentsData);
      setAbsences(absencesData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Obsługa kliknięcia w slot
   */
  const handleSlotClick = (date: Date, slot: TimeSlot) => {
    // Jeśli slot ma wizytę, otwórz szczegóły
    if (slot.appointment && slot.appointment.status !== 'available') {
      setSelectedAppointment(slot.appointment);
    } else {
      // TODO: Otwórz formularz tworzenia nowej wizyty
      console.log('Wolny slot kliknięty:', date, slot);
    }
  };

  /**
   * Obsługa kliknięcia w wizytę
   */
  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
  };

  /**
   * Anuluj wizytę
   */
  const handleCancelAppointment = async (appointment: Appointment) => {
    try {
      await getDataService().updateAppointment(appointment.id, {
        status: 'cancelled',
        cancelReason: 'Anulowane przez lekarza',
        cancelledAt: new Date(),
      });

      // Odśwież dane
      await loadData();
    } catch (error) {
      console.error('Failed to cancel appointment:', error);
      alert('Nie udało się anulować wizyty');
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
        <p>Ładowanie harmonogramu...</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            Harmonogram: Dr {currentUser.firstName} {currentUser.lastName}
          </h1>
          <p className={styles.subtitle}>
            {currentUser.specialization || 'Lekarz'}
          </p>
        </div>
        <div className={styles.stats}>
          <div className={styles.stat}>
            <div className={styles['stat-value']}>{appointments.length}</div>
            <div className={styles['stat-label']}>Wizyt łącznie</div>
          </div>
          <div className={styles.stat}>
            <div className={styles['stat-value']}>
              {appointments.filter((a) => a.status === 'confirmed').length}
            </div>
            <div className={styles['stat-label']}>Potwierdzonych</div>
          </div>
          <div className={styles.stat}>
            <div className={styles['stat-value']}>
              {absences.length}
            </div>
            <div className={styles['stat-label']}>Absencji</div>
          </div>
        </div>
      </div>

      {/* Kalendarz */}
      <div className={styles.calendar}>
        <WeekCalendar
          doctorId={currentUser.id}
          appointments={appointments}
          absences={absences}
          onSlotClick={handleSlotClick}
          onAppointmentClick={handleAppointmentClick}
          currentUserId={currentUser.id}
          currentUserRole={currentUser.role}
        />
      </div>

      {/* Modal ze szczegółami wizyty */}
      {selectedAppointment && (
        <AppointmentDetailsModal
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
          onCancel={handleCancelAppointment}
          showPatientDetails={true}
        />
      )}
    </div>
  );
};

export default DoctorSchedulePage;
