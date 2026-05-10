/**
 * Routes dla Appointments
 *
 * Zabezpieczone endpointy z autentykacją
 */

const express = require('express');
const router = express.Router();
const {
  getAllAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment,
} = require('../controllers/appointmentsController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// GET /api/appointments - Pobierz wszystkie wizyty (wymagana autentykacja)
router.get('/', authenticate, getAllAppointments);

// GET /api/appointments/:id - Pobierz wizytę po ID (wymagana autentykacja)
router.get('/:id', authenticate, getAppointmentById);

// POST /api/appointments - Utwórz nową wizytę (wymagana autentykacja)
router.post('/', authenticate, createAppointment);

// PUT /api/appointments/:id - Aktualizuj wizytę (wymagana autentykacja)
router.put('/:id', authenticate, updateAppointment);

// DELETE /api/appointments/:id - Usuń wizytę (wymagana autentykacja)
router.delete('/:id', authenticate, deleteAppointment);

module.exports = router;
