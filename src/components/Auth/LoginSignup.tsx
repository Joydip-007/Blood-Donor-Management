import React, { useState } from 'react';
import { Mail, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE_URL } from '../../utils/api';

export function LoginSignup() {
  const [step, setStep] = useState<'input' | 'otp'>('input');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [demoOtp, setDemoOtp] = useState('');
  
  const { login } = useAuth();

  const requestOTP = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Use existing email OTP system
      const response = await fetch(
        `${API_BASE_URL}/auth/request-otp`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email,
            type: 'login',
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send OTP');
      }

      const data = await response.json();
      setDemoOtp(data.otp); // For demo purposes
      setSuccess('OTP sent successfully! Check your email');
      setStep('otp');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    setError('');
    setLoading(true);

    try {
      // Use existing email login system
      await login(email, '', otp);
      
      // Get updated user data from localStorage
      const userStr = localStorage.getItem('authUser');
      if (userStr) {
        const userData = JSON.parse(userStr);
        
        // Smart routing based on user type
        // Note: All routes redirect to '/' as App.tsx handles internal routing
        // based on user.isAdmin and user.isRegistered flags
        if (userData.isAdmin) {
          // Admin: Direct to admin dashboard (no registration needed)
          console.log('Admin login detected, redirecting to admin dashboard');
          window.location.href = '/';  // App will handle admin routing
        } else if (userData.isRegistered) {
          // Existing donor: Direct to main dashboard
          console.log('Existing donor login, redirecting to dashboard');
          window.location.href = '/';  // App will handle donor routing
        } else {
          // New user: Must complete registration
          console.log('New user, registration required');
          window.location.href = '/';  // App will handle registration routing
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const validateEmail = (value: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
        <div className="text-center mb-8">
          <div className="inline-block p-3 bg-red-100 rounded-full mb-4">
            <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Blood Donor Portal</h1>
          <p className="text-gray-600 mt-2">Secure OTP-based authentication</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle size={20} />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
            <CheckCircle size={20} />
            <span className="text-sm">{success}</span>
          </div>
        )}

        {demoOtp && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700 font-medium">🔒 Demo OTP: {demoOtp}</p>
            <p className="text-xs text-blue-600 mt-1">Use this code to verify (demo only)</p>
          </div>
        )}

        {step === 'input' && (
          <div className="space-y-4">
            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            <button
              onClick={requestOTP}
              disabled={loading || !validateEmail(email)}
              className="w-full bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </div>
        )}

        {step === 'otp' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter OTP
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit OTP"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-center text-2xl tracking-wider"
                  maxLength={6}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                OTP sent to {email}
              </p>
            </div>

            <button
              onClick={verifyOTP}
              disabled={loading || otp.length !== 6}
              className="w-full bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Verify & Continue'}
            </button>

            <button
              onClick={() => {
                setStep('input');
                setOtp('');
                setDemoOtp('');
              }}
              className="w-full text-red-600 py-2 text-sm hover:underline"
            >
              Change email
            </button>
          </div>
        )}

        <div className="mt-6 text-center text-xs text-gray-500">
          <p>🔒 Secure OTP-based authentication</p>
          <p className="mt-1">Prevents fake and duplicate registrations</p>
        </div>
      </div>
    </div>
  );
}
