/**
 * Routes dla Users
 *
 * Zabezpieczone endpointy z autentykacją i autoryzacją
 */

const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  rateDoctor,
  getDoctorRatings,
  replyToRating,
} = require('../controllers/usersController');
const { authenticate, authorize, optionalAuth } = require('../middleware/authMiddleware');

// GET /api/users - Pobierz wszystkich użytkowników
// Dostępne dla wszystkich (również niezalogowanych) aby goście mogli przeglądać lekarzy
// Hasła są ukryte w kontrolerze (.select('-password'))
router.get('/', optionalAuth, getAllUsers);

// GET /api/users/:id - Pobierz użytkownika po ID (opcjonalna autentykacja)
// Goście mogą zobaczyć podstawowe dane lekarzy
router.get('/:id', optionalAuth, getUserById);

// POST /api/users - Utwórz nowego użytkownika (tylko admin)
router.post('/', authenticate, authorize('admin'), createUser);

// PUT /api/users/:id - Aktualizuj użytkownika (wymagana autentykacja)
router.put('/:id', authenticate, updateUser);

// DELETE /api/users/:id - Usuń użytkownika (tylko admin)
router.delete('/:id', authenticate, authorize('admin'), deleteUser);

// POST /api/users/:id/rate - Oceń lekarza
router.post('/:id/rate', authenticate, rateDoctor);

// GET /api/users/:id/ratings - Pobierz oceny lekarza
router.get('/:id/ratings', optionalAuth, getDoctorRatings);

// POST /api/users/:id/ratings/:ratingId/reply - Odpowiedź lekarza na ocenę
router.post('/:id/ratings/:ratingId/reply', authenticate, replyToRating);

module.exports = router;
