/* global require, module, process */

const express = require('express');
const Razorpay = require('razorpay');
const pool = require('../config/database');
const authenticateToken = require('../middleware/authMiddleware');

const router = express.Router();

// ============================================================
// RAZORPAY
// ============================================================

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// ============================================================
// PAYMENT WINDOW
// ============================================================

const PAYMENT_EXPIRATION_MINUTES = 10;

// ============================================================
// POST /api/bookings
// Create booking
// ============================================================

router.post('/', authenticateToken, async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      restaurant_id,
      table_id,
      private_room_id,
      booking_date,
      booking_time,
      guests,
      special_request
    } = req.body;

    const user_id = req.user.id;

    if (!user_id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const restaurantId = Number(restaurant_id);

    if (!Number.isInteger(restaurantId) || restaurantId < 1) {
      return res.status(400).json({
        success: false,
        message: 'Valid restaurant ID is required'
      });
    }

    if (!booking_date) {
      return res.status(400).json({
        success: false,
        message: 'Booking date is required'
      });
    }

    const datePattern = /^\d{4}-\d{2}-\d{2}$/;

    if (!datePattern.test(booking_date)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking date format. Use YYYY-MM-DD'
      });
    }

    if (!booking_time) {
      return res.status(400).json({
        success: false,
        message: 'Booking time is required'
      });
    }

    const timePattern = /^\d{2}:\d{2}$/;

    if (!timePattern.test(booking_time)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking time format. Use HH:MM'
      });
    }

    const [hours, minutes] = booking_time.split(':').map(Number);

    if (
      hours < 0 ||
      hours > 23 ||
      minutes < 0 ||
      minutes > 59
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking time'
      });
    }

    const bookingDate = new Date(`${booking_date}T00:00:00`);

    if (Number.isNaN(bookingDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking date'
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (bookingDate < today) {
      return res.status(400).json({
        success: false,
        message: 'Booking date cannot be in the past'
      });
    }

    if (bookingDate.getTime() === today.getTime()) {
      const bookingDateTime = new Date();

      bookingDateTime.setHours(
        hours,
        minutes,
        0,
        0
      );

      if (bookingDateTime <= new Date()) {
        return res.status(400).json({
          success: false,
          message: 'Booking time must be in the future'
        });
      }
    }

    const guestCount = Number(guests);

    if (
      !Number.isInteger(guestCount) ||
      guestCount < 1
    ) {
      return res.status(400).json({
        success: false,
        message: 'Valid guest count is required'
      });
    }

    const tableId = table_id
      ? Number(table_id)
      : null;

    const privateRoomId = private_room_id
      ? Number(private_room_id)
      : null;

    if (
      tableId !== null &&
      (
        !Number.isInteger(tableId) ||
        tableId < 1
      )
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid table ID'
      });
    }

    if (
      privateRoomId !== null &&
      (
        !Number.isInteger(privateRoomId) ||
        privateRoomId < 1
      )
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid private room ID'
      });
    }

    if (!tableId && !privateRoomId) {
      return res.status(400).json({
        success: false,
        message:
          'Either table_id or private_room_id is required'
      });
    }

    if (tableId && privateRoomId) {
      return res.status(400).json({
        success: false,
        message:
          'Choose either a table or a private room, not both'
      });
    }

    await client.query('BEGIN');

    const restaurantResult = await client.query(
      `
      SELECT
        id,
        name
      FROM restaurants
      WHERE id = $1
        AND is_active = TRUE
      LIMIT 1
      `,
      [restaurantId]
    );

    if (restaurantResult.rows.length === 0) {
      await client.query('ROLLBACK');

      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    let paymentAmount = 0;

    // ============================================================
    // TABLE BOOKING
    // ============================================================

    if (tableId) {
      const tableResult = await client.query(
        `
        SELECT
          id,
          restaurant_id,
          capacity,
          is_available
        FROM restaurant_tables
        WHERE id = $1
          AND restaurant_id = $2
        LIMIT 1
        `,
        [
          tableId,
          restaurantId
        ]
      );

      if (tableResult.rows.length === 0) {
        await client.query('ROLLBACK');

        return res.status(404).json({
          success: false,
          message: 'Table not found'
        });
      }

      const table = tableResult.rows[0];

      if (!table.is_available) {
        await client.query('ROLLBACK');

        return res.status(400).json({
          success: false,
          message:
            'This table is currently unavailable'
        });
      }

      if (guestCount > table.capacity) {
        await client.query('ROLLBACK');

        return res.status(400).json({
          success: false,
          message:
            `This table can accommodate only ${table.capacity} guests`
        });
      }

      const existingBooking = await client.query(
        `
        SELECT id
        FROM bookings
        WHERE table_id = $1
          AND booking_date = $2
          AND booking_time = $3
          AND status IN ('PENDING', 'CONFIRMED')
        LIMIT 1
        `,
        [
          tableId,
          booking_date,
          booking_time
        ]
      );

      if (existingBooking.rows.length > 0) {
        await client.query('ROLLBACK');

        return res.status(409).json({
          success: false,
          message:
            'This table is already booked for the selected date and time'
        });
      }

      // ============================================================
      // SERVER-SIDE TABLE PRICING
      // ============================================================

      const tablePrices = {
        1: 2500,
        2: 2500,
        3: 3000,
        4: 3000
      };

      paymentAmount = tablePrices[restaurantId];

      if (paymentAmount === undefined) {
        await client.query('ROLLBACK');

        return res.status(400).json({
          success: false,
          message:
            'Pricing is not configured for this restaurant'
        });
      }
    }

    // ============================================================
    // PRIVATE ROOM BOOKING
    // ============================================================

    if (privateRoomId) {
      const roomResult = await client.query(
        `
        SELECT
          id,
          restaurant_id,
          capacity,
          price,
          is_available
        FROM private_rooms
        WHERE id = $1
          AND restaurant_id = $2
        LIMIT 1
        `,
        [
          privateRoomId,
          restaurantId
        ]
      );

      if (roomResult.rows.length === 0) {
        await client.query('ROLLBACK');

        return res.status(404).json({
          success: false,
          message: 'Private room not found'
        });
      }

      const room = roomResult.rows[0];

      if (!room.is_available) {
        await client.query('ROLLBACK');

        return res.status(400).json({
          success: false,
          message:
            'This private room is currently unavailable'
        });
      }

      if (guestCount > room.capacity) {
        await client.query('ROLLBACK');

        return res.status(400).json({
          success: false,
          message:
            `This private room can accommodate only ${room.capacity} guests`
        });
      }

      const existingBooking = await client.query(
        `
        SELECT id
        FROM bookings
        WHERE private_room_id = $1
          AND booking_date = $2
          AND booking_time = $3
          AND status IN ('PENDING', 'CONFIRMED')
        LIMIT 1
        `,
        [
          privateRoomId,
          booking_date,
          booking_time
        ]
      );

      if (existingBooking.rows.length > 0) {
        await client.query('ROLLBACK');

        return res.status(409).json({
          success: false,
          message:
            'This private room is already booked for the selected date and time'
        });
      }

      paymentAmount = Number(room.price);

      if (
        !Number.isFinite(paymentAmount) ||
        paymentAmount < 0
      ) {
        await client.query('ROLLBACK');

        return res.status(400).json({
          success: false,
          message:
            'Invalid private room pricing'
        });
      }
    }

    // ============================================================
    // CREATE BOOKING
    // ============================================================

    const bookingResult = await client.query(
      `
      INSERT INTO bookings (
        user_id,
        restaurant_id,
        table_id,
        private_room_id,
        booking_date,
        booking_time,
        guests,
        special_request,
        total_amount,
        expires_at
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        NOW() + INTERVAL '${PAYMENT_EXPIRATION_MINUTES} minutes'
      )
      RETURNING
        id,
        user_id,
        restaurant_id,
        table_id,
        private_room_id,
        booking_date,
        booking_time,
        guests,
        status,
        special_request,
        total_amount,
        created_at,
        updated_at,
        expires_at
      `,
      [
        user_id,
        restaurantId,
        tableId,
        privateRoomId,
        booking_date,
        booking_time,
        guestCount,
        special_request || null,
        paymentAmount
      ]
    );

    await client.query('COMMIT');

    return res.status(201).json({
      success: true,
      message:
        'Booking created successfully',
      booking:
        bookingResult.rows[0]
    });

  } catch (error) {

    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      console.error(
        'Rollback error:',
        rollbackError
      );
    }

    console.error(
      'Create booking error:',
      error
    );

    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message:
          'This table or private room is no longer available for the selected date and time'
      });
    }

    return res.status(500).json({
      success: false,
      message:
        'Failed to create booking'
    });

  } finally {
    client.release();
  }
});

// ============================================================
// GET /api/bookings
// ============================================================

router.get('/', authenticateToken, async (req, res) => {
  try {
    const user_id = req.user.id;

    const result = await pool.query(
      `
      SELECT
        b.id,
        b.user_id,
        b.restaurant_id,
        b.table_id,
        b.private_room_id,
        b.booking_date,
        b.booking_time,
        b.guests,
        b.status,
        b.special_request,
        b.total_amount,
        b.created_at,
        b.updated_at,
        b.expires_at,

        r.name AS restaurant_name,
        r.slug AS restaurant_slug,
        r.city AS restaurant_city,
        r.cuisine AS restaurant_cuisine,

        rt.table_name,
        rt.location AS table_location,

        pr.room_name,
        pr.price AS room_price

      FROM bookings b

      INNER JOIN restaurants r
        ON r.id = b.restaurant_id

      LEFT JOIN restaurant_tables rt
        ON rt.id = b.table_id

      LEFT JOIN private_rooms pr
        ON pr.id = b.private_room_id

      WHERE b.user_id = $1

      ORDER BY
        b.booking_date DESC,
        b.booking_time DESC,
        b.id DESC
      `,
      [user_id]
    );

    return res.json({
      success: true,
      count: result.rows.length,
      bookings: result.rows
    });

  } catch (error) {
    console.error(
      'Get user bookings error:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        'Failed to fetch bookings'
    });
  }
});

// ============================================================
// GET /api/bookings/:id
// ============================================================

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const user_id = req.user.id;
    const booking_id = Number(req.params.id);

    if (
      !Number.isInteger(booking_id) ||
      booking_id < 1
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Invalid booking ID'
      });
    }

    const result = await pool.query(
      `
      SELECT
        b.id,
        b.user_id,
        b.restaurant_id,
        b.table_id,
        b.private_room_id,
        b.booking_date,
        b.booking_time,
        b.guests,
        b.status,
        b.special_request,
        b.total_amount,
        b.created_at,
        b.updated_at,
        b.expires_at,

        r.name AS restaurant_name,
        r.slug AS restaurant_slug,
        r.city AS restaurant_city,
        r.cuisine AS restaurant_cuisine,

        rt.table_name,
        rt.location AS table_location,

        pr.room_name,
        pr.price AS room_price

      FROM bookings b

      INNER JOIN restaurants r
        ON r.id = b.restaurant_id

      LEFT JOIN restaurant_tables rt
        ON rt.id = b.table_id

      LEFT JOIN private_rooms pr
        ON pr.id = b.private_room_id

      WHERE b.id = $1
        AND b.user_id = $2

      LIMIT 1
      `,
      [
        booking_id,
        user_id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          'Booking not found'
      });
    }

    return res.json({
      success: true,
      booking:
        result.rows[0]
    });

  } catch (error) {
    console.error(
      'Get booking error:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        'Failed to fetch booking'
    });
  }
});

// ============================================================
// POST /api/bookings/:id/cancel
// Cancel booking + REAL Razorpay refund
// ============================================================

router.post('/:id/cancel', authenticateToken, async (req, res) => {
  const client = await pool.connect();

  try {
    const user_id = req.user.id;
    const booking_id = Number(req.params.id);

    if (
      !Number.isInteger(booking_id) ||
      booking_id < 1
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Invalid booking ID'
      });
    }

    await client.query('BEGIN');

    // ============================================================
    // GET BOOKING
    // ============================================================

    const bookingResult = await client.query(
      `
      SELECT
        id,
        user_id,
        status,
        booking_date,
        booking_time,
        expires_at
      FROM bookings
      WHERE id = $1
        AND user_id = $2
      FOR UPDATE
      `,
      [
        booking_id,
        user_id
      ]
    );

    if (bookingResult.rows.length === 0) {
      await client.query('ROLLBACK');

      return res.status(404).json({
        success: false,
        message:
          'Booking not found'
      });
    }

    const booking = bookingResult.rows[0];

    // ============================================================
    // ALREADY CANCELLED
    // ============================================================

    if (booking.status === 'CANCELLED') {
      await client.query('ROLLBACK');

      return res.status(400).json({
        success: false,
        message:
          'Booking is already cancelled'
      });
    }

    // ============================================================
    // COMPLETED
    // ============================================================

    if (booking.status === 'COMPLETED') {
      await client.query('ROLLBACK');

      return res.status(400).json({
        success: false,
        message:
          'Completed bookings cannot be cancelled'
      });
    }

    // ============================================================
    // ALLOWED STATUSES
    // ============================================================

    if (
      booking.status !== 'PENDING' &&
      booking.status !== 'CONFIRMED'
    ) {
      await client.query('ROLLBACK');

      return res.status(400).json({
        success: false,
        message:
          'Booking cannot be cancelled in its current status'
      });
    }

    // ============================================================
    // GET PAYMENT
    // ============================================================

    const paymentResult = await client.query(
      `
      SELECT
        id,
        booking_id,
        provider,
        provider_order_id,
        provider_payment_id,
        amount,
        currency,
        status,
        paid_at
      FROM payments
      WHERE booking_id = $1
      LIMIT 1
      FOR UPDATE
      `,
      [booking_id]
    );

    let refundStatus = 'NOT_REQUIRED';
    let refundId = null;

    // ============================================================
    // PAYMENT EXISTS
    // ============================================================

    if (paymentResult.rows.length > 0) {

      const payment = paymentResult.rows[0];

      console.log('');
      console.log(
        '============================================================'
      );
      console.log(
        'LUMORA REFUND DEBUG'
      );
      console.log(
        '============================================================'
      );

      console.log(
        'Booking ID:',
        booking_id
      );

      console.log(
        'Payment DB ID:',
        payment.id
      );

      console.log(
        'Provider:',
        payment.provider
      );

      console.log(
        'Provider Order ID:',
        payment.provider_order_id
      );

      console.log(
        'Provider Payment ID:',
        payment.provider_payment_id
      );

      console.log(
        'DB Amount:',
        payment.amount
      );

      console.log(
        'DB Currency:',
        payment.currency
      );

      console.log(
        'DB Payment Status:',
        payment.status
      );

      // ==========================================================
      // PAID PAYMENT
      // ==========================================================

      if (payment.status === 'PAID') {

        if (
          payment.provider !== 'RAZORPAY' ||
          !payment.provider_payment_id
        ) {
          await client.query('ROLLBACK');

          return res.status(400).json({
            success: false,
            message:
              'Valid Razorpay payment information not found'
          });
        }

        // ========================================================
        // FETCH ACTUAL RAZORPAY PAYMENT
        // ========================================================

        let razorpayPayment;

        try {

          console.log(
            'Fetching payment from Razorpay...'
          );

          razorpayPayment =
            await razorpay.payments.fetch(
              payment.provider_payment_id
            );

          // ======================================================
          // BASIC PAYMENT DATA
          // ======================================================

          console.log(
            'Razorpay Payment ID:',
            razorpayPayment?.id
          );

          console.log(
            'Razorpay Status:',
            razorpayPayment?.status
          );

          console.log(
            'Razorpay Amount:',
            razorpayPayment?.amount
          );

          console.log(
            'Razorpay Amount Paid:',
            razorpayPayment?.amount_paid
          );

          console.log(
            'Razorpay Amount Refunded:',
            razorpayPayment?.amount_refunded
          );

          console.log(
            'Razorpay Refund Status:',
            razorpayPayment?.refund_status
          );

          console.log(
            'Razorpay Currency:',
            razorpayPayment?.currency
          );

          // ======================================================
          // EXTRA RAZORPAY PAYMENT DETAILS
          // ======================================================

          console.log(
            'Razorpay Method:',
            razorpayPayment?.method
          );

          console.log(
            'Razorpay Email:',
            razorpayPayment?.email
          );

          console.log(
            'Razorpay Contact:',
            razorpayPayment?.contact
          );

          console.log(
            'Razorpay Order ID:',
            razorpayPayment?.order_id
          );

          console.log(
            'Razorpay Description:',
            razorpayPayment?.description
          );

          console.log(
            'Razorpay Notes:',
            razorpayPayment?.notes
          );

        } catch (fetchError) {

          console.error('');
          console.error(
            '============================================================'
          );
          console.error(
            'RAZORPAY PAYMENT FETCH ERROR'
          );
          console.error(
            '============================================================'
          );

          console.error(
            'Status Code:',
            fetchError?.statusCode
          );

          console.error(
            'Error Code:',
            fetchError?.error?.code
          );

          console.error(
            'Description:',
            fetchError?.error?.description
          );

          console.error(
            'Reason:',
            fetchError?.error?.reason
          );

          console.error(
            'Source:',
            fetchError?.error?.source
          );

          console.error(
            'Step:',
            fetchError?.error?.step
          );

          console.error(
            '============================================================'
          );

          await client.query('ROLLBACK');

          return res.status(502).json({
            success: false,
            message:
              'Unable to verify the Razorpay payment before refund',
            razorpay_error: {
              status_code:
                fetchError?.statusCode || null,
              code:
                fetchError?.error?.code || null,
              description:
                fetchError?.error?.description || null
            }
          });
        }

        // ========================================================
        // CURRENCY
        // ========================================================

        if (
          razorpayPayment.currency &&
          razorpayPayment.currency !== 'INR'
        ) {
          await client.query('ROLLBACK');

          return res.status(400).json({
            success: false,
            message:
              'Razorpay payment currency is not INR'
          });
        }

        // ========================================================
        // CAPTURED CHECK
        // ========================================================

        if (
          razorpayPayment.status !== 'captured'
        ) {

          console.error(
            'Payment is not captured.'
          );

          console.error(
            'Actual Razorpay status:',
            razorpayPayment.status
          );

          await client.query('ROLLBACK');

          return res.status(400).json({
            success: false,
            message:
              `Refund cannot be processed because the Razorpay payment status is "${razorpayPayment.status}".`
          });
        }

        // ========================================================
        // AMOUNT
        // ========================================================

        const razorpayAmount =
          Number(
            razorpayPayment.amount || 0
          );

        const amountRefunded =
          Number(
            razorpayPayment.amount_refunded || 0
          );

        const dbAmount =
          Number(
            payment.amount || 0
          );

        console.log(
          'DB Amount Rupees:',
          dbAmount
        );

        console.log(
          'Razorpay Amount Paise:',
          razorpayAmount
        );

        console.log(
          'Amount Refunded Paise:',
          amountRefunded
        );

        // ========================================================
        // VALIDATE AMOUNT
        // ========================================================

        if (
          !Number.isFinite(razorpayAmount) ||
          razorpayAmount <= 0
        ) {
          await client.query('ROLLBACK');

          return res.status(400).json({
            success: false,
            message:
              'Invalid payment amount received from Razorpay'
          });
        }

        // ========================================================
        // REFUNDABLE AMOUNT
        // ========================================================

        const refundableAmount =
          razorpayAmount - amountRefunded;

        console.log(
          'Refundable Amount Paise:',
          refundableAmount
        );

        // ========================================================
        // ALREADY FULLY REFUNDED
        // ========================================================

        if (refundableAmount <= 0) {

          console.log(
            'Payment is already fully refunded.'
          );

          refundStatus =
            'ALREADY_REFUNDED';

          await client.query(
            `
            UPDATE payments
            SET
              status = 'REFUNDED',
              updated_at = NOW()
            WHERE id = $1
            `,
            [payment.id]
          );

        } else {

          // ======================================================
          // AMOUNT COMPARISON
          // ======================================================

          const dbAmountPaise =
            Math.round(dbAmount * 100);

          if (
            dbAmountPaise !== razorpayAmount
          ) {
            console.warn(
              'WARNING: DB amount and Razorpay amount do not match.'
            );

            console.warn(
              'DB Amount Paise:',
              dbAmountPaise
            );

            console.warn(
              'Razorpay Amount Paise:',
              razorpayAmount
            );
          }

          // ======================================================
          // REFUND REMAINING AMOUNT
          // ======================================================

          console.log(
            'Final Refund Amount Paise:',
            refundableAmount
          );

          let razorpayRefund;

          try {

            console.log('');
            console.log(
              'Calling Razorpay refund API...'
            );

            console.log(
              'Refund Payment ID:',
              payment.provider_payment_id
            );

            console.log(
              'Refund Amount Paise:',
              refundableAmount
            );

            /*
             * REFUND REMAINING AMOUNT
             *
             * Example:
             *
             * Original payment = 300000 paise
             * Already refunded = 100000 paise
             * Remaining        = 200000 paise
             *
             * Razorpay receives amount = 200000
             */

            razorpayRefund =
              await razorpay.payments.refund(
                payment.provider_payment_id,
                {
                  amount: refundableAmount
                }
              );

            console.log(
              'Razorpay refund created successfully.'
            );

            console.log(
              'Refund ID:',
              razorpayRefund?.id
            );

            console.log(
              'Refund Status:',
              razorpayRefund?.status
            );

            console.log(
              'Refund Amount:',
              razorpayRefund?.amount
            );

          } catch (refundError) {

            console.error('');
            console.error(
              '============================================================'
            );
            console.error(
              'RAZORPAY REFUND ERROR'
            );
            console.error(
              '============================================================'
            );

            console.error(
              'Status Code:',
              refundError?.statusCode
            );

            console.error(
              'Error Code:',
              refundError?.error?.code
            );

            console.error(
              'Description:',
              refundError?.error?.description
            );

            console.error(
              'Reason:',
              refundError?.error?.reason
            );

            console.error(
              'Source:',
              refundError?.error?.source
            );

            console.error(
              'Step:',
              refundError?.error?.step
            );

            console.error(
              'Refund Error Message:',
              refundError?.message
            );

            console.error(
              'Refund Error Response:',
              refundError?.error
            );

            console.error(
              '============================================================'
            );

            await client.query('ROLLBACK');

            return res.status(502).json({
              success: false,
              message:
                'Booking cancellation failed because the Razorpay refund could not be processed',
              razorpay_error: {
                status_code:
                  refundError?.statusCode || null,
                code:
                  refundError?.error?.code || null,
                description:
                  refundError?.error?.description || null,
                reason:
                  refundError?.error?.reason || null,
                source:
                  refundError?.error?.source || null,
                step:
                  refundError?.error?.step || null,
                message:
                  refundError?.message || null
              }
            });
          }

          // ======================================================
          // VALIDATE REFUND
          // ======================================================

          if (
            !razorpayRefund ||
            !razorpayRefund.id
          ) {
            await client.query('ROLLBACK');

            return res.status(502).json({
              success: false,
              message:
                'Razorpay refund was not created'
            });
          }

          // ======================================================
          // SAVE REFUND STATUS
          // ======================================================

          refundId =
            razorpayRefund.id;

          refundStatus =
            'REFUNDED';

          await client.query(
            `
            UPDATE payments
            SET
              status = 'REFUNDED',
              updated_at = NOW()
            WHERE id = $1
            `,
            [payment.id]
          );

          console.log(
            'Payment DB status updated to REFUNDED.'
          );
        }
      }

      // ==========================================================
      // ALREADY REFUNDED
      // ==========================================================

      else if (
        payment.status === 'REFUNDED'
      ) {

        console.log(
          'Payment is already marked REFUNDED in database.'
        );

        refundStatus =
          'ALREADY_REFUNDED';
      }

      // ==========================================================
      // PENDING / FAILED
      // ==========================================================

      else if (
        payment.status === 'PENDING' ||
        payment.status === 'FAILED'
      ) {

        console.log(
          'No refund required for payment status:',
          payment.status
        );

        refundStatus =
          'NOT_REQUIRED';
      }
    }

    // ============================================================
    // NO PAYMENT
    // ============================================================

    else {

      console.log(
        'No payment record found for booking:',
        booking_id
      );

      refundStatus =
        'NOT_REQUIRED';
    }

    // ============================================================
    // CANCEL BOOKING
    // ============================================================

    const cancelledBooking =
      await client.query(
        `
        UPDATE bookings
        SET
          status = 'CANCELLED',
          updated_at = NOW()
        WHERE id = $1
          AND user_id = $2
        RETURNING
          id,
          user_id,
          status,
          booking_date,
          booking_time,
          expires_at,
          updated_at
        `,
        [
          booking_id,
          user_id
        ]
      );

    // ============================================================
    // COMMIT
    // ============================================================

    await client.query('COMMIT');

    console.log('');
    console.log(
      '============================================================'
    );

    console.log(
      'BOOKING CANCELLED SUCCESSFULLY'
    );

    console.log(
      'Booking ID:',
      booking_id
    );

    console.log(
      'Refund Status:',
      refundStatus
    );

    console.log(
      'Refund ID:',
      refundId
    );

    console.log(
      '============================================================'
    );

    return res.json({
      success: true,
      message:
        'Booking cancelled successfully',
      refund_status:
        refundStatus,
      refund_id:
        refundId,
      booking:
        cancelledBooking.rows[0]
    });

  } catch (error) {

    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      console.error(
        'Rollback error:',
        rollbackError
      );
    }

    console.error(
      'Cancel booking error:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        'Failed to cancel booking'
    });

  } finally {
    client.release();
  }
});

// ============================================================
// EXPORT
// ============================================================

module.exports = router;