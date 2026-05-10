/**
 * Model Availability - dostępność lekarza
 */

const mongoose = require('mongoose');

const TimeRangeSchema = new mongoose.Schema(
  {
    startTime: {
      type: String,
      required: true,
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format czasu musi być HH:MM'],
    },
    endTime: {
      type: String,
      required: true,
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format czasu musi być HH:MM'],
    },
  },
  { _id: false }
);

const AvailabilitySchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'ID lekarza jest wymagane'],
    },
    type: {
      type: String,
      enum: ['recurring', 'one-time'],
      required: [true, 'Typ dostępności jest wymagany'],
    },
    // Dla recurring
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    daysOfWeek: {
      type: [Number], // 0 = Niedziela, 1 = Poniedziałek, etc.
      validate: {
        validator: function (v) {
          return this.type !== 'recurring' || (v && v.length > 0);
        },
        message: 'Dni tygodnia są wymagane dla dostępności cyklicznej',
      },
    },
    timeRanges: {
      type: [TimeRangeSchema],
      validate: {
        validator: function (v) {
          return this.type !== 'recurring' || (v && v.length > 0);
        },
        message: 'Zakresy czasowe są wymagane dla dostępności cyklicznej',
      },
    },
    // Dla one-time
    specificDate: {
      type: Date,
      validate: {
        validator: function (v) {
          return this.type !== 'one-time' || !!v;
        },
        message: 'Data jest wymagana dla dostępności jednorazowej',
      },
    },
    specificTimeRanges: {
      type: [TimeRangeSchema],
      validate: {
        validator: function (v) {
          return this.type !== 'one-time' || (v && v.length > 0);
        },
        message: 'Zakresy czasowe są wymagane dla dostępności jednorazowej',
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index dla szybszych zapytań
AvailabilitySchema.index({ doctorId: 1, type: 1 });

module.exports = mongoose.model('Availability', AvailabilitySchema);
