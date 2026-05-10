/**
 * Routes dla Availabilities
 *
 * Zabezpieczone endpointy z autentykacją
 */

const express = require('express');
const router = express.Router();
const {
  getAllAvailabilities,
  getAvailabilityById,
  createAvailability,
  updateAvailability,
  deleteAvailability,
} = require('../controllers/availabilitiesController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// GET /api/availabilities - Pobierz wszystkie dostępności (publiczny dostęp)
router.get('/', getAllAvailabilities);

// GET /api/availabilities/:id - Pobierz dostępność po ID (publiczny dostęp)
router.get('/:id', getAvailabilityById);

// POST /api/availabilities - Utwórz nową dostępność (tylko lekarz)
router.post('/', authenticate, authorize('doctor', 'admin'), createAvailability);

// PUT /api/availabilities/:id - Aktualizuj dostępność (tylko lekarz)
router.put('/:id', authenticate, authorize('doctor', 'admin'), updateAvailability);

// DELETE /api/availabilities/:id - Usuń dostępność (tylko lekarz)
router.delete('/:id', authenticate, authorize('doctor', 'admin'), deleteAvailability);

module.exports = router;
