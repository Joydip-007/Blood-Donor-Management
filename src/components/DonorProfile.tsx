import React, { useState, useEffect } from 'react';
import { Edit2, Save, X, Phone, Mail, MapPin, Calendar, Droplet, AlertCircle, CheckCircle, UserX, MapPinned, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../utils/api';
import { Donor, BloodGroup } from '../types';
import { geocodeLocation, parseCoordinate } from '../utils/geocoding';
import { validateBangladeshPhone } from '../utils/phoneUtils';

export function DonorProfile() {
  const { token } = useAuth();
  const [donor, setDonor] = useState<Donor | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);
  
  const [editForm, setEditForm] = useState({
    phone: '',
    alternatePhone: '',
    city: '',
    area: '',
    address: '',
    latitude: '',
    longitude: '',
    lastDonationDate: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        `${API_BASE_URL}/donors/profile`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setDonor(data.donor);
        setEditForm({
          phone: data.donor.phone || '',
          alternatePhone: data.donor.alternatePhone || '',
          city: data.donor.city || '',
          area: data.donor.area || '',
          address: data.donor.address || '',
          latitude: data.donor.latitude?.toString() || '',
          longitude: data.donor.longitude?.toString() || '',
          lastDonationDate: data.donor.lastDonationDate ? new Date(data.donor.lastDonationDate).toISOString().split('T')[0] : '',
        });
        
        // Clear any errors on successful load
        setError('');
      } else if (response.status === 401) {
        setError('Session expired. Please login again.');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to load profile');
      }
    } catch (err: any) {
      setError('Failed to connect to server. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleGeocode = async () => {
    if (!editForm.city || !editForm.area) {
      alert('Please enter city and area first');
      return;
    }
    
    setIsGeocoding(true);
    try {
      const result = await geocodeLocation(editForm.city, editForm.area);
      
      if (result) {
        setEditForm({
          ...editForm,
          latitude: result.latitude.toString(),
          longitude: result.longitude.toString()
        });
        alert('✓ Coordinates found successfully!');
      } else {
        alert('Could not find coordinates. Please enter manually.');
      }
    } catch (error) {
      alert('Geocoding failed. Please enter coordinates manually.');
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleUpdate = async () => {
    setError('');
    setSuccess('');

    // Validate primary phone
    const phoneValidation = validateBangladeshPhone(editForm.phone);
    if (!phoneValidation.isValid) {
      setError(phoneValidation.error || 'Primary phone must be a valid 11-digit Bangladesh number starting with 01');
      return;
    }

    // Validate alternate phone if provided
    if (editForm.alternatePhone) {
      const altPhoneValidation = validateBangladeshPhone(editForm.alternatePhone);
      if (!altPhoneValidation.isValid) {
        setError(altPhoneValidation.error || 'Alternate phone must be a valid 11-digit Bangladesh number starting with 01');
        return;
      }
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/donors/profile`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...editForm,
            latitude: parseCoordinate(editForm.latitude),
            longitude: parseCoordinate(editForm.longitude),
            lastDonationDate: editForm.lastDonationDate || undefined,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      const data = await response.json();
      setDonor(data.donor);
      setSuccess('Profile updated successfully!');
      setEditing(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async () => {
    if (!confirm(
      'Are you sure you want to deactivate your account?\n\n' +
      'Your profile will be hidden from searches but all your data will be preserved.\n' +
      'You can reactivate your account anytime.'
    )) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        `${API_BASE_URL}/donors/profile`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message || 'Profile deactivated successfully');
        fetchProfile(); // Refresh to show deactivated status
      } else {
        setError(data.error || 'Failed to deactivate account');
      }
    } catch (err: any) {
      setError('Failed to deactivate account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReactivate = async () => {
    if (!confirm(
      'Reactivate your account?\n\n' +
      'You will appear in donor searches and emergency request matching again.'
    )) {
      return;
    }

    setIsReactivating(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(
        `${API_BASE_URL}/donors/profile/reactivate`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message || 'Account reactivated successfully');
        fetchProfile(); // Refresh profile
      } else {
        setError(data.error || 'Failed to reactivate account');
      }
    } catch (err: any) {
      setError('Failed to reactivate account. Please try again.');
    } finally {
      setIsReactivating(false);
    }
  };

  const getDaysSinceLastDonation = () => {
    if (!donor?.lastDonationDate) return null;
    const days = Math.floor(
      (new Date().getTime() - new Date(donor.lastDonationDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    return days;
  };

  const getAvailabilityStatus = () => {
    const days = getDaysSinceLastDonation();
    if (days === null) {
      return { text: 'Available', color: 'text-green-600', bg: 'bg-green-100' };
    }
    
    if (days < 90) {
      return {
        text: `Unavailable (${90 - days} days remaining)`,
        color: 'text-red-600',
        bg: 'bg-red-100',
      };
    }
    
    return { text: 'Available', color: 'text-green-600', bg: 'bg-green-100' };
  };

  if (loading && !donor) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-700">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error && !donor) {
    return (
      <div className="p-4 md:p-6 bg-red-50 border border-red-200 rounded-lg text-red-700">
        <AlertCircle className="inline mr-2" size={20} />
        {error}
      </div>
    );
  }

  if (!donor) {
    return null;
  }

  const availabilityStatus = getAvailabilityStatus();
  const daysSinceLastDonation = getDaysSinceLastDonation();

  return (
    <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
      {/* Success/Error Messages */}
      {success && (
        <div className="p-4 md:p-6 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
          <CheckCircle size={20} />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-4 md:p-6 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Profile Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg shadow-lg p-6 md:p-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">{donor.name}</h1>
            <p className="text-red-100 mt-1">Blood Donor ID: {donor.id.slice(0, 8)}</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 justify-end mb-2">
              <Droplet size={24} />
              <span className="text-2xl md:text-3xl font-bold">{donor.bloodGroup}</span>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${availabilityStatus.bg} ${availabilityStatus.color}`}>
              {availabilityStatus.text}
            </span>
          </div>
        </div>
      </div>

      {/* Availability Information */}
      <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
        <h2 className="text-xl md:text-2xl font-semibold mb-4 flex items-center gap-2">
          <Calendar className="text-red-600" size={20} />
          Donation Availability {editing && '(Editable)'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700 mb-1">Last Donation Date</p>
            {editing ? (
              <input
                type="date"
                value={editForm.lastDonationDate}
                onChange={(e) => setEditForm({ ...editForm, lastDonationDate: e.target.value })}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 text-base min-h-[44px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            ) : (
              <p className="text-lg font-semibold">
                {donor.lastDonationDate
                  ? new Date(donor.lastDonationDate).toLocaleDateString()
                  : 'No previous donation'}
              </p>
            )}
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700 mb-1">Days Since Last Donation</p>
            <p className="text-lg font-semibold">
              {daysSinceLastDonation !== null ? `${daysSinceLastDonation} days` : 'N/A'}
            </p>
          </div>
        </div>
        <div className="mt-4 p-4 md:p-6 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-900">
            <strong>ℹ️ Note:</strong> You can donate blood every 90 days. {editing ? 'Update your last donation date to help us track your availability.' : 'Your availability status is automatically updated based on your last donation date.'}
          </p>
        </div>
      </div>

      {/* Personal Information */}
      <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl md:text-2xl font-semibold">Personal Information</h2>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 min-h-[44px] bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit2 size={18} />
              <span className="hidden sm:inline">Edit Profile</span>
              <span className="sm:hidden">Edit</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700 mb-1">Age</p>
            <p className="text-lg font-semibold">{donor.age} years</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700 mb-1">Gender</p>
            <p className="text-lg font-semibold">{donor.gender}</p>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
        <h2 className="text-xl md:text-2xl font-semibold mb-4 flex items-center gap-2">
          <Phone className="text-red-600" size={20} />
          Contact Information {editing && '(Editable)'}
        </h2>

        {!editing ? (
          <div className="space-y-4 md:space-y-6">
            <div className="flex items-start gap-3">
              <Mail size={18} className="text-gray-400 mt-1" />
              <div>
                <p className="text-sm text-gray-700">Email 🔒</p>
                <p className="font-medium">{donor.email}</p>
                <p className="text-xs text-gray-500">Cannot be changed (verified login email)</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone size={18} className="text-gray-400 mt-1" />
              <div>
                <p className="text-sm text-gray-700">Primary Phone</p>
                <p className="font-medium">{donor.phone}</p>
              </div>
            </div>
            {donor.alternatePhone && (
              <div className="flex items-start gap-3">
                <Phone size={18} className="text-gray-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-700">Alternate Phone</p>
                  <p className="font-medium">{donor.alternatePhone}</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 md:space-y-6">
            <div>
              <label className="block text-sm md:text-base font-semibold text-gray-700 mb-2">Email 🔒</label>
              <input
                type="email"
                value={donor.email}
                readOnly
                className="w-full px-4 py-3 text-base min-h-[44px] bg-gray-100 border border-gray-300 rounded-lg cursor-not-allowed focus:outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed (verified login email)</p>
            </div>
            <div>
              <label className="block text-sm md:text-base font-semibold text-gray-700 mb-2">
                Primary Phone * <span className="text-xs font-normal text-gray-500">(Bangladesh)</span>
              </label>
              <input
                type="tel"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value.replace(/\D/g, '').slice(0, 11) })}
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
                value={editForm.alternatePhone}
                onChange={(e) => setEditForm({ ...editForm, alternatePhone: e.target.value.replace(/\D/g, '').slice(0, 11) })}
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
        )}
      </div>

      {/* Location Information */}
      <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
        <h2 className="text-xl md:text-2xl font-semibold mb-4 flex items-center gap-2">
          <MapPin className="text-red-600" size={20} />
          Location {editing && '(Editable)'}
        </h2>

        {!editing ? (
          <div className="space-y-4 md:space-y-6">
            <p className="text-gray-700"><strong>City:</strong> {donor.city}</p>
            <p className="text-gray-700"><strong>Area:</strong> {donor.area}</p>
            <p className="text-gray-700"><strong>Address:</strong> {donor.address}</p>
            {donor.latitude && donor.longitude && (
              <p className="text-gray-700"><strong>Coordinates:</strong> {donor.latitude}, {donor.longitude}</p>
            )}
          </div>
        ) : (
          <div className="space-y-4 md:space-y-6">
            <div>
              <label className="block text-sm md:text-base font-semibold text-gray-700 mb-2">City</label>
              <input
                type="text"
                value={editForm.city}
                onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                className="w-full px-4 py-3 text-base min-h-[44px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div>
              <label className="block text-sm md:text-base font-semibold text-gray-700 mb-2">Area</label>
              <input
                type="text"
                value={editForm.area}
                onChange={(e) => setEditForm({ ...editForm, area: e.target.value })}
                className="w-full px-4 py-3 text-base min-h-[44px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div>
              <label className="block text-sm md:text-base font-semibold text-gray-700 mb-2">Address</label>
              <input
                type="text"
                value={editForm.address}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                className="w-full px-4 py-3 text-base min-h-[44px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            
            {/* Geocoding Button */}
            <button
              type="button"
              onClick={handleGeocode}
              disabled={!editForm.city || !editForm.area || isGeocoding}
              className="col-span-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <MapPinned size={18} />
              {isGeocoding ? 'Finding coordinates...' : '📍 Auto-fill Coordinates'}
            </button>
            
            <div className="grid grid-cols-2 gap-4 md:gap-6">
              <div>
                <label className="block text-sm md:text-base font-semibold text-gray-700 mb-2">Latitude</label>
                <input
                  type="number"
                  step="0.00000001"
                  value={editForm.latitude}
                  onChange={(e) => setEditForm({ ...editForm, latitude: e.target.value })}
                  className="w-full px-4 py-3 text-base min-h-[44px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm md:text-base font-semibold text-gray-700 mb-2">Longitude</label>
                <input
                  type="number"
                  step="0.00000001"
                  value={editForm.longitude}
                  onChange={(e) => setEditForm({ ...editForm, longitude: e.target.value })}
                  className="w-full px-4 py-3 text-base min-h-[44px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {editing && (
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleUpdate}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 md:px-6 py-2 md:py-3 min-h-[44px] bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300"
          >
            <Save size={20} />
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            onClick={() => {
              setEditing(false);
              setError('');
            }}
            className="px-4 md:px-6 py-2 md:py-3 min-h-[44px] bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors flex items-center justify-center gap-2"
          >
            <X size={20} />
            Cancel
          </button>
        </div>
      )}

      {/* Account Status and Deactivation Section */}
      <div className="bg-white rounded-lg shadow-sm p-6 md:p-8">
        <h3 className="text-lg md:text-xl font-bold mb-4 flex items-center gap-2">
          {donor?.isActive === false ? (
            <>
              <AlertCircle className="text-yellow-600" size={24} />
              <span className="text-yellow-600">Account Deactivated</span>
            </>
          ) : (
            <>
              <Shield className="text-green-600" size={24} />
              <span className="text-green-600">Account Active</span>
            </>
          )}
        </h3>

        {donor?.isActive === false ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-sm md:text-base text-yellow-800 mb-4">
              Your account is currently deactivated. You will not appear in donor searches or emergency requests.
              Your profile data is safely preserved and you can reactivate anytime.
            </p>
            <button
              onClick={handleReactivate}
              disabled={isReactivating}
              className="px-4 md:px-6 py-2 md:py-3 min-h-[44px] bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-semibold transition-colors"
            >
              {isReactivating ? 'Reactivating...' : '✓ Reactivate My Account'}
            </button>
          </div>
        ) : (
          <div>
            <h4 className="font-semibold text-red-600 mb-3">Deactivate Account</h4>
            <p className="text-sm md:text-base text-gray-600 mb-4">
              Temporarily deactivate your account. Your profile data will be preserved and you can reactivate anytime.
              While deactivated:
            </p>
            <ul className="list-disc list-inside text-sm md:text-base text-gray-600 mb-4 space-y-1">
              <li>You will not appear in donor searches</li>
              <li>You will not be matched for emergency requests</li>
              <li>Your profile remains accessible to you</li>
              <li>You can reactivate anytime</li>
              <li>No data will be deleted</li>
            </ul>
            <button
              onClick={handleDeactivate}
              disabled={loading}
              className="px-4 md:px-6 py-2 md:py-3 min-h-[44px] bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-300"
            >
              {loading ? 'Deactivating...' : 'Deactivate Account'}
            </button>
          </div>
        )}
      </div>

      {/* Metadata */}
      <div className="bg-gray-50 rounded-lg p-4 md:p-6 text-sm text-gray-700">
        <p>Profile created: {new Date(donor.createdAt).toLocaleDateString()}</p>
        <p>Last updated: {new Date(donor.updatedAt).toLocaleDateString()}</p>
      </div>
    </div>
  );
}
