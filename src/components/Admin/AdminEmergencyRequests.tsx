import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, XCircle, Clock, Droplet, MapPin, Phone, Building, User, Filter, Search, Calendar } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE_URL } from '../../utils/api';
import { BloodGroup } from '../../types';

interface EmergencyRequest {
  id: string;
  patientName: string;
  bloodGroup: BloodGroup;
  unitsRequired: number;
  hospitalName: string;
  city: string;
  area: string;
  contactPhone: string;
  urgency: 'critical' | 'high' | 'medium';
  requiredBy: string;
  notes: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  createdAt: string;
  approvedAt?: string;
  rejectionReason?: string;
}

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

interface Props {
  onBack: () => void;
}

export function AdminEmergencyRequests({ onBack }: Props) {
  const { token } = useAuth();
  const [requests, setRequests] = useState<EmergencyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<EmergencyRequest | null>(null);
  const [matchedDonors, setMatchedDonors] = useState<MatchedDonor[]>([]);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);

  // Filters
  const [filters, setFilters] = useState({
    status: 'pending' as 'all' | 'pending' | 'approved' | 'rejected' | 'completed',
    urgency: '' as '' | 'critical' | 'high' | 'medium',
    bloodGroup: '' as BloodGroup | '',
    city: '',
    searchTerm: ''
  });

  const bloodGroups: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  useEffect(() => {
    fetchRequests();
  }, [filters.status]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.status !== 'all') {
        params.append('status', filters.status);
      }
      if (filters.urgency) {
        params.append('urgency', filters.urgency);
      }
      if (filters.bloodGroup) {
        params.append('bloodGroup', filters.bloodGroup);
      }
      if (filters.city) {
        params.append('city', filters.city);
      }

      const response = await fetch(
        `${API_BASE_URL}/admin/requests/all?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setRequests(data.requests || []);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    setProcessingRequest(requestId);
    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/requests/${requestId}/approve`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ adminId: 1 }), // TODO: Get actual admin ID from auth context
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMatchedDonors(data.matchedDonors || []);
        
        // Find and update the request in state
        const request = requests.find(r => r.id === requestId);
        if (request) {
          setSelectedRequest(request);
        }
        
        // Refresh requests list
        await fetchRequests();
        
        alert(`Request approved! Found ${data.matchedCount} compatible donors.`);
      } else {
        const errorData = await response.json();
        alert(`Failed to approve request: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error approving request:', error);
      alert('Failed to approve request');
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;

    setProcessingRequest(selectedRequest.id);
    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/requests/${selectedRequest.id}/reject`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            reason: rejectionReason,
            adminId: 1 // TODO: Get actual admin ID from auth context
          }),
        }
      );

      if (response.ok) {
        setShowRejectModal(false);
        setRejectionReason('');
        setSelectedRequest(null);
        await fetchRequests();
        alert('Request rejected successfully');
      } else {
        const errorData = await response.json();
        alert(`Failed to reject request: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Failed to reject request');
    } finally {
      setProcessingRequest(null);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredRequests = requests.filter(request => {
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      return (
        request.patientName.toLowerCase().includes(searchLower) ||
        request.hospitalName.toLowerCase().includes(searchLower) ||
        request.contactPhone.includes(searchLower)
      );
    }
    return true;
  });

  // Statistics
  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
    critical: requests.filter(r => r.urgency === 'critical' && r.status === 'pending').length,
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
        <button
          onClick={onBack}
          className="mb-4 flex items-center gap-2 text-gray-700 hover:text-gray-900 font-medium"
        >
          ← Back to Dashboard
        </button>
        
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-red-100 rounded-full">
            <AlertCircle className="text-red-600" size={32} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Emergency Requests</h1>
            <p className="text-gray-600 mt-1">Review and manage emergency blood requests</p>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <p className="text-gray-600 text-sm font-medium">Total Requests</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{stats.total}</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <p className="text-gray-600 text-sm font-medium">Pending</p>
            <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.pending}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <p className="text-gray-600 text-sm font-medium">Approved</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{stats.approved}</p>
          </div>
          <div className="bg-red-50 rounded-lg p-4 border border-red-200">
            <p className="text-gray-600 text-sm font-medium">Rejected</p>
            <p className="text-2xl font-bold text-red-600 mt-1">{stats.rejected}</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <p className="text-gray-600 text-sm font-medium">Critical Pending</p>
            <p className="text-2xl font-bold text-purple-600 mt-1">{stats.critical}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <Filter size={20} className="text-red-600" />
          Filters & Search
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value as any })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Urgency</label>
            <select
              value={filters.urgency}
              onChange={(e) => setFilters({ ...filters, urgency: e.target.value as any })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">All Urgency</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Blood Group</label>
            <select
              value={filters.bloodGroup}
              onChange={(e) => setFilters({ ...filters, bloodGroup: e.target.value as BloodGroup | '' })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">All Blood Groups</option>
              {bloodGroups.map(bg => (
                <option key={bg} value={bg}>{bg}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
            <input
              type="text"
              value={filters.city}
              onChange={(e) => setFilters({ ...filters, city: e.target.value })}
              placeholder="Enter city..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Search</label>
            <input
              type="text"
              value={filters.searchTerm}
              onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
              placeholder="Patient, hospital, phone..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>

        <button
          onClick={fetchRequests}
          className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
        >
          <Search size={18} />
          Apply Filters
        </button>
      </div>

      {/* Requests List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="font-semibold text-lg mb-4">
          Requests ({filteredRequests.length})
        </h3>

        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
            <p className="mt-4 text-gray-700">Loading requests...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="p-12 text-center">
            <AlertCircle className="text-gray-400 mx-auto mb-4" size={48} />
            <p className="text-gray-600">No requests found matching your criteria</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request) => (
              <div 
                key={request.id} 
                className={`border rounded-lg p-6 hover:shadow-md transition-shadow ${
                  request.urgency === 'critical' ? 'border-red-300 bg-red-50' : 'border-gray-200'
                }`}
              >
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                  <div className="flex-1 space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-lg flex items-center gap-2">
                          <User size={18} />
                          {request.patientName}
                        </h4>
                        <p className="text-sm text-gray-600">Request ID: #{request.id}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                          {request.status.toUpperCase()}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getUrgencyColor(request.urgency)}`}>
                          {request.urgency === 'critical' && '🔴 '}
                          {request.urgency === 'high' && '🟠 '}
                          {request.urgency === 'medium' && '🟡 '}
                          {request.urgency.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Droplet size={16} className="text-red-600" />
                        <span className="font-medium">Blood Group:</span>
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
                          {request.bloodGroup}
                        </span>
                        <span className="text-gray-600">({request.unitsRequired} units)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building size={16} className="text-gray-600" />
                        <span className="font-medium">Hospital:</span>
                        <span>{request.hospitalName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-gray-600" />
                        <span className="font-medium">Location:</span>
                        <span>{request.area}, {request.city}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone size={16} className="text-gray-600" />
                        <span className="font-medium">Contact:</span>
                        <a href={`tel:${request.contactPhone}`} className="text-blue-600 hover:underline">
                          {request.contactPhone}
                        </a>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-gray-600" />
                        <span className="font-medium">Required By:</span>
                        <span>{request.requiredBy ? new Date(request.requiredBy).toLocaleString() : 'ASAP'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-gray-600" />
                        <span className="font-medium">Created:</span>
                        <span>{new Date(request.createdAt).toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Notes */}
                    {request.notes && (
                      <div className="mt-3 p-3 bg-gray-50 rounded border border-gray-200">
                        <p className="text-sm font-medium text-gray-700">Notes:</p>
                        <p className="text-sm text-gray-600 mt-1">{request.notes}</p>
                      </div>
                    )}

                    {/* Rejection Reason */}
                    {request.status === 'rejected' && request.rejectionReason && (
                      <div className="mt-3 p-3 bg-red-50 rounded border border-red-200">
                        <p className="text-sm font-medium text-red-700">Rejection Reason:</p>
                        <p className="text-sm text-red-600 mt-1">{request.rejectionReason}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {request.status === 'pending' && (
                    <div className="flex flex-col gap-2 md:min-w-[150px]">
                      <button
                        onClick={() => handleApprove(request.id)}
                        disabled={processingRequest === request.id}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:bg-gray-300"
                      >
                        <CheckCircle size={18} />
                        {processingRequest === request.id ? 'Processing...' : 'Approve'}
                      </button>
                      <button
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowRejectModal(true);
                        }}
                        disabled={processingRequest === request.id}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:bg-gray-300"
                      >
                        <XCircle size={18} />
                        Reject
                      </button>
                    </div>
                  )}

                  {request.status === 'approved' && request.approvedAt && (
                    <div className="text-sm text-gray-600">
                      <p className="font-medium text-green-600">Approved</p>
                      <p className="mt-1">{new Date(request.approvedAt).toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <XCircle className="text-red-600" size={24} />
              Reject Request
            </h3>
            <p className="text-gray-700 mb-4">
              Please provide a reason for rejecting this emergency request:
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleReject}
                disabled={!rejectionReason.trim() || processingRequest !== null}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-300"
              >
                {processingRequest ? 'Processing...' : 'Confirm Rejection'}
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                  setSelectedRequest(null);
                }}
                disabled={processingRequest !== null}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Matched Donors Modal */}
      {matchedDonors.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CheckCircle className="text-green-600" size={24} />
              Matched Donors ({matchedDonors.length})
            </h3>
            <div className="space-y-3">
              {matchedDonors.map((donor) => (
                <div key={donor.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold text-base">{donor.name}</h4>
                      <div className="mt-2 space-y-1 text-sm text-gray-700">
                        <div className="flex items-center gap-2">
                          <Droplet size={14} className="text-red-600" />
                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
                            {donor.bloodGroup}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin size={14} />
                          {donor.area}, {donor.city}
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone size={14} />
                          <a href={`tel:${donor.phone}`} className="text-blue-600 hover:underline">
                            {donor.phone}
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setMatchedDonors([])}
              className="mt-4 w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
