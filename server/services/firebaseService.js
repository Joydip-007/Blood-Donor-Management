// backend/services/firebaseService.js
const admin = require('firebase-admin');

// Initialize Firebase Admin
let firebaseApp;

try {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
    ? JSON.parse(
        Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, 'base64').toString()
      )
    : require('../firebase-key.json'); // Fallback for local development

  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  console.log('✅ Firebase Admin initialized successfully');
} catch (error) {
  console.error('❌ Firebase Admin initialization error:', error.message);
}

/**
 * Verify Firebase ID token from client
 * @param {string} idToken - Firebase ID token from client
 * @returns {Promise<object>} Decoded token with user info
 */
async function verifyPhoneToken(idToken) {
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
};
