/**
 * Model User - pacjenci, lekarze, administratorzy
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email jest wymagany'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Nieprawidłowy format email'],
    },
    password: {
      type: String,
      required: [true, 'Hasło jest wymagane'],
      minlength: [6, 'Hasło musi mieć minimum 6 znaków'],
    },
    role: {
      type: String,
      enum: ['patient', 'doctor', 'admin'],
      default: 'patient',
    },
    firstName: {
      type: String,
      required: [true, 'Imię jest wymagane'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Nazwisko jest wymagane'],
      trim: true,
    },
    pesel: {
      type: String,
      required: [true, 'PESEL jest wymagany'],
      unique: true,
      match: [/^\d{11}$/, 'PESEL musi mieć 11 cyfr'],
    },
    specialization: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isBanned: {
      type: Boolean,
      default: false,
    },
    sessionId: {
      type: String,
      default: null,
    },
    cart: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment',
      },
    ],
    doctorRating: {
      totalRating: { type: Number, default: 0 },
      numberOfRatings: { type: Number, default: 0 },
      averageRating: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

// Hash hasła przed zapisaniem
UserSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Metoda do porównania hasła
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Nie zwracaj hasła w JSON
UserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', UserSchema);
