/**
 * Skrypt do import danych z mockData.json do MongoDB
 *
 * Użycie: node scripts/seedDatabase.js
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

// Import modeli
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Availability = require('../models/Availability');
const Absence = require('../models/Absence');
const Rating = require('../models/Rating');

async function seedDatabase() {
  try {
    // Połącz z MongoDB
    console.log('Łączenie z MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Połączono z MongoDB');

    // Wyczyść istniejące dane
    console.log('\nUsuwanie istniejących danych...');
    await User.deleteMany({});
    await Appointment.deleteMany({});
    await Availability.deleteMany({});
    await Absence.deleteMany({});
    await Rating.deleteMany({});
    console.log('Baza danych wyczyszczona');

    // Wczytaj mockData.json
    console.log('\nWczytywanie mockData.json...');
    const mockDataPath = path.join(__dirname, '../../public/data/mockData.json');
    const mockData = JSON.parse(fs.readFileSync(mockDataPath, 'utf8'));

    // Import użytkowników (dodaj domyślne hasło i unikalny PESEL)
    console.log('\nImport użytkowników...');
    const usersToCreate = mockData.users.map((user, index) => ({
      ...user,
      password: user.password || 'password123', // Domyślne hasło
      pesel: user.pesel || `${90000000000 + index}`, // Unikalny PESEL jeśli brak
    }));
    // WAŻNE: Użyj User.create() zamiast insertMany() aby uruchomić pre-save middleware (hashowanie hasła!)
    const users = await User.create(usersToCreate);
    console.log(`Zaimportowano ${users.length} użytkowników`);

    // Utwórz mapę starych ID na nowe
    const userIdMap = {};
    mockData.users.forEach((oldUser, index) => {
      userIdMap[oldUser.id] = users[index]._id;
    });

    // Import availabilities z zamianą ID
    console.log('\nImport dostępności...');
    const availabilities = mockData.availabilities.map(avail => ({
      ...avail,
      doctorId: userIdMap[avail.doctorId],
    }));
    const createdAvailabilities = await Availability.insertMany(availabilities);
    console.log(`Zaimportowano ${createdAvailabilities.length} dostępności`);

    // Import absences z zamianą ID
    console.log('\nImport absencji...');
    const absences = mockData.absences.map(absence => ({
      ...absence,
      doctorId: userIdMap[absence.doctorId],
    }));
    const createdAbsences = await Absence.insertMany(absences);
    console.log(`Zaimportowano ${createdAbsences.length} absencji`);

    // Import appointments z zamianą ID
    console.log('\nImport wizyt...');
    const appointments = mockData.appointments.map(app => ({
      ...app,
      doctorId: userIdMap[app.doctorId],
      patientId: userIdMap[app.patientId],
    }));
    const createdAppointments = await Appointment.insertMany(appointments);
    console.log(`Zaimportowano ${createdAppointments.length} wizyt`);

    // Import ratings z zamianą ID (jeśli istnieją)
    let createdRatings = [];
    if (mockData.ratings && mockData.ratings.length > 0) {
      console.log('\nImport ocen...');
      const ratings = mockData.ratings.map(rating => ({
        doctorId: userIdMap[rating.doctorId],
        patientId: userIdMap[rating.patientId],
        appointmentId: rating.appointmentId ? userIdMap[rating.appointmentId] : undefined,
        rating: rating.rating,
        comment: rating.comment,
        doctorReply: rating.doctorReply,
        repliedAt: rating.repliedAt,
        createdAt: rating.createdAt,
        updatedAt: rating.updatedAt,
      }));
      createdRatings = await Rating.insertMany(ratings);
      console.log(`Zaimportowano ${createdRatings.length} ocen`);
    }

    console.log('\nImport zakończony pomyślnie!');
    console.log(`\nPodsumowanie:`);
    console.log(`   Użytkownicy: ${users.length}`);
    console.log(`   Dostępności: ${createdAvailabilities.length}`);
    console.log(`   Absencje: ${createdAbsences.length}`);
    console.log(`   Wizyty: ${createdAppointments.length}`);
    console.log(`   Oceny: ${createdRatings.length}`);

  } catch (error) {
    console.error('\nBłąd podczas importu:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\nPołączenie z MongoDB zamknięte');
  }
}

// Uruchom import
seedDatabase();
