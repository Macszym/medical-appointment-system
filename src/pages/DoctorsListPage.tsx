/**
 * Strona z listą lekarzy
 *
 * Pacjent może przeglądać listę lekarzy i wybrać jednego do rezerwacji
 *
 */

import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Card,
  CardContent,
  CardActions,
  Button,
  Avatar,
  Grid,
  CircularProgress,
  Dialog,
  DialogContent,
  InputAdornment,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import type { User } from '../models';
import { getDataService } from '../services/ServiceFactory';
import { DoctorRatingsDisplay } from '../components/rating/DoctorRatingsDisplay';
import { DoctorRatingForm } from '../components/rating/DoctorRatingForm';
import apiClient from '../services/apiClient';
import { useAuth } from '../contexts/SimpleAuthContext';

const DoctorsListPage: React.FC = () => {
  const [doctors, setDoctors] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingDoctorId, setRatingDoctorId] = useState<string | null>(null);
  const { isAuthenticated, currentUser } = useAuth();

  useEffect(() => {
    loadDoctors();
  }, []);

  const loadDoctors = async () => {
    try {
      setIsLoading(true);
      const allUsers = await getDataService().getAllUsers();
      const doctorsList = allUsers.filter((user) => user.role === 'doctor' && user.isActive);
      setDoctors(doctorsList);
    } catch (error) {
      console.error('Failed to load doctors:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRateDoctor = async (rating: number, comment: string) => {
    if (!ratingDoctorId || !currentUser?.id) return;

    try {
      const dataService = getDataService();
      await dataService.rateDoctor(ratingDoctorId, currentUser.id, rating, comment);

      alert('Ocena dodana pomyślnie!');
      setRatingDoctorId(null);
      // Odśwież listę lekarzy aby pokazać nową średnią
      loadDoctors();
    } catch (error: any) {
      throw error;
    }
  };

  const filteredDoctors = doctors.filter(
    (doctor) =>
      doctor.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doctor.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doctor.specialization?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const ratingDoctor = doctors.find((d) => d.id === ratingDoctorId);

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
          Ładowanie listy lekarzy...
        </Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Lista lekarzy
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Wybierz lekarza i zarezerwuj konsultację
        </Typography>
      </Box>

      {/* Wyszukiwarka */}
      <Box sx={{ mb: 4 }}>
        <TextField
          fullWidth
          placeholder="Szukaj po nazwisku lub specjalizacji..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Lista lekarzy */}
      {filteredDoctors.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            Nie znaleziono lekarzy
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredDoctors.map((doctor) => (
            <Grid item xs={12} sm={6} md={4} key={doctor.id}>
              <Card elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar
                      sx={{
                        width: 56,
                        height: 56,
                        bgcolor: 'primary.main',
                        fontSize: '1.5rem',
                        mr: 2,
                      }}
                    >
                      {doctor.firstName[0]}
                      {doctor.lastName[0]}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" component="h3">
                        Dr {doctor.firstName} {doctor.lastName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {doctor.specialization || 'Lekarz'}
                      </Typography>
                    </Box>
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {doctor.email}
                  </Typography>

                  {}
                  {doctor.doctorRating && (
                    <Box sx={{ mt: 2 }}>
                      <DoctorRatingsDisplay
                        averageRating={doctor.doctorRating.averageRating}
                        numberOfRatings={doctor.doctorRating.numberOfRatings}
                      />
                    </Box>
                  )}
                </CardContent>

                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Button
                    component={RouterLink}
                    to={`/doctors/${doctor.id}`}
                    variant="contained"
                    fullWidth
                    sx={{ mb: 1 }}
                  >
                    Zobacz harmonogram
                  </Button>
                  {isAuthenticated && currentUser?.role === 'patient' && (
                    <Button
                      onClick={() => setRatingDoctorId(doctor.id)}
                      variant="outlined"
                      fullWidth
                    >
                      Oceń lekarza
                    </Button>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Modal do oceniania lekarza */}
      <Dialog
        open={!!ratingDoctorId}
        onClose={() => setRatingDoctorId(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogContent>
          {ratingDoctorId && ratingDoctor && (
            <DoctorRatingForm
              doctorId={ratingDoctorId}
              doctorName={`Dr ${ratingDoctor.firstName} ${ratingDoctor.lastName}`}
              onSubmit={handleRateDoctor}
              onCancel={() => setRatingDoctorId(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default DoctorsListPage;
