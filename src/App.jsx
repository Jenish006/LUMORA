import { useEffect } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
} from 'react-router-dom';

import Home from './pages/Home/Home';
import Reservation from './pages/Reservation/Reservation';
import RestaurantDetails from './pages/RestaurantDetails/RestaurantDetails';
import BookingSummary from './pages/BookingSummary/BookingSummary';
import Payment from './pages/Payment/Payment';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Account from './pages/Account/Account';
import ForgotPassword from './pages/Auth/ForgotPassword';
import BookingConfirmation from './pages/BookingConfirmation/BookingConfirmation';
import BookingDetails from './pages/BookingDetails/BookingDetails';

import AdminLayout from './pages/Admin/AdminLayout';
import AdminDashboard from './pages/Admin/AdminDashboard';
import AdminBookings from './pages/Admin/AdminBookings';
import AdminBookingDetails from './pages/Admin/AdminBookingDetails';
import AdminUsers from './pages/Admin/AdminUsers';
import AdminRestaurants from './pages/Admin/AdminRestaurants';
import AdminPayments from './pages/Admin/AdminPayments';
import AdminProtectedRoute from './pages/Admin/AdminProtectedRoute';

import useLenis from './hooks/useLenis';
import { initScrollAnimations } from './animations/scrollAnimations';

import './App.css';

function AppContent() {
  useLenis();

  useEffect(() => {
    const timer = setTimeout(() => {
      initScrollAnimations();
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  return (
    <Routes>

      {/* =========================
          CUSTOMER ROUTES
         ========================= */}

      <Route
        path="/"
        element={<Home />}
      />

      <Route
        path="/reserve"
        element={<Reservation />}
      />

      <Route
        path="/booking-summary"
        element={<BookingSummary />}
      />

      <Route
        path="/payment"
        element={<Payment />}
      />

      <Route
        path="/booking-confirmation"
        element={<BookingConfirmation />}
      />

      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/register"
        element={<Register />}
      />

      <Route
        path="/forgot-password"
        element={<ForgotPassword />}
      />

      <Route
        path="/account"
        element={<Account />}
      />

      <Route
        path="/booking-details/:bookingId"
        element={<BookingDetails />}
      />

      <Route
        path="/restaurant/:restaurantId"
        element={<RestaurantDetails />}
      />

      {/* =========================
          ADMIN ROUTES
         ========================= */}

      <Route
        path="/admin"
        element={<AdminProtectedRoute />}
      >
        <Route
          element={<AdminLayout />}
        >
          <Route
            index
            element={<AdminDashboard />}
          />

          <Route
            path="bookings"
            element={<AdminBookings />}
          />

          <Route
            path="bookings/:bookingId"
            element={<AdminBookingDetails />}
          />

          <Route
            path="users"
            element={<AdminUsers />}
          />

          <Route
            path="restaurants"
            element={<AdminRestaurants />}
          />

          <Route
            path="payments"
            element={<AdminPayments />}
          />
        </Route>
      </Route>

    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;