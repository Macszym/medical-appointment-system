/**
 * Strona główna
 *
 * Wyświetla powitanie i informacje o systemie
 */

import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  Login as LoginIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/SimpleAuthContext';

const HomePage: React.FC = () => {
  const { isAuthenticated, currentUser } = useAuth();

  return (
    <Container maxWidth="lg">
      {/* Hero section */}
      <Box
        sx={{
          minHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          py: 8,
        }}
      >
        <Typography
          variant="h2"
          component="h1"
          gutterBottom
          sx={{
            fontWeight: 700,
            background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
            backgroundClip: 'text',
            textFillColor: 'transparent',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          System Rezerwacji Wizyt Lekarskich
        </Typography>
        <Typography variant="h6" color="text.secondary" paragraph sx={{ mb: 4 }}>
          Rezerwuj wizyty u lekarzy online
        </Typography>

        {!isAuthenticated && (
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              component={RouterLink}
              to="/register"
              variant="contained"
              size="large"
              startIcon={<PersonAddIcon />}
            >
              Zarejestruj się
            </Button>
            <Button
              component={RouterLink}
              to="/login"
              variant="outlined"
              size="large"
              startIcon={<LoginIcon />}
            >
              Zaloguj się
            </Button>
          </Box>
        )}

        {isAuthenticated && currentUser && (
          <Paper elevation={2} sx={{ p: 4, mt: 2, maxWidth: 600 }}>
            <Typography variant="h4" gutterBottom>
              Witaj, {currentUser.firstName} {currentUser.lastName}!
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Rola:{' '}
              <strong>
                {currentUser.role === 'patient'
                  ? 'Pacjent'
                  : currentUser.role === 'doctor'
                  ? 'Lekarz'
                  : 'Administrator'}
              </strong>
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              {currentUser.role === 'admin' && (
                <>
                  <Button
                    component={RouterLink}
                    to="/admin/users"
                    variant="contained"
                    size="large"
                  >
                    Zarządzanie użytkownikami
                  </Button>
                  <Button
                    component={RouterLink}
                    to="/doctors"
                    variant="outlined"
                    size="large"
                  >
                    Lista lekarzy
                  </Button>
                </>
              )}
              {currentUser.role === 'doctor' && (
                <Button
                  component={RouterLink}
                  to="/doctor/schedule"
                  variant="contained"
                  size="large"
                >
                  Przejdź do harmonogramu
                </Button>
              )}
              {currentUser.role === 'patient' && (
                <Button
                  component={RouterLink}
                  to="/doctors"
                  variant="contained"
                  size="large"
                >
                  Przeglądaj lekarzy
                </Button>
              )}
            </Box>
          </Paper>
        )}
      </Box>

    </Container>
  );
};

export default HomePage;
