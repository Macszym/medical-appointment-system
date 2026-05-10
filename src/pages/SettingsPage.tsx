/**
 * Strona ustawień
 *
 * Zawiera:
 * - Wybór źródła danych (
 * - Inne ustawienia aplikacji
 */

import React from 'react';
import { Container, Box, Typography, Paper } from '@mui/material';
import { Settings as SettingsIcon } from '@mui/icons-material';
import DataSourceSelector from '../components/settings/DataSourceSelector';

const SettingsPage: React.FC = () => {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <SettingsIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
        <Typography variant="h3" component="h1" gutterBottom>
          Ustawienia
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Konfiguracja aplikacji
        </Typography>
      </Box>

      <Paper elevation={2} sx={{ p: 4 }}>
        <DataSourceSelector />
      </Paper>
    </Container>
  );
};

export default SettingsPage;
