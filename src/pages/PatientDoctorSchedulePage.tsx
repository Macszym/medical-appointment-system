/**
 * Strona harmonogramu lekarza - widok dla pacjenta
 *
 * Pacjent widzi dostępne sloty i może zarezerwować wizytę
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/SimpleAuthContext';
import { useCart } from '../contexts/SimpleCartContext';
import WeekCalendar from '../components/calendar/WeekCalendar';
import { DoctorRatingsDisplay } from '../components/rating/DoctorRatingsDisplay';
import { DoctorRatingForm } from '../components/rating/DoctorRatingForm';
import type { User, Appointment, Absence, TimeSlot, Rating } from '../models';
import { getDataService } from '../services/ServiceFactory';
import styles from './PatientDoctorSchedulePage.module.css';

const PatientDoctorSchedulePage: React.FC = () => {
  const { doctorId } = useParams<{ doctorId: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState<User | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [availabilities, setAvailabilities] = useState<any[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ date: Date; slot: TimeSlot } | null>(null);
  const [appointmentType, setAppointmentType] = useState<'first_visit' | 'consultation' | 'follow_up' | 'procedure'>('consultation');
  const [patientNotes, setPatientNotes] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  useEffect(() => {
    if (doctorId) {
      loadData(doctorId);
    }
  }, [doctorId]);

  const loadData = async (docId: string) => {
    try {
      setIsLoading(true);

      // Najpierw pobierz dane lekarza
      const doctorData = await getDataService().getUserById(docId);

      if (!doctorData || doctorData.role !== 'doctor') {
        alert('Lekarz nie został znaleziony');
        navigate('/doctors');
        return;
      }

      setDoctor(doctorData);

      // Pobierz oceny lekarza (dostępne dla wszystkich)
      try {
        const ratingsData = await getDataService().getDoctorRatings(docId);
        setRatings(ratingsData);
      } catch (error) {
        console.error('Failed to load ratings:', error);
        // Nie przerywaj ładowania, jeśli oceny się nie załadują
      }

      // Jeśli użytkownik jest zalogowany, pobierz harmonogram
      if (currentUser) {
        const [appointmentsData, absencesData, availabilitiesData] = await Promise.all([
          getDataService().getAppointments({
            doctorId: docId,
            startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          }),
          getDataService().getAbsencesByDoctor(docId),
          getDataService().getAvailabilitiesByDoctor(docId),
        ]);

        setAppointments(appointmentsData);
        setAbsences(absencesData);
        setAvailabilities(availabilitiesData);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      alert('Nie udało się załadować danych lekarza');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSlotClick = (date: Date, slot: TimeSlot) => {
    // Sprawdź czy slot jest dostępny (lekarz ma dostępność)
    if (!slot.isAvailable) {
      alert('Lekarz nie jest dostępny w tym czasie');
      return;
    }

    // Sprawdź czy slot jest już zajęty
    if (slot.appointment && slot.appointment.status !== 'available') {
      alert('Ten termin jest już zajęty');
      return;
    }

    // Slot jest wolny - można zarezerwować
    setSelectedSlot({ date, slot });
    // Reset formularza
    setPatientNotes('');
    setSelectedFiles([]);
  };

  /**
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...filesArray]);
    }
  };

  /**
   * Usuń plik z listy
   */
  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const { addToCart } = useCart();

  const handleRateDoctor = async (rating: number, comment: string) => {
    if (!doctor || !currentUser) return;

    try {
      const dataService = getDataService();
      await dataService.rateDoctor(doctor.id, currentUser.id, rating, comment);

      alert('Ocena dodana pomyślnie!');
      setShowRatingForm(false);

      // Odśwież dane lekarza (żeby zaktualizować średnią ocen)
      if (doctorId) {
        loadData(doctorId);
      }
    } catch (error: any) {
      // Błąd jest obsłużony w komponencie DoctorRatingForm
      throw error;
    }
  };

  const handleReserve = async () => {
    if (!selectedSlot || !currentUser || !doctor) return;

    try {
      // Przygotuj notatki z informacją o załącznikach
      let notesWithAttachments = patientNotes || '';
      if (selectedFiles.length > 0) {
        notesWithAttachments +=
          (notesWithAttachments ? '\n\n' : '') +
          `Załączone dokumenty (${selectedFiles.length}):\n` +
          selectedFiles.map((file) => `- ${file.name} (${(file.size / 1024).toFixed(1)} KB)`).join('\n');
      }

      // Dodaj wizytę do koszyka
      await addToCart({
        doctorId: doctor.id,
        startTime: selectedSlot.slot.startTime,
        duration: 30,
        type: appointmentType,
        patientFirstName: currentUser.firstName,
        patientLastName: currentUser.lastName,
        patientGender: (currentUser as any).gender || 'other',
        patientAge: 30, // Mock - można by obliczyć z dateOfBirth
        patientNotes: notesWithAttachments,
      });

      alert('Wizyta została dodana do koszyka!');
      setSelectedSlot(null);
      setAppointmentType('consultation'); // Reset do domyślnej
      setPatientNotes('');
      setSelectedFiles([]);
    } catch (error) {
      console.error('Failed to add to cart:', error);
      alert('Nie udało się dodać wizyty do koszyka');
    }
  };

  /**
   * Tłumaczenie typu wizyty
   */
  const translateType = (type: string): string => {
    const translations: Record<string, string> = {
      first_visit: 'Pierwsza wizyta',
      consultation: 'Konsultacja',
      follow_up: 'Wizyta kontrolna',
      procedure: 'Zabieg',
    };
    return translations[type] || type;
  };

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Ładowanie harmonogramu...</p>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className={styles.error}>
        <h2>Lekarz nie został znaleziony</h2>
        <button onClick={() => navigate('/doctors')} className={styles['button-primary']}>
          Powrót do listy lekarzy
        </button>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button onClick={() => navigate('/doctors')} className={styles['back-button']}>
          ← Powrót do listy
        </button>

        <div className={styles['doctor-info']}>
          <div className={styles.avatar}>
            {doctor.firstName[0]}
            {doctor.lastName[0]}
          </div>
          <div>
            <h1 className={styles.title}>
              Dr {doctor.firstName} {doctor.lastName}
            </h1>
            <p className={styles.subtitle}>{doctor.specialization || 'Lekarz'}</p>
          </div>
        </div>
      </div>

      {/* Oceny lekarza - widoczne dla wszystkich */}
      {doctor.doctorRating && (
        <div style={{ maxWidth: '800px', margin: '20px auto', padding: '20px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <DoctorRatingsDisplay
            averageRating={doctor.doctorRating.averageRating}
            numberOfRatings={doctor.doctorRating.numberOfRatings}
            ratings={ratings}
            showReviews={true}
          />

          {/* Przycisk do dodawania oceny (tylko dla zalogowanych pacjentów) */}
          {currentUser && currentUser.role === 'patient' && !showRatingForm && (
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <button
                onClick={() => setShowRatingForm(true)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#1976d2',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                Oceń lekarza
              </button>
            </div>
          )}

          {/* Formularz oceny */}
          {showRatingForm && currentUser && (
            <div style={{ marginTop: '20px', borderTop: '1px solid #e0e0e0', paddingTop: '20px' }}>
              <DoctorRatingForm
                doctorId={doctor.id}
                doctorName={`${doctor.firstName} ${doctor.lastName}`}
                onSubmit={handleRateDoctor}
                onCancel={() => setShowRatingForm(false)}
              />
            </div>
          )}
        </div>
      )}

      {!currentUser ? (
        <div className={styles.error} style={{ margin: '40px auto', maxWidth: '600px' }}>
          <h2>Dostęp do harmonogramu wymaga logowania</h2>
          <p style={{ marginBottom: '20px' }}>
            Aby zobaczyć harmonogram lekarza i zarezerwować wizytę, musisz być zalogowany.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button onClick={() => navigate('/login')} className={styles['button-primary']}>
              Zaloguj się
            </button>
            <button onClick={() => navigate('/register')} className={styles['button-secondary']}>
              Zarejestruj się
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className={styles.info}>
            <p>Kliknij na wolny slot, aby zarezerwować wizytę (30 min)</p>
          </div>

          <div className={styles.calendar}>
            <WeekCalendar
              doctorId={doctor.id}
              appointments={appointments}
              absences={absences}
              availabilities={availabilities}
              onSlotClick={handleSlotClick}
              onAppointmentClick={() => {}}
              currentUserId={currentUser?.id}
              currentUserRole={currentUser?.role}
            />
          </div>
        </>
      )}

      {/* Modal rezerwacji */}
      {selectedSlot && (
        <div className={styles.modal}>
          <div className={styles['modal-content']}>
            <h2>Potwierdzenie rezerwacji</h2>
            <p>
              <strong>Lekarz:</strong> Dr {doctor.firstName} {doctor.lastName}
            </p>
            <p>
              <strong>Data:</strong>{' '}
              {selectedSlot.slot.startTime.toLocaleDateString('pl-PL', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
            <p>
              <strong>Godzina:</strong>{' '}
              {selectedSlot.slot.startTime.toLocaleTimeString('pl-PL', {
                hour: '2-digit',
                minute: '2-digit',
              })}{' '}
              -{' '}
              {selectedSlot.slot.endTime.toLocaleTimeString('pl-PL', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>

            <div style={{ marginTop: '20px' }}>
              <label htmlFor="appointmentType" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                <strong>Typ wizyty:</strong>
              </label>
              <select
                id="appointmentType"
                value={appointmentType}
                onChange={(e) => setAppointmentType(e.target.value as any)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: '14px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  backgroundColor: 'white',
                }}
              >
                <option value="consultation">Konsultacja</option>
                <option value="first_visit">Pierwsza wizyta</option>
                <option value="follow_up">Wizyta kontrolna</option>
                <option value="procedure">Zabieg</option>
              </select>
            </div>

            <div style={{ marginTop: '20px' }}>
              <label htmlFor="patientNotes" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                <strong>Informacje dla lekarza (opcjonalnie):</strong>
              </label>
              <textarea
                id="patientNotes"
                value={patientNotes}
                onChange={(e) => setPatientNotes(e.target.value)}
                placeholder="Opisz swoje dolegliwości, objawy, pytania..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: '14px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
              />
            </div>

            <div style={{ marginTop: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                <strong>Załącz dokumenty (opcjonalnie):</strong>
              </label>
              <p style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>
                Np. wyniki badań, skierowania, zdjęcia RTG
              </p>
              <input
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={handleFileChange}
                style={{
                  width: '100%',
                  padding: '8px',
                  fontSize: '14px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                }}
              />

              {/* Lista wybranych plików */}
              {selectedFiles.length > 0 && (
                <div style={{ marginTop: '12px' }}>
                  <p style={{ fontSize: '13px', fontWeight: '500', marginBottom: '8px' }}>
                    Wybrane pliki ({selectedFiles.length}):
                  </p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {selectedFiles.map((file, index) => (
                      <li
                        key={index}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '6px 8px',
                          backgroundColor: '#f5f5f5',
                          borderRadius: '4px',
                          marginBottom: '4px',
                          fontSize: '13px',
                        }}
                      >
                        <span>
                          {file.name} ({(file.size / 1024).toFixed(1)} KB)
                        </span>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#e74c3c',
                            cursor: 'pointer',
                            fontSize: '16px',
                            padding: '0 4px',
                          }}
                          title="Usuń plik"
                        >
                          X
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className={styles.actions}>
              <button onClick={() => setSelectedSlot(null)} className={styles['button-secondary']}>
                Anuluj
              </button>
              <button onClick={handleReserve} className={styles['button-primary']}>
                Dodaj do koszyka
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDoctorSchedulePage;
