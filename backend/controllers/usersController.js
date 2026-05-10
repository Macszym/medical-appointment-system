/**
 * Kontroler Users - operacje CRUD na użytkownikach
 */

const User = require('../models/User');
const Rating = require('../models/Rating');
const Appointment = require('../models/Appointment');

/**
 * GET /api/users
 * Pobierz wszystkich użytkowników (z filtrowaniem)
 */
exports.getAllUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const filter = {};

    if (role) {
      filter.role = role;
    }

    const users = await User.find(filter).select('-password');
    res.json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    console.error('Error in getAllUsers:', error);
    res.status(500).json({
      success: false,
      message: 'Błąd serwera przy pobieraniu użytkowników',
      error: error.message,
    });
  }
};

/**
 * GET /api/users/:id
 * Pobierz pojedynczego użytkownika
 */
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Użytkownik nie został znaleziony',
      });
    }

    // Dla niezalogowanych użytkowników (gości), ukryj wrażliwe dane
    const currentUserRole = req.user?.role;
    if (!currentUserRole) {
      // Guest - pokaż tylko podstawowe publiczne dane
      const publicData = {
        _id: user._id,
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        specialization: user.specialization,
        doctorRating: user.doctorRating,
      };
      return res.json({
        success: true,
        data: publicData,
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Error in getUserById:', error);
    res.status(500).json({
      success: false,
      message: 'Błąd serwera przy pobieraniu użytkownika',
      error: error.message,
    });
  }
};

/**
 * POST /api/users
 * Utwórz nowego użytkownika
 */
exports.createUser = async (req, res) => {
  try {
    const user = await User.create(req.body);

    res.status(201).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Error in createUser:', error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email lub PESEL już istnieje',
      });
    }

    res.status(400).json({
      success: false,
      message: 'Błąd przy tworzeniu użytkownika',
      error: error.message,
    });
  }
};

/**
 * PUT /api/users/:id
 * Aktualizuj użytkownika
 */
exports.updateUser = async (req, res) => {
  try {
    // Nie pozwalaj na aktualizację hasła przez ten endpoint
    delete req.body.password;

    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Użytkownik nie został znaleziony',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Error in updateUser:', error);
    res.status(400).json({
      success: false,
      message: 'Błąd przy aktualizacji użytkownika',
      error: error.message,
    });
  }
};

/**
 * DELETE /api/users/:id
 * Usuń użytkownika
 */
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Użytkownik nie został znaleziony',
      });
    }

    res.json({
      success: true,
      message: 'Użytkownik został usunięty',
      data: {},
    });
  } catch (error) {
    console.error('Error in deleteUser:', error);
    res.status(500).json({
      success: false,
      message: 'Błąd serwera przy usuwaniu użytkownika',
      error: error.message,
    });
  }
};

/**
 * POST /api/users/:id/rate
 * Oceń lekarza
 */
exports.rateDoctor = async (req, res) => {
  try {
    const { id: doctorId } = req.params;
    const { rating, comment } = req.body;
    const patientId = req.user.userId; // Z auth middleware

    // Walidacja
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Ocena musi być w zakresie 1-5',
      });
    }

    // Sprawdź czy to lekarz
    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({
        success: false,
        message: 'Lekarz nie znaleziony',
      });
    }

    // Sprawdź czy pacjent miał wizytę u tego lekarza
    const pastAppointment = await Appointment.findOne({
      doctorId,
      patientId,
      status: { $ne: 'cancelled' }, // Nie anulowana
      startTime: { $lt: new Date() }, // Wizyta już się odbyła
    });

    if (!pastAppointment) {
      return res.status(403).json({
        success: false,
        message: 'Możesz oceniać tylko lekarzy, u których byłeś na wizycie',
      });
    }

    // Utwórz ocenę
    const newRating = await Rating.create({
      doctorId,
      patientId,
      rating,
      comment: comment || '',
    });

    // Zaktualizuj statystyki lekarza
    doctor.doctorRating.totalRating += rating;
    doctor.doctorRating.numberOfRatings += 1;
    doctor.doctorRating.averageRating =
      doctor.doctorRating.totalRating / doctor.doctorRating.numberOfRatings;
    await doctor.save();

    res.status(201).json({
      success: true,
      message: 'Ocena dodana pomyślnie',
      data: newRating,
    });
  } catch (error) {
    console.error('Error in rateDoctor:', error);


    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Już oceniłeś tego lekarza',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Błąd serwera przy ocenianiu lekarza',
      error: error.message,
    });
  }
};

/**
 * GET /api/users/:id/ratings
 * Pobierz wszystkie oceny lekarza
 */
exports.getDoctorRatings = async (req, res) => {
  try {
    const { id: doctorId } = req.params;

    // Sprawdź czy to lekarz
    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({
        success: false,
        message: 'Lekarz nie znaleziony',
      });
    }

    // Pobierz oceny
    const ratings = await Rating.find({ doctorId })
      .populate('patientId', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: ratings,
    });
  } catch (error) {
    console.error('Error in getDoctorRatings:', error);
    res.status(500).json({
      success: false,
      message: 'Błąd serwera przy pobieraniu ocen',
      error: error.message,
    });
  }
};

/**
 * POST /api/users/:id/ratings/:ratingId/reply
 * Lekarz odpowiada na ocenę
 */
exports.replyToRating = async (req, res) => {
  try {
    const { id: doctorId, ratingId } = req.params;
    const { reply } = req.body;
    const currentUserId = req.user.userId;
    const currentUserRole = req.user.role;

    // Walidacja
    if (!ratingId) {
      return res.status(400).json({
        success: false,
        message: 'Rating ID jest wymagany',
      });
    }

    if (!reply || reply.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Odpowiedź nie może być pusta',
      });
    }

    if (reply.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Odpowiedź nie może być dłuższa niż 500 znaków',
      });
    }

    // Sprawdź czy to lekarz i czy to jego profil
    if (currentUserRole !== 'doctor' && currentUserRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Tylko lekarze mogą odpowiadać na oceny',
      });
    }

    if (currentUserRole === 'doctor' && currentUserId !== doctorId) {
      return res.status(403).json({
        success: false,
        message: 'Możesz odpowiadać tylko na oceny w swoim profilu',
      });
    }

    // Znajdź ocenę
    const rating = await Rating.findOne({ _id: ratingId, doctorId });
    if (!rating) {
      return res.status(404).json({
        success: false,
        message: 'Ocena nie znaleziona',
      });
    }

    // Dodaj odpowiedź
    rating.doctorReply = reply;
    rating.repliedAt = new Date();
    await rating.save();

    res.json({
      success: true,
      message: 'Odpowiedź dodana pomyślnie',
      data: rating,
    });
  } catch (error) {
    console.error('Error in replyToRating:', error);
    res.status(500).json({
      success: false,
      message: 'Błąd serwera przy dodawaniu odpowiedzi',
      error: error.message,
    });
  }
};
