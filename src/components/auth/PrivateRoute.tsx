/**
 * PrivateRoute - Komponent zabezpieczający chronione trasy
 *
 * Przekierowuje do /login jeśli użytkownik nie jest zalogowany
 * Sprawdza wymaganą rolę jeśli została określona
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { Box, Typography, CircularProgress, Paper, Button } from '@mui/material';
import { Lock as LockIcon, Home as HomeIcon } from '@mui/icons-material';
import { useAuth } from '../../contexts/SimpleAuthContext';
import { Link as RouterLink } from 'react-router-dom';
import type { UserRole } from '../../models';

interface PrivateRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole | UserRole[];
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, requiredRole }) => {
  const { isAuthenticated, currentUser, isLoading } = useAuth();

  // Pokaż loader podczas sprawdzania autentykacji
  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
          gap: 2,
        }}
      >
        <CircularProgress size={60} />
        <Typography variant="body1" color="text.secondary">
          Sprawdzanie uprawnień...
        </Typography>
      </Box>
    );
  }

  // Przekieruj do logowania jeśli nie zalogowany
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Sprawdź wymaganą rolę jeśli została określona
  if (requiredRole && currentUser) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

    if (!roles.includes(currentUser.role)) {
      return (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '60vh',
            p: 3,
          }}
        >
          <Paper
            elevation={3}
            sx={{
              p: 6,
              maxWidth: 500,
              textAlign: 'center',
            }}
          >
            <LockIcon sx={{ fontSize: 80, color: 'error.main', mb: 3 }} />

            <Typography variant="h4" gutterBottom color="error.main">
              Brak dostępu
            </Typography>

            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Nie masz uprawnień do wyświetlenia tej strony.
            </Typography>

            <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Wymagana rola:</strong> {roles.join(' lub ')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Twoja rola:</strong> {currentUser.role}
              </Typography>
            </Box>

            <Button
              component={RouterLink}
              to="/"
              variant="contained"
              startIcon={<HomeIcon />}
              fullWidth
            >
              Wróć do strony głównej
            </Button>
          </Paper>
        </Box>
      );
    }
  }

  return <>{children}</>;
};

export default PrivateRoute;
