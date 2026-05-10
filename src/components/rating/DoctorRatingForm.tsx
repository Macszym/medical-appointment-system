/**
 * Component DoctorRatingForm - Formularz oceny lekarza
 */

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Rating,
  TextField,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';

interface DoctorRatingFormProps {
  doctorId: string;
  doctorName: string;
  onSubmit: (rating: number, comment: string) => Promise<void>;
  onCancel?: () => void;
}

export const DoctorRatingForm: React.FC<DoctorRatingFormProps> = ({
  doctorId,
  doctorName,
  onSubmit,
  onCancel,
}) => {
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      setError('Proszę wybrać ocenę (1-5 gwiazdek)');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await onSubmit(rating, comment);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Błąd przy dodawaniu oceny');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Oceń lekarza: {doctorName}
      </Typography>

      <Box component="form" onSubmit={handleSubmit}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" gutterBottom>
            Twoja ocena:
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Rating
              value={rating}
              onChange={(event, newValue) => {
                setRating(newValue || 0);
                setError('');
              }}
              size="large"
            />
            {rating > 0 && (
              <Typography variant="body2" color="text.secondary">
                {rating} / 5 {rating === 1 ? 'gwiazdka' : rating < 5 ? 'gwiazdki' : 'gwiazdek'}
              </Typography>
            )}
          </Box>
        </Box>

        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            id="comment"
            label="Komentarz (opcjonalnie)"
            multiline
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Opisz swoje doświadczenie z tym lekarzem..."
            inputProps={{ maxLength: 500 }}
            helperText={`${comment.length} / 500`}
          />
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          {onCancel && (
            <Button onClick={onCancel} disabled={isSubmitting}>
              Anuluj
            </Button>
          )}
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting || rating === 0}
            startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
          >
            {isSubmitting ? 'Dodawanie...' : 'Dodaj ocenę'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};
