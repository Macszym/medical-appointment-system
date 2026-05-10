/**
 * Komponent WeekCalendar - Widok tygodniowy kalendarza lekarza
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  getWeekStart,
  getWeekDays,
  goToNextWeek,
  goToPreviousWeek,
  formatDatePolish,
  formatTime,
  getPolishDayName,
  isToday,
  isPast,
} from '../../utils/dateUtils';
import {
  generateWeekSchedule,
  markUnavailableSlots,
  DEFAULT_START_HOUR,
  DEFAULT_END_HOUR,
  getCurrentSlotIndex,
} from '../../utils/slotUtils';
import type { Appointment, Absence, Availability, WeekSchedule, TimeSlot } from '../../models';
import styles from './WeekCalendar.module.css';

interface WeekCalendarProps {
  doctorId: string;
  appointments: Appointment[];
  absences?: Absence[];
  availabilities?: Availability[];
  startHour?: number;
  endHour?: number;
  visibleHours?: number;
  onSlotClick?: (date: Date, slot: TimeSlot) => void;
  onAppointmentClick?: (appointment: Appointment) => void;
  currentUserId?: string;
  currentUserRole?: string;
}

const WeekCalendar: React.FC<WeekCalendarProps> = ({
  doctorId,
  appointments,
  absences = [],
  availabilities = [],
  startHour = DEFAULT_START_HOUR,
  endHour = DEFAULT_END_HOUR,
  visibleHours = 6,
  onSlotClick,
  onAppointmentClick,
  currentUserId,
  currentUserRole,
}) => {
  // Stan aktualnego tygodnia
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getWeekStart(new Date()));

  // Generuj harmonogram tygodniowy
  const weekSchedule: WeekSchedule = useMemo(() => {
    let schedule = generateWeekSchedule(currentWeekStart, appointments, absences);

    // Zastosuj reguły dostępności - oznacz sloty poza godzinami pracy lekarza jako niedostępne
    if (availabilities && availabilities.length > 0) {
      schedule.days = schedule.days.map((daySchedule) =>
        markUnavailableSlots(daySchedule, availabilities)
      );
    }

    // Oznacz wszystkie sloty jako niedostępne w dniach absencji (urlop)
    schedule.days = schedule.days.map((daySchedule) => {
      if (daySchedule.isAbsence) {
        return {
          ...daySchedule,
          slots: daySchedule.slots.map((slot) => ({
            ...slot,
            isAvailable: false, // Blokuj wszystkie sloty podczas absencji
          })),
        };
      }
      return daySchedule;
    });

    return schedule;
  }, [currentWeekStart, appointments, absences, availabilities]);

  // Godziny do wyświetlenia
  const hours = useMemo(() => {
    const result: string[] = [];
    for (let hour = startHour; hour < endHour; hour++) {
      result.push(`${hour.toString().padStart(2, '0')}:00`);
      result.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    return result;
  }, [startHour, endHour]);

  const handlePreviousWeek = () => {
    setCurrentWeekStart(goToPreviousWeek(currentWeekStart));
  };

  const handleNextWeek = () => {
    setCurrentWeekStart(goToNextWeek(currentWeekStart));
  };

  const handleToday = () => {
    setCurrentWeekStart(getWeekStart(new Date()));
  };

  const handleSlotClick = (date: Date, slot: TimeSlot) => {
    if (onSlotClick) {
      onSlotClick(date, slot);
    }
  };

  const handleAppointmentClick = (appointment: Appointment) => {
    if (onAppointmentClick) {
      onAppointmentClick(appointment);
    }
  };

  const getCurrentTimePosition = (): number | null => {
    const now = new Date();
    const todaySchedule = weekSchedule.days.find((day) => isToday(day.date));

    if (!todaySchedule) return null;

    const currentSlotIdx = getCurrentSlotIndex(todaySchedule.slots);
    if (currentSlotIdx === -1) return null;

    // Wysokość nagłówka (60px) + wysokość slotu (50px) * indeks
    return 60 + currentSlotIdx * 50;
  };

  const currentTimePosition = getCurrentTimePosition();

  // Oblicz wysokość siatki: każda godzina = 100px + nagłówek 60px
  const maxGridHeight = visibleHours * 100 + 60;

  return (
    <div className={styles['calendar-container']}>
      {/* NAGŁÓWEK KALENDARZA */}
      <div className={styles['calendar-header']}>
        <h2 className={styles['header-title']}>
          {formatDatePolish(weekSchedule.weekStart)} - {formatDatePolish(weekSchedule.weekEnd)}
        </h2>

        <div className={styles['navigation-buttons']}>
          <button
            className={styles['nav-button']}
            onClick={handlePreviousWeek}
            title="Poprzedni tydzień"
          >
            ← Poprzedni
          </button>
          <button
            className={`${styles['nav-button']} ${styles['today-button']}`}
            onClick={handleToday}
            title="Idź do dzisiaj"
          >
            Dzisiaj
          </button>
          <button
            className={styles['nav-button']}
            onClick={handleNextWeek}
            title="Następny tydzień"
          >
            Następny →
          </button>
        </div>
      </div>

      {/* Informacja o scrollowaniu */}
      <div style={{
        padding: '8px 16px',
        background: '#e8f4fd',
        borderBottom: '1px solid #b3d7f2',
        fontSize: '13px',
        color: '#0d47a1'
      }}>
        Widok pokazuje {visibleHours}h. Przewiń w dół aby zobaczyć więcej godzin.
      </div>

      {/* SIATKA KALENDARZA - z ograniczoną wysokością */}
      <div
        className={styles['calendar-grid']}
        style={{ maxHeight: `${maxGridHeight}px` }}
      >
        {/* Kolumna z godzinami (lewa) */}
        <div className={styles['time-column']}>
          <div className={styles['time-header']}>Czas</div>
          {hours.map((hour) => (
            <div key={hour} className={styles['time-slot']}>
              {hour}
            </div>
          ))}
        </div>

        {/* Kolumny dla każdego dnia tygodnia */}
        {weekSchedule.days.map((daySchedule) => {
          const isDayToday = isToday(daySchedule.date);
          const isDayAbsence = daySchedule.isAbsence;

          return (
            <div
              key={daySchedule.date.toISOString()}
              className={`${styles['day-column']} ${
                isDayToday ? styles.today : ''
              } ${isDayAbsence ? styles.absence : ''}`}
            >
              {/* Nagłówek dnia */}
              <div className={styles['day-header']}>
                <div className={styles['day-name']}>
                  {getPolishDayName(daySchedule.date, true)}
                </div>
                <div className={styles['day-date']}>
                  {daySchedule.date.getDate()}
                </div>
                {daySchedule.appointmentCount > 0 && (
                  <div className={styles['day-appointments-count']}>
                    {daySchedule.appointmentCount} wizyt
                  </div>
                )}
              </div>

              {/* Sloty czasowe */}
              <div className={styles['day-slots']}>
                {daySchedule.slots.map((slot) => {
                  const hasAppointment = slot.appointment && slot.appointment.status !== 'available';
                  const isSlotPast = isPast(slot.endTime);

                  // Wyciągnięcie ID (może być string lub obiekt po populate)
                  const getIdFromField = (field: any): string | undefined => {
                    if (!field) return undefined;
                    if (typeof field === 'string') return field;
                    if (typeof field === 'object') return field._id || field.id;
                    return undefined;
                  };

                  // Sprawdź czy użytkownik ma dostęp do szczegółów wizyty
                  const appointmentDoctorId = getIdFromField(slot.appointment?.doctorId);
                  const appointmentPatientId = getIdFromField(slot.appointment?.patientId);

                  const isDoctor = currentUserRole === 'doctor' && appointmentDoctorId === currentUserId;
                  const isPatient = currentUserRole === 'patient' && appointmentPatientId === currentUserId;
                  const canViewDetails = isDoctor || isPatient;
                  const isOccupiedByOther = hasAppointment && !canViewDetails;

                  return (
                    <div
                      key={slot.startTime.toISOString()}
                      className={`${styles['slot-cell']} ${
                        !slot.isAvailable || isSlotPast || isOccupiedByOther ? styles.unavailable : ''
                      }`}
                      onClick={() => handleSlotClick(daySchedule.date, slot)}
                      title={
                        hasAppointment
                          ? canViewDetails
                            ? `${slot.appointment?.type} - ${slot.appointment?.patientFirstName} ${slot.appointment?.patientLastName}`
                            : 'Zajęte przez innego pacjenta'
                          : `Wolny slot: ${formatTime(slot.startTime)}`
                      }
                    >
                      {hasAppointment && slot.appointment && (
                        <div
                          className={`${styles['appointment-block']} ${
                            styles[slot.appointment.type || 'consultation']
                          } ${isSlotPast ? styles.past : ''} ${
                            slot.appointment.status === 'cancelled' ? styles.cancelled : ''
                          } ${isOccupiedByOther ? styles.occupied : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (canViewDetails) {
                              handleAppointmentClick(slot.appointment!);
                            }
                          }}
                        >
                          <div className={styles['appointment-time']}>
                            {formatTime(slot.startTime)}
                          </div>
                          <div className={styles['appointment-patient']}>
                            {canViewDetails
                              ? `${slot.appointment.patientFirstName} ${slot.appointment.patientLastName}`
                              : 'Zajęte'}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Znacznik aktualnego czasu */}
        {currentTimePosition !== null && (
          <div
            className={styles['current-time-indicator']}
            style={{ top: `${currentTimePosition}px` }}
          />
        )}
      </div>
    </div>
  );
};

export default WeekCalendar;
