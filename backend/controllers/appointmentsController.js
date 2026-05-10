/**
 * Kontroler Appointments - operacje CRUD na wizytach
 */

const Appointment = require('../models/Appointment');

/**
 * GET /api/appointments
 * Pobierz wizyty z filtrowaniem
 *
 * - Pacjent może widzieć TYLKO swoje wizyty
 * - Lekarz może widzieć TYLKO swoje wizyty
 * - Admin może widzieć wszystkie
 */
exports.getAllAppointments = async (req, res) => {
  try {
    const { doctorId, patientId, startDate, endDate, status } = req.query;
    const filter = {};


    const currentUserId = req.user?.userId;
    const currentUserRole = req.user?.role;

    if (currentUserRole === 'patient') {
      // Pacjent przeglądający harmonogram lekarza może widzieć wszystkie jego wizyty (żeby widzieć zajęte sloty)
      if (doctorId) {
        filter.doctorId = doctorId;
      } else {
        // Pacjent bez doctorId widzi tylko swoje wizyty
        filter.patientId = currentUserId;
      }
    } else if (currentUserRole === 'doctor') {
      // Lekarz może widzieć TYLKO swoje wizyty
      filter.doctorId = currentUserId;
    } else if (currentUserRole === 'admin') {
      // Admin może filtrować jak chce
      if (doctorId) filter.doctorId = doctorId;
      if (patientId) filter.patientId = patientId;
    } else {
      // Brak autentykacji lub nieznana rola - brak dostępu
      return res.status(403).json({
        success: false,
        message: 'Brak dostępu',
      });
    }

    // Dodatkowe filtry (dozwolone dla wszystkich)
    if (status) filter.status = status;

    // Filtrowanie po zakresie dat
    if (startDate || endDate) {
      filter.startTime = {};
      if (startDate) filter.startTime.$gte = new Date(startDate);
      if (endDate) filter.startTime.$lte = new Date(endDate);
    }

    const appointments = await Appointment.find(filter)
      .populate('doctorId', 'firstName lastName email specialization')
      .populate('patientId', 'firstName lastName email')
      .sort({ startTime: 1 });

    res.json({
      success: true,
      count: appointments.length,
      data: appointments,
    });
  } catch (error) {
    console.error('Error in getAllAppointments:', error);
    res.status(500).json({
      success: false,
      message: 'Błąd serwera przy pobieraniu wizyt',
      error: error.message,
    });
  }
};

/**
 * GET /api/appointments/:id
 * Pobierz pojedynczą wizytę
 *
 */
exports.getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('doctorId', 'firstName lastName email specialization')
      .populate('patientId', 'firstName lastName email');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Wizyta nie została znaleziona',
      });
    }


    const currentUserId = req.user?.userId;
    const currentUserRole = req.user?.role;

    const isPatient = currentUserRole === 'patient' && appointment.patientId._id.toString() === currentUserId;
    const isDoctor = currentUserRole === 'doctor' && appointment.doctorId._id.toString() === currentUserId;
    const isAdmin = currentUserRole === 'admin';

    if (!isPatient && !isDoctor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Brak dostępu do tej wizyty',
      });
    }

    res.json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    console.error('Error in getAppointmentById:', error);
    res.status(500).json({
      success: false,
      message: 'Błąd serwera przy pobieraniu wizyty',
      error: error.message,
    });
  }
};

/**
 * POST /api/appointments
 * Utwórz nową wizytę
 */
exports.createAppointment = async (req, res) => {
  try {
    // Sprawdź czy slot nie jest już zajęty
    const existingAppointment = await Appointment.findOne({
      doctorId: req.body.doctorId,
      startTime: req.body.startTime,
      status: { $in: ['reserved', 'confirmed'] },
    });

    if (existingAppointment) {
      return res.status(400).json({
        success: false,
        message: 'Ten termin jest już zajęty',
      });
    }

    const appointment = await Appointment.create(req.body);

    res.status(201).json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    console.error('Error in createAppointment:', error);
    res.status(400).json({
      success: false,
      message: 'Błąd przy tworzeniu wizyty',
      error: error.message,
    });
  }
};

/**
 * PUT /api/appointments/:id
 * Aktualizuj wizytę
 *
 * - Pacjent może aktualizować tylko swoje wizyty (np. anulować)
 * - Lekarz może aktualizować tylko swoje wizyty (np. potwierdzić/odrzucić)
 * - Admin może aktualizować wszystko
 */
exports.updateAppointment = async (req, res) => {
  try {
    // Najpierw pobierz wizytę aby sprawdzić uprawnienia
    const existingAppointment = await Appointment.findById(req.params.id);

    if (!existingAppointment) {
      return res.status(404).json({
        success: false,
        message: 'Wizyta nie została znaleziona',
      });
    }


    const currentUserId = req.user?.userId;
    const currentUserRole = req.user?.role;

    const isPatient = currentUserRole === 'patient' && existingAppointment.patientId.toString() === currentUserId;
    const isDoctor = currentUserRole === 'doctor' && existingAppointment.doctorId.toString() === currentUserId;
    const isAdmin = currentUserRole === 'admin';

    if (!isPatient && !isDoctor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Brak uprawnień do aktualizacji tej wizyty',
      });
    }

    // Aktualizuj wizytę
    const appointment = await Appointment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    console.error('Error in updateAppointment:', error);
    res.status(400).json({
      success: false,
      message: 'Błąd przy aktualizacji wizyty',
      error: error.message,
    });
  }
};

/**
 * DELETE /api/appointments/:id
 * Usuń wizytę
 *
 * - Tylko admin może usuwać wizyty
 */
exports.deleteAppointment = async (req, res) => {
  try {
    // Najpierw pobierz wizytę aby sprawdzić uprawnienia
    const existingAppointment = await Appointment.findById(req.params.id);

    if (!existingAppointment) {
      return res.status(404).json({
        success: false,
        message: 'Wizyta nie została znaleziona',
      });
    }


    const currentUserId = req.user?.userId;
    const currentUserRole = req.user?.role;

    // Sprawdź uprawnienia: Admin, pacjent (swoje) lub lekarz (swoje)
    const isAdmin = currentUserRole === 'admin';
    const isPatientOwner = existingAppointment.patientId?.toString() === currentUserId;
    const isDoctorOwner = existingAppointment.doctorId?.toString() === currentUserId;

    if (!isAdmin && !isPatientOwner && !isDoctorOwner) {
      return res.status(403).json({
        success: false,
        message: 'Brak uprawnień do usuwania tej wizyty',
      });
    }

    const appointment = await Appointment.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Wizyta została usunięta',
      data: {},
    });
  } catch (error) {
    console.error('Error in deleteAppointment:', error);
    res.status(500).json({
      success: false,
      message: 'Błąd serwera przy usuwaniu wizyty',
      error: error.message,
    });
  }
};
