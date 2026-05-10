/**
 * Model Absence - absencje/urlopy lekarza
 */

const mongoose = require('mongoose');

const AbsenceSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'ID lekarza jest wymagane'],
    },
    startDate: {
      type: Date,
      required: [true, 'Data rozpoczęcia jest wymagana'],
    },
    endDate: {
      type: Date,
      required: [true, 'Data zakończenia jest wymagana'],
    },
    reason: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index dla szybszych zapytań
AbsenceSchema.index({ doctorId: 1, startDate: 1 });

module.exports = mongoose.model('Absence', AbsenceSchema);
