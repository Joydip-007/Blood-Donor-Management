import React, { useState, useEffect } from 'react';
import { MapPin, Map as MapIcon, Filter } from 'lucide-react';
import { API_BASE_URL } from '../utils/api';
import { BloodGroup, Donor } from '../types';
import { DonorMap } from './DonorMap';
// Note: debug utility removed as viewMode is now always 'map' and doesn't need logging

export function DonorSearch() {
  const [allDonors, setAllDonors] = useState<Donor[]>([]); // Store all donors
  const [loading, setLoading] = useState(false);
  
  const [filters, setFilters] = useState({
    bloodGroup: '' as BloodGroup | '',
    city: '',
    area: '',
  });

  const bloodGroups: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  // Load all available donors on initial load
  const loadAllDonors = async () => {
    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/donors/search`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            bloodGroup: '',
            city: '',
            area: '',
            isAvailable: true, // Load only available donors by default
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load donors');
      }

      const data = await response.json();
      setAllDonors(data.donors);
    } catch (err) {
      console.error('Load donors error:', err);
      setAllDonors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllDonors();
  }, []);

  // Client-side filtering of donors
  const filteredDonors = allDonors.filter(donor => {
    // Pre-convert filter values to lowercase for performance
    const cityFilter = filters.city.toLowerCase();
    const areaFilter = filters.area.toLowerCase();
    
    // Filter by blood group
    if (filters.bloodGroup && donor.bloodGroup !== filters.bloodGroup) {
      return false;
    }
    
    // Filter by city (case-insensitive partial match)
    if (cityFilter && !donor.city.toLowerCase().includes(cityFilter)) {
      return false;
    }
    
    // Filter by area (case-insensitive partial match)
    if (areaFilter && !donor.area.toLowerCase().includes(areaFilter)) {
      return false;
    }
    
    return true;
  });

  const donorsWithLocation = filteredDonors.filter(d => d.latitude && d.longitude);

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 md:gap-6">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold">Donor Map</h2>
          <p className="text-gray-700 mt-1 text-sm md:text-base">Browse all available blood donors - use filters to narrow your search</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
        <h3 className="font-semibold text-base md:text-lg mb-4 md:mb-6 flex items-center gap-2">
          <Filter size={20} className="text-red-600" />
          Filter Donors
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
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
              placeholder="Filter by city..."
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
              placeholder="Filter by area..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-base min-h-[44px]"
            />
          </div>
        </div>
        
        {/* Show filter status */}
        <div className="mt-4 text-sm text-gray-600">
          {loading ? (
            <p className="flex items-center gap-2">
              <span className="animate-spin">⏳</span> Loading donors...
            </p>
          ) : (
            <p>
              Showing <span className="font-semibold text-red-600">{filteredDonors.length}</span> of{' '}
              <span className="font-semibold">{allDonors.length}</span> available donors
              {(filters.bloodGroup || filters.city || filters.area) && ' (filtered)'}
            </p>
          )}
        </div>
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
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 md:p-8 text-center">
            <MapIcon size={48} className="text-yellow-500 mx-auto mb-4" />
            <p className="text-yellow-900 font-medium mb-2 text-base md:text-lg">No Location Data Available</p>
            <p className="text-sm md:text-base text-yellow-800">
              {filteredDonors.length > 0 
                ? 'The donors matching your filters do not have location coordinates. Try adjusting your filters.'
                : 'No donors found matching your current filters. Try adjusting your search criteria.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
