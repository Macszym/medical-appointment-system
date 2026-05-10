/**
 * Strona ocen lekarza
 *
 * Pozwala lekarzowi zobaczyć wszystkie swoje oceny i odpowiadać na nie
 */

import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Rating,
  Divider,
  TextField,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { useAuth } from '../contexts/SimpleAuthContext';
import { getDataService } from '../services/ServiceFactory';
import type { Rating as RatingType } from '../models';

const DoctorRatingsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [ratings, setRatings] = useState<RatingType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyTexts, setReplyTexts] = useState<{ [key: string]: string }>({});
  const [error, setError] = useState('');

  useEffect(() => {
    loadRatings();
  }, [currentUser]);

  const loadRatings = async () => {
    if (!currentUser?.id) return;

    try {
      setIsLoading(true);
      const dataService = getDataService();
      const ratingsData = await dataService.getDoctorRatings(currentUser.id);
      setRatings(ratingsData);
    } catch (error) {
      console.error('Failed to load ratings:', error);
      setError('Nie udało się załadować ocen');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReply = async (ratingId: string) => {
    const replyText = replyTexts[ratingId] || '';

    if (!ratingId) {
      console.error('Rating ID is missing!');
      setError('Błąd: brak ID oceny');
      return;
    }

    if (!currentUser?.id || !replyText.trim()) {
      setError('Odpowiedź nie może być pusta');
      return;
    }

    try {
      const dataService = getDataService();
      await dataService.replyToRating(
        currentUser.id,
        ratingId,
        replyText,
        currentUser.id,
        currentUser.role
      );

      setReplyingTo(null);
      setReplyTexts((prev) => {
        const newTexts = { ...prev };
        delete newTexts[ratingId];
        return newTexts;
      });
      setError('');
      await loadRatings();
    } catch (error: any) {
      console.error('Error replying to rating:', error);
      setError(error.response?.data?.message || 'Nie udało się dodać odpowiedzi');
    }
  };

  const handleCancelReply = (ratingId: string) => {
    setReplyingTo(null);
    setReplyTexts((prev) => {
      const newTexts = { ...prev };
      delete newTexts[ratingId];
      return newTexts;
    });
    setError('');
  };

  const handleOpenReply = (ratingId: string) => {
    setReplyingTo(ratingId);
    setError('');
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
          Ładowanie ocen...
        </Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Moje oceny
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {ratings.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            Nie masz jeszcze żadnych ocen
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {ratings.map((ratingItem) => (
            <Paper key={ratingItem._id} elevation={2} sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                <Box>
                  <Rating value={ratingItem.rating} readOnly size="medium" />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {format(new Date(ratingItem.createdAt), 'dd MMMM yyyy, HH:mm', { locale: pl })}
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  Pacjent:{' '}
                  {ratingItem.patientId?.firstName && ratingItem.patientId?.lastName
                    ? `${ratingItem.patientId.firstName} ${ratingItem.patientId.lastName}`
                    : 'Anonimowy'}
                </Typography>
              </Box>

              {ratingItem.comment && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                    "{ratingItem.comment}"
                  </Typography>
                </Box>
              )}

              <Divider sx={{ my: 2 }} />

              {ratingItem.doctorReply ? (
                <Box sx={{ bgcolor: 'action.hover', p: 2, borderRadius: 1 }}>
                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    Twoja odpowiedź:
                  </Typography>
                  <Typography variant="body2">{ratingItem.doctorReply}</Typography>
                  {ratingItem.repliedAt && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      {format(new Date(ratingItem.repliedAt), 'dd MMMM yyyy, HH:mm', { locale: pl })}
                    </Typography>
                  )}
                </Box>
              ) : (
                <Box>
                  {replyingTo === ratingItem._id ? (
                    <Box>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        value={replyTexts[ratingItem._id] || ''}
                        onChange={(e) =>
                          setReplyTexts((prev) => ({
                            ...prev,
                            [ratingItem._id]: e.target.value,
                          }))
                        }
                        placeholder="Napisz odpowiedź..."
                        inputProps={{ maxLength: 500 }}
                        helperText={`${(replyTexts[ratingItem._id] || '').length} / 500`}
                        sx={{ mb: 2 }}
                        autoFocus
                      />
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        <Button onClick={() => handleCancelReply(ratingItem._id)}>
                          Anuluj
                        </Button>
                        <Button
                          variant="contained"
                          onClick={() => handleReply(ratingItem._id)}
                          disabled={!(replyTexts[ratingItem._id] || '').trim()}
                        >
                          Wyślij odpowiedź
                        </Button>
                      </Box>
                    </Box>
                  ) : (
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleOpenReply(ratingItem._id)}
                    >
                      Odpowiedz
                    </Button>
                  )}
                </Box>
              )}
            </Paper>
          ))}
        </Box>
      )}
    </Container>
  );
};

export default DoctorRatingsPage;
