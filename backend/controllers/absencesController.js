/**
 * Kontroler Absences - operacje CRUD na absencjach lekarzy
 */

const Absence = require('../models/Absence');

/**
 * GET /api/absences
 * Pobierz absencje z filtrowaniem
 */
exports.getAllAbsences = async (req, res) => {
  try {
    const { doctorId } = req.query;
    const filter = {};

    if (doctorId) filter.doctorId = doctorId;

    const absences = await Absence.find(filter)
      .populate('doctorId', 'firstName lastName email specialization')
      .sort({ startDate: 1 });

    res.json({
      success: true,
      count: absences.length,
      data: absences,
    });
  } catch (error) {
    console.error('Error in getAllAbsences:', error);
    res.status(500).json({
      success: false,
      message: 'Błąd serwera przy pobieraniu absencji',
      error: error.message,
    });
  }
};

/**
 * GET /api/absences/:id
 * Pobierz pojedynczą absencję
 */
exports.getAbsenceById = async (req, res) => {
  try {
    const absence = await Absence.findById(req.params.id).populate(
      'doctorId',
      'firstName lastName email specialization'
    );

    if (!absence) {
      return res.status(404).json({
        success: false,
        message: 'Absencja nie została znaleziona',
      });
    }

    res.json({
      success: true,
      data: absence,
    });
  } catch (error) {
    console.error('Error in getAbsenceById:', error);
    res.status(500).json({
      success: false,
      message: 'Błąd serwera przy pobieraniu absencji',
      error: error.message,
    });
  }
};

/**
 * POST /api/absences
 * Utwórz nową absencję
 */
exports.createAbsence = async (req, res) => {
  try {
    const absence = await Absence.create(req.body);

    res.status(201).json({
      success: true,
      data: absence,
    });
  } catch (error) {
    console.error('Error in createAbsence:', error);
    res.status(400).json({
      success: false,
      message: 'Błąd przy tworzeniu absencji',
      error: error.message,
    });
  }
};

/**
 * PUT /api/absences/:id
 * Aktualizuj absencję
 */
exports.updateAbsence = async (req, res) => {
  try {
    const absence = await Absence.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!absence) {
      return res.status(404).json({
        success: false,
        message: 'Absencja nie została znaleziona',
      });
    }

    res.json({
      success: true,
      data: absence,
    });
  } catch (error) {
    console.error('Error in updateAbsence:', error);
    res.status(400).json({
      success: false,
      message: 'Błąd przy aktualizacji absencji',
      error: error.message,
    });
  }
};

/**
 * DELETE /api/absences/:id
 * Usuń absencję
 */
exports.deleteAbsence = async (req, res) => {
  try {
    const absence = await Absence.findByIdAndDelete(req.params.id);

    if (!absence) {
      return res.status(404).json({
        success: false,
        message: 'Absencja nie została znaleziona',
      });
    }

    res.json({
      success: true,
      message: 'Absencja została usunięta',
      data: {},
    });
  } catch (error) {
    console.error('Error in deleteAbsence:', error);
    res.status(500).json({
      success: false,
      message: 'Błąd serwera przy usuwaniu absencji',
      error: error.message,
    });
  }
};
