/**
 * Auth Routes
 *
 * Endpointy autentykacji:
 * - POST /auth/register - rejestracja
 * - POST /auth/login - logowanie
 * - POST /auth/refresh - odświeżanie tokena
 * - POST /auth/logout - wylogowanie
 * - GET /auth/me - dane zalogowanego użytkownika
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');

// Publiczne endpointy (bez autentykacji)
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

// Chronione endpointy (wymagają autentykacji)
router.get('/me', authenticate, authController.getCurrentUser);

module.exports = router;
