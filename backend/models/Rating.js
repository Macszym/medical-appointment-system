/**
 * Model Rating - Oceny lekarzy przez pacjentów
 *
 * System oceniania lekarzy
 */

const mongoose = require('mongoose');

const RatingSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      required: false,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      maxlength: 500,
    },
    doctorReply: {
      type: String,
      maxlength: 500,
    },
    repliedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index dla szybszego wyszukiwania
RatingSchema.index({ doctorId: 1 });

// UNIQUE index - pacjent może ocenić lekarza tylko raz 
RatingSchema.index({ patientId: 1, doctorId: 1 }, { unique: true });

module.exports = mongoose.model('Rating', RatingSchema);
