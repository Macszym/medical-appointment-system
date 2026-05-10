/**
 * Strona rejestracji
 *
 * Formularz rejestracji użytkownika z walidacją
 */

import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Link,
  CircularProgress,
  Grid,
} from '@mui/material';
import { PersonAdd as PersonAddIcon } from '@mui/icons-material';
import { authService } from '../services/auth/AuthService';
import type { RegisterDTO } from '../services/auth/AuthService';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<RegisterDTO>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    pesel: '',
  });

  const [confirmPassword, setConfirmPassword] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null); // Clear error when user types
  };

  const validateForm = (): string | null => {
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return 'Podaj poprawny adres email';
    }

    // Password validation
    if (formData.password.length < 6) {
      return 'Hasło musi mieć minimum 6 znaków';
    }

    if (formData.password !== confirmPassword) {
      return 'Hasła nie są identyczne';
    }

    // PESEL validation (11 digits)
    const peselRegex = /^\d{11}$/;
    if (!peselRegex.test(formData.pesel)) {
      return 'PESEL musi składać się z 11 cyfr';
    }

    // Required fields
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      return 'Imię i nazwisko są wymagane';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate form
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.register(formData);

      if (response.success) {
        // Registration successful - redirect to home or doctors page
        navigate('/doctors');
        window.location.reload(); // Force reload to update auth context
      } else {
        setError(response.message || 'Rejestracja nie powiodła się');
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        'Wystąpił błąd podczas rejestracji';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          marginBottom: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              backgroundColor: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 2,
            }}
          >
            <PersonAddIcon sx={{ color: 'white', fontSize: 32 }} />
          </Box>

          <Typography component="h1" variant="h4" gutterBottom>
            Rejestracja
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Utwórz nowe konto pacjenta
          </Typography>

          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Grid container spacing={2} justifyContent="center">
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  id="firstName"
                  label="Imię"
                  name="firstName"
                  autoComplete="given-name"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Jan"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  id="lastName"
                  label="Nazwisko"
                  name="lastName"
                  autoComplete="family-name"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Kowalski"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  id="email"
                  label="Email"
                  name="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="jan.kowalski@example.com"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  id="pesel"
                  label="PESEL"
                  name="pesel"
                  value={formData.pesel}
                  onChange={handleChange}
                  placeholder="12345678901"
                  inputProps={{ maxLength: 11 }}
                  helperText="11-cyfrowy numer PESEL"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  name="password"
                  label="Hasło"
                  type="password"
                  id="password"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  helperText="Minimum 6 znaków"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  name="confirmPassword"
                  label="Powtórz hasło"
                  type="password"
                  id="confirmPassword"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError(null);
                  }}
                  placeholder="••••••••"
                />
              </Grid>
            </Grid>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={isLoading}
              sx={{ mt: 3, mb: 2, py: 1.5 }}
              startIcon={isLoading ? <CircularProgress size={20} /> : null}
            >
              {isLoading ? 'Rejestracja...' : 'Zarejestruj się'}
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Masz już konto?{' '}
                <Link component={RouterLink} to="/login" underline="hover">
                  Zaloguj się
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default RegisterPage;
