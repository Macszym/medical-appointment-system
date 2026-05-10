/**
 * Auth Controller - Autentykacja JWT
 *
 * - POST /auth/register - rejestracja nowego użytkownika
 * - POST /auth/login - logowanie i generowanie JWT
 * - POST /auth/refresh - odświeżanie access token
 * - POST /auth/logout - wylogowanie (czyszczenie refresh token)
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');

// Czas życia tokenów
const ACCESS_TOKEN_EXPIRY = '15m'; // 15 minut
const REFRESH_TOKEN_EXPIRY = '7d'; // 7 dni

/**
 * Generuje access token (krótki)
 */
const generateAccessToken = (user) => {
  return jwt.sign(
    {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      sessionId: user.sessionId,
    },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
};

/**
 * Generuje refresh token (długi)
 */
const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      userId: user._id.toString(),
      email: user.email,
      sessionId: user.sessionId, // Dodaj sessionId dla single session enforcement
    },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
};

/**
 * POST /auth/register
 * Rejestracja nowego użytkownika
 */
exports.register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, pesel, role } = req.body;

    // Walidacja
    if (!email || !password || !firstName || !lastName || !pesel) {
      return res.status(400).json({
        success: false,
        message: 'Wszystkie pola są wymagane',
      });
    }

    // Sprawdź czy użytkownik już istnieje
    const existingUser = await User.findOne({ $or: [{ email }, { pesel }] });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Użytkownik z tym emailem lub PESEL już istnieje',
      });
    }

    // Tylko admin może rejestrować lekarzy
    // Dla zwykłej rejestracji zawsze tworzymy pacjenta
    const userRole = role === 'doctor' || role === 'admin' ? 'patient' : (role || 'patient');

    // Generuj sessionId 
    const sessionId = crypto.randomBytes(32).toString('hex');

    // Utwórz nowego użytkownika
    const user = await User.create({
      email,
      password, // Zostanie automatycznie zahashowane przez pre-save hook
      firstName,
      lastName,
      pesel,
      role: userRole,
      isActive: true,
      isBanned: false,
      sessionId,
    });

    // Generuj tokeny
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Zwróć dane użytkownika bez hasła
    const userResponse = user.toJSON();

    res.status(201).json({
      success: true,
      message: 'Rejestracja zakończona pomyślnie',
      data: {
        user: userResponse,
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Błąd podczas rejestracji',
      error: error.message,
    });
  }
};

/**
 * POST /auth/login
 * Logowanie użytkownika
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Walidacja
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email i hasło są wymagane',
      });
    }

    // Znajdź użytkownika (include password do weryfikacji)
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Nieprawidłowy email lub hasło',
      });
    }

    // Sprawdź czy konto jest aktywne
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Konto zostało dezaktywowane',
      });
    }

    // Weryfikuj hasło
    const isPasswordValid = await user.matchPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Nieprawidłowy email lub hasło',
      });
    }

    // Generuj nowy sessionId 
    // To unieważni poprzednią sesję użytkownika (single session enforcement)
    const sessionId = crypto.randomBytes(32).toString('hex');
    user.sessionId = sessionId;
    await user.save();

    // Generuj tokeny
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Zwróć dane użytkownika bez hasła
    const userResponse = user.toJSON();

    res.json({
      success: true,
      message: 'Logowanie pomyślne',
      data: {
        user: userResponse,
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Błąd podczas logowania',
      error: error.message,
    });
  }
};

/**
 * POST /auth/refresh
 * Odświeża access token używając refresh token
 */
exports.refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token jest wymagany',
      });
    }

    // Weryfikuj refresh token
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
    );

    // Znajdź użytkownika
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Nieprawidłowy refresh token',
      });
    }

    // Sprawdź czy sessionId w refresh token zgadza się z sessionId w bazie
    // Jeśli nie - oznacza to że użytkownik zalogował się z innego urządzenia
    if (decoded.sessionId && user.sessionId && decoded.sessionId !== user.sessionId) {
      return res.status(401).json({
        success: false,
        message: 'Sesja została unieważniona (logowanie z innego urządzenia)',
        sessionExpired: true,
      });
    }

    // Generuj nowy access token
    const newAccessToken = generateAccessToken(user);

    res.json({
      success: true,
      data: {
        accessToken: newAccessToken,
      },
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({
      success: false,
      message: 'Nieprawidłowy lub wygasły refresh token',
    });
  }
};

/**
 * POST /auth/logout
 * Wylogowanie (w przyszłości - blacklisting tokenów)
 */
exports.logout = async (req, res) => {
  try {
    // W przyszłości można dodać blacklist tokenów w Redis/MongoDB
    // Na razie po prostu zwracamy sukces

    res.json({
      success: true,
      message: 'Wylogowano pomyślnie',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Błąd podczas wylogowania',
    });
  }
};

/**
 * GET /auth/me
 * Pobiera dane zalogowanego użytkownika (wymaga auth middleware)
 */
exports.getCurrentUser = async (req, res) => {
  try {
    // req.user jest ustawiane przez auth middleware
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Użytkownik nie znaleziony',
      });
    }

    res.json({
      success: true,
      data: user.toJSON(),
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Błąd podczas pobierania danych użytkownika',
    });
  }
};
