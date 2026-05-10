/**
 * Modal ze szczegółami wizyty
 *
 * Wyświetlany po kliknięciu w wizytę w kalendarzu.
 * Pokazuje pełne informacje o wizycie, pacjencie i ewentualne załączniki.
 */

import React from 'react';
import { formatDateTime, formatTime } from '../../utils/dateUtils';
import type { Appointment, AppointmentType } from '../../models';
import styles from './AppointmentDetailsModal.module.css';

/**
 * Mapowanie typów wizyt na polskie nazwy
 */
const APPOINTMENT_TYPE_LABELS: Record<AppointmentType, string> = {
  first_visit: 'Pierwsza wizyta',
  follow_up: 'Wizyta kontrolna',
  chronic_disease: 'Choroba przewlekła',
  prescription: 'Recepta',
  consultation: 'Konsultacja',
  emergency: 'Wizyta pilna',
};

/**
 * Mapowanie statusów na polskie nazwy
 */
const APPOINTMENT_STATUS_LABELS: Record<string, string> = {
  available: 'Dostępny',
  reserved: 'Zarezerwowany',
  confirmed: 'Potwierdzony',
  completed: 'Zakończony',
  cancelled: 'Anulowany',
  no_show: 'Pacjent się nie stawił',
};

/**
 * Props komponentu
 */
interface AppointmentDetailsModalProps {
  appointment: Appointment;
  onClose: () => void;
  onCancel?: (appointment: Appointment) => void;
  showPatientDetails?: boolean; // Czy pokazywać dane pacjenta (widok lekarza)
}

/**
 * Komponent AppointmentDetailsModal
 */
const AppointmentDetailsModal: React.FC<AppointmentDetailsModalProps> = ({
  appointment,
  onClose,
  onCancel,
  showPatientDetails = true,
}) => {
  /**
   * Obsługa anulowania wizyty
   */
  const handleCancel = () => {
    if (onCancel && window.confirm('Czy na pewno chcesz anulować tę wizytę?')) {
      onCancel(appointment);
      onClose();
    }
  };

  /**
   * Zamknięcie modalu po kliknięciu w tło
   */
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div className={styles.modal}>
        {/* Nagłówek */}
        <div className={styles.header}>
          <h2 className={styles.title}>Szczegóły wizyty</h2>
          <button
            className={styles['close-button']}
            onClick={onClose}
            title="Zamknij"
          >
            X
          </button>
        </div>

        {/* Treść */}
        <div className={styles.content}>
          {/* Typ wizyty i status */}
          <div className={styles.section}>
            <div className={styles['info-row']}>
              <span className={styles.label}>Typ wizyty:</span>
              <span className={`${styles.badge} ${styles[appointment.type || 'consultation']}`}>
                {APPOINTMENT_TYPE_LABELS[appointment.type || 'consultation']}
              </span>
            </div>
            <div className={styles['info-row']}>
              <span className={styles.label}>Status:</span>
              <span className={`${styles.badge} ${styles[appointment.status]}`}>
                {APPOINTMENT_STATUS_LABELS[appointment.status]}
              </span>
            </div>
          </div>

          {/* Data i czas */}
          <div className={styles.section}>
            <h3 className={styles['section-title']}>Termin</h3>
            <div className={styles['info-row']}>
              <span className={styles.label}>Data:</span>
              <span className={styles.value}>
                {formatDateTime(appointment.startTime)}
              </span>
            </div>
            <div className={styles['info-row']}>
              <span className={styles.label}>Czas trwania:</span>
              <span className={styles.value}>{appointment.duration} minut</span>
            </div>
            <div className={styles['info-row']}>
              <span className={styles.label}>Zakończenie:</span>
              <span className={styles.value}>
                {formatTime(appointment.endTime)}
              </span>
            </div>
          </div>

          {/* Dane pacjenta (widoczne dla lekarza) */}
          {showPatientDetails && (
            <div className={styles.section}>
              <h3 className={styles['section-title']}>Dane pacjenta</h3>
              <div className={styles['info-row']}>
                <span className={styles.label}>Imię i nazwisko:</span>
                <span className={styles.value}>
                  {appointment.patientFirstName} {appointment.patientLastName}
                </span>
              </div>
              {appointment.patientGender && (
                <div className={styles['info-row']}>
                  <span className={styles.label}>Płeć:</span>
                  <span className={styles.value}>
                    {appointment.patientGender === 'male' ? 'Mężczyzna' :
                     appointment.patientGender === 'female' ? 'Kobieta' : 'Inna'}
                  </span>
                </div>
              )}
              {appointment.patientAge && (
                <div className={styles['info-row']}>
                  <span className={styles.label}>Wiek:</span>
                  <span className={styles.value}>{appointment.patientAge} lat</span>
                </div>
              )}
            </div>
          )}

          {/* Notatki */}
          {appointment.patientNotes && (
            <div className={styles.section}>
              <h3 className={styles['section-title']}>Informacje dla lekarza</h3>
              <div className={styles.notes}>{appointment.patientNotes}</div>
            </div>
          )}

          {/* Załączniki */}
          {appointment.attachments && appointment.attachments.length > 0 && (
            <div className={styles.section}>
              <h3 className={styles['section-title']}>Załączniki</h3>
              <div className={styles.attachments}>
                {appointment.attachments.map((attachment) => (
                  <a
                    key={attachment.id}
                    href={attachment.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.attachment}
                  >
                    {attachment.fileName}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Powód anulowania */}
          {appointment.status === 'cancelled' && appointment.cancelReason && (
            <div className={styles.section}>
              <h3 className={styles['section-title']}>Powód anulowania</h3>
              <div className={styles.notes}>{appointment.cancelReason}</div>
            </div>
          )}
        </div>

        {/* Akcje */}
        <div className={styles.actions}>
          {appointment.status !== 'cancelled' &&
           appointment.status !== 'completed' &&
           onCancel && (
            <button
              className={`${styles.button} ${styles['button-danger']}`}
              onClick={handleCancel}
            >
              Anuluj wizytę
            </button>
          )}
          <button
            className={`${styles.button} ${styles['button-secondary']}`}
            onClick={onClose}
          >
            Zamknij
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppointmentDetailsModal;
