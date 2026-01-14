// backend/routes/phoneAuth.js
const express = require('express');
const router = express.Router();
const { verifyPhoneToken } = require('../services/firebaseService');
const mysql = require('mysql2/promise');
const { parsePhoneNumber } = require('libphonenumber-js');

// Get database pool from parent
let pool;

// Set pool function to be called from main server
function setPool(dbPool) {
  pool = dbPool;
}

/**
 * POST /api/auth/phone/verify
 * Verify Firebase ID token and login/register user
 */
router.post('/verify', async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'Firebase ID token is required',
      });
    }

    // Verify Firebase token
    const verification = await verifyPhoneToken(idToken);

    if (!verification.success) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
        error: verification.error,
      });
    }

    const phoneNumber = verification.phoneNumber;

    // Check if phone number exists in CONTACT_NUMBER table
    const [contactResults] = await pool.query(
      `SELECT cn.donor_id, d.full_name, d.email, d.is_active, d.blood_group, d.availability
       FROM CONTACT_NUMBER cn
       JOIN DONOR d ON cn.donor_id = d.donor_id
       WHERE cn.phone_number = ? OR cn.phone_number = ?`,
      [phoneNumber, phoneNumber.replace('+88', '')]
    );

    if (contactResults.length > 0) {
      // Existing user - login
      const donor = contactResults[0];

      if (!donor.is_active) {
        return res.status(403).json({
          success: false,
          message: 'Account is deactivated',
        });
      }

      return res.json({
        success: true,
        message: 'Login successful',
        user: {
          donor_id: donor.donor_id,
          full_name: donor.full_name,
          email: donor.email,
          phone_number: phoneNumber,
          blood_group: donor.blood_group,
          availability: donor.availability,
        },
        isNewUser: false,
      });
    } else {
      // New user - needs to complete registration
      return res.json({
        success: true,
        message: 'Phone verified - complete registration',
        phone_number: phoneNumber,
        firebase_uid: verification.uid,
        isNewUser: true,
        requiresRegistration: true,
      });
    }
  } catch (error) {
    console.error('Phone verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during phone verification',
      error: error.message,
    });
  }
});

/**
 * POST /api/auth/phone/format
 * Format phone number to E.164 format
 */
router.post('/format', (req, res) => {
  try {
    const { phoneNumber, country = 'BD' } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required',
      });
    }

    // Parse and format phone number
    const parsed = parsePhoneNumber(phoneNumber, country);

    if (!parsed || !parsed.isValid()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number format',
      });
    }

    res.json({
      success: true,
      formatted: parsed.number, // E.164 format (e.g., +8801712345678)
      national: parsed.formatNational(),
      international: parsed.formatInternational(),
      country: parsed.country,
    });
  } catch (error) {
    console.error('Phone format error:', error);
    res.status(400).json({
      success: false,
      message: 'Error formatting phone number',
      error: error.message,
    });
  }
});

module.exports = router;
module.exports.setPool = setPool;
