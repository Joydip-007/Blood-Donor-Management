/**
 * Blood Donor Management System - Backend API Server
 * 
 * This server connects the frontend with the MySQL database
 * following the ERD structure defined in database.sql
 * 
 * Database Tables (from ERD):
 * - LOCATION: Stores location information
 * - BLOOD_GROUP: Blood types and Rh factors
 * - DONOR: Donor information with FK to LOCATION and BLOOD_GROUP
 * - CONTACT_NUMBER: Multiple phone numbers per donor (1:N)
 * - BLOOD_COMPATIBILITY: Blood type compatibility rules
 * - EMERGENCY_REQUEST: Emergency blood requests
 * - OTP: OTP verification records
 */

const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const { Resend } = require('resend');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Resend email service
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

// Middleware
app.use(cors());
app.use(express.json());

// Database connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'blood_donor_management',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// In-memory session store (for demo - use Redis in production)
const sessions = new Map();
const otpStore = new Map();

// Helper Functions

// Generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Generate session token
function generateSessionToken() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Mask identifier for production logs
function maskIdentifier(identifier) {
  if (!identifier) return 'unknown';
  if (identifier.includes('@')) {
    // Email: show first 2 chars and domain
    const [local, domain] = identifier.split('@');
    return `${local.substring(0, 2)}***@${domain}`;
  } else {
    // Phone: show last 4 digits
    return `***${identifier.slice(-4)}`;
  }
}

// Send OTP via email using Resend
async function sendOTPEmail(email, otp) {
  if (!resend) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`⚠️  Resend not configured. OTP for ${email}: ${otp}`);
    } else {
      console.log(`⚠️  Resend not configured`);
    }
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: RESEND_FROM_EMAIL,
      to: email,
      subject: '🩸 Blood Donor Management - Your OTP Code',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🩸 Blood Donor Management</h1>
            <p style="color: #fecaca; margin: 10px 0 0 0; font-size: 14px;">Secure OTP Authentication</p>
          </div>
          
          <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">Your Verification Code</h2>
            
            <p style="color: #6b7280; font-size: 16px; margin: 0 0 30px 0;">
              Use this code to complete your authentication. This code is valid for <strong>10 minutes</strong>.
            </p>
            
            <div style="background: #f3f4f6; border: 2px dashed #dc2626; border-radius: 8px; padding: 30px; text-align: center; margin: 30px 0;">
              <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #dc2626; font-family: 'Courier New', monospace;">
                ${otp}
              </div>
              <p style="color: #6b7280; font-size: 12px; margin: 10px 0 0 0;">Valid for 10 minutes</p>
            </div>
            
            <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 30px 0; border-radius: 4px;">
              <p style="margin: 0; color: #991b1b; font-size: 14px;">
                <strong>🔒 Security Notice:</strong><br>
                Never share this code with anyone. Our team will never ask for your OTP.
              </p>
            </div>
            
            <p style="color: #9ca3af; font-size: 12px; margin: 30px 0 0 0; text-align: center;">
              If you didn't request this code, please ignore this email.
            </p>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
            <p style="margin: 0;">Blood Donor Management System</p>
            <p style="margin: 5px 0 0 0;">Saving lives, one donation at a time 🩸</p>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      return { success: false, error: error.message };
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log(`✅ OTP email sent to ${email} (ID: ${data.id})`);
    } else {
      console.log(`✅ OTP email sent (ID: ${data.id})`);
    }
    return { success: true, data };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
}

// Get blood group ID from name (e.g., "A+" -> bg_id)
async function getBloodGroupId(bloodGroupName) {
  const match = bloodGroupName.match(/^(A|B|AB|O)([+-])$/);
  if (!match) return null;
  
  const [, bgName, rhFactor] = match;
  const [rows] = await pool.execute(
    'SELECT bg_id FROM BLOOD_GROUP WHERE bg_name = ? AND rh_factor = ?',
    [bgName, rhFactor]
  );
  
  return rows.length > 0 ? rows[0].bg_id : null;
}

// Get blood group name from ID
async function getBloodGroupName(bgId) {
  const [rows] = await pool.execute(
    'SELECT bg_name, rh_factor FROM BLOOD_GROUP WHERE bg_id = ?',
    [bgId]
  );
  
  return rows.length > 0 ? `${rows[0].bg_name}${rows[0].rh_factor}` : null;
}

// Get or create location
async function getOrCreateLocation(city, area, latitude = null, longitude = null) {
  // Check if location exists
  const [existing] = await pool.execute(
    'SELECT location_id FROM LOCATION WHERE city = ? AND area = ?',
    [city, area]
  );
  
  if (existing.length > 0) {
    return existing[0].location_id;
  }
  
  // Create new location
  const [result] = await pool.execute(
    'INSERT INTO LOCATION (city, area, latitude, longitude) VALUES (?, ?, ?, ?)',
    [city, area, latitude, longitude]
  );
  
  return result.insertId;
}

// Get compatible donor blood groups for a receiver (from BLOOD_COMPATIBILITY table)
async function getCompatibleDonorBloodGroups(receiverBgId) {
  const [rows] = await pool.execute(
    'SELECT donor_bg FROM BLOOD_COMPATIBILITY WHERE receiver_bg = ?',
    [receiverBgId]
  );
  
  return rows.map(r => r.donor_bg);
}

// Map gender code to full name
const genderMap = { 'M': 'Male', 'F': 'Female', 'O': 'Other' };
const genderReverseMap = { 'Male': 'M', 'Female': 'F', 'Other': 'O' };

// ==================== AUTH ROUTES ====================

// Request OTP
app.post('/api/auth/request-otp', async (req, res) => {
  try {
    if (process.env.NODE_ENV !== 'production') {
      console.log('📨 OTP request received:', { email: req.body.email, phone: req.body.phone });
    } else {
      console.log('📨 OTP request received');
    }
    
    const { email, phone } = req.body;
    
    if (!email && !phone) {
      console.log('❌ No email or phone provided');
      return res.status(400).json({ error: 'Email or phone required' });
    }

    const otp = generateOTP();
    if (process.env.NODE_ENV !== 'production') {
      console.log(`🔑 Generated OTP for ${email || phone}: ${otp}`);
    } else {
      console.log(`🔑 Generated OTP for ${maskIdentifier(email || phone)}`);
    }
    
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    const identifier = email || phone;

    // Store OTP
    otpStore.set(identifier, { otp, expiresAt, email, phone });
    if (process.env.NODE_ENV !== 'production') {
      console.log(`💾 OTP stored for ${identifier}, expires at ${expiresAt.toISOString()}`);
    } else {
      console.log(`💾 OTP stored, expires at ${expiresAt.toISOString()}`);
    }

    // Send OTP via email if email provided
    if (email) {
      console.log('📧 Attempting to send email via Resend...');
      const emailResult = await sendOTPEmail(email, otp);
      console.log('📧 Email result:', emailResult);
      
      if (emailResult.success) {
        res.json({ 
          success: true, 
          message: 'OTP sent successfully to your email'
        });
      } else {
        // Fallback: still return success but log the issue
        if (process.env.NODE_ENV !== 'production') {
          console.log(`⚠️  Email failed, OTP for ${identifier}: ${otp}`);
        } else {
          console.log(`⚠️  Email failed for ${maskIdentifier(identifier)}`);
        }
        const response = { 
          success: true, 
          message: 'OTP generated (email service unavailable)'
        };
        // Only include OTP in response for development/demo
        if (process.env.NODE_ENV !== 'production') {
          response.otp = otp;
        }
        res.json(response);
      }
    } else {
      // Phone OTP - log to console (SMS integration can be added later)
      if (process.env.NODE_ENV !== 'production') {
        console.log(`📱 OTP for ${phone}: ${otp}`);
      } else {
        console.log(`📱 OTP requested for ${maskIdentifier(phone)}`);
      }
      const response = { 
        success: true, 
        message: 'OTP sent successfully'
      };
      // Only include OTP in response for development/demo
      if (process.env.NODE_ENV !== 'production') {
        response.otp = otp;
      }
      res.json(response);
    }
  } catch (error) {
    console.error('❌ Error in request-otp:', error);
    if (process.env.NODE_ENV !== 'production') {
      res.status(500).json({ error: 'Failed to send OTP', details: error.message });
    } else {
      res.status(500).json({ error: 'Failed to send OTP' });
    }
  }
});

// Verify OTP
app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔐 OTP verification request:', { email: req.body.email, phone: req.body.phone });
    } else {
      console.log('🔐 OTP verification request received');
    }
    
    const { email, phone, otp } = req.body;
    const identifier = email || phone;
    
    if (!identifier) {
      console.log('❌ No identifier provided for verification');
      return res.status(400).json({ error: 'Email or phone required' });
    }
    
    const otpData = otpStore.get(identifier);
    
    if (!otpData) {
      if (process.env.NODE_ENV !== 'production') {
        console.log(`❌ No OTP found for ${identifier}`);
      } else {
        console.log(`❌ No OTP found for ${maskIdentifier(identifier)}`);
      }
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }
    
    if (otpData.otp !== otp) {
      if (process.env.NODE_ENV !== 'production') {
        console.log(`❌ Invalid OTP for ${identifier}`);
      } else {
        console.log(`❌ Invalid OTP for ${maskIdentifier(identifier)}`);
      }
      return res.status(400).json({ error: 'Invalid OTP' });
    }
    
    if (new Date(otpData.expiresAt) < new Date()) {
      otpStore.delete(identifier);
      if (process.env.NODE_ENV !== 'production') {
        console.log(`❌ OTP expired for ${identifier}`);
      } else {
        console.log(`❌ OTP expired for ${maskIdentifier(identifier)}`);
      }
      return res.status(400).json({ error: 'OTP expired' });
    }

    // Clean up OTP
    otpStore.delete(identifier);
    if (process.env.NODE_ENV !== 'production') {
      console.log(`✅ OTP verified successfully for ${identifier}`);
    } else {
      console.log(`✅ OTP verified successfully for ${maskIdentifier(identifier)}`);
    }

    // Check if donor exists
    let donorId = null;
    if (email) {
      const [donors] = await pool.execute(
        'SELECT donor_id FROM DONOR WHERE email = ? AND is_active = TRUE',
        [email]
      );
      if (donors.length > 0) {
        donorId = donors[0].donor_id;
        if (process.env.NODE_ENV !== 'production') {
          console.log(`👤 Found existing donor with ID: ${donorId}`);
        } else {
          console.log(`👤 Found existing donor`);
        }
      } else {
        console.log(`👤 No existing donor found, new user`);
      }
    }

    // Create session
    const sessionToken = generateSessionToken();
    const userData = {
      id: donorId || identifier,
      email,
      phone,
      donorId,
      createdAt: new Date().toISOString(),
      isActive: true
    };

    sessions.set(sessionToken, userData);
    console.log(`🎫 Session created`);

    res.json({ 
      success: true,
      token: sessionToken,
      user: userData
    });
  } catch (error) {
    console.error('❌ Error in verify-otp:', error);
    if (process.env.NODE_ENV !== 'production') {
      res.status(500).json({ error: 'Failed to verify OTP', details: error.message });
    } else {
      res.status(500).json({ error: 'Failed to verify OTP' });
    }
  }
});

// ==================== DONOR ROUTES ====================

// Register new donor
app.post('/api/donors/register', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const session = sessions.get(token);
    
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { name, email, phone, alternatePhone, age, gender, bloodGroup, city, area, address, latitude, longitude } = req.body;

    // Validate age (per ERD: CHECK (age >= 18))
    if (age < 18) {
      return res.status(400).json({ error: 'Donor must be 18 or above' });
    }

    // Check for duplicate email (per ERD: email is UNIQUE)
    const [existingEmail] = await pool.execute(
      'SELECT donor_id FROM DONOR WHERE email = ? AND is_active = TRUE',
      [email]
    );
    if (existingEmail.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Check for duplicate phone
    const [existingPhone] = await pool.execute(
      'SELECT cn.donor_id FROM CONTACT_NUMBER cn JOIN DONOR d ON cn.donor_id = d.donor_id WHERE cn.phone_number = ? AND d.is_active = TRUE',
      [phone]
    );
    if (existingPhone.length > 0) {
      return res.status(400).json({ error: 'Phone number already registered' });
    }

    // Get blood group ID
    const bloodGroupId = await getBloodGroupId(bloodGroup);
    if (!bloodGroupId) {
      return res.status(400).json({ error: 'Invalid blood group' });
    }

    // Get or create location
    const locationId = await getOrCreateLocation(city, area, latitude, longitude);

    // Insert donor (per ERD: DONOR table)
    const [result] = await pool.execute(
      `INSERT INTO DONOR (full_name, age, gender, email, blood_group, availability, last_donate, is_active, location_id) 
       VALUES (?, ?, ?, ?, ?, TRUE, NULL, TRUE, ?)`,
      [name, age, genderReverseMap[gender] || gender, email, bloodGroupId, locationId]
    );

    const donorId = result.insertId;

    // Insert primary phone (per ERD: CONTACT_NUMBER table, 1:N relationship)
    await pool.execute(
      'INSERT INTO CONTACT_NUMBER (donor_id, phone_number) VALUES (?, ?)',
      [donorId, phone]
    );

    // Insert alternate phone if provided
    if (alternatePhone) {
      await pool.execute(
        'INSERT INTO CONTACT_NUMBER (donor_id, phone_number) VALUES (?, ?)',
        [donorId, alternatePhone]
      );
    }

    // Update session with donor ID
    session.donorId = donorId;
    sessions.set(token, session);

    const donor = {
      id: donorId.toString(),
      name,
      email,
      phone,
      alternatePhone,
      age,
      gender,
      bloodGroup,
      city,
      area,
      address: address || '',
      latitude,
      longitude,
      isAvailable: true,
      isDeleted: false,
      lastDonationDate: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    res.json({ success: true, donor });
  } catch (error) {
    console.error('Error registering donor:', error);
    res.status(500).json({ error: 'Failed to register donor' });
  }
});

// Get donor profile
app.get('/api/donors/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const session = sessions.get(token);
    
    if (!session || !session.donorId) {
      return res.status(404).json({ error: 'Donor not found' });
    }

    // Query donor with location join (per ERD relationships)
    const [donors] = await pool.execute(
      `SELECT d.*, l.city, l.area, l.latitude, l.longitude 
       FROM DONOR d 
       LEFT JOIN LOCATION l ON d.location_id = l.location_id 
       WHERE d.donor_id = ? AND d.is_active = TRUE`,
      [session.donorId]
    );

    if (donors.length === 0) {
      return res.status(404).json({ error: 'Donor not found' });
    }

    const donorRecord = donors[0];

    // Get blood group name
    const bloodGroupName = await getBloodGroupName(donorRecord.blood_group);

    // Get contact numbers (per ERD: 1:N relationship)
    const [contacts] = await pool.execute(
      'SELECT phone_number FROM CONTACT_NUMBER WHERE donor_id = ? ORDER BY contact_id',
      [session.donorId]
    );

    const phones = contacts.map(c => c.phone_number);

    // Calculate availability based on 90-day rule
    let isAvailable = donorRecord.availability;
    if (donorRecord.last_donate) {
      const daysSince = Math.floor((Date.now() - new Date(donorRecord.last_donate).getTime()) / (1000 * 60 * 60 * 24));
      isAvailable = daysSince >= 90;
    }

    const donor = {
      id: donorRecord.donor_id.toString(),
      name: donorRecord.full_name,
      email: donorRecord.email,
      phone: phones[0] || '',
      alternatePhone: phones[1] || '',
      age: donorRecord.age,
      gender: genderMap[donorRecord.gender] || donorRecord.gender,
      bloodGroup: bloodGroupName,
      city: donorRecord.city || '',
      area: donorRecord.area || '',
      address: '',
      latitude: donorRecord.latitude,
      longitude: donorRecord.longitude,
      isAvailable,
      isDeleted: !donorRecord.is_active,
      lastDonationDate: donorRecord.last_donate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    res.json({ donor });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update donor profile
app.put('/api/donors/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const session = sessions.get(token);
    
    if (!session || !session.donorId) {
      return res.status(404).json({ error: 'Donor not found' });
    }

    const updates = req.body;

    // Update location if changed
    if (updates.city || updates.area) {
      const [current] = await pool.execute(
        'SELECT l.city, l.area FROM DONOR d JOIN LOCATION l ON d.location_id = l.location_id WHERE d.donor_id = ?',
        [session.donorId]
      );
      
      const newCity = updates.city || current[0]?.city;
      const newArea = updates.area || current[0]?.area;
      
      if (newCity && newArea) {
        const locationId = await getOrCreateLocation(newCity, newArea, updates.latitude, updates.longitude);
        await pool.execute('UPDATE DONOR SET location_id = ? WHERE donor_id = ?', [locationId, session.donorId]);
      }
    }

    // Update phone numbers
    if (updates.phone) {
      const [existingContacts] = await pool.execute(
        'SELECT contact_id FROM CONTACT_NUMBER WHERE donor_id = ? ORDER BY contact_id',
        [session.donorId]
      );

      if (existingContacts.length > 0) {
        await pool.execute('UPDATE CONTACT_NUMBER SET phone_number = ? WHERE contact_id = ?', 
          [updates.phone, existingContacts[0].contact_id]);
      }

      if (updates.alternatePhone && existingContacts.length > 1) {
        await pool.execute('UPDATE CONTACT_NUMBER SET phone_number = ? WHERE contact_id = ?', 
          [updates.alternatePhone, existingContacts[1].contact_id]);
      } else if (updates.alternatePhone) {
        await pool.execute('INSERT INTO CONTACT_NUMBER (donor_id, phone_number) VALUES (?, ?)', 
          [session.donorId, updates.alternatePhone]);
      }
    }

    // Update last donation date
    if (updates.lastDonationDate) {
      const daysSince = Math.floor((Date.now() - new Date(updates.lastDonationDate).getTime()) / (1000 * 60 * 60 * 24));
      const isAvailable = daysSince >= 90;
      
      await pool.execute(
        'UPDATE DONOR SET last_donate = ?, availability = ? WHERE donor_id = ?',
        [updates.lastDonationDate, isAvailable, session.donorId]
      );
    }

    // Fetch updated profile
    const profileRes = await fetch(`http://localhost:${PORT}/api/donors/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const profileData = await profileRes.json();

    res.json({ success: true, donor: profileData.donor });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Soft delete donor (per ERD: is_active flag)
app.delete('/api/donors/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const session = sessions.get(token);
    
    if (!session || !session.donorId) {
      return res.status(404).json({ error: 'Donor not found' });
    }

    await pool.execute('UPDATE DONOR SET is_active = FALSE WHERE donor_id = ?', [session.donorId]);

    res.json({ success: true, message: 'Donor marked as inactive' });
  } catch (error) {
    console.error('Error deleting donor:', error);
    res.status(500).json({ error: 'Failed to delete donor' });
  }
});

// Search donors
app.post('/api/donors/search', async (req, res) => {
  try {
    const { bloodGroup, city, area, isAvailable } = req.body;

    let query = `
      SELECT d.*, l.city, l.area, l.latitude, l.longitude, bg.bg_name, bg.rh_factor
      FROM DONOR d 
      LEFT JOIN LOCATION l ON d.location_id = l.location_id
      LEFT JOIN BLOOD_GROUP bg ON d.blood_group = bg.bg_id
      WHERE d.is_active = TRUE
    `;
    const params = [];

    if (bloodGroup) {
      const bgId = await getBloodGroupId(bloodGroup);
      if (bgId) {
        query += ' AND d.blood_group = ?';
        params.push(bgId);
      }
    }

    if (city) {
      query += ' AND LOWER(l.city) LIKE LOWER(?)';
      params.push(`%${city}%`);
    }

    if (area) {
      query += ' AND LOWER(l.area) LIKE LOWER(?)';
      params.push(`%${area}%`);
    }

    const [donorsData] = await pool.execute(query, params);

    // Get contact numbers
    const donorIds = donorsData.map(d => d.donor_id);
    let contactsByDonor = {};
    
    if (donorIds.length > 0) {
      const [contacts] = await pool.execute(
        `SELECT donor_id, phone_number FROM CONTACT_NUMBER WHERE donor_id IN (${donorIds.map(() => '?').join(',')})`,
        donorIds
      );
      contacts.forEach(c => {
        if (!contactsByDonor[c.donor_id]) contactsByDonor[c.donor_id] = [];
        contactsByDonor[c.donor_id].push(c.phone_number);
      });
    }

    let donors = donorsData.map(d => {
      // Calculate availability
      let availability = d.availability;
      if (d.last_donate) {
        const daysSince = Math.floor((Date.now() - new Date(d.last_donate).getTime()) / (1000 * 60 * 60 * 24));
        availability = daysSince >= 90;
      }

      return {
        id: d.donor_id.toString(),
        name: d.full_name,
        email: d.email,
        phone: contactsByDonor[d.donor_id]?.[0] || '',
        alternatePhone: contactsByDonor[d.donor_id]?.[1] || '',
        age: d.age,
        gender: genderMap[d.gender] || d.gender,
        bloodGroup: `${d.bg_name}${d.rh_factor}`,
        city: d.city || '',
        area: d.area || '',
        address: '',
        latitude: d.latitude,
        longitude: d.longitude,
        isAvailable: availability,
        isDeleted: !d.is_active,
        lastDonationDate: d.last_donate,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    });

    // Filter by availability if specified
    if (isAvailable !== undefined) {
      donors = donors.filter(d => d.isAvailable === isAvailable);
    }

    res.json({ donors });
  } catch (error) {
    console.error('Error searching donors:', error);
    res.status(500).json({ error: 'Failed to search donors' });
  }
});

// ==================== EMERGENCY REQUEST ROUTES ====================

// Create emergency request (per ERD: EMERGENCY_REQUEST table)
app.post('/api/requests/create', async (req, res) => {
  try {
    const { bloodGroup, city, area, hospitalName, contactPhone } = req.body;

    // Get blood group ID
    const bloodGroupId = await getBloodGroupId(bloodGroup);
    if (!bloodGroupId) {
      return res.status(400).json({ error: 'Invalid blood group' });
    }

    // Get or create location
    const locationId = await getOrCreateLocation(city, area || '');

    // Insert emergency request
    const [result] = await pool.execute(
      `INSERT INTO EMERGENCY_REQUEST (blood_group, hospital_name, request_date, location_id, contact_number) 
       VALUES (?, ?, NOW(), ?, ?)`,
      [bloodGroupId, hospitalName, locationId, contactPhone]
    );

    // Get compatible blood groups (from BLOOD_COMPATIBILITY table per ERD)
    const compatibleBgIds = await getCompatibleDonorBloodGroups(bloodGroupId);

    // Find compatible, available donors
    let matchedDonors = [];
    if (compatibleBgIds.length > 0) {
      const [donorsData] = await pool.execute(
        `SELECT d.donor_id, d.full_name, d.blood_group, d.availability, d.last_donate, 
                l.city, l.area, l.latitude, l.longitude, bg.bg_name, bg.rh_factor
         FROM DONOR d
         LEFT JOIN LOCATION l ON d.location_id = l.location_id
         LEFT JOIN BLOOD_GROUP bg ON d.blood_group = bg.bg_id
         WHERE d.is_active = TRUE AND d.blood_group IN (${compatibleBgIds.map(() => '?').join(',')})
         AND LOWER(l.city) LIKE LOWER(?)`,
        [...compatibleBgIds, `%${city}%`]
      );

      // Get contact numbers
      const donorIds = donorsData.map(d => d.donor_id);
      let contactsByDonor = {};
      
      if (donorIds.length > 0) {
        const [contacts] = await pool.execute(
          `SELECT donor_id, phone_number FROM CONTACT_NUMBER WHERE donor_id IN (${donorIds.map(() => '?').join(',')})`,
          donorIds
        );
        contacts.forEach(c => {
          if (!contactsByDonor[c.donor_id]) contactsByDonor[c.donor_id] = c.phone_number;
        });
      }

      matchedDonors = donorsData
        .filter(d => {
          let isAvailable = d.availability;
          if (d.last_donate) {
            const daysSince = Math.floor((Date.now() - new Date(d.last_donate).getTime()) / (1000 * 60 * 60 * 24));
            isAvailable = daysSince >= 90;
          }
          return isAvailable;
        })
        .map(d => ({
          id: d.donor_id.toString(),
          name: d.full_name,
          bloodGroup: `${d.bg_name}${d.rh_factor}`,
          city: d.city || '',
          area: d.area || '',
          phone: contactsByDonor[d.donor_id] || '',
          latitude: d.latitude,
          longitude: d.longitude
        }));
    }

    const request = {
      id: result.insertId.toString(),
      bloodGroup,
      hospitalName,
      city,
      area,
      contactPhone,
      createdAt: new Date().toISOString(),
      status: 'active'
    };

    res.json({ success: true, request, matchedDonors });
  } catch (error) {
    console.error('Error creating request:', error);
    res.status(500).json({ error: 'Failed to create request' });
  }
});

// Get active requests
app.get('/api/requests/active', async (req, res) => {
  try {
    const [requests] = await pool.execute(
      `SELECT er.*, l.city, l.area, bg.bg_name, bg.rh_factor
       FROM EMERGENCY_REQUEST er
       LEFT JOIN LOCATION l ON er.location_id = l.location_id
       LEFT JOIN BLOOD_GROUP bg ON er.blood_group = bg.bg_id
       ORDER BY er.request_date DESC`
    );

    const formattedRequests = requests.map(r => ({
      id: r.request_id.toString(),
      bloodGroup: `${r.bg_name}${r.rh_factor}`,
      hospitalName: r.hospital_name,
      city: r.city || '',
      area: r.area || '',
      contactPhone: r.contact_number,
      createdAt: r.request_date,
      status: 'active'
    }));

    res.json({ requests: formattedRequests });
  } catch (error) {
    console.error('Error fetching requests:', error);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

// ==================== STATISTICS ROUTES ====================

app.get('/api/statistics', async (req, res) => {
  try {
    // Get all donors with blood groups and locations
    const [donorsData] = await pool.execute(
      `SELECT d.donor_id, d.blood_group, d.availability, d.last_donate, d.is_active, 
              l.city, bg.bg_name, bg.rh_factor
       FROM DONOR d
       LEFT JOIN LOCATION l ON d.location_id = l.location_id
       LEFT JOIN BLOOD_GROUP bg ON d.blood_group = bg.bg_id`
    );

    const activeDonors = donorsData.filter(d => d.is_active);
    const inactiveDonors = donorsData.filter(d => !d.is_active);

    // Calculate availability with 90-day rule
    const availableDonors = activeDonors.filter(d => {
      if (d.last_donate) {
        const daysSince = Math.floor((Date.now() - new Date(d.last_donate).getTime()) / (1000 * 60 * 60 * 24));
        return daysSince >= 90;
      }
      return d.availability;
    });

    const unavailableDonors = activeDonors.filter(d => {
      if (d.last_donate) {
        const daysSince = Math.floor((Date.now() - new Date(d.last_donate).getTime()) / (1000 * 60 * 60 * 24));
        return daysSince < 90;
      }
      return !d.availability;
    });

    // Blood group statistics
    const byBloodGroup = {};
    activeDonors.forEach(d => {
      const bgName = `${d.bg_name}${d.rh_factor}`;
      byBloodGroup[bgName] = (byBloodGroup[bgName] || 0) + 1;
    });

    // City statistics
    const byCity = {};
    activeDonors.forEach(d => {
      const city = d.city || 'Unknown';
      byCity[city] = (byCity[city] || 0) + 1;
    });

    res.json({
      totalDonors: activeDonors.length,
      activeDonors: activeDonors.length,
      inactiveDonors: inactiveDonors.length,
      availableDonors: availableDonors.length,
      unavailableDonors: unavailableDonors.length,
      byBloodGroup,
      byCity
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    await pool.execute('SELECT 1');
    res.json({ 
      status: 'healthy', 
      database: 'connected',
      emailService: resend ? 'configured' : 'not configured'
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'unhealthy', 
      database: 'disconnected', 
      error: error.message 
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Blood Donor Management API Server running on port ${PORT}`);
  console.log(`Database: ${process.env.DB_NAME || 'blood_donor_management'} (MySQL)`);
  console.log('ERD tables: LOCATION, BLOOD_GROUP, DONOR, CONTACT_NUMBER, BLOOD_COMPATIBILITY, EMERGENCY_REQUEST, OTP');
  
  // Check email service configuration
  if (resend && process.env.RESEND_API_KEY) {
    console.log(`Email service: Resend API ✓ Configured`);
    console.log(`From address: ${RESEND_FROM_EMAIL}`);
  } else {
    console.log(`Email service: ⚠️  Not configured (set RESEND_API_KEY and RESEND_FROM_EMAIL)`);
  }
});

module.exports = app;
