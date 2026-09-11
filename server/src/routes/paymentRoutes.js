/* global require, module, process, Buffer */

const express = require('express');
const crypto = require('crypto');
const Razorpay = require('razorpay');

const pool = require('../config/database');
const authenticateToken = require('../middleware/authMiddleware');

const router = express.Router();


// ============================================================
// RAZORPAY CONFIGURATION
// ============================================================

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});


// ============================================================
// HELPER — VALIDATE BOOKING
// ============================================================

const getValidBooking = async (client, bookingId, userId) => {

  const bookingResult = await client.query(
    `
    SELECT
      id,
      user_id,
      status,
      total_amount,
      expires_at
    FROM bookings
    WHERE id = $1
      AND user_id = $2
    FOR UPDATE
    `,
    [
      bookingId,
      userId
    ]
  );


  if (bookingResult.rows.length === 0) {

    return {
      error: {
        status: 404,
        message: 'Booking not found'
      }
    };
  }


  const booking = bookingResult.rows[0];


  // ==========================================================
  // BOOKING STATUS
  // ==========================================================

  if (booking.status === 'CANCELLED') {

    return {
      error: {
        status: 400,
        message: 'Cancelled bookings cannot be paid'
      }
    };
  }


  if (booking.status === 'COMPLETED') {

    return {
      error: {
        status: 400,
        message: 'Completed bookings cannot be paid'
      }
    };
  }


  if (booking.status === 'CONFIRMED') {

    return {
      error: {
        status: 400,
        message: 'Booking is already confirmed'
      }
    };
  }


  if (booking.status !== 'PENDING') {

    return {
      error: {
        status: 400,
        message: 'Booking is not available for payment'
      }
    };
  }


  // ==========================================================
  // PAYMENT EXPIRATION
  // ==========================================================

  if (
    booking.expires_at &&
    new Date(booking.expires_at) <= new Date()
  ) {

    await client.query(
      `
      UPDATE bookings
      SET
        status = 'CANCELLED',
        updated_at = NOW()
      WHERE id = $1
        AND user_id = $2
        AND status = 'PENDING'
      `,
      [
        bookingId,
        userId
      ]
    );


    return {
      expired: true,
      error: {
        status: 400,
        message: 'This booking has expired. Please make a new reservation.'
      }
    };
  }


  // ==========================================================
  // VALIDATE AMOUNT
  // ==========================================================

  const paymentAmount = Number(booking.total_amount);


  if (
    !Number.isFinite(paymentAmount) ||
    paymentAmount <= 0
  ) {

    return {
      error: {
        status: 400,
        message: 'Invalid booking payment amount'
      }
    };
  }


  return {
    booking,
    paymentAmount
  };
};


// ============================================================
// POST /api/payments/create-order
// CREATE RAZORPAY ORDER
// ============================================================

router.post(
  '/create-order',
  authenticateToken,
  async (req, res) => {

    const client = await pool.connect();


    try {

      const user_id = req.user.id;
      const { booking_id } = req.body;


      // ========================================================
      // AUTHENTICATION
      // ========================================================

      if (!user_id) {

        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }


      // ========================================================
      // BOOKING ID VALIDATION
      // ========================================================

      if (!booking_id) {

        return res.status(400).json({
          success: false,
          message: 'Booking ID is required'
        });
      }


      const bookingId = Number(booking_id);


      if (
        !Number.isInteger(bookingId) ||
        bookingId < 1
      ) {

        return res.status(400).json({
          success: false,
          message: 'Invalid booking ID'
        });
      }


      // ========================================================
      // START TRANSACTION
      // ========================================================

      await client.query('BEGIN');


      // ========================================================
      // VALIDATE BOOKING
      // ========================================================

      const validation = await getValidBooking(
        client,
        bookingId,
        user_id
      );


      if (validation.error) {

        /*
        Expired booking was changed to CANCELLED.
        Therefore COMMIT instead of ROLLBACK.
        */

        if (validation.expired) {

          await client.query('COMMIT');

        } else {

          await client.query('ROLLBACK');
        }


        return res.status(validation.error.status).json({
          success: false,
          message: validation.error.message
        });
      }


      const {
        booking,
        paymentAmount
      } = validation;


      const paymentCurrency = 'INR';


      // ========================================================
      // CHECK EXISTING PAID PAYMENT
      // ========================================================

      const paidPayment = await client.query(
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
          paid_at,
          created_at,
          updated_at
        FROM payments
        WHERE booking_id = $1
          AND status = 'PAID'
        LIMIT 1
        `,
        [
          bookingId
        ]
      );


      if (paidPayment.rows.length > 0) {

        await client.query('ROLLBACK');


        return res.status(409).json({
          success: false,
          message: 'Payment has already been completed for this booking',
          payment: paidPayment.rows[0]
        });
      }


      // ========================================================
      // CHECK EXISTING PENDING RAZORPAY ORDER
      // ========================================================

      const pendingPayment = await client.query(
        `
        SELECT
          id,
          booking_id,
          provider,
          provider_order_id,
          amount,
          currency,
          status,
          created_at,
          updated_at
        FROM payments
        WHERE booking_id = $1
          AND provider = 'RAZORPAY'
          AND status = 'PENDING'
          AND provider_order_id IS NOT NULL
        ORDER BY id DESC
        LIMIT 1
        `,
        [
          bookingId
        ]
      );


      // ========================================================
      // REUSE EXISTING RAZORPAY ORDER
      // ========================================================

      if (pendingPayment.rows.length > 0) {

        const existingPayment =
          pendingPayment.rows[0];


        const existingPaymentAmount =
          Number(existingPayment.amount);


        const existingAmountPaise =
          Math.round(existingPaymentAmount * 100);


        const currentAmountPaise =
          Math.round(paymentAmount * 100);


        // ======================================================
        // VERIFY EXISTING ORDER AMOUNT + CURRENCY
        // ======================================================

        if (
          !Number.isFinite(existingPaymentAmount) ||
          existingAmountPaise !== currentAmountPaise ||
          existingPayment.currency !== paymentCurrency
        ) {

          /*
          Existing Razorpay order does not match
          the current booking amount/currency.

          Do NOT reuse this stale order.
          Mark the local payment record as FAILED.
          */

          await client.query(
            `
            UPDATE payments
            SET
              status = 'FAILED',
              updated_at = NOW()
            WHERE id = $1
              AND status = 'PENDING'
            `,
            [
              existingPayment.id
            ]
          );

        } else {

          /*
          Existing Razorpay order is valid.
          Reuse it.
          */

          await client.query('COMMIT');


          return res.status(200).json({
            success: true,
            message: 'Existing Razorpay order found',

            order: {
              id: existingPayment.provider_order_id,
              amount: currentAmountPaise,
              currency: paymentCurrency
            },

            booking: {
              id: booking.id,
              total_amount: booking.total_amount,
              status: booking.status
            }
          });
        }
      }


      // ========================================================
      // CREATE NEW RAZORPAY ORDER
      //
      // Razorpay amount = paise
      //
      // Example:
      // ₹2500 = 250000 paise
      // ========================================================

      const razorpayOrder = await razorpay.orders.create({

        amount: Math.round(paymentAmount * 100),

        currency: paymentCurrency,

        receipt: `lumora_booking_${bookingId}`,

        notes: {
          booking_id: String(bookingId),
          user_id: String(user_id)
        }

      });


      // ========================================================
      // SAVE RAZORPAY ORDER
      // ========================================================

      const paymentResult = await client.query(
        `
        INSERT INTO payments (
          booking_id,
          provider,
          provider_order_id,
          amount,
          currency,
          status
        )
        VALUES (
          $1,
          'RAZORPAY',
          $2,
          $3,
          $4,
          'PENDING'
        )
        RETURNING
          id,
          booking_id,
          provider,
          provider_order_id,
          amount,
          currency,
          status,
          created_at,
          updated_at
        `,
        [
          bookingId,
          razorpayOrder.id,
          paymentAmount,
          paymentCurrency
        ]
      );


      // ========================================================
      // COMMIT
      // ========================================================

      await client.query('COMMIT');


      // ========================================================
      // SUCCESS
      // ========================================================

      return res.status(201).json({

        success: true,

        message: 'Razorpay order created successfully',

        order: {
          id: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency
        },

        payment: paymentResult.rows[0],

        booking: {
          id: booking.id,
          total_amount: booking.total_amount,
          status: booking.status
        }

      });


    } catch (error) {

      try {

        await client.query('ROLLBACK');

      } catch (rollbackError) {

        console.error(
          'Create order rollback error:',
          rollbackError
        );
      }


      console.error(
        'Razorpay order creation error:',
        error
      );


      return res.status(500).json({
        success: false,
        message: 'Failed to create Razorpay order'
      });


    } finally {

      client.release();

    }
  }
);


// ============================================================
// POST /api/payments/verify
// VERIFY RAZORPAY PAYMENT
// ============================================================

router.post(
  '/verify',
  authenticateToken,
  async (req, res) => {

    const client = await pool.connect();


    try {

      const user_id = req.user.id;


      const {
        booking_id,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      } = req.body;


      // ========================================================
      // AUTHENTICATION
      // ========================================================

      if (!user_id) {

        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }


      // ========================================================
      // REQUIRED FIELDS
      // ========================================================

      if (
        !booking_id ||
        !razorpay_order_id ||
        !razorpay_payment_id ||
        !razorpay_signature
      ) {

        return res.status(400).json({
          success: false,
          message: 'Razorpay payment details are required'
        });
      }


      // ========================================================
      // BOOKING ID
      // ========================================================

      const bookingId = Number(booking_id);


      if (
        !Number.isInteger(bookingId) ||
        bookingId < 1
      ) {

        return res.status(400).json({
          success: false,
          message: 'Invalid booking ID'
        });
      }


      // ========================================================
      // START TRANSACTION
      // ========================================================

      await client.query('BEGIN');


      // ========================================================
      // GET BOOKING
      // ========================================================

      const bookingResult = await client.query(
        `
        SELECT
          id,
          user_id,
          status,
          total_amount,
          expires_at
        FROM bookings
        WHERE id = $1
          AND user_id = $2
        FOR UPDATE
        `,
        [
          bookingId,
          user_id
        ]
      );


      if (bookingResult.rows.length === 0) {

        await client.query('ROLLBACK');


        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }


      const booking = bookingResult.rows[0];


      // ========================================================
      // BOOKING STATUS
      // ========================================================

      if (booking.status === 'CANCELLED') {

        await client.query('ROLLBACK');


        return res.status(400).json({
          success: false,
          message: 'Cancelled bookings cannot be paid'
        });
      }


      if (booking.status === 'COMPLETED') {

        await client.query('ROLLBACK');


        return res.status(400).json({
          success: false,
          message: 'Completed bookings cannot be paid'
        });
      }


      if (booking.status === 'CONFIRMED') {

        await client.query('ROLLBACK');


        return res.status(400).json({
          success: false,
          message: 'Booking is already confirmed'
        });
      }


      if (booking.status !== 'PENDING') {

        await client.query('ROLLBACK');


        return res.status(400).json({
          success: false,
          message: 'Booking is not available for payment'
        });
      }


      // ========================================================
      // EXPIRATION CHECK
      // ========================================================

      if (
        booking.expires_at &&
        new Date(booking.expires_at) <= new Date()
      ) {

        await client.query(
          `
          UPDATE bookings
          SET
            status = 'CANCELLED',
            updated_at = NOW()
          WHERE id = $1
            AND user_id = $2
            AND status = 'PENDING'
          `,
          [
            bookingId,
            user_id
          ]
        );


        /*
        Booking was changed to CANCELLED.
        Therefore COMMIT.
        */

        await client.query('COMMIT');


        return res.status(400).json({
          success: false,
          message: 'This booking has expired. Please make a new reservation.'
        });
      }


      // ========================================================
      // SERVER-SIDE AMOUNT
      // ========================================================

      const paymentAmount =
        Number(booking.total_amount);


      if (
        !Number.isFinite(paymentAmount) ||
        paymentAmount <= 0
      ) {

        await client.query('ROLLBACK');


        return res.status(400).json({
          success: false,
          message: 'Invalid booking payment amount'
        });
      }


      const expectedAmountPaise =
        Math.round(paymentAmount * 100);


      // ========================================================
      // FIND OUR RAZORPAY PAYMENT RECORD
      // ========================================================

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
          status
        FROM payments
        WHERE booking_id = $1
          AND provider = 'RAZORPAY'
          AND provider_order_id = $2
        ORDER BY id DESC
        LIMIT 1
        FOR UPDATE
        `,
        [
          bookingId,
          razorpay_order_id
        ]
      );


      if (paymentResult.rows.length === 0) {

        await client.query('ROLLBACK');


        return res.status(404).json({
          success: false,
          message: 'Razorpay order not found for this booking'
        });
      }


      const paymentRecord =
        paymentResult.rows[0];


      // ========================================================
      // CHECK PAYMENT RECORD STATUS
      // ========================================================

      if (paymentRecord.status === 'PAID') {

        await client.query('ROLLBACK');


        return res.status(409).json({
          success: false,
          message: 'This payment has already been completed'
        });
      }


      // ========================================================
      // ONLY PENDING PAYMENT CAN BE VERIFIED
      // ========================================================

      if (paymentRecord.status !== 'PENDING') {

        await client.query('ROLLBACK');


        return res.status(400).json({
          success: false,
          message: 'This payment is not available for verification'
        });
      }


      // ========================================================
      // VERIFY STORED AMOUNT
      // ========================================================

      const storedAmount =
        Number(paymentRecord.amount);


      if (
        !Number.isFinite(storedAmount) ||
        Math.round(storedAmount * 100) !== expectedAmountPaise
      ) {

        await client.query('ROLLBACK');


        return res.status(400).json({
          success: false,
          message: 'Payment amount does not match booking amount'
        });
      }


      // ========================================================
      // VERIFY CURRENCY
      // ========================================================

      if (paymentRecord.currency !== 'INR') {

        await client.query('ROLLBACK');


        return res.status(400).json({
          success: false,
          message: 'Invalid payment currency'
        });
      }


      // ========================================================
      // VERIFY RAZORPAY SERVER CONFIGURATION
      // ========================================================

      if (!process.env.RAZORPAY_KEY_SECRET) {

        await client.query('ROLLBACK');


        return res.status(500).json({
          success: false,
          message: 'Razorpay server configuration is missing'
        });
      }


      // ========================================================
      // VERIFY RAZORPAY SIGNATURE
      //
      // HMAC SHA256:
      //
      // order_id + "|" + payment_id
      //
      // Secret is ONLY used on backend.
      // ========================================================

      const generatedSignature =
        crypto
          .createHmac(
            'sha256',
            process.env.RAZORPAY_KEY_SECRET
          )
          .update(
            `${razorpay_order_id}|${razorpay_payment_id}`
          )
          .digest('hex');


      const generatedSignatureBuffer =
        Buffer.from(
          generatedSignature,
          'utf8'
        );


      const receivedSignatureBuffer =
        Buffer.from(
          razorpay_signature,
          'utf8'
        );


      const signaturesMatch =
        generatedSignatureBuffer.length ===
          receivedSignatureBuffer.length &&
        crypto.timingSafeEqual(
          generatedSignatureBuffer,
          receivedSignatureBuffer
        );


      if (!signaturesMatch) {

        await client.query('ROLLBACK');


        return res.status(400).json({
          success: false,
          message: 'Invalid Razorpay payment signature'
        });
      }


      // ========================================================
      // VERIFY PAYMENT DIRECTLY WITH RAZORPAY
      // ========================================================

      let razorpayPayment;


      try {

        razorpayPayment =
          await razorpay.payments.fetch(
            razorpay_payment_id
          );

      } catch (razorpayError) {

        console.error(
          'Razorpay payment fetch error:',
          razorpayError
        );


        await client.query('ROLLBACK');


        return res.status(400).json({
          success: false,
          message: 'Unable to verify payment with Razorpay'
        });
      }


      // ========================================================
      // VERIFY RAZORPAY PAYMENT STATUS
      // ========================================================

      if (
        razorpayPayment.status !== 'captured'
      ) {

        await client.query('ROLLBACK');


        return res.status(400).json({
          success: false,
          message: 'Razorpay payment has not been captured'
        });
      }


      // ========================================================
      // VERIFY RAZORPAY ORDER ID
      // ========================================================

      if (
        razorpayPayment.order_id !==
        razorpay_order_id
      ) {

        await client.query('ROLLBACK');


        return res.status(400).json({
          success: false,
          message: 'Razorpay order ID does not match'
        });
      }


      // ========================================================
      // VERIFY RAZORPAY AMOUNT
      // ========================================================

      if (
        Number(razorpayPayment.amount) !==
        expectedAmountPaise
      ) {

        await client.query('ROLLBACK');


        return res.status(400).json({
          success: false,
          message: 'Razorpay payment amount does not match booking amount'
        });
      }


      // ========================================================
      // VERIFY RAZORPAY CURRENCY
      // ========================================================

      if (
        razorpayPayment.currency !== 'INR'
      ) {

        await client.query('ROLLBACK');


        return res.status(400).json({
          success: false,
          message: 'Razorpay payment currency is invalid'
        });
      }


      // ========================================================
      // VERIFY RAZORPAY PAYMENT ID
      // ========================================================

      if (
        razorpayPayment.id !==
        razorpay_payment_id
      ) {

        await client.query('ROLLBACK');


        return res.status(400).json({
          success: false,
          message: 'Razorpay payment ID does not match'
        });
      }


      // ========================================================
      // PREVENT DUPLICATE PAYMENT
      // ========================================================

      const duplicatePayment =
        await client.query(
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
            paid_at,
            created_at,
            updated_at
          FROM payments
          WHERE provider_payment_id = $1
            AND status = 'PAID'
          LIMIT 1
          `,
          [
            razorpay_payment_id
          ]
        );


      if (duplicatePayment.rows.length > 0) {

        await client.query('ROLLBACK');


        return res.status(409).json({
          success: false,
          message: 'This Razorpay payment has already been processed',
          payment: duplicatePayment.rows[0]
        });
      }


      // ========================================================
      // UPDATE PAYMENT RECORD
      // ========================================================

      const updatedPayment =
        await client.query(
          `
          UPDATE payments
          SET
            provider_payment_id = $1,
            status = 'PAID',
            paid_at = NOW(),
            updated_at = NOW()
          WHERE id = $2
            AND status = 'PENDING'
          RETURNING
            id,
            booking_id,
            provider,
            provider_order_id,
            provider_payment_id,
            amount,
            currency,
            status,
            paid_at,
            created_at,
            updated_at
          `,
          [
            razorpay_payment_id,
            paymentRecord.id
          ]
        );


      if (updatedPayment.rows.length === 0) {

        await client.query('ROLLBACK');


        return res.status(409).json({
          success: false,
          message: 'Payment record could not be updated'
        });
      }


      // ========================================================
      // CONFIRM BOOKING
      // ========================================================

      const updatedBooking =
        await client.query(
          `
          UPDATE bookings
          SET
            status = 'CONFIRMED',
            updated_at = NOW()
          WHERE id = $1
            AND user_id = $2
            AND status = 'PENDING'
          RETURNING
            id,
            user_id,
            status,
            total_amount,
            updated_at
          `,
          [
            bookingId,
            user_id
          ]
        );


      if (updatedBooking.rows.length === 0) {

        await client.query('ROLLBACK');


        return res.status(409).json({
          success: false,
          message: 'Booking could not be confirmed'
        });
      }


      // ========================================================
      // COMMIT TRANSACTION
      // ========================================================

      await client.query('COMMIT');


      // ========================================================
      // SUCCESS
      // ========================================================

      return res.status(200).json({

        success: true,

        message: 'Razorpay payment verified successfully',

        payment: updatedPayment.rows[0],

        booking: updatedBooking.rows[0]

      });


    } catch (error) {

      try {

        await client.query('ROLLBACK');

      } catch (rollbackError) {

        console.error(
          'Verify payment rollback error:',
          rollbackError
        );
      }


      console.error(
        'Razorpay payment verification error:',
        error
      );


      return res.status(500).json({
        success: false,
        message: 'Payment verification failed'
      });


    } finally {

      client.release();

    }
  }
);


// ============================================================
// GET /api/payments/booking/:bookingId
// GET PAYMENT DETAILS
// ============================================================

router.get(
  '/booking/:bookingId',
  authenticateToken,
  async (req, res) => {

    try {

      const user_id = req.user.id;


      const bookingId =
        Number(req.params.bookingId);


      // ========================================================
      // BOOKING ID VALIDATION
      // ========================================================

      if (
        !Number.isInteger(bookingId) ||
        bookingId < 1
      ) {

        return res.status(400).json({
          success: false,
          message: 'Invalid booking ID'
        });
      }


      // ========================================================
      // CHECK BOOKING OWNERSHIP
      // ========================================================

      const bookingResult =
        await pool.query(
          `
          SELECT
            id,
            user_id,
            status,
            total_amount
          FROM bookings
          WHERE id = $1
            AND user_id = $2
          `,
          [
            bookingId,
            user_id
          ]
        );


      if (bookingResult.rows.length === 0) {

        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }


      // ========================================================
      // GET PAYMENT
      // ========================================================

      const paymentResult =
        await pool.query(
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
            paid_at,
            created_at,
            updated_at
          FROM payments
          WHERE booking_id = $1
          ORDER BY id DESC
          LIMIT 1
          `,
          [
            bookingId
          ]
        );


      // ========================================================
      // NO PAYMENT
      // ========================================================

      if (paymentResult.rows.length === 0) {

        return res.json({
          success: true,
          payment: null
        });
      }


      // ========================================================
      // SUCCESS
      // ========================================================

      return res.json({
        success: true,
        payment: paymentResult.rows[0]
      });


    } catch (error) {

      console.error(
        'Get payment details error:',
        error
      );


      return res.status(500).json({
        success: false,
        message: 'Failed to fetch payment details'
      });
    }
  }
);


// ============================================================
// EXPORT ROUTER
// ============================================================

module.exports = router;