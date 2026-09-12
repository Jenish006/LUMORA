/* global require, module, process */

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const pool = require('../config/database');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is missing from .env');
}


/*
==================================================
MAIL TRANSPORTER
==================================================
*/

const mailTransporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT || 587),
  secure: process.env.MAIL_SECURE === 'true',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASSWORD
  }
});


/*
==================================================
CHECK SMTP CONNECTION
==================================================
*/

mailTransporter.verify((error) => {
  if (error) {
    console.error(
      'LUMORA MAIL SMTP ERROR:',
      error
    );
  } else {
    console.log(
      'LUMORA MAIL SMTP CONNECTION SUCCESS'
    );
  }
});


/*
==================================================
SEND PASSWORD RESET EMAIL
==================================================
*/

async function sendPasswordResetEmail(
  to,
  resetCode
) {
  await mailTransporter.sendMail({
    from:
      process.env.MAIL_FROM ||
      process.env.MAIL_USER,

    to,

    subject:
      'LUMORA Password Reset Code',

    text: `
Your LUMORA password reset code is: ${resetCode}

This code will expire in 10 minutes.

If you did not request a password reset, you can safely ignore this email.

- LUMORA
    `.trim(),

    html: `
      <div style="
        font-family: Arial, Helvetica, sans-serif;
        max-width: 520px;
        margin: 40px auto;
        padding: 30px;
        background: #ffffff;
        border: 1px solid #e5e5e5;
        border-radius: 14px;
      ">

        <h2 style="
          margin: 0 0 20px;
          color: #171717;
          font-size: 28px;
          letter-spacing: 2px;
        ">
          LUMORA
        </h2>

        <p style="
          color: #444;
          font-size: 16px;
          line-height: 1.6;
        ">
          We received a request to reset your
          LUMORA account password.
        </p>

        <p style="
          color: #444;
          font-size: 16px;
        ">
          Your verification code is:
        </p>

        <div style="
          margin: 25px 0;
          padding: 20px;
          background: #f5f3ef;
          border-radius: 10px;
          text-align: center;
          font-size: 34px;
          font-weight: bold;
          letter-spacing: 10px;
          color: #171717;
        ">
          ${resetCode}
        </div>

        <p style="
          color: #555;
          font-size: 14px;
          line-height: 1.6;
        ">
          This verification code will expire in
          <strong>10 minutes</strong>.
        </p>

        <p style="
          color: #777;
          font-size: 14px;
          line-height: 1.6;
        ">
          If you did not request a password reset,
          you can safely ignore this email.
        </p>

        <hr style="
          border: none;
          border-top: 1px solid #eeeeee;
          margin: 25px 0;
        ">

        <p style="
          color: #999;
          font-size: 12px;
        ">
          This is an automated email from LUMORA.
        </p>

      </div>
    `
  });
}


/*
==================================================
REGISTER
==================================================
*/

router.post('/register', async (req, res) => {
  try {
    const {
      name,
      email,
      password
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message:
          'Name, email and password are required'
      });
    }

    const cleanName = name.trim();

    const cleanEmail =
      email.trim().toLowerCase();

    if (cleanName.length < 2) {
      return res.status(400).json({
        success: false,
        message:
          'Please enter a valid name'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message:
          'Password must contain at least 6 characters'
      });
    }

    const existingUser =
      await pool.query(
        `
        SELECT id
        FROM users
        WHERE LOWER(email) = LOWER($1)
        LIMIT 1
        `,
        [cleanEmail]
      );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message:
          'An account with this email already exists'
      });
    }

    const passwordHash =
      await bcrypt.hash(
        password,
        12
      );

    const result =
      await pool.query(
        `
        INSERT INTO users (
          name,
          email,
          password_hash,
          role
        )
        VALUES ($1, $2, $3, 'CUSTOMER')
        RETURNING id, name, email, role
        `,
        [
          cleanName,
          cleanEmail,
          passwordHash
        ]
      );

    const user = result.rows[0];

    res.status(201).json({
      success: true,
      message:
        'Account created successfully',

      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error(
      'Registration error:',
      error
    );

    res.status(500).json({
      success: false,
      message:
        'Registration failed'
    });
  }
});


/*
==================================================
LOGIN
WITH BRUTE-FORCE PROTECTION
==================================================
*/

router.post('/login', async (req, res) => {
  try {
    const {
      email,
      password
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message:
          'Email and password are required'
      });
    }

    const cleanEmail =
      email.trim().toLowerCase();

    const result =
      await pool.query(
        `
        SELECT
          id,
          name,
          email,
          role,
          password_hash,
          login_failed_attempts,
          login_locked_until
        FROM users
        WHERE LOWER(email) = LOWER($1)
        LIMIT 1
        `,
        [cleanEmail]
      );

    /*
    ==============================================
    INVALID ACCOUNT
    ==============================================
    */

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message:
          'Invalid email or password'
      });
    }

    const user = result.rows[0];


    /*
    ==============================================
    CHECK ACCOUNT LOCK
    ==============================================
    */

    if (
      user.login_locked_until &&
      new Date(user.login_locked_until) > new Date()
    ) {
      const remainingSeconds =
        Math.ceil(
          (
            new Date(
              user.login_locked_until
            ).getTime() -
            Date.now()
          ) / 1000
        );

      const remainingMinutes =
        Math.ceil(
          remainingSeconds / 60
        );

      return res.status(429).json({
        success: false,
        message:
          `Too many failed login attempts. Please try again in ${remainingMinutes} minute${remainingMinutes === 1 ? '' : 's'}.`
      });
    }


    /*
    ==============================================
    CLEAR EXPIRED LOCK
    ==============================================
    */

    if (
      user.login_locked_until &&
      new Date(user.login_locked_until) <= new Date()
    ) {
      await pool.query(
        `
        UPDATE users
        SET
          login_failed_attempts = 0,
          login_locked_until = NULL
        WHERE id = $1
        `,
        [user.id]
      );

      user.login_failed_attempts = 0;
      user.login_locked_until = null;
    }


    /*
    ==============================================
    PASSWORD EXISTENCE CHECK
    ==============================================
    */

    if (!user.password_hash) {
      return res.status(401).json({
        success: false,
        message:
          'This account does not have a valid password. Please register again.'
      });
    }


    /*
    ==============================================
    CHECK PASSWORD
    ==============================================
    */

    const passwordMatches =
      await bcrypt.compare(
        password,
        user.password_hash
      );


    /*
    ==============================================
    WRONG PASSWORD
    ==============================================
    */

    if (!passwordMatches) {

      const failedAttempts =
        Number(
          user.login_failed_attempts || 0
        ) + 1;


      /*
      ----------------------------------------------
      5TH FAILED ATTEMPT
      LOCK ACCOUNT FOR 15 MINUTES
      ----------------------------------------------
      */

      if (failedAttempts >= 5) {

        await pool.query(
          `
          UPDATE users
          SET
            login_failed_attempts = 5,
            login_locked_until =
              NOW() + INTERVAL '15 minutes'
          WHERE id = $1
          `,
          [user.id]
        );

        return res.status(429).json({
          success: false,
          message:
            'Too many failed login attempts. Your account has been temporarily locked for 15 minutes.'
        });
      }


      /*
      ----------------------------------------------
      SAVE FAILED ATTEMPT
      ----------------------------------------------
      */

      await pool.query(
        `
        UPDATE users
        SET
          login_failed_attempts = $1
        WHERE id = $2
        `,
        [
          failedAttempts,
          user.id
        ]
      );

      return res.status(401).json({
        success: false,
        message:
          `Invalid email or password. ${5 - failedAttempts} attempt${5 - failedAttempts === 1 ? '' : 's'} remaining.`
      });
    }


    /*
    ==============================================
    LOGIN SUCCESSFUL
    RESET FAILED ATTEMPTS
    ==============================================
    */

    await pool.query(
      `
      UPDATE users
      SET
        login_failed_attempts = 0,
        login_locked_until = NULL
      WHERE id = $1
      `,
      [user.id]
    );


    /*
    ==============================================
    CREATE JWT
    ==============================================
    */

    const token =
      jwt.sign(
        {
          id: user.id,
          role: user.role
        },
        JWT_SECRET,
        {
          expiresIn: '7d'
        }
      );


    /*
    ==============================================
    STORE JWT IN HTTP-ONLY COOKIE
    ==============================================
    */

    res.cookie(
  'lumora_token',
  token,
  {
    httpOnly: true,

    secure: true,

    sameSite: 'none',

    maxAge:
      7 *
      24 *
      60 *
      60 *
      1000
  }
);


    /*
    ==============================================
    LOGIN SUCCESS
    ==============================================
    */

    res.json({
      success: true,
      message:
        'Login successful',

      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error(
      'Login error:',
      error
    );

    res.status(500).json({
      success: false,
      message:
        'Login failed'
    });
  }
});


/*
==================================================
FORGOT PASSWORD
SEND RESET CODE
==================================================
*/

router.post(
  '/forgot-password',
  async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message:
            'Email address is required'
        });
      }

      const cleanEmail =
        email.trim().toLowerCase();

      const result =
        await pool.query(
          `
          SELECT
            id,
            reset_code_last_sent_at
          FROM users
          WHERE LOWER(email) = LOWER($1)
          LIMIT 1
          `,
          [cleanEmail]
        );

      /*
        Do not reveal whether
        an account exists.
      */

      if (result.rows.length === 0) {
        return res.json({
          success: true,
          message:
            'If an account exists with this email, a verification code has been sent.'
        });
      }

      const user =
        result.rows[0];


      /*
      ==============================================
      60 SECOND RESEND COOLDOWN
      ==============================================
      */

      if (user.reset_code_last_sent_at) {
        const lastSent =
          new Date(
            user.reset_code_last_sent_at
          ).getTime();

        const now =
          Date.now();

        const cooldown =
          60 * 1000;

        if (
          now - lastSent <
          cooldown
        ) {
          const remainingSeconds =
            Math.ceil(
              (
                cooldown -
                (now - lastSent)
              ) / 1000
            );

          return res.status(429).json({
            success: false,
            message:
              `Please wait ${remainingSeconds} seconds before requesting another code.`
          });
        }
      }


      /*
      ==============================================
      GENERATE SECURE 6-DIGIT RESET CODE
      ==============================================
      */

      const resetCode =
        (
          crypto
            .randomBytes(4)
            .readUInt32BE(0) %
          900000
        ) + 100000;

      const resetCodeString =
        resetCode.toString();


      /*
      ==============================================
      HASH RESET CODE
      ==============================================
      */

      const resetCodeHash =
        crypto
          .createHash('sha256')
          .update(resetCodeString)
          .digest('hex');


      /*
      ==============================================
      CODE EXPIRES AFTER 10 MINUTES
      ==============================================
      */

      const expiresAt =
        new Date(
          Date.now() +
          10 * 60 * 1000
        );


      /*
      ==============================================
      SAVE RESET CODE
      RESET ATTEMPTS TO ZERO
      ==============================================
      */

      await pool.query(
        `
        UPDATE users
        SET
          reset_code_hash = $1,
          reset_code_expires_at = $2,
          reset_code_last_sent_at = NOW(),
          reset_code_attempts = 0
        WHERE id = $3
        `,
        [
          resetCodeHash,
          expiresAt,
          user.id
        ]
      );


      /*
      ==============================================
      SEND RESET CODE THROUGH EMAIL
      ==============================================
      */

      try {
        await sendPasswordResetEmail(
          cleanEmail,
          resetCodeString
        );

      } catch (emailError) {

        console.error(
          'Password reset email error:',
          emailError
        );


        /*
          Clear reset information
          if email delivery fails.
        */

        await pool.query(
          `
          UPDATE users
          SET
            reset_code_hash = NULL,
            reset_code_expires_at = NULL,
            reset_code_last_sent_at = NULL,
            reset_code_attempts = 0
          WHERE id = $1
          `,
          [user.id]
        );

        return res.status(500).json({
          success: false,
          message:
            'Unable to send password reset email'
        });
      }


      res.json({
        success: true,
        message:
          'If an account exists with this email, a verification code has been sent.'
      });

    } catch (error) {
      console.error(
        'Forgot password error:',
        error
      );

      res.status(500).json({
        success: false,
        message:
          'Unable to process password reset request'
      });
    }
  }
);


/*
==================================================
VERIFY PASSWORD RESET CODE
==================================================
*/

router.post(
  '/verify-reset-code',
  async (req, res) => {
    try {
      const {
        email,
        code
      } = req.body;

      if (!email || !code) {
        return res.status(400).json({
          success: false,
          message:
            'Email and verification code are required'
        });
      }

      const cleanEmail =
        email.trim().toLowerCase();

      const result =
        await pool.query(
          `
          SELECT
            id,
            reset_code_hash,
            reset_code_expires_at,
            reset_code_attempts
          FROM users
          WHERE LOWER(email) = LOWER($1)
          LIMIT 1
          `,
          [cleanEmail]
        );

      if (result.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message:
            'Invalid verification code'
        });
      }

      const user =
        result.rows[0];


      /*
      ==============================================
      CHECK RESET CODE EXISTS
      ==============================================
      */

      if (
        !user.reset_code_hash ||
        !user.reset_code_expires_at
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Invalid or expired verification code'
        });
      }


      /*
      ==============================================
      CHECK EXPIRY
      ==============================================
      */

      if (
        new Date(
          user.reset_code_expires_at
        ) <= new Date()
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Verification code has expired'
        });
      }


      /*
      ==============================================
      MAXIMUM 5 ATTEMPTS
      ==============================================
      */

      if (
        Number(
          user.reset_code_attempts || 0
        ) >= 5
      ) {
        return res.status(429).json({
          success: false,
          message:
            'Too many incorrect attempts. Please request a new verification code.'
        });
      }


      /*
      ==============================================
      HASH ENTERED CODE
      ==============================================
      */

      const codeHash =
        crypto
          .createHash('sha256')
          .update(code.toString())
          .digest('hex');


      /*
      ==============================================
      COMPARE CODE
      ==============================================
      */

      if (
        codeHash !==
        user.reset_code_hash
      ) {

        const newAttempts =
          Number(
            user.reset_code_attempts || 0
          ) + 1;


        /*
          5th wrong attempt:
          invalidate code completely.
        */

        if (newAttempts >= 5) {

          await pool.query(
            `
            UPDATE users
            SET
              reset_code_hash = NULL,
              reset_code_expires_at = NULL,
              reset_code_last_sent_at = NULL,
              reset_code_attempts = 0
            WHERE id = $1
            `,
            [user.id]
          );

          return res.status(429).json({
            success: false,
            message:
              'Too many incorrect attempts. Please request a new verification code.'
          });
        }


        /*
          Save failed attempt count.
        */

        await pool.query(
          `
          UPDATE users
          SET reset_code_attempts = $1
          WHERE id = $2
          `,
          [
            newAttempts,
            user.id
          ]
        );


        return res.status(400).json({
          success: false,
          message:
            `Invalid verification code. ${5 - newAttempts} attempts remaining.`
        });
      }


      /*
      ==============================================
      CORRECT CODE
      RESET ATTEMPT COUNTER
      ==============================================
      */

      await pool.query(
        `
        UPDATE users
        SET reset_code_attempts = 0
        WHERE id = $1
        `,
        [user.id]
      );


      res.json({
        success: true,
        message:
          'Verification code is valid'
      });

    } catch (error) {
      console.error(
        'Verify reset code error:',
        error
      );

      res.status(500).json({
        success: false,
        message:
          'Unable to verify code'
      });
    }
  }
);


/*
==================================================
RESET PASSWORD
==================================================
*/

router.post(
  '/reset-password',
  async (req, res) => {
    try {
      const {
        email,
        code,
        password
      } = req.body;

      if (
        !email ||
        !code ||
        !password
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Email, verification code and password are required'
        });
      }


      /*
      ==============================================
      PASSWORD VALIDATION
      ==============================================
      */

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message:
            'Password must contain at least 6 characters'
        });
      }


      const cleanEmail =
        email.trim().toLowerCase();


      const result =
        await pool.query(
          `
          SELECT
            id,
            reset_code_hash,
            reset_code_expires_at,
            reset_code_attempts
          FROM users
          WHERE LOWER(email) = LOWER($1)
          LIMIT 1
          `,
          [cleanEmail]
        );


      if (result.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message:
            'Invalid password reset request'
        });
      }


      const user =
        result.rows[0];


      /*
      ==============================================
      CHECK RESET CODE EXISTS
      ==============================================
      */

      if (
        !user.reset_code_hash ||
        !user.reset_code_expires_at
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Invalid or expired verification code'
        });
      }


      /*
      ==============================================
      CHECK EXPIRY
      ==============================================
      */

      if (
        new Date(
          user.reset_code_expires_at
        ) <= new Date()
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Verification code has expired'
        });
      }


      /*
      ==============================================
      PROTECT RESET PASSWORD
      AGAINST BRUTE FORCE
      ==============================================
      */

      if (
        Number(
          user.reset_code_attempts || 0
        ) >= 5
      ) {
        return res.status(429).json({
          success: false,
          message:
            'Too many incorrect attempts. Please request a new verification code.'
        });
      }


      /*
      ==============================================
      HASH ENTERED VERIFICATION CODE
      ==============================================
      */

      const codeHash =
        crypto
          .createHash('sha256')
          .update(code.toString())
          .digest('hex');


      /*
      ==============================================
      VERIFY CODE
      ==============================================
      */

      if (
        codeHash !==
        user.reset_code_hash
      ) {

        const newAttempts =
          Number(
            user.reset_code_attempts || 0
          ) + 1;


        /*
          Invalidate after 5th
          failed attempt.
        */

        if (newAttempts >= 5) {

          await pool.query(
            `
            UPDATE users
            SET
              reset_code_hash = NULL,
              reset_code_expires_at = NULL,
              reset_code_last_sent_at = NULL,
              reset_code_attempts = 0
            WHERE id = $1
            `,
            [user.id]
          );

          return res.status(429).json({
            success: false,
            message:
              'Too many incorrect attempts. Please request a new verification code.'
          });
        }


        await pool.query(
          `
          UPDATE users
          SET reset_code_attempts = $1
          WHERE id = $2
          `,
          [
            newAttempts,
            user.id
          ]
        );


        return res.status(400).json({
          success: false,
          message:
            `Invalid verification code. ${5 - newAttempts} attempts remaining.`
        });
      }


      /*
      ==============================================
      HASH NEW PASSWORD
      ==============================================
      */

      const passwordHash =
        await bcrypt.hash(
          password,
          12
        );


      /*
      ==============================================
      UPDATE PASSWORD
      AND INVALIDATE RESET CODE
      ==============================================
      */

      await pool.query(
        `
        UPDATE users
        SET
          password_hash = $1,
          reset_code_hash = NULL,
          reset_code_expires_at = NULL,
          reset_code_last_sent_at = NULL,
          reset_code_attempts = 0
        WHERE id = $2
        `,
        [
          passwordHash,
          user.id
        ]
      );


      res.json({
        success: true,
        message:
          'Password updated successfully'
      });

    } catch (error) {
      console.error(
        'Reset password error:',
        error
      );

      res.status(500).json({
        success: false,
        message:
          'Unable to reset password'
      });
    }
  }
);


/*
==================================================
LOGOUT
==================================================
*/

router.post(
  '/logout',
  (req, res) => {

    res.clearCookie(
      'lumora_token',
      {
        httpOnly: true,
        secure:
          process.env.NODE_ENV ===
          'production',
        sameSite: 'lax'
      }
    );

    res.json({
      success: true,
      message:
        'Logout successful'
    });
  }
);


/*
==================================================
EXPORT ROUTER
==================================================
*/

module.exports = router;