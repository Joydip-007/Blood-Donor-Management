import React, { useState, useEffect } from 'react';
import { Search, MapPin, Droplet, Phone, Map as MapIcon, Filter } from 'lucide-react';
import { API_BASE_URL } from '../utils/api';
import { BloodGroup, Donor } from '../types';
import { DonorMap } from './DonorMap';

export function DonorSearch() {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [filters, setFilters] = useState({
    bloodGroup: '' as BloodGroup | '',
    city: '',
    area: '',
    isAvailable: true,
  });

  const bloodGroups: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  const searchDonors = async () => {
    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/donors/search`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(filters),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to search donors');
      }

      const data = await response.json();
      setDonors(data.donors);
    } catch (err) {
      console.error('Search error:', err);
      setDonors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    searchDonors();
  }, []);

  const donorsWithLocation = donors.filter(d => d.latitude && d.longitude);

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 md:gap-6">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold">Donor Map</h2>
          <p className="text-gray-700 mt-1 text-sm md:text-base">Find available blood donors by location and blood group</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
        <h3 className="font-semibold text-base md:text-lg mb-4 md:mb-6 flex items-center gap-2">
          <Filter size={20} className="text-red-600" />
          Search Filters
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <div>
            <label className="block text-sm md:text-base font-semibold text-gray-700 mb-2">
              Blood Group
            </label>
            <select
              value={filters.bloodGroup}
              onChange={(e) => setFilters({ ...filters, bloodGroup: e.target.value as BloodGroup | '' })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-base min-h-[44px]"
            >
              <option value="">All Blood Groups</option>
              {bloodGroups.map(bg => (
                <option key={bg} value={bg}>{bg}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm md:text-base font-semibold text-gray-700 mb-2">
              City
            </label>
            <input
              type="text"
              value={filters.city}
              onChange={(e) => setFilters({ ...filters, city: e.target.value })}
              placeholder="Enter city..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-base min-h-[44px]"
            />
          </div>

          <div>
            <label className="block text-sm md:text-base font-semibold text-gray-700 mb-2">
              Area/Locality
            </label>
            <input
              type="text"
              value={filters.area}
              onChange={(e) => setFilters({ ...filters, area: e.target.value })}
              placeholder="Enter area..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-base min-h-[44px]"
            />
          </div>

          <div>
            <label className="block text-sm md:text-base font-semibold text-gray-700 mb-2">
              Availability
            </label>
            <select
              value={filters.isAvailable ? 'available' : 'all'}
              onChange={(e) => setFilters({ ...filters, isAvailable: e.target.value === 'available' })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-base min-h-[44px]"
            >
              <option value="available">Available Only</option>
              <option value="all">All Donors</option>
            </select>
          </div>
        </div>

        <button
          onClick={searchDonors}
          disabled={loading}
          className="mt-6 w-full md:w-auto px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-300 flex items-center justify-center gap-2 min-h-[44px] font-medium text-base"
        >
          <Search size={18} />
          {loading ? 'Searching...' : 'Search Donors'}
        </button>
      </div>

      {/* Map View */}
      <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
          <div className="mb-4 md:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h3 className="font-semibold text-base md:text-lg flex items-center gap-2">
              <MapIcon size={20} className="text-red-600" />
              Donor Location Map
            </h3>
            <span className="text-sm md:text-base text-gray-700 font-medium">
              {donorsWithLocation.length} donor{donorsWithLocation.length !== 1 ? 's' : ''} with location data
            </span>
          </div>

          {donorsWithLocation.length > 0 ? (
            <div className="space-y-4 md:space-y-6">
              {/* Donor Location Map */}
              <DonorMap donors={donorsWithLocation} />

              {/* Donor Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {donorsWithLocation.map((donor) => (
                  <div key={donor.id} className="border border-gray-200 rounded-lg p-4 md:p-5 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-base md:text-lg">{donor.name}</h4>
                        <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium inline-flex items-center gap-1 mt-2">
                          <Droplet size={12} />
                          {donor.bloodGroup}
                        </span>
                      </div>
                      {donor.isAvailable && (
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          Available
                        </span>
                      )}
                    </div>
                    <div className="space-y-2 text-sm md:text-base text-gray-700">
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="flex-shrink-0" />
                        <span>{donor.area}, {donor.city}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapIcon size={14} className="flex-shrink-0" />
                        <span className="text-xs">
                          {donor.latitude !== null && donor.latitude !== undefined ? Number(donor.latitude).toFixed(4) : 'N/A'}, 
                          {donor.longitude !== null && donor.longitude !== undefined ? Number(donor.longitude).toFixed(4) : 'N/A'}
                        </span>
                      </div>
                      {donor.isAvailable && (
                        <a
                          href={`tel:${donor.phone}`}
                          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium min-h-[44px] pt-2"
                        >
                          <Phone size={14} />
                          {donor.phone}
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 md:p-8 text-center">
              <MapIcon size={48} className="text-yellow-500 mx-auto mb-4" />
              <p className="text-yellow-900 font-medium mb-2 text-base md:text-lg">No Location Data Available</p>
              <p className="text-sm md:text-base text-yellow-800">
                None of the donors in the current search results have location coordinates.
                Try different search criteria or encourage donors to add their location.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 md:p-6">
        <h4 className="font-semibold text-blue-900 mb-3 text-base md:text-lg">Search & Filtering Features</h4>
        <ul className="text-sm md:text-base text-blue-800 space-y-2">
          <li>✓ Filter by blood group, city, area, and availability</li>
          <li>✓ Optimized search using indexed location fields</li>
          <li>✓ Real-time availability updates based on 90-day donation rule</li>
          <li>✓ Privacy-protected contact details (shown only for available donors)</li>
          <li>✓ Location-based map view for quick donor identification</li>
        </ul>
      </div>
    </div>
  );
}
