/* global require, module */

const express = require('express');
const pool = require('../config/database');
const authenticateToken = require('../middleware/authMiddleware');

const router = express.Router();

// ============================================================
// TEST ROUTE
// ============================================================

router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'USER ROUTES ARE WORKING'
  });
});

// ============================================================
// GET CURRENT USER
// ============================================================

router.get('/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        id,
        name,
        email,
        role
      FROM users
      WHERE id = $1
      LIMIT 1
      `,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = result.rows[0];

    return res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Get current user error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to get user information'
    });
  }
});

// ============================================================
// UPDATE CURRENT USER
// ============================================================

router.put('/me', authenticateToken, async (req, res) => {
  try {
    const { name, email } = req.body;

    // --------------------------------------------------------
    // Validate input
    // --------------------------------------------------------

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Name and email are required'
      });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (cleanName.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Name must contain at least 2 characters'
      });
    }

    // Basic email validation
    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address'
      });
    }

    // --------------------------------------------------------
    // Check whether another user already has this email
    // --------------------------------------------------------

    const existingUser = await pool.query(
      `
      SELECT id
      FROM users
      WHERE LOWER(email) = LOWER($1)
        AND id <> $2
      LIMIT 1
      `,
      [cleanEmail, req.user.id]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists'
      });
    }

    // --------------------------------------------------------
    // Update user
    // --------------------------------------------------------

    const result = await pool.query(
      `
      UPDATE users
      SET
        name = $1,
        email = $2
      WHERE id = $3
      RETURNING
        id,
        name,
        email,
        role
      `,
      [
        cleanName,
        cleanEmail,
        req.user.id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = result.rows[0];

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Update current user error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

// ============================================================
// CHANGE PASSWORD
// ============================================================

router.put('/password', authenticateToken, async (req, res) => {
  try {
    const {
      currentPassword,
      newPassword
    } = req.body;

    // --------------------------------------------------------
    // Validate required fields
    // --------------------------------------------------------

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    // --------------------------------------------------------
    // Validate new password length
    // --------------------------------------------------------

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must contain at least 6 characters'
      });
    }

    // --------------------------------------------------------
    // Prevent same password
    // --------------------------------------------------------

    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password must be different from current password'
      });
    }

    // --------------------------------------------------------
    // Get current user's password hash
    // --------------------------------------------------------

    const result = await pool.query(
      `
      SELECT
        id,
        password_hash
      FROM users
      WHERE id = $1
      LIMIT 1
      `,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = result.rows[0];

    if (!user.password_hash) {
      return res.status(400).json({
        success: false,
        message: 'Current password is not available for this account'
      });
    }

    // --------------------------------------------------------
    // Verify current password
    // --------------------------------------------------------

    const bcrypt = require('bcryptjs');

    const passwordMatches = await bcrypt.compare(
      currentPassword,
      user.password_hash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // --------------------------------------------------------
    // Hash new password
    // --------------------------------------------------------

    const newPasswordHash = await bcrypt.hash(
      newPassword,
      12
    );

    // --------------------------------------------------------
    // Update password
    // --------------------------------------------------------

    await pool.query(
      `
      UPDATE users
      SET
        password_hash = $1
      WHERE id = $2
      `,
      [
        newPasswordHash,
        req.user.id
      ]
    );

    return res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to change password'
    });
  }
});
module.exports = router;