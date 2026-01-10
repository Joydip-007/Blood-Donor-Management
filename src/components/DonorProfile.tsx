import React, { useState, useEffect } from 'react';
import { Edit2, Save, X, Phone, Mail, MapPin, Calendar, Droplet, AlertCircle, CheckCircle, UserX } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../utils/api';
import { Donor, BloodGroup } from '../types';

export function DonorProfile() {
  const { token } = useAuth();
  const [donor, setDonor] = useState<Donor | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [editForm, setEditForm] = useState({
    phone: '',
    alternatePhone: '',
    city: '',
    area: '',
    address: '',
    latitude: '',
    longitude: '',
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

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

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
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    setError('');
    setSuccess('');
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
            latitude: editForm.latitude ? parseFloat(editForm.latitude) : undefined,
            longitude: editForm.longitude ? parseFloat(editForm.longitude) : undefined,
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
    if (!confirm('Are you sure you want to deactivate your donor profile? Your data will be preserved but you will not appear in search results.')) {
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

      if (!response.ok) {
        throw new Error('Failed to deactivate profile');
      }

      setSuccess('Profile deactivated successfully');
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
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
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error && !donor) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Success/Error Messages */}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
          <CheckCircle size={20} />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Profile Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">{donor.name}</h1>
            <p className="text-red-100 mt-1">Blood Donor ID: {donor.id.slice(0, 8)}</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 justify-end mb-2">
              <Droplet size={24} />
              <span className="text-3xl font-bold">{donor.bloodGroup}</span>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${availabilityStatus.bg} ${availabilityStatus.color}`}>
              {availabilityStatus.text}
            </span>
          </div>
        </div>
      </div>

      {/* Availability Information */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Calendar className="text-red-600" size={20} />
          Donation Availability
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Last Donation</p>
            <p className="text-lg font-semibold">
              {donor.lastDonationDate
                ? new Date(donor.lastDonationDate).toLocaleDateString()
                : 'No previous donation'}
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Days Since Last Donation</p>
            <p className="text-lg font-semibold">
              {daysSinceLastDonation !== null ? `${daysSinceLastDonation} days` : 'N/A'}
            </p>
          </div>
        </div>
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-900">
            <strong>Note:</strong> Donors can donate blood every 90 days. Your availability status is automatically updated based on your last donation date.
          </p>
        </div>
      </div>

      {/* Personal Information */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Personal Information</h2>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit2 size={18} />
              Edit Profile
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Age</p>
            <p className="text-lg font-semibold">{donor.age} years</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Gender</p>
            <p className="text-lg font-semibold">{donor.gender}</p>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Phone className="text-red-600" size={20} />
          Contact Information {editing && '(Editable)'}
        </h2>

        {!editing ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Mail size={18} className="text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{donor.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone size={18} className="text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Primary Phone</p>
                <p className="font-medium">{donor.phone}</p>
              </div>
            </div>
            {donor.alternatePhone && (
              <div className="flex items-center gap-3">
                <Phone size={18} className="text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Alternate Phone</p>
                  <p className="font-medium">{donor.alternatePhone}</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Primary Phone</label>
              <input
                type="tel"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Alternate Phone</label>
              <input
                type="tel"
                value={editForm.alternatePhone}
                onChange={(e) => setEditForm({ ...editForm, alternatePhone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Location Information */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <MapPin className="text-red-600" size={20} />
          Location {editing && '(Editable)'}
        </h2>

        {!editing ? (
          <div className="space-y-2">
            <p><strong>City:</strong> {donor.city}</p>
            <p><strong>Area:</strong> {donor.area}</p>
            <p><strong>Address:</strong> {donor.address}</p>
            {donor.latitude && donor.longitude && (
              <p><strong>Coordinates:</strong> {donor.latitude}, {donor.longitude}</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                value={editForm.city}
                onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Area</label>
              <input
                type="text"
                value={editForm.area}
                onChange={(e) => setEditForm({ ...editForm, area: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                type="text"
                value={editForm.address}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                <input
                  type="text"
                  value={editForm.latitude}
                  onChange={(e) => setEditForm({ ...editForm, latitude: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                <input
                  type="text"
                  value={editForm.longitude}
                  onChange={(e) => setEditForm({ ...editForm, longitude: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {editing && (
        <div className="flex gap-4">
          <button
            onClick={handleUpdate}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300"
          >
            <Save size={20} />
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            onClick={() => {
              setEditing(false);
              setError('');
            }}
            className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors flex items-center gap-2"
          >
            <X size={20} />
            Cancel
          </button>
        </div>
      )}

      {/* Deactivate Account */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-red-900 mb-2 flex items-center gap-2">
          <UserX size={20} />
          Deactivate Profile
        </h3>
        <p className="text-sm text-red-800 mb-4">
          Deactivating your profile will remove you from donor searches, but your data will be preserved. You can reactivate anytime.
        </p>
        <button
          onClick={handleDeactivate}
          disabled={loading}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-300"
        >
          Deactivate My Profile
        </button>
      </div>

      {/* Metadata */}
      <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
        <p>Profile created: {new Date(donor.createdAt).toLocaleDateString()}</p>
        <p>Last updated: {new Date(donor.updatedAt).toLocaleDateString()}</p>
      </div>
    </div>
  );
}
