import React, { useState } from 'react';
import { AlertCircle, Phone, MapPin, Droplet, Clock, User, Building } from 'lucide-react';
import { API_BASE_URL } from '../utils/api';
import { BloodGroup, MatchedDonor } from '../types';
import { validateBangladeshPhone, cleanPhoneNumber, getPhoneErrorMessage } from '../utils/phoneUtils';

export function EmergencyRequest() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [matchedDonors, setMatchedDonors] = useState<MatchedDonor[]>([]);
  const [requestCreated, setRequestCreated] = useState(false);
  const [contactPhoneError, setContactPhoneError] = useState<string | null>(null);

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
      <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
        {/* Success Message */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 md:p-8">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-3 bg-green-100 rounded-full flex-shrink-0">
              <AlertCircle className="text-green-600" size={24} />
            </div>
            <div className="flex-1">
              <h2 className="text-lg md:text-xl font-semibold text-green-900">Request Created Successfully!</h2>
              <p className="text-green-700 mt-1 text-sm md:text-base">
                We found {matchedDonors.length} compatible donor{matchedDonors.length !== 1 ? 's' : ''} in your area
              </p>
            </div>
          </div>
        </div>

        {/* Matched Donors */}
        {matchedDonors.length > 0 ? (
          <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
            <h3 className="text-base md:text-lg font-semibold mb-4 md:mb-6 flex items-center gap-2">
              <User className="text-red-600" size={20} />
              Compatible Donors in {formData.city}
            </h3>
            <div className="space-y-4 md:space-y-6">
              {matchedDonors.map((donor, index) => (
                <div key={donor.id} className="border border-gray-200 rounded-lg p-4 md:p-6 hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                    <div className="flex-1">
                      <h4 className="font-semibold text-base md:text-lg mb-3">{donor.name}</h4>
                      <div className="space-y-2 md:space-y-3">
                        <div className="flex items-center gap-2 text-sm md:text-base text-gray-700">
                          <Droplet size={16} className="text-red-600" />
                          <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs md:text-sm font-medium">
                            {donor.bloodGroup}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm md:text-base text-gray-700">
                          <MapPin size={16} />
                          {donor.area}, {donor.city}
                        </div>
                        <div className="flex items-center gap-2 text-sm md:text-base text-gray-700">
                          <Phone size={16} />
                          <a href={`tel:${donor.phone}`} className="text-blue-600 hover:underline font-medium">
                            {donor.phone}
                          </a>
                        </div>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-xs md:text-sm rounded-full font-medium">
                        Match #{index + 1}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <a
                      href={`tel:${donor.phone}`}
                      className="inline-block px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors min-h-[44px] font-medium text-sm md:text-base"
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
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 md:p-8">
            <h3 className="text-base md:text-lg font-semibold text-yellow-900 mb-2">No Compatible Donors Found</h3>
            <p className="text-yellow-800 text-sm md:text-base mb-3">
              Unfortunately, we couldn't find any available compatible donors in your area at this time. 
              Please try:
            </p>
            <ul className="space-y-2 text-yellow-800 text-sm md:text-base">
              <li>• Contacting nearby blood banks directly</li>
              <li>• Expanding your search to nearby cities</li>
              <li>• Checking back in a few hours as donor availability updates</li>
            </ul>
          </div>
        )}

        {/* Next Steps */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 md:p-8">
          <h3 className="font-semibold text-blue-900 mb-3 text-base md:text-lg">Next Steps</h3>
          <ul className="space-y-2 text-sm md:text-base text-blue-800">
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
          className="w-full px-6 py-3 md:py-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium text-base md:text-lg min-h-[48px]"
        >
          Create Another Request
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
        <div className="mb-6 md:mb-8">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <AlertCircle className="text-red-600" size={28} />
            Emergency Blood Request
          </h2>
          <p className="text-gray-700 mt-2 text-sm md:text-base">
            Submit an emergency blood request and get matched with compatible, available donors in your area
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle size={20} />
            <span className="text-sm md:text-base">{error}</span>
          </div>
        )}

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

              <div>
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
                  Contact Phone * <span className="text-xs font-normal text-gray-500">(Bangladesh)</span>
                </label>
                <input
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 11);
                    setFormData({ ...formData, contactPhone: value });
                    
                    // Validate on change
                    if (value) {
                      setContactPhoneError(getPhoneErrorMessage(value));
                    } else {
                      setContactPhoneError(null);
                    }
                  }}
                  onBlur={(e) => {
                    const cleaned = cleanPhoneNumber(e.target.value);
                    if (cleaned) {
                      setFormData({ ...formData, contactPhone: cleaned });
                    }
                  }}
                  placeholder="01XXX-XXXXXX"
                  pattern="^01[3-9]\d{8}$"
                  maxLength={11}
                  minLength={11}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 text-base min-h-[44px] ${
                    contactPhoneError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-red-500'
                  }`}
                  required
                />
                {contactPhoneError && (
                  <p className="text-xs text-red-600 mt-1">{contactPhoneError}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Enter 11-digit Bangladesh mobile number starting with 01
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
