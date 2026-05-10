/**
 * Model Cart - Koszyk użytkownika
 *
 * Koszyk przechowuje "zarezerwowane" wizyty przed ich ostatecznym potwierdzeniem
 */

const mongoose = require('mongoose');

const CartItemSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  doctorName: {
    type: String,
    required: true,
  },
  doctorSpecialization: {
    type: String,
    required: true,
  },
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
    required: true,
  },
  duration: {
    type: Number, // w minutach
    required: true,
  },
  type: {
    type: String,
    enum: ['first_visit', 'consultation', 'follow_up', 'procedure', 'chronic_disease', 'prescription', 'emergency'],
    default: 'consultation',
  },
  patientFirstName: {
    type: String,
    required: true,
  },
  patientLastName: {
    type: String,
    required: true,
  },
  patientGender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: true,
  },
  patientAge: {
    type: Number,
    required: true,
  },
  patientNotes: {
    type: String,
    default: '',
  },
  price: {
    type: Number,
    default: 200, // Symulowana cena
  },
  addedAt: {
    type: Date,
    default: Date.now,
  },
});

const CartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    items: [CartItemSchema],
  },
  {
    timestamps: true,
  }
);

// Virtual dla totalPrice
CartSchema.virtual('totalPrice').get(function () {
  return this.items.reduce((sum, item) => sum + item.price, 0);
});

// Virtual dla itemCount
CartSchema.virtual('itemCount').get(function () {
  return this.items.length;
});

// Ensure virtuals are included in JSON
CartSchema.set('toJSON', { virtuals: true });
CartSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Cart', CartSchema);
