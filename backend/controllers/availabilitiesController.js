/**
 * Kontroler Availabilities - operacje CRUD na dostępności lekarzy
 */

const Availability = require('../models/Availability');

/**
 * GET /api/availabilities
 * Pobierz dostępności z filtrowaniem
 */
exports.getAllAvailabilities = async (req, res) => {
  try {
    const { doctorId, type } = req.query;
    const filter = {};

    if (doctorId) filter.doctorId = doctorId;
    if (type) filter.type = type;

    const availabilities = await Availability.find(filter)
      .populate('doctorId', 'firstName lastName email specialization')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: availabilities.length,
      data: availabilities,
    });
  } catch (error) {
    console.error('Error in getAllAvailabilities:', error);
    res.status(500).json({
      success: false,
      message: 'Błąd serwera przy pobieraniu dostępności',
      error: error.message,
    });
  }
};

/**
 * GET /api/availabilities/:id
 * Pobierz pojedynczą dostępność
 */
exports.getAvailabilityById = async (req, res) => {
  try {
    const availability = await Availability.findById(req.params.id).populate(
      'doctorId',
      'firstName lastName email specialization'
    );

    if (!availability) {
      return res.status(404).json({
        success: false,
        message: 'Dostępność nie została znaleziona',
      });
    }

    res.json({
      success: true,
      data: availability,
    });
  } catch (error) {
    console.error('Error in getAvailabilityById:', error);
    res.status(500).json({
      success: false,
      message: 'Błąd serwera przy pobieraniu dostępności',
      error: error.message,
    });
  }
};

/**
 * POST /api/availabilities
 * Utwórz nową dostępność
 */
exports.createAvailability = async (req, res) => {
  try {
    const availability = await Availability.create(req.body);

    res.status(201).json({
      success: true,
      data: availability,
    });
  } catch (error) {
    console.error('Error in createAvailability:', error);
    res.status(400).json({
      success: false,
      message: 'Błąd przy tworzeniu dostępności',
      error: error.message,
    });
  }
};

/**
 * PUT /api/availabilities/:id
 * Aktualizuj dostępność
 */
exports.updateAvailability = async (req, res) => {
  try {
    const availability = await Availability.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!availability) {
      return res.status(404).json({
        success: false,
        message: 'Dostępność nie została znaleziona',
      });
    }

    res.json({
      success: true,
      data: availability,
    });
  } catch (error) {
    console.error('Error in updateAvailability:', error);
    res.status(400).json({
      success: false,
      message: 'Błąd przy aktualizacji dostępności',
      error: error.message,
    });
  }
};

/**
 * DELETE /api/availabilities/:id
 * Usuń dostępność
 */
exports.deleteAvailability = async (req, res) => {
  try {
    const availability = await Availability.findByIdAndDelete(req.params.id);

    if (!availability) {
      return res.status(404).json({
        success: false,
        message: 'Dostępność nie została znaleziona',
      });
    }

    res.json({
      success: true,
      message: 'Dostępność została usunięta',
      data: {},
    });
  } catch (error) {
    console.error('Error in deleteAvailability:', error);
    res.status(500).json({
      success: false,
      message: 'Błąd serwera przy usuwaniu dostępności',
      error: error.message,
    });
  }
};
