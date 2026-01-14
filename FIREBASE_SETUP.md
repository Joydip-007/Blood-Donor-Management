# Firebase Phone Authentication Setup Guide

This guide explains how to set up Firebase phone authentication for the Blood Donor Management System.

## Overview
The system now supports Firebase phone authentication alongside the existing email OTP system. Firebase provides:
- **Free tier**: 10,000 phone verifications/month
- **Global SMS delivery** with Firebase infrastructure
- **Secure authentication** with industry-standard protocols

## Prerequisites
- Google/Firebase account
- Access to Firebase Console (console.firebase.google.com)

## Setup Instructions

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select existing project
3. Follow the wizard to create your project
4. Enable Google Analytics (optional)

### Step 2: Enable Phone Authentication

1. In Firebase Console, go to **Authentication** section
2. Click on **Sign-in method** tab
3. Click on **Phone** in the sign-in providers list
4. Toggle **Enable** switch
5. Click **Save**

### Step 3: Generate Service Account Key (Backend)

1. In Firebase Console, click the gear icon → **Project settings**
2. Go to **Service accounts** tab
3. Click **Generate new private key**
4. Download the JSON file (e.g., `firebase-key.json`)
5. **IMPORTANT**: Keep this file secure and never commit it to version control

#### For Local Development:
- Place `firebase-key.json` in the `server/` directory
- The service will automatically detect and use it

#### For Production (Railway/Vercel):
1. Convert the JSON to base64:
   ```bash
   cat firebase-key.json | base64 -w 0
   ```
2. Set the environment variable `FIREBASE_SERVICE_ACCOUNT` with the base64 string
3. On Railway: Settings → Variables → Add Variable

### Step 4: Get Firebase Config (Frontend)

1. In Firebase Console → Project settings → General tab
2. Scroll to "Your apps" section
3. Click **Web app** icon (</>) or select existing web app
4. Copy the configuration values

### Step 5: Configure Environment Variables

#### Backend (.env in `server/` directory):
```env
# Firebase Admin (for production)
FIREBASE_SERVICE_ACCOUNT=<base64_encoded_service_account_json>
```

#### Frontend (.env in root directory):
```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```

**Note**: Frontend Firebase config values are PUBLIC and safe to expose in client-side code.

### Step 6: Configure Phone Authentication Settings

1. In Firebase Console → Authentication → Settings
2. Set up **Authorized domains**:
   - Add your production domain (e.g., `yourapp.vercel.app`)
   - `localhost` is pre-authorized for development
3. Optional: Configure SMS templates in Settings → Templates

### Step 7: Test Setup

#### Test Backend:
```bash
cd server
npm start
# Server should log: "✅ Firebase Admin initialized successfully"
```

#### Test Frontend:
```bash
npm run dev
# Open browser console, should see: "✅ Firebase initialized"
```

## API Endpoints

### Phone Number Formatting
```bash
POST /api/auth/phone/format
Content-Type: application/json

{
  "phoneNumber": "01712345678",
  "country": "BD"
}
```

### Phone Verification
```bash
POST /api/auth/phone/verify
Content-Type: application/json

{
  "idToken": "<firebase_id_token>"
}
```

## Usage Flow

1. **User enters phone number** (e.g., 01712345678)
2. **Frontend formats** to E.164 (+8801712345678) via backend API
3. **Firebase sends SMS** with 6-digit OTP
4. **User enters OTP**
5. **Frontend verifies** with Firebase
6. **Backend validates** Firebase token and checks database
7. **If existing user**: Login successful
8. **If new user**: Redirect to registration with verified phone

## Security Considerations

1. **Never commit** `firebase-key.json` to version control
2. **Use environment variables** for sensitive data
3. **Implement rate limiting** on phone auth endpoints
4. **Monitor Firebase usage** to avoid unexpected charges
5. **Enable App Check** (optional) for additional security

## Troubleshooting

### "Firebase Admin initialization error"
- Check `FIREBASE_SERVICE_ACCOUNT` environment variable
- Verify base64 encoding is correct
- Ensure `firebase-key.json` exists (local dev)

### "Firebase config not found"
- Check frontend environment variables (VITE_FIREBASE_*)
- Restart dev server after adding variables

### "Invalid phone number format"
- Ensure phone number includes country code
- Bangladesh format: +8801XXXXXXXXX or 01XXXXXXXXX

### "SMS not received"
- Check Firebase Console → Authentication → Usage
- Verify phone number is correct
- Check spam/blocked messages on device
- Ensure sufficient Firebase quota

## Cost Management

Firebase Phone Authentication pricing (as of 2024):
- **Free tier**: 10,000 verifications/month
- **Above free tier**: $0.01-0.06 per verification (varies by region)

To monitor usage:
1. Firebase Console → Usage & billing
2. Set up budget alerts
3. Monitor monthly verification count

## Support

For issues related to:
- **Firebase setup**: Check [Firebase Documentation](https://firebase.google.com/docs/auth/web/phone-auth)
- **Backend issues**: Check `server/` logs
- **Frontend issues**: Check browser console

## Testing in Development

For testing without sending real SMS:
1. Firebase Console → Authentication → Sign-in method
2. Scroll to "Phone numbers for testing"
3. Add test phone numbers with verification codes
4. Use these for testing without consuming quota

Example:
- Phone: +8801700000000
- Code: 123456
