/* global require, process */

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const pool = require('./config/database');

const restaurantRoutes = require('./routes/restaurantRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const authRoutes = require('./routes/authRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const app = express();

const PORT = process.env.PORT || 5000;


// ============================================================
// MIDDLEWARE
// ============================================================

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());


// ============================================================
// REQUEST DEBUG
// ============================================================

app.use((req, res, next) => {
  console.log(
    `REQUEST: ${req.method} ${req.originalUrl}`
  );

  next();
});


// ============================================================
// ROOT
// ============================================================

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'LUMORA API is running',
  });
});


// ============================================================
// HEALTH CHECK
// ============================================================

app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT current_database() AS database'
    );

    res.json({
      success: true,
      message: 'LUMORA backend and PostgreSQL are connected',
      database: result.rows[0].database,
    });

  } catch (error) {
    console.error(
      'Database connection error:',
      error
    );

    res.status(500).json({
      success: false,
      message: 'Database connection failed',
    });
  }
});


// ============================================================
// DIRECT USER ROUTE TEST
// ============================================================

app.get('/api/users/direct-test', (req, res) => {
  console.log('DIRECT USER TEST ROUTE HIT');

  res.json({
    success: true,
    message: 'DIRECT USER ROUTE WORKING',
  });
});


// ============================================================
// AUTOMATIC BOOKING EXPIRATION
// ============================================================

const expirePendingBookings = async () => {
  try {
    const result = await pool.query(`
      UPDATE bookings
      SET
        status = 'CANCELLED',
        updated_at = NOW()
      WHERE status = 'PENDING'
        AND expires_at IS NOT NULL
        AND expires_at <= NOW()
      RETURNING id
    `);

    if (result.rowCount > 0) {
      console.log(
        `LUMORA: ${result.rowCount} expired booking(s) cancelled`
      );
    }

  } catch (error) {
    console.error(
      'Booking expiration error:',
      error
    );
  }
};


// ============================================================
// AUTOMATIC BOOKING COMPLETION
// ============================================================

const completeFinishedBookings = async () => {
  try {
    const result = await pool.query(`
      UPDATE bookings
      SET
        status = 'COMPLETED',
        updated_at = NOW()
      WHERE status = 'CONFIRMED'
        AND (
          booking_date::date + booking_time
        ) <= (
          CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata'
        )::timestamp
      RETURNING id
    `);

    if (result.rowCount > 0) {
      console.log(
        `LUMORA: ${result.rowCount} booking(s) marked COMPLETED`
      );
    }

  } catch (error) {
    console.error(
      'Booking completion error:',
      error
    );
  }
};


// ============================================================
// INITIAL BOOKING MAINTENANCE
// ============================================================

expirePendingBookings();
completeFinishedBookings();


// ============================================================
// BOOKING MAINTENANCE — EVERY 60 SECONDS
// ============================================================

setInterval(
  expirePendingBookings,
  60 * 1000
);

setInterval(
  completeFinishedBookings,
  60 * 1000
);


// ============================================================
// RESTAURANT ROUTES
// ============================================================

app.use(
  '/api/restaurants',
  restaurantRoutes
);


// ============================================================
// BOOKING ROUTES
// ============================================================

app.use(
  '/api/bookings',
  bookingRoutes
);


// ============================================================
// AUTHENTICATION ROUTES
// ============================================================

app.use(
  '/api/auth',
  authRoutes
);


// ============================================================
// USER ROUTES
// ============================================================

console.log('USER ROUTES LOADED');

app.use(
  '/api/users',
  userRoutes
);


// ============================================================
// PAYMENT ROUTES
// ============================================================

app.use(
  '/api/payments',
  paymentRoutes
);

app.use('/api/admin', adminRoutes);

// ============================================================
// 404 HANDLER
// ============================================================

app.use((req, res) => {
  console.log(
    `404 ROUTE NOT FOUND: ${req.method} ${req.originalUrl}`
  );

  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
  });
});


// ============================================================
// START SERVER
// ============================================================

app.listen(PORT, () => {
  console.log(
    `LUMORA API running on http://localhost:${PORT}`
  );
});