/* global require, module, process */

const express = require('express');
const Razorpay = require('razorpay');

const pool = require('../config/database');
const requireAdmin = require('../middleware/adminMiddleware');

const router = express.Router();

router.use(requireAdmin);


// ============================================================
// RAZORPAY CONFIGURATION
// ADMIN REFUNDS
// ============================================================

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});


// ============================================================
// ADMIN DASHBOARD
// ============================================================

router.get('/dashboard', async (req, res) => {
  try {
    const [
      usersResult,
      restaurantsResult,
      bookingsResult,
      revenueResult,
      upcomingResult,
      recentBookingsResult,
    ] = await Promise.all([
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM users
      `),

      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM restaurants
      `),

      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM bookings
      `),

      pool.query(`
        SELECT COALESCE(
          SUM(amount) FILTER (WHERE status = 'PAID'),
          0
        ) AS revenue
        FROM payments
      `),

      pool.query(`
        SELECT
          b.id,
          b.booking_date,
          b.booking_time,
          b.guests,
          b.total_amount,
          b.status,
          u.name AS user_name,
          u.email AS user_email,
          r.name AS restaurant_name
        FROM bookings b
        JOIN users u
          ON u.id = b.user_id
        JOIN restaurants r
          ON r.id = b.restaurant_id
        WHERE b.status = 'CONFIRMED'
          AND (
            b.booking_date::date + b.booking_time
          ) > (
            CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata'
          )::timestamp
        ORDER BY
          b.booking_date ASC,
          b.booking_time ASC
        LIMIT 5
      `),

      pool.query(`
        SELECT
          b.id,
          b.booking_date,
          b.booking_time,
          b.guests,
          b.total_amount,
          b.status,
          b.created_at,
          u.name AS user_name,
          u.email AS user_email,
          r.name AS restaurant_name
        FROM bookings b
        JOIN users u
          ON u.id = b.user_id
        JOIN restaurants r
          ON r.id = b.restaurant_id
        ORDER BY b.created_at DESC
        LIMIT 10
      `),
    ]);

    res.json({
      success: true,

      stats: {
        users: usersResult.rows[0].count,
        restaurants: restaurantsResult.rows[0].count,
        bookings: bookingsResult.rows[0].count,
        revenue: Number(
          revenueResult.rows[0].revenue || 0
        ),
      },

      upcomingBookings: upcomingResult.rows,

      recentBookings: recentBookingsResult.rows,
    });
  } catch (error) {
    console.error(
      'Admin dashboard error:',
      error
    );

    res.status(500).json({
      success: false,
      message: 'Unable to load admin dashboard',
    });
  }
});


// ============================================================
// ADMIN ANALYTICS
// ============================================================

router.get('/analytics', async (req, res) => {
  try {
    const [
      todayBookingsResult,
      monthBookingsResult,
      todayRevenueResult,
      monthRevenueResult,
      refundedResult,
      newUsersResult,
      sevenDayBookingsResult,
      sevenDayRevenueResult,
    ] = await Promise.all([

      // ========================================================
      // TODAY'S BOOKINGS
      // ========================================================

      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM bookings
        WHERE booking_date::date = (
          CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata'
        )::date
      `),

      // ========================================================
      // THIS MONTH'S BOOKINGS
      // ========================================================

      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM bookings
        WHERE DATE_TRUNC(
          'month',
          booking_date::date
        ) = DATE_TRUNC(
          'month',
          (
            CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata'
          )::date
        )
      `),

      // ========================================================
      // TODAY'S REVENUE
      // ========================================================

      pool.query(`
        SELECT COALESCE(
          SUM(amount),
          0
        ) AS revenue
        FROM payments
        WHERE status = 'PAID'
          AND (
            paid_at AT TIME ZONE 'Asia/Kolkata'
          )::date = (
            CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata'
          )::date
      `),

      // ========================================================
      // THIS MONTH'S REVENUE
      // ========================================================

      pool.query(`
        SELECT COALESCE(
          SUM(amount),
          0
        ) AS revenue
        FROM payments
        WHERE status = 'PAID'
          AND DATE_TRUNC(
            'month',
            (
              paid_at AT TIME ZONE 'Asia/Kolkata'
            )::date
          ) = DATE_TRUNC(
            'month',
            (
              CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata'
            )::date
          )
      `),

      // ========================================================
      // TOTAL REFUNDED AMOUNT
      // ========================================================

      pool.query(`
        SELECT COALESCE(
          SUM(amount),
          0
        ) AS amount
        FROM payments
        WHERE status = 'REFUNDED'
      `),

      // ========================================================
      // NEW USERS TODAY
      // ========================================================

      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM users
        WHERE (
          created_at AT TIME ZONE 'Asia/Kolkata'
        )::date = (
          CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata'
        )::date
      `),

      // ========================================================
      // LAST 7 DAYS - BOOKINGS
      // Always returns exactly 7 days
      // Includes days with 0 bookings
      // ========================================================

      pool.query(`
        WITH last_seven_days AS (
          SELECT
            generate_series(
              (
                CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata'
              )::date - 6,
              (
                CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata'
              )::date,
              INTERVAL '1 day'
            )::date AS date
        )

        SELECT
          d.date,
          COUNT(b.id)::int AS bookings

        FROM last_seven_days d

        LEFT JOIN bookings b
          ON b.booking_date::date = d.date

        GROUP BY d.date

        ORDER BY d.date ASC
      `),

      // ========================================================
      // LAST 7 DAYS - REVENUE
      // Always returns exactly 7 days
      // Includes days with ₹0 revenue
      // ========================================================

      pool.query(`
        WITH last_seven_days AS (
          SELECT
            generate_series(
              (
                CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata'
              )::date - 6,
              (
                CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata'
              )::date,
              INTERVAL '1 day'
            )::date AS date
        )

        SELECT
          d.date,
          COALESCE(
            SUM(p.amount),
            0
          ) AS revenue

        FROM last_seven_days d

        LEFT JOIN payments p
          ON p.status = 'PAID'
          AND (
            p.paid_at AT TIME ZONE 'Asia/Kolkata'
          )::date = d.date

        GROUP BY d.date

        ORDER BY d.date ASC
      `),

    ]);

    res.json({
      success: true,

      analytics: {

        // ======================================================
        // SUMMARY
        // ======================================================

        todayBookings:
          Number(
            todayBookingsResult.rows[0].count || 0
          ),

        monthBookings:
          Number(
            monthBookingsResult.rows[0].count || 0
          ),

        todayRevenue:
          Number(
            todayRevenueResult.rows[0].revenue || 0
          ),

        monthRevenue:
          Number(
            monthRevenueResult.rows[0].revenue || 0
          ),

        refundedAmount:
          Number(
            refundedResult.rows[0].amount || 0
          ),

        newUsersToday:
          Number(
            newUsersResult.rows[0].count || 0
          ),

        // ======================================================
        // LAST 7 DAYS
        // ======================================================

        sevenDayBookings:
          sevenDayBookingsResult.rows.map(
            (row) => ({
              date: String(row.date),
              bookings: Number(
                row.bookings || 0
              ),
            })
          ),

        sevenDayRevenue:
          sevenDayRevenueResult.rows.map(
            (row) => ({
              date: String(row.date),
              revenue: Number(
                row.revenue || 0
              ),
            })
          ),
      },
    });

  } catch (error) {
    console.error(
      'Admin analytics error:',
      error
    );

    res.status(500).json({
      success: false,
      message:
        'Unable to load admin analytics',
    });
  }
});


// ============================================================
// ALL BOOKINGS
// ============================================================

router.get('/bookings', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        b.*,

        u.name AS user_name,
        u.email AS user_email,

        r.name AS restaurant_name,
        r.city AS restaurant_city

      FROM bookings b

      JOIN users u
        ON u.id = b.user_id

      JOIN restaurants r
        ON r.id = b.restaurant_id

      ORDER BY b.created_at DESC
    `);

    res.json({
      success: true,
      bookings: result.rows,
    });
  } catch (error) {
    console.error(
      'Admin bookings error:',
      error
    );

    res.status(500).json({
      success: false,
      message: 'Unable to load bookings',
    });
  }
});


// ============================================================
// CANCEL PENDING BOOKING
// ============================================================

router.patch(
  '/bookings/:id/cancel',
  async (req, res) => {
    const bookingId = Number(
      req.params.id
    );

    if (
      !Number.isInteger(bookingId) ||
      bookingId < 1
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID',
      });
    }

    try {
      const result = await pool.query(
        `
        UPDATE bookings
        SET
          status = 'CANCELLED',
          updated_at = NOW()
        WHERE
          id = $1
          AND status = 'PENDING'
        RETURNING *
        `,
        [bookingId]
      );

      if (result.rowCount === 0) {
        const bookingCheck =
          await pool.query(
            `
            SELECT
              id,
              status
            FROM bookings
            WHERE id = $1
            `,
            [bookingId]
          );

        if (bookingCheck.rowCount === 0) {
          return res.status(404).json({
            success: false,
            message: 'Booking not found',
          });
        }

        const currentStatus =
          bookingCheck.rows[0].status;

        return res.status(409).json({
          success: false,
          message:
            `Only PENDING bookings can be cancelled by admin. Current status: ${currentStatus}`,
        });
      }

      res.json({
        success: true,
        message:
          'Booking cancelled successfully',
        booking: result.rows[0],
      });
    } catch (error) {
      console.error(
        'Admin booking cancellation error:',
        error
      );

      res.status(500).json({
        success: false,
        message:
          'Unable to cancel booking',
      });
    }
  }
);


// ============================================================
// ALL USERS
// ============================================================

router.get('/users', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        u.id,
        u.name,
        u.email,
        u.role,
        u.created_at,

        COUNT(b.id)::int AS booking_count

      FROM users u

      LEFT JOIN bookings b
        ON b.user_id = u.id

      GROUP BY
        u.id,
        u.name,
        u.email,
        u.role,
        u.created_at

      ORDER BY u.created_at DESC
    `);

    res.json({
      success: true,
      users: result.rows,
    });
  } catch (error) {
    console.error(
      'Admin users error:',
      error
    );

    res.status(500).json({
      success: false,
      message: 'Unable to load users',
    });
  }
});


// ============================================================
// UPDATE USER ROLE
// ============================================================

router.patch(
  '/users/:id/role',
  async (req, res) => {
    const userId = Number(
      req.params.id
    );

    if (
      !Number.isInteger(userId) ||
      userId < 1
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID',
      });
    }

    const { role } = req.body;

    if (
      role !== 'CUSTOMER' &&
      role !== 'ADMIN'
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Role must be CUSTOMER or ADMIN',
      });
    }

    try {
      if (
        Number(req.user.id) === userId
      ) {
        return res.status(400).json({
          success: false,
          message:
            'You cannot change your own role',
        });
      }

      const result = await pool.query(
        `
        UPDATE users
        SET
          role = $1
        WHERE id = $2
        RETURNING
          id,
          name,
          email,
          role,
          created_at
        `,
        [role, userId]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      res.json({
        success: true,
        message:
          'User role updated successfully',
        user: result.rows[0],
      });
    } catch (error) {
      console.error(
        'Admin user role update error:',
        error
      );

      res.status(500).json({
        success: false,
        message:
          'Unable to update user role',
      });
    }
  }
);


// ============================================================
// ALL RESTAURANTS
// ============================================================

router.get('/restaurants', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM restaurants
      ORDER BY id ASC
    `);

    res.json({
      success: true,
      restaurants: result.rows,
    });
  } catch (error) {
    console.error(
      'Admin restaurants error:',
      error
    );

    res.status(500).json({
      success: false,
      message: 'Unable to load restaurants',
    });
  }
});


// ============================================================
// UPDATE RESTAURANT STATUS
// ============================================================

router.patch(
  '/restaurants/:id/status',
  async (req, res) => {
    const restaurantId = Number(
      req.params.id
    );

    if (
      !Number.isInteger(restaurantId) ||
      restaurantId < 1
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid restaurant ID',
      });
    }

    const { is_active } = req.body;

    if (typeof is_active !== 'boolean') {
      return res.status(400).json({
        success: false,
        message:
          'is_active must be a boolean value',
      });
    }

    try {
      const result = await pool.query(
        `
        UPDATE restaurants
        SET
          is_active = $1,
          updated_at = NOW()
        WHERE id = $2
        RETURNING *
        `,
        [is_active, restaurantId]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'Restaurant not found',
        });
      }

      res.json({
        success: true,
        message: is_active
          ? 'Restaurant activated successfully'
          : 'Restaurant deactivated successfully',
        restaurant: result.rows[0],
      });
    } catch (error) {
      console.error(
        'Admin restaurant status update error:',
        error
      );

      res.status(500).json({
        success: false,
        message:
          'Unable to update restaurant status',
      });
    }
  }
);


// ============================================================
// EDIT RESTAURANT
// ============================================================

router.patch(
  '/restaurants/:id',
  async (req, res) => {
    const restaurantId = Number(
      req.params.id
    );

    if (
      !Number.isInteger(restaurantId) ||
      restaurantId < 1
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid restaurant ID',
      });
    }

    const {
      name,
      cuisine,
      description,
      city,
      address,
      phone,
      rating,
      price_range,
      image_url,
    } = req.body;

    if (
      typeof name !== 'string' ||
      !name.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: 'Restaurant name is required',
      });
    }

    if (
      typeof cuisine !== 'string' ||
      !cuisine.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: 'Cuisine is required',
      });
    }

    if (
      typeof city !== 'string' ||
      !city.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: 'City is required',
      });
    }

    if (
      typeof address !== 'string' ||
      !address.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: 'Address is required',
      });
    }

    const restaurantRating =
      Number(rating);

    if (
      !Number.isFinite(restaurantRating) ||
      restaurantRating < 0 ||
      restaurantRating > 5
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Rating must be between 0 and 5',
      });
    }

    try {
      const result = await pool.query(
        `
        UPDATE restaurants
        SET
          name = $1,
          cuisine = $2,
          description = $3,
          city = $4,
          address = $5,
          phone = $6,
          rating = $7,
          price_range = $8,
          image_url = $9,
          updated_at = NOW()
        WHERE id = $10
        RETURNING *
        `,
        [
          name.trim(),
          cuisine.trim(),
          typeof description === 'string'
            ? description.trim()
            : null,
          city.trim(),
          address.trim(),
          typeof phone === 'string' &&
          phone.trim()
            ? phone.trim()
            : null,
          restaurantRating,
          typeof price_range === 'string'
            ? price_range.trim()
            : null,
          typeof image_url === 'string' &&
          image_url.trim()
            ? image_url.trim()
            : null,
          restaurantId,
        ]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'Restaurant not found',
        });
      }

      res.json({
        success: true,
        message:
          'Restaurant updated successfully',
        restaurant: result.rows[0],
      });
    } catch (error) {
      console.error(
        'Admin restaurant update error:',
        error
      );

      res.status(500).json({
        success: false,
        message:
          'Unable to update restaurant',
      });
    }
  }
);


// ============================================================
// REFUND PAID RAZORPAY PAYMENT
// ============================================================

router.post(
  '/payments/:id/refund',
  async (req, res) => {
    const paymentId = Number(
      req.params.id
    );

    if (
      !Number.isInteger(paymentId) ||
      paymentId < 1
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment ID',
      });
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // ======================================================
      // GET PAYMENT + BOOKING
      // ======================================================

      const paymentResult =
        await client.query(
          `
          SELECT
            p.id,
            p.booking_id,
            p.provider,
            p.provider_order_id,
            p.provider_payment_id,
            p.amount,
            p.currency,
            p.status,

            b.status AS booking_status

          FROM payments p

          JOIN bookings b
            ON b.id = p.booking_id

          WHERE p.id = $1

          FOR UPDATE
          `,
          [paymentId]
        );

      if (
        paymentResult.rows.length === 0
      ) {
        await client.query('ROLLBACK');

        return res.status(404).json({
          success: false,
          message: 'Payment not found',
        });
      }

      const payment =
        paymentResult.rows[0];

      // ======================================================
      // PROVIDER CHECK
      // ======================================================

      if (
        payment.provider !== 'RAZORPAY'
      ) {
        await client.query('ROLLBACK');

        return res.status(400).json({
          success: false,
          message:
            'Only Razorpay payments can be refunded',
        });
      }

      // ======================================================
      // PAYMENT STATUS CHECK
      // ======================================================

      if (
        payment.status === 'REFUNDED'
      ) {
        await client.query('ROLLBACK');

        return res.status(409).json({
          success: false,
          message:
            'This payment has already been refunded',
        });
      }

      if (
        payment.status !== 'PAID'
      ) {
        await client.query('ROLLBACK');

        return res.status(400).json({
          success: false,
          message:
            'Only PAID payments can be refunded',
        });
      }

      // ======================================================
      // RAZORPAY PAYMENT ID CHECK
      // ======================================================

      if (
        !payment.provider_payment_id
      ) {
        await client.query('ROLLBACK');

        return res.status(400).json({
          success: false,
          message:
            'Razorpay payment ID is missing',
        });
      }

      // ======================================================
      // RAZORPAY CONFIG CHECK
      // ======================================================

      if (
        !process.env.RAZORPAY_KEY_ID ||
        !process.env.RAZORPAY_KEY_SECRET
      ) {
        await client.query('ROLLBACK');

        return res.status(500).json({
          success: false,
          message:
            'Razorpay server configuration is missing',
        });
      }

      // ======================================================
      // REFUND AMOUNT
      // ======================================================

      const refundAmount =
        Math.round(
          Number(payment.amount) * 100
        );

      if (
        !Number.isFinite(refundAmount) ||
        refundAmount <= 0
      ) {
        await client.query('ROLLBACK');

        return res.status(400).json({
          success: false,
          message:
            'Invalid payment refund amount',
        });
      }

      // ======================================================
      // CREATE RAZORPAY REFUND
      // ======================================================

      const refund =
        await razorpay.payments.refund(
          payment.provider_payment_id,
          {
            amount: refundAmount,

            notes: {
              lumora_payment_id:
                String(payment.id),

              booking_id:
                String(payment.booking_id),

              refunded_by:
                String(req.user.id),
            },
          }
        );

      // ======================================================
      // UPDATE PAYMENT STATUS
      // ======================================================

      const updatedPayment =
        await client.query(
          `
          UPDATE payments
          SET
            status = 'REFUNDED',
            updated_at = NOW()
          WHERE id = $1
            AND status = 'PAID'
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
          [payment.id]
        );

      if (
        updatedPayment.rows.length === 0
      ) {
        await client.query('ROLLBACK');

        return res.status(409).json({
          success: false,
          message:
            'Payment status could not be updated',
        });
      }

      // ======================================================
      // CANCEL BOOKING
      // ======================================================

      const updatedBooking =
        await client.query(
          `
          UPDATE bookings
          SET
            status = 'CANCELLED',
            updated_at = NOW()
          WHERE id = $1
            AND status = 'CONFIRMED'
          RETURNING
            id,
            user_id,
            status,
            total_amount,
            updated_at
          `,
          [payment.booking_id]
        );

      // ======================================================
      // COMMIT
      // ======================================================

      await client.query('COMMIT');

      // ======================================================
      // SUCCESS
      // ======================================================

      return res.status(200).json({
        success: true,

        message:
          'Payment refunded successfully',

        refund: {
          id: refund.id,
          payment_id:
            refund.payment_id,
          amount:
            refund.amount,
          currency:
            refund.currency,
          status:
            refund.status,
        },

        payment:
          updatedPayment.rows[0],

        booking:
          updatedBooking.rows[0] ||
          {
            id: payment.booking_id,
            status:
              payment.booking_status,
          },
      });

    } catch (error) {

      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error(
          'Refund rollback error:',
          rollbackError
        );
      }

      console.error(
        'Admin Razorpay refund error:',
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error?.error?.description ||
          error?.description ||
          'Payment refund failed',
      });

    } finally {
      client.release();
    }
  }
);


// ============================================================
// ALL PAYMENTS
// ============================================================

router.get('/payments', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        p.*,

        u.name AS user_name,
        u.email AS user_email,

        b.booking_date,
        b.booking_time,

        r.name AS restaurant_name

      FROM payments p

      JOIN bookings b
        ON b.id = p.booking_id

      JOIN users u
        ON u.id = b.user_id

      JOIN restaurants r
        ON r.id = b.restaurant_id

      ORDER BY p.created_at DESC
    `);

    res.json({
      success: true,
      payments: result.rows,
    });
  } catch (error) {
    console.error(
      'Admin payments error:',
      error
    );

    res.status(500).json({
      success: false,
      message: 'Unable to load payments',
    });
  }
});


// ============================================================
// SINGLE BOOKING DETAILS
// ============================================================

router.get('/bookings/:id', async (req, res) => {
  const bookingId = Number(
    req.params.id
  );

  if (
    !Number.isInteger(bookingId) ||
    bookingId < 1
  ) {
    return res.status(400).json({
      success: false,
      message: 'Invalid booking ID',
    });
  }

  try {
    const result = await pool.query(
      `
      SELECT
        b.*,

        u.name AS user_name,
        u.email AS user_email,

        r.name AS restaurant_name,
        r.city AS restaurant_city

      FROM bookings b

      JOIN users u
        ON u.id = b.user_id

      JOIN restaurants r
        ON r.id = b.restaurant_id

      WHERE b.id = $1
      `,
      [bookingId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    const paymentResult =
      await pool.query(
        `
        SELECT *
        FROM payments
        WHERE booking_id = $1
        ORDER BY created_at DESC
        `,
        [bookingId]
      );

    res.json({
      success: true,
      booking: result.rows[0],
      payments: paymentResult.rows,
    });
  } catch (error) {
    console.error(
      'Admin booking details error:',
      error
    );

    res.status(500).json({
      success: false,
      message:
        'Unable to load booking details',
    });
  }
});


module.exports = router;