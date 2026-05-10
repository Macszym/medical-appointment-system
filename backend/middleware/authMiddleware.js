/**
 * Auth Middleware - Weryfikacja JWT
 *
 * Middleware do zabezpieczenia endpointów backendu
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware weryfikujący JWT token
 * Dodaje req.user z danymi użytkownika
 */
exports.authenticate = async (req, res, next) => {
  try {
    // Pobierz token z nagłówka Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Brak tokena autoryzacyjnego',
      });
    }

    const token = authHeader.substring(7); // Usuń 'Bearer '

    // Weryfikuj token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Sprawdź czy użytkownik nadal istnieje
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Użytkownik nie znaleziony lub nieaktywny',
      });
    }


    // Sprawdź czy sessionId w tokenie zgadza się z sessionId w bazie
    if (decoded.sessionId && user.sessionId && decoded.sessionId !== user.sessionId) {
      return res.status(401).json({
        success: false,
        message: 'Sesja została unieważniona (logowanie z innego urządzenia)',
        sessionExpired: true,
      });
    }

    // Dodaj dane użytkownika do requesta
    req.user = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      isBanned: user.isBanned,
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Nieprawidłowy token',
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token wygasł',
        expired: true,
      });
    }

    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Błąd autoryzacji',
    });
  }
};

/**
 * Middleware sprawdzający czy użytkownik ma określoną rolę
 * Użycie: authorize('admin'), authorize('doctor', 'admin')
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Brak autentykacji',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Brak uprawnień do wykonania tej operacji',
        requiredRoles: roles,
        userRole: req.user.role,
      });
    }

    next();
  };
};

/**
 * Middleware sprawdzający czy użytkownik nie jest zbanowany
 */
exports.checkBanned = (req, res, next) => {
  if (req.user && req.user.isBanned) {
    return res.status(403).json({
      success: false,
      message: 'Twoje konto zostało zbanowane',
    });
  }
  next();
};

/**
 * Middleware opcjonalnej autentykacji
 * Dodaje req.user jeśli token jest prawidłowy, ale nie zwraca błędu jeśli go nie ma
 */
exports.optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Brak tokena, ale to OK - przechodzimy dalej
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId);
    if (user && user.isActive) {
      req.user = {
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
        isBanned: user.isBanned,
      };
    }

    next();
  } catch (error) {
    // Token nieprawidłowy, ale nie zwracamy błędu
    next();
  }
};
