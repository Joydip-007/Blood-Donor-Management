import React, { useState } from 'react';
import { User, MapPin, Phone, Mail, Droplet, Calendar, AlertCircle, ArrowLeft, MapPinned } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE_URL } from '../../utils/api';
import { BloodGroup } from '../../types';
import { calculateAge } from '../../utils/helpers';
import { geocodeLocation, parseCoordinate } from '../../utils/geocoding';
import { validateBangladeshPhone } from '../../utils/phoneUtils';

interface Props {
  onBack: () => void;
  onSuccess: () => void;
}

export function AdminAddDonor({ onBack, onSuccess }: Props) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isGeocoding, setIsGeocoding] = useState(false);

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
      setError('Donor must be 18 or above');
      return false;
    }

    if (age > 65) {
      setError('Age must be below 65 for blood donation');
      return false;
    }

    if (!formData.city || !formData.area) {
      setError('City and area are required');
      return false;
    }

    return true;
  };

  const handleGeocode = async () => {
    if (!formData.city || !formData.area) {
      alert('Please enter city and area first');
      return;
    }
    
    setIsGeocoding(true);
    try {
      const result = await geocodeLocation(formData.city, formData.area);
      
      if (result) {
        setFormData({
          ...formData,
          latitude: result.latitude.toString(),
          longitude: result.longitude.toString()
        });
        alert('✓ Coordinates found successfully!');
      } else {
        alert('Could not find coordinates. Please enter manually or try different city/area names.');
      }
    } catch (error) {
      alert('Geocoding failed. Please enter coordinates manually.');
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/donors/add`,
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
            latitude: parseCoordinate(formData.latitude),
            longitude: parseCoordinate(formData.longitude),
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add donor');
      }

      setSuccess('Donor added successfully!');
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={onBack}
        className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft size={20} />
        Back to Dashboard
      </button>

      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Add New Donor (Admin)</h2>
          <p className="text-gray-600 mt-1">Manually register a donor without OTP verification</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
            <AlertCircle size={20} />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <User size={20} className="text-red-600" />
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <Calendar size={16} className="text-red-600" />
                  Date of Birth *
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Required - Age will be calculated automatically</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Age <span className="text-xs font-normal text-gray-500">(Auto-calculated from Date of Birth)</span>
                </label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  readOnly
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">Automatically calculated from date of birth. Must be between 18-65 years.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gender *
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <Droplet size={16} className="text-red-600" />
                  Blood Group *
                </label>
                <select
                  name="bloodGroup"
                  value={formData.bloodGroup}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
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
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Phone size={20} className="text-red-600" />
              Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <Mail size={16} />
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter 11-digit Bangladesh mobile number starting with 01
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Optional second contact number (11 digits)
                </p>
              </div>
            </div>
          </div>

          {/* Location Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MapPin size={20} className="text-red-600" />
              Location Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City *
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="e.g., Dhaka, Chittagong, Sylhet, Rajshahi"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Area/Locality *
                </label>
                <input
                  type="text"
                  name="area"
                  value={formData.area}
                  onChange={handleChange}
                  placeholder="e.g., Dhanmondi, Gulshan, Mirpur, Banani"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Address (Optional)
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Street address, landmark"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              {/* Geocoding Button */}
              <div className="md:col-span-2">
                <button
                  type="button"
                  onClick={handleGeocode}
                  disabled={!formData.city || !formData.area || isGeocoding}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <MapPinned size={18} />
                  {isGeocoding ? 'Finding coordinates...' : 'Auto-fill Coordinates from Address'}
                </button>
                <p className="text-xs text-gray-500 mt-1 text-center">
                  Click to automatically find latitude/longitude
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Latitude (Optional)
                </label>
                <input
                  type="number"
                  step="0.00000001"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleChange}
                  placeholder="e.g., 23.8103"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Longitude (Optional)
                </label>
                <input
                  type="number"
                  step="0.00000001"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleChange}
                  placeholder="e.g., 90.4125"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-4 pt-4 border-t">
            <button
              type="button"
              onClick={onBack}
              className="flex-1 bg-gray-600 text-white py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? 'Adding Donor...' : 'Add Donor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
