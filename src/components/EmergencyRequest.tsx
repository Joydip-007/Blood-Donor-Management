import React, { useState, useEffect } from 'react';
import { AlertCircle, Phone, MapPin, Droplet, Clock, User, Building, CheckCircle, Trash2, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { API_BASE_URL } from '../utils/api';
import { BloodGroup } from '../types';
import { validateBangladeshPhone } from '../utils/phoneUtils';

interface MatchedDonor {
  id: string;
  name: string;
  bloodGroup: string;
  city: string;
  area: string;
  phone: string;
  latitude?: number;
  longitude?: number;
}

interface EmergencyRequestData {
  id: string;
  patientName: string;
  bloodGroup: string;
  unitsRequired: number;
  hospitalName: string;
  city: string;
  area: string;
  urgency: 'critical' | 'high' | 'medium';
  requiredBy: string;
  contactNumber: string;
  notes: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  createdAt: string;
  approvedAt?: string;
  rejectionReason?: string;
  matchedDonors?: MatchedDonor[];
}

export function EmergencyRequest() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [myRequests, setMyRequests] = useState<EmergencyRequestData[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [contactNumber, setContactNumber] = useState('');
  const [contactNumberEntered, setContactNumberEntered] = useState(false);
  const [expandedRequest, setExpandedRequest] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    patientName: '',
    bloodGroup: 'O+' as BloodGroup,
    unitsRequired: '1',
    hospitalName: '',
    city: '',
    area: '',
    contactName: '',
    contactPhone: '',
    urgency: 'high' as 'critical' | 'high' | 'medium',
    requiredBy: '',
    notes: '',
  });

  const bloodGroups: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  const compatibilityInfo: Record<BloodGroup, string> = {
    'A+': 'Can receive from: A+, A-, O+, O-',
    'A-': 'Can receive from: A-, O-',
    'B+': 'Can receive from: B+, B-, O+, O-',
    'B-': 'Can receive from: B-, O-',
    'AB+': 'Universal Receiver - Can receive from all blood groups',
    'AB-': 'Can receive from: AB-, A-, B-, O-',
    'O+': 'Can receive from: O+, O-',
    'O-': 'Can only receive from: O-',
  };

  const fetchMyRequests = async (phone: string) => {
    setLoadingRequests(true);
    setError('');
    try {
      const cleanedPhone = phone.replace(/[\s\-\(\)]/g, '');
      const response = await fetch(`${API_BASE_URL}/requests/my-requests/${cleanedPhone}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch requests');
      }

      const data = await response.json();
      setMyRequests(data.requests || []);
    } catch (err: any) {
      setError(err.message);
      setMyRequests([]);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleContactNumberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const phoneValidation = validateBangladeshPhone(contactNumber);
    if (!phoneValidation.isValid) {
      setError(phoneValidation.error || 'Contact phone must be a valid 11-digit Bangladesh number starting with 01');
      return;
    }
    setContactNumberEntered(true);
    setFormData({ ...formData, contactPhone: contactNumber });
    fetchMyRequests(contactNumber);
  };

  const handleDeleteRequest = async (requestId: string) => {
    if (!window.confirm('Are you sure you want to delete this request?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/requests/${requestId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contactNumber: contactNumber }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete request');
      }

      // Refresh the requests list
      fetchMyRequests(contactNumber);
    } catch (err: any) {
      alert('Error deleting request: ' + err.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate phone number
      const phoneValidation = validateBangladeshPhone(formData.contactPhone);
      if (!phoneValidation.isValid) {
        throw new Error(phoneValidation.error || 'Contact phone must be a valid 11-digit Bangladesh number starting with 01');
      }

      const response = await fetch(
        `${API_BASE_URL}/requests/create`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...formData,
            unitsRequired: parseFloat(formData.unitsRequired),
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create request');
      }

      // Reset form and refresh requests
      setFormData({
        patientName: '',
        bloodGroup: 'O+',
        unitsRequired: '1',
        hospitalName: '',
        city: '',
        area: '',
        contactName: '',
        contactPhone: contactNumber,
        urgency: 'high',
        requiredBy: '',
        notes: '',
      });
      setShowForm(false);
      fetchMyRequests(contactNumber);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      completed: 'bg-blue-100 text-blue-800',
    };
    return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800';
  };

  const getUrgencyBadge = (urgency: string) => {
    const badges = {
      critical: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      medium: 'bg-yellow-100 text-yellow-800',
    };
    return badges[urgency as keyof typeof badges] || 'bg-gray-100 text-gray-800';
  };

  // If contact number not entered, show the initial form
  if (!contactNumberEntered) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
          <div className="mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <AlertCircle className="text-red-600" size={28} />
              Emergency Blood Request
            </h2>
            <p className="text-gray-700 mt-2 text-sm md:text-base">
              Enter your contact number to view your previous requests and create new ones
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
              <AlertCircle size={20} />
              <span className="text-sm md:text-base">{error}</span>
            </div>
          )}

          <form onSubmit={handleContactNumberSubmit} className="space-y-6">
            <div>
              <label className="block text-sm md:text-base font-semibold text-gray-700 mb-2">
                Contact Phone * <span className="text-xs font-normal text-gray-500">(Bangladesh)</span>
              </label>
              <input
                type="tel"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value.replace(/\D/g, '').slice(0, 11))}
                placeholder="01XXXXXXXXX (11 digits)"
                pattern="^01[3-9]\d{8}$"
                maxLength={11}
                minLength={11}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-base min-h-[44px]"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter your 11-digit Bangladesh mobile number starting with 01
              </p>
            </div>

            <button
              type="submit"
              className="w-full bg-red-600 text-white py-3 md:py-4 rounded-lg font-semibold text-base md:text-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 min-h-[48px]"
            >
              Continue
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Main view showing requests and form
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header with contact info and refresh */}
      <div className="bg-white rounded-lg shadow-md p-4 md:p-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-gray-900">My Emergency Requests</h2>
          <p className="text-sm text-gray-600">Contact: {contactNumber}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => fetchMyRequests(contactNumber)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
            disabled={loadingRequests}
          >
            <RefreshCw size={16} className={loadingRequests ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={() => {
              setContactNumberEntered(false);
              setMyRequests([]);
              setContactNumber('');
            }}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Change Number
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle size={20} />
          <span className="text-sm md:text-base">{error}</span>
        </div>
      )}

      {/* Create new request button */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full bg-red-600 text-white py-3 md:py-4 rounded-lg font-semibold text-base md:text-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
        >
          <AlertCircle size={20} />
          Create New Emergency Request
        </button>
      )}

      {/* Request form (when creating new) */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
          <div className="mb-6 md:mb-8 flex items-center justify-between">
            <h3 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <AlertCircle className="text-red-600" size={28} />
              New Emergency Request
            </h3>
            <button
              onClick={() => {
                setShowForm(false);
                setError('');
              }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
            {/* Patient Information */}
            <div>
              <h3 className="text-base md:text-lg font-semibold mb-4 md:mb-6 flex items-center gap-2">
                <User className="text-red-600" size={20} />
                Patient Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div>
                  <label className="block text-sm md:text-base font-semibold text-gray-700 mb-2">
                    Patient Name *
                  </label>
                  <input
                    type="text"
                    value={formData.patientName}
                    onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-base min-h-[44px]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm md:text-base font-semibold text-gray-700 mb-2 flex items-center gap-1">
                    <Droplet size={16} className="text-red-600" />
                    Blood Group Required *
                  </label>
                  <select
                    value={formData.bloodGroup}
                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value as BloodGroup })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-base min-h-[44px]"
                    required
                  >
                    {bloodGroups.map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                  <p className="text-xs md:text-sm text-gray-600 mt-2">{compatibilityInfo[formData.bloodGroup]}</p>
                </div>

                <div>
                  <label className="block text-sm md:text-base font-semibold text-gray-700 mb-2">
                    Units Required *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={formData.unitsRequired}
                    onChange={(e) => setFormData({ ...formData, unitsRequired: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-base min-h-[44px]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm md:text-base font-semibold text-gray-700 mb-2">
                    Urgency Level *
                  </label>
                  <select
                    value={formData.urgency}
                    onChange={(e) => setFormData({ ...formData, urgency: e.target.value as any })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-base min-h-[44px]"
                    required
                  >
                    <option value="critical">🔴 Critical (Immediate)</option>
                    <option value="high">🟠 High (Within 24 hours)</option>
                    <option value="medium">🟡 Medium (Within 48 hours)</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm md:text-base font-semibold text-gray-700 mb-2 flex items-center gap-1">
                    <Clock size={16} />
                    Required By *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.requiredBy}
                    onChange={(e) => setFormData({ ...formData, requiredBy: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-base min-h-[44px]"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Hospital Information */}
            <div>
              <h3 className="text-base md:text-lg font-semibold mb-4 md:mb-6 flex items-center gap-2">
                <Building className="text-red-600" size={20} />
                Hospital Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div>
                  <label className="block text-sm md:text-base font-semibold text-gray-700 mb-2">
                    Hospital Name *
                  </label>
                  <input
                    type="text"
                    value={formData.hospitalName}
                    onChange={(e) => setFormData({ ...formData, hospitalName: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-base min-h-[44px]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm md:text-base font-semibold text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="e.g., Dhaka, Chittagong, Sylhet"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-base min-h-[44px]"
                    required
                    minLength={2}
                    maxLength={50}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm md:text-base font-semibold text-gray-700 mb-2">
                    Area/Locality *
                  </label>
                  <input
                    type="text"
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    placeholder="e.g., Dhanmondi, Gulshan, Mirpur, Banani"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-base min-h-[44px]"
                    required
                    minLength={2}
                    maxLength={100}
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="text-base md:text-lg font-semibold mb-4 md:mb-6 flex items-center gap-2">
                <Phone className="text-red-600" size={20} />
                Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div>
                  <label className="block text-sm md:text-base font-semibold text-gray-700 mb-2">
                    Contact Person Name *
                  </label>
                  <input
                    type="text"
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-base min-h-[44px]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm md:text-base font-semibold text-gray-700 mb-2">
                    Contact Phone *
                  </label>
                  <input
                    type="tel"
                    value={formData.contactPhone}
                    disabled
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-base min-h-[44px]"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Using the phone number you entered earlier
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm md:text-base font-semibold text-gray-700 mb-2">
                    Additional Notes (Optional)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    placeholder="Any additional information..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-base min-h-[88px]"
                  />
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="pt-4 md:pt-6 border-t">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 text-white py-3 md:py-4 rounded-lg font-semibold text-base md:text-lg hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[48px]"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Submitting Request...
                  </>
                ) : (
                  <>
                    <AlertCircle size={20} />
                    Submit Emergency Request
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List of previous requests */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Your Requests {myRequests.length > 0 && `(${myRequests.length})`}
        </h3>

        {loadingRequests ? (
          <div className="bg-white rounded-lg shadow-md p-8 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
            <span className="ml-3 text-gray-600">Loading your requests...</span>
          </div>
        ) : myRequests.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
            <p>No emergency requests found.</p>
            <p className="text-sm mt-2">Create your first request using the button above.</p>
          </div>
        ) : (
          myRequests.map((request) => (
            <div key={request.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Request header */}
              <div className="p-4 md:p-6 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h4 className="text-lg font-semibold text-gray-900">Request #{request.id}</h4>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(request.status)}`}>
                        {request.status.toUpperCase()}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getUrgencyBadge(request.urgency)}`}>
                        {request.urgency.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Created: {new Date(request.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setExpandedRequest(expandedRequest === request.id ? null : request.id)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      {expandedRequest === request.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                    <button
                      onClick={() => handleDeleteRequest(request.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete request"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Request details (collapsible) */}
              {expandedRequest === request.id && (
                <div className="p-4 md:p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Patient Name</p>
                      <p className="font-medium">{request.patientName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Blood Group</p>
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                        <Droplet size={14} />
                        {request.bloodGroup}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Units Required</p>
                      <p className="font-medium">{request.unitsRequired}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Hospital</p>
                      <p className="font-medium">{request.hospitalName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Location</p>
                      <p className="font-medium">{request.area}, {request.city}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Required By</p>
                      <p className="font-medium">{new Date(request.requiredBy).toLocaleString()}</p>
                    </div>
                  </div>

                  {request.notes && (
                    <div>
                      <p className="text-sm text-gray-600">Notes</p>
                      <p className="text-gray-800 mt-1">{request.notes}</p>
                    </div>
                  )}

                  {request.status === 'approved' && request.approvedAt && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-sm font-medium text-green-900">
                        ✓ Approved on {new Date(request.approvedAt).toLocaleString()}
                      </p>
                    </div>
                  )}

                  {request.status === 'rejected' && request.rejectionReason && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-sm font-medium text-red-900">Rejection Reason:</p>
                      <p className="text-sm text-red-800 mt-1">{request.rejectionReason}</p>
                    </div>
                  )}

                  {/* Matched Donors (only for approved requests) */}
                  {request.status === 'approved' && request.matchedDonors && request.matchedDonors.length > 0 && (
                    <div className="border-t pt-4">
                      <h5 className="font-semibold text-gray-900 mb-3">
                        Matched Donors ({request.matchedDonors.length})
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {request.matchedDonors.map((donor) => (
                          <div key={donor.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="font-semibold text-gray-900">{donor.name}</p>
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium mt-1">
                                  <Droplet size={12} />
                                  {donor.bloodGroup}
                                </span>
                              </div>
                            </div>
                            <div className="space-y-1 text-sm">
                              <p className="flex items-center gap-1 text-gray-600">
                                <MapPin size={14} />
                                {donor.area}, {donor.city}
                              </p>
                              <p className="flex items-center gap-1 text-gray-600">
                                <Phone size={14} />
                                <a href={`tel:${donor.phone}`} className="text-blue-600 hover:underline">
                                  {donor.phone}
                                </a>
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {request.status === 'approved' && (!request.matchedDonors || request.matchedDonors.length === 0) && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-sm text-yellow-800">
                        Your request has been approved, but no donors were found at the time of approval. 
                        Please contact the admin for assistance.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
