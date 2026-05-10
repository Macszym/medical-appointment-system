/**
 *
 * Pozwala pacjentowi zobaczyć swoje wizyty i je odwołać
 */

import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  Divider,
  CircularProgress,
  Grid,
} from '@mui/material';
import {
  Event as EventIcon,
  Cancel as CancelIcon,
  AccessTime as TimeIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/SimpleAuthContext';
import { getDataService } from '../services/ServiceFactory';
import type { Appointment } from '../models';

const MyAppointmentsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAppointments();
  }, [currentUser?.id]); // Odśwież wizyty gdy zmienia się użytkownik

  /**
   * Wczytaj wizyty pacjenta
   */
  const loadAppointments = async () => {
    if (!currentUser) return;

    try {
      setIsLoading(true);

      const data = await getDataService().getAppointments({
        patientId: currentUser.id,
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 dni wstecz
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 dni wprzód
      });

      // Sortuj po dacie
      data.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

      setAppointments(data);
    } catch (error) {
      console.error('Failed to load appointments:', error);
      alert('Nie udało się załadować wizyt');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Usuwa wizytę całkowicie, dzięki czemu slot staje się ponownie wolny
   */
  const handleCancelAppointment = async (appointment: Appointment) => {
    if (!confirm('Czy na pewno chcesz odwołać tę wizytę? Slot stanie się ponownie dostępny dla innych pacjentów.')) {
      return;
    }

    try {
      // Usuń wizytę całkowicie - slot wróci do stanu wolnego
      await getDataService().deleteAppointment(appointment.id);

      alert('Wizyta została odwołana. Slot jest teraz wolny.');
      await loadAppointments();
    } catch (error) {
      console.error('Failed to cancel appointment:', error);
      alert('Nie udało się odwołać wizyty');
    }
  };

  /**
   * Formatuj datę po polsku
   */
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('pl-PL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  /**
   * Formatuj godzinę
   */
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('pl-PL', {
      hour: '2-digit',
      minute: '2-digit',
    });
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

  /**
   * Tłumaczenie statusu
   */
  const translateStatus = (status: string): string => {
    const translations: Record<string, string> = {
      reserved: 'Zarezerwowana',
      confirmed: 'Potwierdzona',
      cancelled: 'Odwołana',
      completed: 'Zakończona',
      available: 'Dostępna',
    };
    return translations[status] || status;
  };

  /**
   * Kolor statusu dla Material-UI Chip
   */
  const getStatusColor = (status: string): 'default' | 'primary' | 'success' | 'error' | 'warning' => {
    const colors: Record<string, 'default' | 'primary' | 'success' | 'error' | 'warning'> = {
      reserved: 'warning',
      confirmed: 'success',
      cancelled: 'error',
      completed: 'default',
    };
    return colors[status] || 'default';
  };

  /**
   * Sprawdź czy wizyta może być odwołana
   */
  const canCancel = (appointment: Appointment): boolean => {
    // Można odwołać tylko zarezerwowane i potwierdzone wizyty w przyszłości
    if (appointment.status === 'cancelled' || appointment.status === 'completed') {
      return false;
    }

    return appointment.startTime > new Date();
  };

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          gap: 2,
        }}
      >
        <CircularProgress size={60} />
        <Typography variant="body1" color="text.secondary">
          Ładowanie wizyt...
        </Typography>
      </Box>
    );
  }

  // Podziel wizyty na przyszłe i przeszłe
  const now = new Date();
  const upcomingAppointments = appointments.filter((app) => app.startTime >= now);
  const pastAppointments = appointments.filter((app) => app.startTime < now);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <EventIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
        <Typography variant="h3" component="h1" gutterBottom>
          Moje wizyty
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Masz {upcomingAppointments.length}{' '}
          {upcomingAppointments.length === 1 ? 'nadchodzącą wizytę' : upcomingAppointments < 5 ? 'nadchodzące wizyty' : 'nadchodzących wizyt'}
        </Typography>
      </Box>

      {appointments.length === 0 ? (
        <Paper elevation={2} sx={{ p: 6, textAlign: 'center' }}>
          <EventIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Nie masz żadnych wizyt
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Przeglądaj lekarzy i zarezerwuj swoją pierwszą wizytę
          </Typography>
        </Paper>
      ) : (
        <>
          {/* Nadchodzące wizyty */}
          {upcomingAppointments.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
                Nadchodzące wizyty
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {upcomingAppointments.map((appointment) => (
                  <Paper key={appointment.id} elevation={2} sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Chip
                          label={translateStatus(appointment.status)}
                          color={getStatusColor(appointment.status)}
                          size="small"
                        />
                        <Chip
                          label={translateType(appointment.type)}
                          variant="outlined"
                          size="small"
                        />
                      </Box>
                      {canCancel(appointment) && (
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          startIcon={<CancelIcon />}
                          onClick={() => handleCancelAppointment(appointment)}
                        >
                          Odwołaj
                        </Button>
                      )}
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          Lekarz:
                        </Typography>
                        <Typography variant="body1" fontWeight={500}>
                          Dr {(appointment.doctorId as any)?.firstName || ''}{' '}
                          {(appointment.doctorId as any)?.lastName || ''}
                        </Typography>
                        {(appointment.doctorId as any)?.specialization && (
                          <Typography variant="body2" color="text.secondary">
                            {(appointment.doctorId as any).specialization}
                          </Typography>
                        )}
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          Data:
                        </Typography>
                        <Typography variant="body1" fontWeight={500}>
                          {formatDate(appointment.startTime)}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          Godzina:
                        </Typography>
                        <Typography variant="body1" fontWeight={500}>
                          <TimeIcon sx={{ fontSize: 16, verticalAlign: 'text-bottom', mr: 0.5 }} />
                          {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          Czas trwania:
                        </Typography>
                        <Typography variant="body1" fontWeight={500}>
                          {appointment.duration} min
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                ))}
              </Box>
            </Box>
          )}

          {/* Przeszłe wizyty */}
          {pastAppointments.length > 0 && (
            <Box>
              <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
                Historia wizyt
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {pastAppointments.map((appointment) => (
                  <Paper key={appointment.id} elevation={1} sx={{ p: 3, opacity: 0.85 }}>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                      <Chip
                        label={translateStatus(appointment.status)}
                        color={getStatusColor(appointment.status)}
                        size="small"
                      />
                      <Chip
                        label={translateType(appointment.type)}
                        variant="outlined"
                        size="small"
                      />
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          Lekarz:
                        </Typography>
                        <Typography variant="body1" fontWeight={500}>
                          Dr {(appointment.doctorId as any)?.firstName || ''}{' '}
                          {(appointment.doctorId as any)?.lastName || ''}
                        </Typography>
                        {(appointment.doctorId as any)?.specialization && (
                          <Typography variant="body2" color="text.secondary">
                            {(appointment.doctorId as any).specialization}
                          </Typography>
                        )}
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          Data:
                        </Typography>
                        <Typography variant="body1" fontWeight={500}>
                          {formatDate(appointment.startTime)}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          Godzina:
                        </Typography>
                        <Typography variant="body1" fontWeight={500}>
                          <TimeIcon sx={{ fontSize: 16, verticalAlign: 'text-bottom', mr: 0.5 }} />
                          {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          Czas trwania:
                        </Typography>
                        <Typography variant="body1" fontWeight={500}>
                          {appointment.duration} min
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                ))}
              </Box>
            </Box>
          )}
        </>
      )}
    </Container>
  );
};

export default MyAppointmentsPage;
