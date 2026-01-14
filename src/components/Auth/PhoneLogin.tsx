// frontend/src/components/Auth/PhoneLogin.tsx
import { useState } from 'react';
import phoneAuthService from '../../services/phoneAuthService';
import './PhoneLogin.css';

interface PhoneLoginProps {
  onLoginSuccess?: (user: any) => void;
}

export default function PhoneLogin({ onLoginSuccess }: PhoneLoginProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      await phoneAuthService.sendOTP(phoneNumber);
      setStep('otp');
      setMessage('OTP sent to your phone!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await phoneAuthService.verifyOTP(otp);

      if (result.isNewUser) {
        // New user - redirect to registration
        window.location.href = '/register?phone=' + result.phone_number;
      } else {
        // Existing user - login successful
        setMessage('Login successful!');
        if (onLoginSuccess) {
          onLoginSuccess(result.user);
        } else {
          window.location.href = '/dashboard';
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangeNumber = () => {
    setStep('phone');
    setOtp('');
    setError('');
    setMessage('');
    phoneAuthService.reset();
  };

  return (
    <div className="phone-login">
      <h2>🩸 Login with Phone</h2>

      {error && <div className="alert alert-error">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      {step === 'phone' ? (
        <form onSubmit={handleSendOTP}>
          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <input
              type="tel"
              id="phone"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="01712345678"
              required
              disabled={loading}
            />
            <small>Enter your Bangladesh mobile number</small>
          </div>

          <div id="recaptcha-container" className="recaptcha-container"></div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !phoneNumber}
          >
            {loading ? 'Sending...' : 'Send OTP'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOTP}>
          <div className="form-group">
            <label htmlFor="otp">Enter OTP</label>
            <input
              type="text"
              id="otp"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="123456"
              maxLength={6}
              required
              disabled={loading}
              autoFocus
            />
            <small>Enter 6-digit code sent to {phoneNumber}</small>
          </div>

          <div className="button-group">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || otp.length !== 6}
            >
              {loading ? 'Verifying...' : 'Verify & Login'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleChangeNumber}
              disabled={loading}
            >
              Change Number
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
