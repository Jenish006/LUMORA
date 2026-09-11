/* global require, module */

const express = require('express');
const pool = require('../config/database');

const router = express.Router();


// ============================================================
// GET /api/restaurants
// Get all active restaurants
// ============================================================

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        name,
        slug,
        city,
        cuisine,
        description,
        rating,
        price_range,
        image_url,
        address,
        phone,
        is_active,
        created_at
      FROM restaurants
      WHERE is_active = TRUE
      ORDER BY id ASC
    `);

    res.json({
      success: true,
      count: result.rows.length,
      restaurants: result.rows
    });
  } catch (error) {
    console.error('Get restaurants error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch restaurants'
    });
  }
});


// ============================================================
// GET /api/restaurants/:slug
// Get one restaurant by slug
// ============================================================

router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const result = await pool.query(
      `
      SELECT
        id,
        name,
        slug,
        city,
        cuisine,
        description,
        rating,
        price_range,
        image_url,
        address,
        phone,
        is_active,
        created_at
      FROM restaurants
      WHERE slug = $1
        AND is_active = TRUE
      LIMIT 1
      `,
      [slug]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    return res.json({
      success: true,
      restaurant: result.rows[0]
    });
  } catch (error) {
    console.error('Get restaurant error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch restaurant'
    });
  }
});


// ============================================================
// GET /api/restaurants/:restaurantId/tables
// Get available tables
// ============================================================

router.get('/:restaurantId/tables', async (req, res) => {
  try {
    const { restaurantId } = req.params;

    const result = await pool.query(
      `
      SELECT
        id,
        restaurant_id,
        table_name,
        capacity,
        location,
        is_available,
        created_at
      FROM restaurant_tables
      WHERE restaurant_id = $1
        AND is_available = TRUE
      ORDER BY id ASC
      `,
      [restaurantId]
    );

    return res.json({
      success: true,
      count: result.rows.length,
      tables: result.rows
    });
  } catch (error) {
    console.error('Get restaurant tables error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch restaurant tables'
    });
  }
});


// ============================================================
// GET /api/restaurants/:restaurantId/rooms
// Get available private rooms
// ============================================================

router.get('/:restaurantId/rooms', async (req, res) => {
  try {
    const { restaurantId } = req.params;

    const result = await pool.query(
      `
      SELECT
        id,
        restaurant_id,
        room_name,
        capacity,
        price,
        is_available,
        created_at
      FROM private_rooms
      WHERE restaurant_id = $1
        AND is_available = TRUE
      ORDER BY id ASC
      `,
      [restaurantId]
    );

    return res.json({
      success: true,
      count: result.rows.length,
      rooms: result.rows
    });
  } catch (error) {
    console.error('Get private rooms error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch private rooms'
    });
  }
});


// ============================================================
// GET /api/restaurants/:restaurantId/availability
// Check restaurant hours + available tables + private rooms
// ============================================================

router.get('/:restaurantId/availability', async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { date, time, guests } = req.query;

    // --------------------------------------------------------
    // Validate restaurant ID
    // --------------------------------------------------------

    const restaurantIdNumber = Number(restaurantId);

    if (
      !Number.isInteger(restaurantIdNumber) ||
      restaurantIdNumber < 1
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid restaurant ID'
      });
    }

    // --------------------------------------------------------
    // Validate date
    // --------------------------------------------------------

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Booking date is required'
      });
    }

    // Validate date format: YYYY-MM-DD
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;

    if (!datePattern.test(date)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking date. Use YYYY-MM-DD'
      });
    }

    // --------------------------------------------------------
    // Validate time
    // --------------------------------------------------------

    if (!time) {
      return res.status(400).json({
        success: false,
        message: 'Booking time is required'
      });
    }

    // Validate time format: HH:MM or HH:MM:SS
    const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/;

    if (!timePattern.test(time)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking time. Use HH:MM'
      });
    }

    // --------------------------------------------------------
    // Validate guests
    // --------------------------------------------------------

    const guestCount = Number(guests);

    if (
      !guests ||
      !Number.isInteger(guestCount) ||
      guestCount < 1
    ) {
      return res.status(400).json({
        success: false,
        message: 'Valid guest count is required'
      });
    }

    // --------------------------------------------------------
    // Check restaurant exists and is active
    // --------------------------------------------------------

    const restaurantResult = await pool.query(
      `
      SELECT
        id,
        name,
        slug,
        city,
        cuisine,
        is_active
      FROM restaurants
      WHERE id = $1
        AND is_active = TRUE
      LIMIT 1
      `,
      [restaurantIdNumber]
    );

    if (restaurantResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found or inactive'
      });
    }

    const restaurant = restaurantResult.rows[0];

    // --------------------------------------------------------
    // Get restaurant hours
    // --------------------------------------------------------

    const hoursResult = await pool.query(
      `
      SELECT
        day_of_week,
        open_time,
        close_time,
        is_closed
      FROM restaurant_hours
      WHERE restaurant_id = $1
        AND day_of_week = EXTRACT(
          DOW FROM $2::date
        )::integer
      LIMIT 1
      `,
      [
        restaurantIdNumber,
        date
      ]
    );

    // --------------------------------------------------------
    // Hours not configured
    // --------------------------------------------------------

    if (hoursResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Restaurant hours are not configured for this day'
      });
    }

    const hours = hoursResult.rows[0];

    // --------------------------------------------------------
    // Restaurant closed
    // --------------------------------------------------------

    if (hours.is_closed) {
      return res.json({
        success: true,
        restaurant_id: restaurantIdNumber,
        restaurant_name: restaurant.name,
        booking_date: date,
        booking_time: time,
        guests: guestCount,
        restaurant_open: false,
        opening_hours: {
          open_time: hours.open_time,
          close_time: hours.close_time
        },
        message: 'Restaurant is closed on this day',
        tables: [],
        private_rooms: [],
        counts: {
          available_tables: 0,
          available_private_rooms: 0
        }
      });
    }

    // --------------------------------------------------------
    // Check requested time against opening hours
    // --------------------------------------------------------

    const timeStatusResult = await pool.query(
      `
      SELECT
        $1::time >= $2::time
        AND $1::time < $3::time AS is_open
      `,
      [
        time,
        hours.open_time,
        hours.close_time
      ]
    );

    const isOpen = timeStatusResult.rows[0].is_open;

    // --------------------------------------------------------
    // Requested time outside opening hours
    // --------------------------------------------------------

    if (!isOpen) {
      return res.json({
        success: true,
        restaurant_id: restaurantIdNumber,
        restaurant_name: restaurant.name,
        booking_date: date,
        booking_time: time,
        guests: guestCount,
        restaurant_open: false,
        opening_hours: {
          open_time: hours.open_time,
          close_time: hours.close_time
        },
        message: `Restaurant is open from ${hours.open_time} to ${hours.close_time}`,
        tables: [],
        private_rooms: [],
        counts: {
          available_tables: 0,
          available_private_rooms: 0
        }
      });
    }

    // --------------------------------------------------------
    // Get available tables
    // --------------------------------------------------------

    const tablesResult = await pool.query(
      `
      SELECT
        rt.id,
        rt.restaurant_id,
        rt.table_name,
        rt.capacity,
        rt.location,
        rt.is_available,
        rt.created_at
      FROM restaurant_tables rt
      WHERE rt.restaurant_id = $1
        AND rt.capacity >= $2
        AND rt.is_available = TRUE

        AND NOT EXISTS (
          SELECT 1
          FROM bookings b
          WHERE b.table_id = rt.id
            AND b.booking_date = $3
            AND b.booking_time = $4
            AND b.status IN ('PENDING', 'CONFIRMED')
        )

      ORDER BY
        rt.capacity ASC,
        rt.id ASC
      `,
      [
        restaurantIdNumber,
        guestCount,
        date,
        time
      ]
    );

    // --------------------------------------------------------
    // Get available private rooms
    // --------------------------------------------------------

    const roomsResult = await pool.query(
      `
      SELECT
        pr.id,
        pr.restaurant_id,
        pr.room_name,
        pr.capacity,
        pr.price,
        pr.is_available,
        pr.created_at
      FROM private_rooms pr
      WHERE pr.restaurant_id = $1
        AND pr.capacity >= $2
        AND pr.is_available = TRUE

        AND NOT EXISTS (
          SELECT 1
          FROM bookings b
          WHERE b.private_room_id = pr.id
            AND b.booking_date = $3
            AND b.booking_time = $4
            AND b.status IN ('PENDING', 'CONFIRMED')
        )

      ORDER BY
        pr.capacity ASC,
        pr.id ASC
      `,
      [
        restaurantIdNumber,
        guestCount,
        date,
        time
      ]
    );

    // --------------------------------------------------------
    // Final response
    // --------------------------------------------------------

    return res.json({
      success: true,
      restaurant_id: restaurantIdNumber,
      restaurant_name: restaurant.name,
      booking_date: date,
      booking_time: time,
      guests: guestCount,

      restaurant_open: true,

      opening_hours: {
        open_time: hours.open_time,
        close_time: hours.close_time
      },

      tables: tablesResult.rows,

      private_rooms: roomsResult.rows,

      counts: {
        available_tables: tablesResult.rows.length,
        available_private_rooms: roomsResult.rows.length
      }
    });

  } catch (error) {
    console.error(
      'Availability check error:',
      error
    );

    return res.status(500).json({
      success: false,
      message: 'Failed to check availability'
    });
  }
});


module.exports = router;
