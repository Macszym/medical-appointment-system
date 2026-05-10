/**
 * Routes dla Absences
 *
 * Zabezpieczone endpointy z autentykacją
 */

const express = require('express');
const router = express.Router();
const {
  getAllAbsences,
  getAbsenceById,
  createAbsence,
  updateAbsence,
  deleteAbsence,
} = require('../controllers/absencesController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// GET /api/absences - Pobierz wszystkie absencje (publiczny dostęp)
router.get('/', getAllAbsences);

// GET /api/absences/:id - Pobierz absencję po ID (publiczny dostęp)
router.get('/:id', getAbsenceById);

// POST /api/absences - Utwórz nową absencję (tylko lekarz)
router.post('/', authenticate, authorize('doctor', 'admin'), createAbsence);

// PUT /api/absences/:id - Aktualizuj absencję (tylko lekarz)
router.put('/:id', authenticate, authorize('doctor', 'admin'), updateAbsence);

// DELETE /api/absences/:id - Usuń absencję (tylko lekarz)
router.delete('/:id', authenticate, authorize('doctor', 'admin'), deleteAbsence);

module.exports = router;
