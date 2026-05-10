/**
 * Routes dla Cart
 */

const express = require('express');
const router = express.Router();
const {
  getCart,
  addToCart,
  removeFromCart,
  clearCart,
} = require('../controllers/cartController');
const { authenticate } = require('../middleware/authMiddleware');

// GET /api/cart - Pobierz koszyk zalogowanego użytkownika
router.get('/', authenticate, getCart);

// POST /api/cart - Dodaj wizytę do koszyka
router.post('/', authenticate, addToCart);

// DELETE /api/cart/:itemId - Usuń wizytę z koszyka
router.delete('/:itemId', authenticate, removeFromCart);

// DELETE /api/cart - Wyczyść cały koszyk
router.delete('/', authenticate, clearCart);

module.exports = router;
