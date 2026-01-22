import React, { useState, useEffect } from 'react';
import { Users, Search, Droplet, MapPin, Phone, Mail, ArrowLeft, AlertCircle, MoreVertical, Edit, Trash2, CheckCircle, XCircle, Save, X, Filter, RefreshCcw, MapPinned } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE_URL } from '../../utils/api';
import { Donor, BloodGroup } from '../../types';
import { parseCoordinate } from '../../utils/geocoding';

interface Props {
  onBack: () => void;
}

export function AdminDonorList({ onBack }: Props) {
  const { token } = useAuth();
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [bloodGroupFilter, setBloodGroupFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  
  // Edit modal state
  const [editingDonor, setEditingDonor] = useState<Donor | null>(null);
  const [editFormData, setEditFormData] = useState<any>({});
  const [editLoading, setEditLoading] = useState(false);
  
  // Delete confirmation state
  const [deletingDonor, setDeletingDonor] = useState<Donor | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // Action menu state
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const bloodGroups: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  useEffect(() => {
    fetchDonors();
  }, []);

  const fetchDonors = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/donors/all`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch donors');
      }

      const data = await response.json();
      setDonors(data.donors);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredDonors = donors.filter(donor => {
    // Search filter
    const matchesSearch = 
      donor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      donor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      donor.phone.includes(searchTerm) ||
      donor.bloodGroup.includes(searchTerm.toUpperCase()) ||
      donor.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      donor.area.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Blood group filter
    const matchesBloodGroup = !bloodGroupFilter || donor.bloodGroup === bloodGroupFilter;
    
    // Status filter
    let matchesStatus = true;
    if (statusFilter === 'available') {
      matchesStatus = !donor.isDeleted && donor.isAvailable;
    } else if (statusFilter === 'unavailable') {
      matchesStatus = !donor.isDeleted && !donor.isAvailable;
    } else if (statusFilter === 'inactive') {
      matchesStatus = donor.isDeleted;
    }
    
    return matchesSearch && matchesBloodGroup && matchesStatus;
  });

  const activeDonors = donors.filter(d => !d.isDeleted);
  const inactiveDonors = donors.filter(d => d.isDeleted);

  const handleEditClick = (donor: Donor) => {
    setEditingDonor(donor);
    setEditFormData({
      name: donor.name,
      age: donor.age.toString(),
      gender: donor.gender,
      bloodGroup: donor.bloodGroup,
      phone: donor.phone,
      alternatePhone: donor.alternatePhone || '',
      city: donor.city,
      area: donor.area,
      address: '',
      latitude: donor.latitude?.toString() || '',
      longitude: donor.longitude?.toString() || '',
      lastDonationDate: donor.lastDonationDate || '',
      isAvailable: donor.isAvailable
    });
    setOpenMenuId(null);
  };

  const handleEditSubmit = async () => {
    if (!editingDonor) return;

    setEditLoading(true);
    setError('');

    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/donors/${editingDonor.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...editFormData,
            age: parseInt(editFormData.age),
            latitude: parseCoordinate(editFormData.latitude),
            longitude: parseCoordinate(editFormData.longitude),
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update donor');
      }

      setSuccess('Donor updated successfully!');
      setEditingDonor(null);
      fetchDonors();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setEditLoading(false);
    }
  };

  const handleToggleAvailability = async (donor: Donor) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/donors/${donor.id}/availability`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ isAvailable: !donor.isAvailable }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update availability');
      }

      setSuccess(`Donor marked as ${!donor.isAvailable ? 'available' : 'unavailable'}`);
      fetchDonors();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    }
    setOpenMenuId(null);
  };

  const handleDeactivate = async () => {
    if (!deletingDonor) return;

    setDeleteLoading(true);
    setError('');

    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/donors/${deletingDonor.id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to deactivate donor');
      }

      setSuccess('Donor deactivated successfully!');
      setDeletingDonor(null);
      fetchDonors();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleReactivate = async (donor: Donor) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/donors/${donor.id}/reactivate`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reactivate donor');
      }

      setSuccess('Donor reactivated successfully!');
      fetchDonors();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    }
    setOpenMenuId(null);
  };

  const handleBulkGeocode = async () => {
    if (!confirm('This will geocode all locations missing coordinates. Continue?')) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/locations/geocode-all`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setSuccess(`✓ Geocoded ${data.updated} locations. ${data.failed} failed.`);
        fetchDonors(); // Refresh the list
        setTimeout(() => setSuccess(''), 5000);
      } else {
        setError('Geocoding failed: ' + data.error);
      }
    } catch (error) {
      setError('Error during bulk geocoding');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <button
        onClick={onBack}
        className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft size={20} />
        Back to Dashboard
      </button>

      <div className="bg-white rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="text-red-600" size={28} />
              All Registered Donors
            </h2>
            <p className="text-gray-600 mt-1">Complete list with management tools</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleBulkGeocode}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:bg-gray-300"
            >
              <MapPinned size={18} />
              Geocode All Locations
            </button>
            <button
              onClick={fetchDonors}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <RefreshCcw size={18} />
              Refresh
            </button>
          </div>
        </div>

        {/* Success/Error Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between text-red-700">
            <div className="flex items-center gap-2">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
            <button onClick={() => setError('')} className="text-red-700 hover:text-red-900">
              <X size={18} />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between text-green-700">
            <div className="flex items-center gap-2">
              <CheckCircle size={20} />
              <span>{success}</span>
            </div>
            <button onClick={() => setSuccess('')} className="text-green-700 hover:text-green-900">
              <X size={18} />
            </button>
          </div>
        )}

        {/* Advanced Filtering */}
        <div className="mb-6 space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, email, phone, blood group, city, or area..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Filter size={16} className="inline mr-1" />
                Blood Group
              </label>
              <select
                value={bloodGroupFilter}
                onChange={(e) => setBloodGroupFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">All Blood Groups</option>
                {bloodGroups.map(bg => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>
            
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Filter size={16} className="inline mr-1" />
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">All Status</option>
                <option value="available">Available</option>
                <option value="unavailable">Unavailable</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Enhanced Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-gray-600 text-sm">Total Donors</p>
            <p className="text-2xl font-semibold mt-1">{donors.length}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-gray-600 text-sm">Available</p>
            <p className="text-2xl font-semibold mt-1 text-green-600">
              {activeDonors.filter(d => d.isAvailable).length}
            </p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <p className="text-gray-600 text-sm">Unavailable</p>
            <p className="text-2xl font-semibold mt-1 text-yellow-600">
              {activeDonors.filter(d => !d.isAvailable).length}
            </p>
          </div>
          <div className="bg-red-50 rounded-lg p-4">
            <p className="text-gray-600 text-sm">Inactive</p>
            <p className="text-2xl font-semibold mt-1 text-red-600">
              {inactiveDonors.length}
            </p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-gray-600 text-sm">Filtered Results</p>
            <p className="text-2xl font-semibold mt-1 text-purple-600">{filteredDonors.length}</p>
          </div>
        </div>

        {/* Donors List */}
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading donors...</p>
          </div>
        ) : filteredDonors.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">
              {searchTerm || bloodGroupFilter || statusFilter ? 'No donors found matching your filters' : 'No donors registered yet'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">ID</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Blood Group</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Age</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Gender</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Location</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Contact</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredDonors.map((donor) => (
                  <tr key={donor.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-600">#{donor.id}</td>
                    <td className="px-4 py-3 text-sm font-medium">
                      <div>
                        {donor.name}
                        {donor.isDeleted && (
                          <span className="ml-2 px-2 py-1 bg-gray-200 text-gray-600 rounded text-xs">
                            Inactive
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium flex items-center gap-1 w-fit">
                        <Droplet size={12} />
                        {donor.bloodGroup}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{donor.age}</td>
                    <td className="px-4 py-3 text-sm">{donor.gender}</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-1 text-gray-600">
                        <MapPin size={14} />
                        <div>
                          <div>{donor.area}</div>
                          <div className="text-xs text-gray-500">{donor.city}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="space-y-1">
                        <a
                          href={`tel:${donor.phone}`}
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          <Phone size={12} />
                          {donor.phone}
                        </a>
                        <a
                          href={`mailto:${donor.email}`}
                          className="text-gray-600 hover:text-gray-800 flex items-center gap-1 text-xs"
                        >
                          <Mail size={12} />
                          {donor.email}
                        </a>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {donor.isAvailable ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          Available
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                          Unavailable
                        </span>
                      )}
                      {donor.lastDonationDate && (
                        <div className="text-xs text-gray-500 mt-1">
                          Last: {new Date(donor.lastDonationDate).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-center relative">
                      <button
                        onClick={() => setOpenMenuId(openMenuId === donor.id ? null : donor.id)}
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        <MoreVertical size={18} />
                      </button>
                      
                      {/* Action Menu Dropdown */}
                      {openMenuId === donor.id && (
                        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 w-48">
                          <button
                            onClick={() => handleEditClick(donor)}
                            className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm"
                          >
                            <Edit size={16} />
                            Edit Profile
                          </button>
                          {!donor.isDeleted && (
                            <>
                              <button
                                onClick={() => handleToggleAvailability(donor)}
                                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm"
                              >
                                {donor.isAvailable ? <XCircle size={16} /> : <CheckCircle size={16} />}
                                Mark {donor.isAvailable ? 'Unavailable' : 'Available'}
                              </button>
                              <button
                                onClick={() => setDeletingDonor(donor)}
                                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm text-red-600"
                              >
                                <Trash2 size={16} />
                                Deactivate
                              </button>
                            </>
                          )}
                          {donor.isDeleted && (
                            <button
                              onClick={() => handleReactivate(donor)}
                              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm text-green-600"
                            >
                              <CheckCircle size={16} />
                              Reactivate
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingDonor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Edit Donor Profile</h3>
              <button onClick={() => setEditingDonor(null)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Personal Info */}
              <div>
                <h4 className="text-lg font-semibold mb-4">Personal Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                    <input
                      type="text"
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Age *</label>
                    <input
                      type="number"
                      value={editFormData.age}
                      onChange={(e) => setEditFormData({ ...editFormData, age: e.target.value })}
                      min="18"
                      max="65"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
                    <select
                      value={editFormData.gender}
                      onChange={(e) => setEditFormData({ ...editFormData, gender: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group *</label>
                    <select
                      value={editFormData.bloodGroup}
                      onChange={(e) => setEditFormData({ ...editFormData, bloodGroup: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      {bloodGroups.map(bg => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Donation Date</label>
                    <input
                      type="date"
                      value={editFormData.lastDonationDate}
                      onChange={(e) => setEditFormData({ ...editFormData, lastDonationDate: e.target.value })}
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div>
                <h4 className="text-lg font-semibold mb-4">Contact Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email (Read-only)</label>
                    <input
                      type="email"
                      value={editingDonor.email}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Primary Phone *</label>
                    <input
                      type="tel"
                      value={editFormData.phone}
                      onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Alternate Phone</label>
                    <input
                      type="tel"
                      value={editFormData.alternatePhone}
                      onChange={(e) => setEditFormData({ ...editFormData, alternatePhone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>
              </div>

              {/* Location */}
              <div>
                <h4 className="text-lg font-semibold mb-4">Location Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                    <input
                      type="text"
                      value={editFormData.city}
                      onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Area *</label>
                    <input
                      type="text"
                      value={editFormData.area}
                      onChange={(e) => setEditFormData({ ...editFormData, area: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <input
                      type="text"
                      value={editFormData.address}
                      onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                    <input
                      type="text"
                      value={editFormData.latitude}
                      onChange={(e) => setEditFormData({ ...editFormData, latitude: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                    <input
                      type="text"
                      value={editFormData.longitude}
                      onChange={(e) => setEditFormData({ ...editFormData, longitude: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>
              </div>

              {/* Availability */}
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editFormData.isAvailable}
                    onChange={(e) => setEditFormData({ ...editFormData, isAvailable: e.target.checked })}
                    className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Mark as Available</span>
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-4">
              <button
                onClick={() => setEditingDonor(null)}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSubmit}
                disabled={editLoading}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:bg-gray-300 flex items-center justify-center gap-2"
              >
                <Save size={18} />
                {editLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingDonor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Confirm Deactivation</h3>
            </div>
            
            <div className="p-6">
              <p className="text-gray-700">
                Are you sure you want to deactivate <strong>{deletingDonor.name}</strong>?
              </p>
              <p className="text-sm text-gray-500 mt-2">
                This donor will be marked as inactive and won't appear in search results. You can reactivate them later if needed.
              </p>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-4">
              <button
                onClick={() => setDeletingDonor(null)}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeactivate}
                disabled={deleteLoading}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:bg-gray-300"
              >
                {deleteLoading ? 'Deactivating...' : 'Deactivate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
