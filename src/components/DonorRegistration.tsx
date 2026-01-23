import React, { useState, useEffect } from 'react';
import { User, MapPin, Phone, Mail, Droplet, Calendar, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../utils/api';
import { BloodGroup } from '../types';
import { calculateAge } from '../utils/helpers';
import { geocodeLocation, parseCoordinate } from '../utils/geocoding';
import { validateBangladeshPhone } from '../utils/phoneUtils';

interface Props {
  onSuccess: () => void;
}

export function DonorRegistration({ onSuccess }: Props) {
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    alternatePhone: '',
    age: '',
    dateOfBirth: '',
    gender: 'Male',
    bloodGroup: 'O+' as BloodGroup,
    city: '',
    area: '',
    address: '',
    latitude: '',
    longitude: '',
  });

  // Auto-populate email from authenticated session
  useEffect(() => {
    if (user?.email) {
      setFormData(prev => ({
        ...prev,
        email: user.email
      }));
    }
  }, [user]);

  const bloodGroups: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      
      // Auto-calculate age when date of birth changes
      if (name === 'dateOfBirth' && value) {
        updated.age = calculateAge(value).toString();
      }
      
      return updated;
    });
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Name is required');
      return false;
    }

    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError('Invalid email address');
      return false;
    }

    // Validate primary phone
    const phoneValidation = validateBangladeshPhone(formData.phone);
    if (!phoneValidation.isValid) {
      setError(phoneValidation.error || 'Primary phone must be a valid 11-digit Bangladesh number starting with 01');
      return false;
    }

    // Validate alternate phone if provided
    if (formData.alternatePhone) {
      const altPhoneValidation = validateBangladeshPhone(formData.alternatePhone);
      if (!altPhoneValidation.isValid) {
        setError(altPhoneValidation.error || 'Alternate phone must be a valid 11-digit Bangladesh number starting with 01');
        return false;
      }
    }

    // Validate age - dateOfBirth is now required since age is auto-calculated
    if (!formData.dateOfBirth) {
      setError('Date of Birth is required');
      return false;
    }

    const age = parseInt(formData.age);
    if (isNaN(age) || age < 18) {
      setError('You must be 18 or above to donate blood');
      return false;
    }

    if (age > 65) {
      setError('Age must be below 65 for blood donation');
      return false;
    }

    if (!formData.city || !formData.area || !formData.address) {
      setError('Complete address is required');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Attempt to geocode location in the background if coordinates are not provided
      let latitude = formData.latitude;
      let longitude = formData.longitude;
      
      if ((!latitude || !longitude) && formData.city && formData.area) {
        try {
          const coords = await geocodeLocation(formData.city, formData.area);
          if (coords) {
            latitude = coords.latitude.toString();
            longitude = coords.longitude.toString();
          }
        } catch (geocodeError) {
          // Silently fail - coordinates are optional
          console.log('Auto-geocoding failed, continuing without coordinates');
        }
      }

      const response = await fetch(
        `${API_BASE_URL}/donors/register`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...formData,
            age: parseInt(formData.age),
            dateOfBirth: formData.dateOfBirth || undefined,
            latitude: parseCoordinate(latitude),
            longitude: parseCoordinate(longitude),
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to register');
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6 md:p-8">
      <div className="mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">Donor Registration</h2>
        <p className="text-gray-700 mt-1">Complete your profile to become a registered blood donor</p>
      </div>

      {/* Welcome Message */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 md:p-6 mb-6">
        <h3 className="font-semibold text-blue-900 mb-2">🎉 Welcome! Complete Your Registration</h3>
        <p className="text-xs md:text-sm text-blue-800">
          Your email has been verified and is locked for security. 
          Please fill in the remaining information to complete your donor registration.
          You can update your profile and donation information anytime after registration.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 md:p-6 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
        {/* Personal Information */}
        <div>
          <h3 className="text-base md:text-lg font-semibold mb-4 md:mb-6 flex items-center gap-2">
            <User size={20} className="text-red-600" />
            Personal Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div>
              <label className="block text-sm md:text-base font-semibold text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 text-base min-h-[44px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm md:text-base font-semibold text-gray-700 mb-2 flex items-center gap-1">
                <Calendar size={16} className="text-red-600" />
                Date of Birth *
              </label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 text-base min-h-[44px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                required
              />
              <p className="text-xs md:text-sm text-gray-700 mt-1">Required - Age will be calculated automatically</p>
            </div>

            <div>
              <label className="block text-sm md:text-base font-semibold text-gray-700 mb-2">
                Age <span className="text-xs font-normal text-gray-500">(Auto-calculated from Date of Birth)</span>
              </label>
              <input
                type="number"
                name="age"
                value={formData.age}
                readOnly
                disabled
                className="w-full px-4 py-3 text-base min-h-[44px] border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
              />
              <p className="text-xs md:text-sm text-gray-700 mt-1">Automatically calculated from your date of birth. Must be between 18-65 years.</p>
            </div>

            <div>
              <label className="block text-sm md:text-base font-semibold text-gray-700 mb-2">
                Gender *
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-4 py-3 text-base min-h-[44px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                required
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm md:text-base font-semibold text-gray-700 mb-2 flex items-center gap-1">
                <Droplet size={16} className="text-red-600" />
                Blood Group *
              </label>
              <select
                name="bloodGroup"
                value={formData.bloodGroup}
                onChange={handleChange}
                className="w-full px-4 py-3 text-base min-h-[44px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                required
              >
                {bloodGroups.map(bg => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div>
          <h3 className="text-base md:text-lg font-semibold mb-4 md:mb-6 flex items-center gap-2">
            <Phone size={20} className="text-red-600" />
            Contact Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div>
              <label className="block text-sm md:text-base font-semibold text-gray-700 mb-2 flex items-center gap-1">
                <Mail size={16} />
                📧 Email * <span className="text-xs md:text-sm text-gray-700">(from your login)</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                readOnly
                className="w-full px-4 py-3 text-base min-h-[44px] bg-gray-100 border border-gray-300 rounded-lg cursor-not-allowed focus:outline-none"
                required
              />
              <p className="text-xs md:text-sm text-gray-700 mt-1">
                🔒 Email is locked to your verified login email for security
              </p>
            </div>

            <div>
              <label className="block text-sm md:text-base font-semibold text-gray-700 mb-2 flex items-center gap-1">
                <Phone size={16} />
                Primary Phone * <span className="text-xs font-normal text-gray-500">(Bangladesh)</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 11);
                  setFormData(prev => ({ ...prev, phone: value }));
                }}
                placeholder="01XXXXXXXXX (11 digits)"
                pattern="^01[3-9]\d{8}$"
                maxLength={11}
                minLength={11}
                className="w-full px-4 py-3 text-base min-h-[44px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter 11-digit Bangladesh mobile number starting with 01
              </p>
            </div>

            <div>
              <label className="block text-sm md:text-base font-semibold text-gray-700 mb-2">
                Alternate Phone (Optional) <span className="text-xs font-normal text-gray-500">(Bangladesh)</span>
              </label>
              <input
                type="tel"
                name="alternatePhone"
                value={formData.alternatePhone}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 11);
                  setFormData(prev => ({ ...prev, alternatePhone: value }));
                }}
                placeholder="01XXXXXXXXX (11 digits)"
                pattern="^01[3-9]\d{8}$"
                maxLength={11}
                minLength={11}
                className="w-full px-4 py-3 text-base min-h-[44px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Optional second contact number (11 digits)
              </p>
            </div>
          </div>
        </div>

        {/* Location Information */}
        <div>
          <h3 className="text-base md:text-lg font-semibold mb-4 md:mb-6 flex items-center gap-2">
            <MapPin size={20} className="text-red-600" />
            Location Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div>
              <label className="block text-sm md:text-base font-semibold text-gray-700 mb-2">
                City *
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="e.g., Dhaka, Chittagong, Sylhet, Rajshahi"
                className="w-full px-4 py-3 text-base min-h-[44px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                required
                minLength={2}
                maxLength={50}
              />
            </div>

            <div>
              <label className="block text-sm md:text-base font-semibold text-gray-700 mb-2">
                Area/Locality *
              </label>
              <input
                type="text"
                name="area"
                value={formData.area}
                onChange={handleChange}
                placeholder="e.g., Dhanmondi, Gulshan, Mirpur, Banani"
                className="w-full px-4 py-3 text-base min-h-[44px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                required
                minLength={2}
                maxLength={100}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm md:text-base font-semibold text-gray-700 mb-2">
                Full Address *
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Street address, landmark"
                className="w-full px-4 py-3 text-base min-h-[44px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                📍 Location coordinates will be automatically determined from your city and area
              </p>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-4 pt-4 border-t">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-red-600 text-white py-3 md:py-4 text-base md:text-lg font-semibold min-h-[48px] rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {loading ? 'Registering...' : 'Complete Registration'}
          </button>
        </div>
      </form>

      <div className="mt-6 p-4 md:p-6 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Data Privacy & Security</h4>
        <ul className="text-xs md:text-sm text-blue-800 space-y-1">
          <li>✓ Your data is encrypted and securely stored</li>
          <li>✓ Contact details shown only when required</li>
          <li>✓ Duplicate registrations prevented automatically</li>
          <li>✓ You can update your profile anytime</li>
        </ul>
      </div>
    </div>
  );
}
