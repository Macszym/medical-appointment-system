/**
 * Główny komponent aplikacji
 * Konfiguruje routing i providery (Context API)
 */

import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { theme } from './theme';
import { AuthProvider } from './contexts/SimpleAuthContext';
import { CartProvider } from './contexts/SimpleCartContext';
import { DataSourceProvider, useDataSource } from './contexts/DataSourceContext';
import { serviceFactory } from './services/ServiceFactory';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import DoctorSchedulePage from './pages/DoctorSchedulePage';
import DoctorAvailabilityPage from './pages/DoctorAvailabilityPage';
import DoctorRatingsPage from './pages/DoctorRatingsPage';
import DoctorsListPage from './pages/DoctorsListPage';
import PatientDoctorSchedulePage from './pages/PatientDoctorSchedulePage';
import CartPage from './pages/CartPage';
import MyAppointmentsPage from './pages/MyAppointmentsPage';
import SettingsPage from './pages/SettingsPage';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import AdminUsersPage from './pages/AdminUsersPage';
import PrivateRoute from './components/auth/PrivateRoute';

/**
 * Komponent wewnętrzny do inicjalizacji serwisu
 * Musi być wewnątrz DataSourceProvider aby mieć dostęp do contextu
 */
function AppContent() {
  const { dataSource } = useDataSource();

  /**
   * Inicjalizuj serwis przy starcie aplikacji i przy zmianie źródła
   */
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Ustaw źródło w fabryce
        serviceFactory.setDataSource(dataSource);

        // Pobierz aktywny serwis i zainicjalizuj
        const service = serviceFactory.getService();
        await service.initialize();

        console.log(`Data service initialized (${dataSource})`);
      } catch (error) {
        console.error('Failed to initialize data service:', error);
      }
    };

    initializeApp();
  }, [dataSource]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <CartProvider>
          <Layout>
            <Routes>
            {/* Strona główna */}
            <Route path="/" element={<HomePage />} />

            {/* Harmonogram lekarza - tylko dla lekarzy */}
            <Route
              path="/doctor/schedule"
              element={
                <PrivateRoute requiredRole="doctor">
                  <DoctorSchedulePage />
                </PrivateRoute>
              }
            />

            {/* Lista lekarzy - publiczny dostęp */}
            <Route path="/doctors" element={<DoctorsListPage />} />
            <Route path="/doctors/:doctorId" element={<PatientDoctorSchedulePage />} />

            {/* Wizyty pacjenta - tylko dla pacjentów */}
            <Route
              path="/my-appointments"
              element={
                <PrivateRoute requiredRole="patient">
                  <MyAppointmentsPage />
                </PrivateRoute>
              }
            />

            {/* Ustawienia */}
            <Route path="/settings" element={<SettingsPage />} />

            {/* Admin panel - tylko dla adminów */}
            <Route
              path="/admin/users"
              element={
                <PrivateRoute requiredRole="admin">
                  <AdminUsersPage />
                </PrivateRoute>
              }
            />

            {/* Autentykacja  */}
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Koszyk - tylko dla pacjentów */}
            <Route
              path="/cart"
              element={
                <PrivateRoute requiredRole="patient">
                  <CartPage />
                </PrivateRoute>
              }
            />

            {/* Zarządzanie dostępnością - tylko dla lekarzy */}
            <Route
              path="/doctor/availability"
              element={
                <PrivateRoute requiredRole="doctor">
                  <DoctorAvailabilityPage />
                </PrivateRoute>
              }
            />

            {/* Oceny lekarza - tylko dla lekarzy */}
            <Route
              path="/doctor/ratings"
              element={
                <PrivateRoute requiredRole="doctor">
                  <DoctorRatingsPage />
                </PrivateRoute>
              }
            />

            {/* 404 */}
            <Route
              path="*"
              element={
                <div style={{ padding: '48px', textAlign: 'center' }}>
                  <h1>404</h1>
                  <p>Strona nie została znaleziona</p>
                </div>
              }
            />
            </Routes>
          </Layout>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

/**
 * Główny komponent App
 */
function App() {
  return (
    <BrowserRouter>
      <DataSourceProvider>
        <AppContent />
      </DataSourceProvider>
    </BrowserRouter>
  );
}

export default App;
