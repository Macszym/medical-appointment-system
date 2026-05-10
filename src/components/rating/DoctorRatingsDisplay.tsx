/**
 * Component DoctorRatingsDisplay - Wyświetlanie ocen i recenzji lekarza
 */

import React from 'react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Box, Typography, Rating, Divider, Paper } from '@mui/material';
import type { Rating as RatingType } from '../../models';

interface DoctorRatingsDisplayProps {
  averageRating: number;
  numberOfRatings: number;
  ratings?: RatingType[];
  showReviews?: boolean;
}

export const DoctorRatingsDisplay: React.FC<DoctorRatingsDisplayProps> = ({
  averageRating,
  numberOfRatings,
  ratings = [],
  showReviews = false,
}) => {
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
          {averageRating.toFixed(1)}
        </Typography>
        <Rating value={averageRating} precision={0.1} readOnly size="small" />
        <Typography variant="body2" color="text.secondary">
          ({numberOfRatings} {numberOfRatings === 1 ? 'ocena' : numberOfRatings < 5 ? 'oceny' : 'ocen'})
        </Typography>
      </Box>

      {showReviews && ratings.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Opinie pacjentów
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {ratings.map((ratingItem) => (
              <Paper key={ratingItem._id} elevation={1} sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Rating value={ratingItem.rating} readOnly size="small" />
                  <Typography variant="caption" color="text.secondary">
                    {format(new Date(ratingItem.createdAt), 'dd MMMM yyyy', { locale: pl })}
                  </Typography>
                </Box>
                {ratingItem.comment && (
                  <Typography variant="body2" color="text.secondary">
                    {ratingItem.comment}
                  </Typography>
                )}
              </Paper>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
};
