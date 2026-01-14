// frontend/src/services/phoneAuthService.ts
import { auth } from '../config/firebase';
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
} from 'firebase/auth';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class PhoneAuthService {
  private recaptchaVerifier: RecaptchaVerifier | null = null;
  private confirmationResult: ConfirmationResult | null = null;

  /**
   * Initialize reCAPTCHA verifier
   */
  initializeRecaptcha(containerId: string = 'recaptcha-container'): RecaptchaVerifier {
    if (!this.recaptchaVerifier && auth) {
      this.recaptchaVerifier = new RecaptchaVerifier(auth,
        containerId,
        {
          size: 'normal',
          callback: (_response: string) => {
            console.log('reCAPTCHA solved');
          },
          'expired-callback': () => {
            console.log('reCAPTCHA expired');
            this.recaptchaVerifier = null;
          },
        }
      );
    }
    return this.recaptchaVerifier!;
  }

  /**
   * Format phone number to E.164 format
   */
  async formatPhoneNumber(phoneNumber: string): Promise<string> {
    try {
      const response = await axios.post(`${API_URL}/api/auth/phone/format`, {
        phoneNumber,
        country: 'BD',
      });

      if (response.data.success) {
        return response.data.formatted;
      }
      throw new Error(response.data.message);
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to format phone number'
      );
    }
  }

  /**
   * Send OTP to phone number
   */
  async sendOTP(phoneNumber: string): Promise<{ success: boolean; message: string }> {
    try {
      if (!auth) {
        throw new Error('Firebase not initialized');
      }

      // Format phone number
      const formattedPhone = await this.formatPhoneNumber(phoneNumber);

      // Initialize reCAPTCHA
      if (!this.recaptchaVerifier) {
        this.initializeRecaptcha();
      }

      // Send OTP via Firebase
      this.confirmationResult = await signInWithPhoneNumber(
        auth,
        formattedPhone,
        this.recaptchaVerifier!
      );

      return {
        success: true,
        message: 'OTP sent successfully',
      };
    } catch (error: any) {
      console.error('Send OTP error:', error);
      
      // Reset reCAPTCHA on error
      if (this.recaptchaVerifier) {
        this.recaptchaVerifier.clear();
        this.recaptchaVerifier = null;
      }

      // Don't expose full error details in production
      const errorMessage = error.code === 'auth/invalid-phone-number' 
        ? 'Invalid phone number format'
        : error.code === 'auth/quota-exceeded'
        ? 'SMS quota exceeded. Please try again later.'
        : 'Failed to send OTP. Please try again.';
      
      throw new Error(errorMessage);
    }
  }

  /**
   * Verify OTP code
   */
  async verifyOTP(code: string): Promise<any> {
    try {
      if (!this.confirmationResult) {
        throw new Error('Please request OTP first');
      }

      // Confirm with Firebase
      const result = await this.confirmationResult.confirm(code);
      const user = result.user;

      // Get Firebase ID token
      const idToken = await user.getIdToken();

      // Verify with backend
      const response = await axios.post(
        `${API_URL}/api/auth/phone/verify`,
        { idToken }
      );

      if (response.data.success) {
        // Store minimal user data in localStorage
        // Note: Consider using secure storage for sensitive data
        if (response.data.user) {
          const userData = {
            donor_id: response.data.user.donor_id,
            full_name: response.data.user.full_name,
            email: response.data.user.email,
            phone_number: response.data.user.phone_number,
          };
          localStorage.setItem('user', JSON.stringify(userData));
        }
        return response.data;
      }

      throw new Error(response.data.message);
    } catch (error: any) {
      console.error('Verify OTP error:', error);
      throw new Error(
        error.response?.data?.message ||
        error.message ||
        'Invalid OTP code'
      );
    }
  }

  /**
   * Reset state
   */
  reset(): void {
    if (this.recaptchaVerifier) {
      this.recaptchaVerifier.clear();
      this.recaptchaVerifier = null;
    }
    this.confirmationResult = null;
  }
}

export default new PhoneAuthService();
