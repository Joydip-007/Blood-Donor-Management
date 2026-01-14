// backend/services/firebaseService.js
const admin = require('firebase-admin');

// Initialize Firebase Admin
let firebaseApp;
let isInitialized = false;

try {
  let serviceAccount;
  
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    // Production: try raw JSON first, then base64
    try {
      // Attempt 1: Parse as raw JSON (easiest for Railway dashboard)
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      console.log('✅ Firebase credentials loaded from raw JSON');
    } catch (jsonError) {
      // Attempt 2: Try base64 decoding (for CLI or encoded vars)
      try {
        serviceAccount = JSON.parse(
          Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, 'base64').toString()
        );
        console.log('✅ Firebase credentials loaded from base64');
      } catch (base64Error) {
        console.error('❌ Failed to parse Firebase credentials:');
        console.error('   Raw JSON error:', jsonError.message);
        console.error('   Base64 error:', base64Error.message);
        serviceAccount = null;
      }
    }
  } else {
    // Local development: try to load from file
    try {
      serviceAccount = require('../firebase-key.json');
      console.log('✅ Firebase credentials loaded from local file');
    } catch (fileError) {
      console.warn('⚠️  Firebase service account not configured. Phone auth will be disabled.');
      console.warn('   Set FIREBASE_SERVICE_ACCOUNT environment variable for production.');
      serviceAccount = null;
    }
  }

  if (serviceAccount) {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    isInitialized = true;
    console.log('✅ Firebase Admin initialized successfully');
  }
} catch (error) {
  console.error('❌ Firebase Admin initialization error:', error.message);
  console.warn('   Phone authentication will be disabled');
}

/**
 * Verify Firebase ID token from client
 * @param {string} idToken - Firebase ID token from client
 * @returns {Promise<object>} Decoded token with user info
 */
async function verifyPhoneToken(idToken) {
  if (!isInitialized) {
    return {
      success: false,
      error: 'Firebase not initialized. Phone authentication is not available.',
    };
  }
  
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return {
      success: true,
      phoneNumber: decodedToken.phone_number,
      uid: decodedToken.uid,
    };
  } catch (error) {
    console.error('Token verification error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get user by phone number
 * @param {string} phoneNumber - Phone number in E.164 format
 */
async function getUserByPhone(phoneNumber) {
  if (!isInitialized) {
    return {
      success: false,
      error: 'Firebase not initialized',
    };
  }
  
  try {
    const user = await admin.auth().getUserByPhoneNumber(phoneNumber);
    return { success: true, user };
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      return { success: false, notFound: true };
    }
    return { success: false, error: error.message };
  }
}

module.exports = {
  admin,
  verifyPhoneToken,
  getUserByPhone,
  isInitialized: () => isInitialized,
};
