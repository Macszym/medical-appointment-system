/**
 *
 * Pozwala pacjentowi zobaczyć zarezerwowane wizyty przed potwierdzeniem
 * i usunąć je z koszyka
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Paper,
  Button,
  Avatar,
  Chip,
  IconButton,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  ShoppingCart as CartIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useCart } from '../contexts/SimpleCartContext';
import { useAuth } from '../contexts/SimpleAuthContext';
import { getDataService } from '../services/ServiceFactory';
import type { Appointment } from '../models';

const CartPage: React.FC = () => {
  const { items, removeFromCart, clearCart, itemCount } = useCart();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [isConfirming, setIsConfirming] = useState(false);

  /**
   * Potwierdź wszystkie wizyty w koszyku
   */
  const handleConfirmAll = async () => {
    if (!currentUser || items.length === 0) return;

    try {
      setIsConfirming(true);

      // Utwórz wszystkie wizyty
      const promises = items.map((item) => {
        const appointment: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'> = {
          doctorId: item.doctorId,
          patientId: currentUser.id,
          startTime: item.startTime,
          endTime: item.endTime,
          duration: item.duration,
          status: 'reserved',
          type: item.type as any,
          patientFirstName: currentUser.firstName,
          patientLastName: currentUser.lastName,
          patientGender: (currentUser as any).gender || 'other',
          patientAge: 35, // Mock
          patientNotes: '',
        };

        return getDataService().createAppointment(appointment);
      });

      await Promise.all(promises);

      // Wyczyść koszyk
      clearCart();

      alert(`Potwierdzono ${items.length} wizyt!`);
      navigate('/doctors');
    } catch (error) {
      console.error('Failed to confirm appointments:', error);
      alert('Nie udało się potwierdzić wizyt');
    } finally {
      setIsConfirming(false);
    }
  };

  /**
   * Usuń wizytę z koszyka
   */
  const handleRemove = async (itemId: string) => {
    if (confirm('Czy na pewno chcesz usunąć tę wizytę z koszyka?')) {
      try {
        await removeFromCart(itemId);
      } catch (error) {
        console.error('Failed to remove from cart:', error);
        alert('Nie udało się usunąć z koszyka');
      }
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

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <CartIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
        <Typography variant="h3" component="h1" gutterBottom>
          Koszyk
        </Typography>
        <Typography variant="h6" color="text.secondary">
          {itemCount === 0
            ? 'Twój koszyk jest pusty'
            : `Masz ${itemCount} ${itemCount === 1 ? 'wizytę' : itemCount < 5 ? 'wizyty' : 'wizyt'} w koszyku`}
        </Typography>
      </Box>

      {items.length === 0 ? (
        <Paper elevation={2} sx={{ p: 6, textAlign: 'center' }}>
          <CartIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Koszyk jest pusty
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Dodaj wizyty do koszyka, aby móc je potwierdzić
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/doctors')}
            sx={{ mt: 2 }}
          >
            Przeglądaj lekarzy
          </Button>
        </Paper>
      ) : (
        <>
          <Box sx={{ mb: 3 }}>
            {items.map((item, index) => (
              <Paper key={index} elevation={2} sx={{ mb: 2, overflow: 'hidden' }}>
                <Box sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar
                        sx={{
                          width: 48,
                          height: 48,
                          bgcolor: 'primary.main',
                        }}
                      >
                        {item.doctorName.split(' ')[1]?.[0] || 'D'}
                        {item.doctorName.split(' ')[2]?.[0] || 'D'}
                      </Avatar>
                      <Box>
                        <Typography variant="h6">{item.doctorName}</Typography>
                        <Chip label={translateType(item.type)} size="small" color="primary" />
                      </Box>
                    </Box>
                    <IconButton
                      onClick={() => handleRemove(item._id)}
                      color="error"
                      title="Usuń z koszyka"
                    >
                      <CloseIcon />
                    </IconButton>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Data:
                      </Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {formatDate(item.startTime)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Godzina:
                      </Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {formatTime(item.startTime)} - {formatTime(item.endTime)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Czas trwania:
                      </Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {item.duration} min
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Paper>
            ))}
          </Box>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => clearCart()}
            >
              Wyczyść koszyk
            </Button>
            <Button
              variant="contained"
              size="large"
              onClick={handleConfirmAll}
              disabled={isConfirming}
              startIcon={isConfirming ? <CircularProgress size={20} /> : null}
            >
              {isConfirming ? 'Potwierdzam...' : 'Potwierdź wszystkie'}
            </Button>
          </Box>
        </>
      )}
    </Container>
  );
};

export default CartPage;
