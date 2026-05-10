/**
 * Kontroler Cart - operacje na koszyku użytkownika
 */

const Cart = require('../models/Cart');
const User = require('../models/User');

/**
 * GET /api/cart
 * Pobierz koszyk zalogowanego użytkownika
 */
exports.getCart = async (req, res) => {
  try {
    const userId = req.user.userId;

    let cart = await Cart.findOne({ userId }).populate(
      'items.doctorId',
      'firstName lastName specialization'
    );

    // Jeśli koszyk nie istnieje, utwórz pusty
    if (!cart) {
      cart = await Cart.create({ userId, items: [] });
    }

    res.json({
      success: true,
      data: {
        userId: cart.userId,
        items: cart.items,
        totalPrice: cart.totalPrice,
        itemCount: cart.itemCount,
        lastUpdated: cart.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error in getCart:', error);
    res.status(500).json({
      success: false,
      message: 'Błąd serwera przy pobieraniu koszyka',
      error: error.message,
    });
  }
};

/**
 * POST /api/cart
 * Dodaj wizytę do koszyka
 */
exports.addToCart = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      doctorId,
      startTime,
      duration,
      type,
      patientFirstName,
      patientLastName,
      patientGender,
      patientAge,
      patientNotes,
    } = req.body;

    // Walidacja
    if (
      !doctorId ||
      !startTime ||
      !duration ||
      !type ||
      !patientFirstName ||
      !patientLastName ||
      !patientGender ||
      !patientAge
    ) {
      return res.status(400).json({
        success: false,
        message: 'Brak wymaganych pól',
      });
    }

    // Sprawdź czy lekarz istnieje
    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({
        success: false,
        message: 'Lekarz nie znaleziony',
      });
    }

    // Pobierz lub utwórz koszyk
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = await Cart.create({ userId, items: [] });
    }

    // Oblicz endTime
    const start = new Date(startTime);
    const end = new Date(start.getTime() + duration * 60000);

    // Sprawdź czy ten slot nie jest już w koszyku
    const alreadyInCart = cart.items.some(
      (item) =>
        item.doctorId.toString() === doctorId &&
        item.startTime.getTime() === start.getTime()
    );

    if (alreadyInCart) {
      return res.status(400).json({
        success: false,
        message: 'Ten termin jest już w koszyku',
      });
    }

    // Dodaj do koszyka
    const newItem = {
      doctorId,
      doctorName: `${doctor.firstName} ${doctor.lastName}`,
      doctorSpecialization: doctor.specialization || 'Ogólna',
      startTime: start,
      endTime: end,
      duration,
      type,
      patientFirstName,
      patientLastName,
      patientGender,
      patientAge,
      patientNotes: patientNotes || '',
      price: 200, // Symulowana cena
      addedAt: new Date(),
    };

    cart.items.push(newItem);
    await cart.save();

    // Populate doctor info
    await cart.populate('items.doctorId', 'firstName lastName specialization');

    res.status(201).json({
      success: true,
      message: 'Wizyta dodana do koszyka',
      data: {
        userId: cart.userId,
        items: cart.items,
        totalPrice: cart.totalPrice,
        itemCount: cart.itemCount,
        lastUpdated: cart.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error in addToCart:', error);
    res.status(500).json({
      success: false,
      message: 'Błąd serwera przy dodawaniu do koszyka',
      error: error.message,
    });
  }
};

/**
 * DELETE /api/cart/:itemId
 * Usuń wizytę z koszyka
 */
exports.removeFromCart = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { itemId } = req.params;

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Koszyk nie znaleziony',
      });
    }

    // Usuń item po _id
    cart.items = cart.items.filter((item) => item._id.toString() !== itemId);
    await cart.save();

    // Populate doctor info
    await cart.populate('items.doctorId', 'firstName lastName specialization');

    res.json({
      success: true,
      message: 'Wizyta usunięta z koszyka',
      data: {
        userId: cart.userId,
        items: cart.items,
        totalPrice: cart.totalPrice,
        itemCount: cart.itemCount,
        lastUpdated: cart.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error in removeFromCart:', error);
    res.status(500).json({
      success: false,
      message: 'Błąd serwera przy usuwaniu z koszyka',
      error: error.message,
    });
  }
};

/**
 * DELETE /api/cart
 * Wyczyść cały koszyk
 */
exports.clearCart = async (req, res) => {
  try {
    const userId = req.user.userId;

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Koszyk nie znaleziony',
      });
    }

    cart.items = [];
    await cart.save();

    res.json({
      success: true,
      message: 'Koszyk wyczyszczony',
      data: {
        userId: cart.userId,
        items: [],
        totalPrice: 0,
        itemCount: 0,
        lastUpdated: cart.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error in clearCart:', error);
    res.status(500).json({
      success: false,
      message: 'Błąd serwera przy czyszczeniu koszyka',
      error: error.message,
    });
  }
};
