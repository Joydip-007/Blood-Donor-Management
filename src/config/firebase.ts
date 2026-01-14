// frontend/src/config/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getAnalytics, isSupported } from 'firebase/analytics';

// Firebase configuration - these are public environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || ""
};

// Initialize Firebase only if config is provided
let app;
let auth;
let analytics;

try {
  if (firebaseConfig.apiKey) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    
    // Initialize Analytics if measurementId exists and is supported
    if (firebaseConfig.measurementId) {
      isSupported().then(supported => {
        if (supported) {
          analytics = getAnalytics(app);
          console.log('✅ Firebase Analytics initialized');
        }
      }).catch(err => {
        console.warn('⚠️ Analytics not supported:', err);
      });
    }
    
    console.log('✅ Firebase initialized');
  } else {
    console.warn('⚠️ Firebase config not found - phone auth disabled');
  }
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
}

export { auth, analytics };
