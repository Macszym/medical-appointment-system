/**
 * Komponent nawigacji (menu górne)
 *
 *
 * Pokazuje różne opcje menu w zależności od roli użytkownika:
 * - Guest: Lista lekarzy, Rejestracja, Logowanie
 * - Patient: Lista lekarzy, Harmonogramy, Mój koszyk, Wyloguj
 * - Doctor: Mój harmonogram, Zarządzanie harmonogramem, Wyloguj
 * - Admin: Użytkownicy, Wyloguj
 */

import React from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Badge,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  LocalHospital as HospitalIcon,
  ShoppingCart as CartIcon,
  Settings as SettingsIcon,
  AccountCircle as AccountIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/SimpleAuthContext';
import { useCart } from '../../contexts/SimpleCartContext';
import styles from './Navigation.module.css';

const Navigation: React.FC = () => {
  const { currentUser, isAuthenticated, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <AppBar position="sticky">
      <Toolbar>
        {/* Logo */}
        <IconButton
          edge="start"
          color="inherit"
          component={RouterLink}
          to="/"
          sx={{ mr: 2 }}
        >
          <HospitalIcon />
        </IconButton>
        <Typography
          variant="h6"
          component={RouterLink}
          to="/"
          sx={{
            flexGrow: 0,
            textDecoration: 'none',
            color: 'inherit',
            mr: 4,
          }}
        >
          System Rezerwacji Wizyt
        </Typography>

        {/* Menu Items */}
        <Box sx={{ flexGrow: 1, display: 'flex', gap: 1 }}>
          {/* Guest Menu */}
          {!isAuthenticated && (
            <>
              <Button color="inherit" component={RouterLink} to="/doctors">
                Lista lekarzy
              </Button>
              <Button color="inherit" component={RouterLink} to="/register">
                Rejestracja
              </Button>
              <Button color="inherit" component={RouterLink} to="/login" variant="outlined">
                Logowanie
              </Button>
            </>
          )}

          {/* Patient Menu */}
          {isAuthenticated && currentUser?.role === 'patient' && (
            <>
              <Button color="inherit" component={RouterLink} to="/doctors">
                Lekarze
              </Button>
              <Button color="inherit" component={RouterLink} to="/my-appointments">
                Moje wizyty
              </Button>
              <IconButton color="inherit" component={RouterLink} to="/cart">
                <Badge badgeContent={itemCount} color="error">
                  <CartIcon />
                </Badge>
              </IconButton>
            </>
          )}

          {/* Doctor Menu */}
          {isAuthenticated && currentUser?.role === 'doctor' && (
            <>
              <Button color="inherit" component={RouterLink} to="/doctor/schedule">
                Harmonogram
              </Button>
              <Button color="inherit" component={RouterLink} to="/doctor/availability">
                Dostępność
              </Button>
              <Button color="inherit" component={RouterLink} to="/doctor/ratings">
                Oceny
              </Button>
            </>
          )}

          {/* Admin Menu */}
          {isAuthenticated && currentUser?.role === 'admin' && (
            <>
              <Button color="inherit" component={RouterLink} to="/admin/users">
                Użytkownicy
              </Button>
            </>
          )}
        </Box>

        {/* Settings */}
        <IconButton color="inherit" component={RouterLink} to="/settings">
          <SettingsIcon />
        </IconButton>

        {/* User Info */}
        {isAuthenticated && currentUser && (
          <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
            <Typography variant="body2" sx={{ mr: 2 }}>
              {currentUser.firstName} {currentUser.lastName}
            </Typography>
            <Button color="inherit" onClick={handleLogout} variant="outlined">
              Wyloguj
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navigation;
