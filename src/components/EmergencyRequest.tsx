import React, { useState } from 'react';
import { AlertCircle, Phone, MapPin, Droplet, Clock, User, Building } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { BloodGroup, MatchedDonor } from '../types';

export function EmergencyRequest() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [matchedDonors, setMatchedDonors] = useState<MatchedDonor[]>([]);
  const [requestCreated, setRequestCreated] = useState(false);

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
  const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad'];

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate phone number
      if (!formData.contactPhone.match(/^\d{10}$/)) {
        throw new Error('Contact phone must be 10 digits');
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6e4ea9c3/requests/create`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
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

      const data = await response.json();
      setMatchedDonors(data.matchedDonors);
      setRequestCreated(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (requestCreated) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Success Message */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-green-100 rounded-full">
              <AlertCircle className="text-green-600" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-green-900">Request Created Successfully!</h2>
              <p className="text-green-700 mt-1">
                We found {matchedDonors.length} compatible donor{matchedDonors.length !== 1 ? 's' : ''} in your area
              </p>
            </div>
          </div>
        </div>

        {/* Matched Donors */}
        {matchedDonors.length > 0 ? (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <User className="text-red-600" size={20} />
              Compatible Donors in {formData.city}
            </h3>
            <div className="space-y-4">
              {matchedDonors.map((donor, index) => (
                <div key={donor.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg">{donor.name}</h4>
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Droplet size={16} className="text-red-600" />
                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                            {donor.bloodGroup}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin size={16} />
                          {donor.area}, {donor.city}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone size={16} />
                          <a href={`tel:${donor.phone}`} className="text-blue-600 hover:underline">
                            {donor.phone}
                          </a>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                        Match #{index + 1}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <a
                      href={`tel:${donor.phone}`}
                      className="inline-block px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <Phone className="inline mr-2" size={16} />
                      Call Donor
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-yellow-900 mb-2">No Compatible Donors Found</h3>
            <p className="text-yellow-800">
              Unfortunately, we couldn't find any available compatible donors in your area at this time. 
              Please try:
            </p>
            <ul className="mt-3 space-y-2 text-yellow-800">
              <li>• Contacting nearby blood banks directly</li>
              <li>• Expanding your search to nearby cities</li>
              <li>• Checking back in a few hours as donor availability updates</li>
            </ul>
          </div>
        )}

        {/* Next Steps */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">Next Steps</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>✓ Contact the matched donors directly via phone</li>
            <li>✓ Verify donor availability before arranging donation</li>
            <li>✓ Coordinate with the hospital for donation timing</li>
            <li>✓ Ensure all medical screening is completed</li>
          </ul>
        </div>

        <button
          onClick={() => {
            setRequestCreated(false);
            setMatchedDonors([]);
            setFormData({
              patientName: '',
              bloodGroup: 'O+',
              unitsRequired: '1',
              hospitalName: '',
              city: '',
              area: '',
              contactName: '',
              contactPhone: '',
              urgency: 'high',
              requiredBy: '',
              notes: '',
            });
          }}
          className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Create Another Request
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <AlertCircle className="text-red-600" size={28} />
            Emergency Blood Request
          </h2>
          <p className="text-gray-600 mt-2">
            Submit an emergency blood request and get matched with compatible, available donors in your area
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Patient Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <User className="text-red-600" size={20} />
              Patient Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Patient Name *
                </label>
                <input
                  type="text"
                  value={formData.patientName}
                  onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <Droplet size={16} className="text-red-600" />
                  Blood Group Required *
                </label>
                <select
                  value={formData.bloodGroup}
                  onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value as BloodGroup })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                >
                  {bloodGroups.map(bg => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">{compatibilityInfo[formData.bloodGroup]}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Units Required *
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={formData.unitsRequired}
                  onChange={(e) => setFormData({ ...formData, unitsRequired: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Urgency Level *
                </label>
                <select
                  value={formData.urgency}
                  onChange={(e) => setFormData({ ...formData, urgency: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                >
                  <option value="critical">🔴 Critical (Immediate)</option>
                  <option value="high">🟠 High (Within 24 hours)</option>
                  <option value="medium">🟡 Medium (Within 48 hours)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <Clock size={16} />
                  Required By *
                </label>
                <input
                  type="datetime-local"
                  value={formData.requiredBy}
                  onChange={(e) => setFormData({ ...formData, requiredBy: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Hospital Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Building className="text-red-600" size={20} />
              Hospital Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hospital Name *
                </label>
                <input
                  type="text"
                  value={formData.hospitalName}
                  onChange={(e) => setFormData({ ...formData, hospitalName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City *
                </label>
                <select
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                >
                  <option value="">Select City</option>
                  {cities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Area/Locality *
                </label>
                <input
                  type="text"
                  value={formData.area}
                  onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                  placeholder="e.g., Koramangala, Whitefield"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Phone className="text-red-600" size={20} />
              Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Person Name *
                </label>
                <input
                  type="text"
                  value={formData.contactName}
                  onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Phone *
                </label>
                <input
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                  placeholder="10-digit number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Notes (Optional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  placeholder="Any additional information..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-4 border-t">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 text-white py-3 rounded-lg font-medium text-lg hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Finding Compatible Donors...
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
    </div>
  );
}
