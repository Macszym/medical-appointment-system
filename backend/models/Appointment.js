/**
 * Model Appointment - wizyty/konsultacje
 */

const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'ID lekarza jest wymagane'],
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'ID pacjenta jest wymagane'],
    },
    startTime: {
      type: Date,
      required: [true, 'Czas rozpoczęcia jest wymagany'],
    },
    endTime: {
      type: Date,
      required: [true, 'Czas zakończenia jest wymagany'],
    },
    duration: {
      type: Number,
      required: [true, 'Długość wizyty jest wymagana'],
      min: [30, 'Minimalna długość wizyty to 30 minut'],
    },
    status: {
      type: String,
      enum: ['available', 'reserved', 'confirmed', 'cancelled', 'completed', 'no_show'],
      default: 'reserved',
    },
    type: {
      type: String,
      enum: ['first_visit', 'consultation', 'follow_up', 'procedure', 'chronic_disease', 'prescription', 'emergency'],
      required: [true, 'Typ wizyty jest wymagany'],
    },
    patientFirstName: {
      type: String,
      required: [true, 'Imię pacjenta jest wymagane'],
    },
    patientLastName: {
      type: String,
      required: [true, 'Nazwisko pacjenta jest wymagane'],
    },
    patientGender: {
      type: String,
      enum: ['male', 'female', 'other'],
      default: 'other',
    },
    patientAge: {
      type: Number,
      min: [0, 'Wiek nie może być ujemny'],
    },
    patientNotes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index dla szybszych zapytań
AppointmentSchema.index({ doctorId: 1, startTime: 1 });
AppointmentSchema.index({ patientId: 1, startTime: 1 });

module.exports = mongoose.model('Appointment', AppointmentSchema);
