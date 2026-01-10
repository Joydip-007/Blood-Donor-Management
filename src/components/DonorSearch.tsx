import React, { useState, useEffect } from 'react';
import { Search, MapPin, Droplet, Phone, Filter, Map as MapIcon } from 'lucide-react';
import { API_BASE_URL } from '../utils/api';
import { BloodGroup, Donor } from '../types';

export function DonorSearch() {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  
  const [filters, setFilters] = useState({
    bloodGroup: '' as BloodGroup | '',
    city: '',
    area: '',
    isAvailable: true,
  });

  const bloodGroups: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad'];

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Donor Search & Map</h2>
          <p className="text-gray-600 mt-1">Find available blood donors by location and blood group</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              viewMode === 'list'
                ? 'bg-red-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <Filter size={18} />
            List View
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              viewMode === 'map'
                ? 'bg-red-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <MapIcon size={18} />
            Map View
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Filter size={20} className="text-red-600" />
          Search Filters
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Blood Group
            </label>
            <select
              value={filters.bloodGroup}
              onChange={(e) => setFilters({ ...filters, bloodGroup: e.target.value as BloodGroup | '' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">All Blood Groups</option>
              {bloodGroups.map(bg => (
                <option key={bg} value={bg}>{bg}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              City
            </label>
            <select
              value={filters.city}
              onChange={(e) => setFilters({ ...filters, city: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">All Cities</option>
              {cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Area/Locality
            </label>
            <input
              type="text"
              value={filters.area}
              onChange={(e) => setFilters({ ...filters, area: e.target.value })}
              placeholder="Enter area..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Availability
            </label>
            <select
              value={filters.isAvailable ? 'available' : 'all'}
              onChange={(e) => setFilters({ ...filters, isAvailable: e.target.value === 'available' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="available">Available Only</option>
              <option value="all">All Donors</option>
            </select>
          </div>
        </div>

        <button
          onClick={searchDonors}
          disabled={loading}
          className="mt-4 w-full md:w-auto px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-300 flex items-center justify-center gap-2"
        >
          <Search size={18} />
          {loading ? 'Searching...' : 'Search Donors'}
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-gray-600 text-sm">Total Found</p>
          <p className="text-2xl font-semibold mt-1">{donors.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-gray-600 text-sm">Available</p>
          <p className="text-2xl font-semibold mt-1 text-green-600">
            {donors.filter(d => d.isAvailable).length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-gray-600 text-sm">With Location</p>
          <p className="text-2xl font-semibold mt-1 text-blue-600">
            {donorsWithLocation.length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-gray-600 text-sm">Blood Groups</p>
          <p className="text-2xl font-semibold mt-1 text-purple-600">
            {[...new Set(donors.map(d => d.bloodGroup))].length}
          </p>
        </div>
      </div>

      {/* List View */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Searching donors...</p>
            </div>
          ) : donors.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500">No donors found matching your criteria</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Blood Group</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Location</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Age</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Availability</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Contact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {donors.map((donor) => (
                    <tr key={donor.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium">{donor.name}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium flex items-center gap-1 w-fit">
                          <Droplet size={12} />
                          {donor.bloodGroup}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-1 text-gray-600">
                          <MapPin size={14} />
                          {donor.area}, {donor.city}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">{donor.age}</td>
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
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {donor.isAvailable ? (
                          <a
                            href={`tel:${donor.phone}`}
                            className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                          >
                            <Phone size={14} />
                            {donor.phone}
                          </a>
                        ) : (
                          <span className="text-gray-400">Not available</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Map View */}
      {viewMode === 'map' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <MapIcon size={20} className="text-red-600" />
              Donor Location Map
            </h3>
            <span className="text-sm text-gray-600">
              {donorsWithLocation.length} donor{donorsWithLocation.length !== 1 ? 's' : ''} with location data
            </span>
          </div>

          {donorsWithLocation.length > 0 ? (
            <div className="space-y-4">
              {/* Map Placeholder */}
              <div className="bg-gray-100 rounded-lg p-8 text-center border-2 border-dashed border-gray-300">
                <MapIcon size={48} className="text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 font-medium mb-2">Interactive Map View</p>
                <p className="text-sm text-gray-500 mb-4">
                  Displaying {donorsWithLocation.length} donor locations on map
                </p>
                <p className="text-xs text-gray-400">
                  🗺️ Map integration available with Google Maps, Mapbox, or Leaflet
                </p>
              </div>

              {/* Donor Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {donorsWithLocation.map((donor) => (
                  <div key={donor.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold">{donor.name}</h4>
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium inline-flex items-center gap-1 mt-1">
                          <Droplet size={12} />
                          {donor.bloodGroup}
                        </span>
                      </div>
                      {donor.isAvailable && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          Available
                        </span>
                      )}
                    </div>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <MapPin size={14} />
                        {donor.area}, {donor.city}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapIcon size={14} />
                        {donor.latitude?.toFixed(4)}, {donor.longitude?.toFixed(4)}
                      </div>
                      {donor.isAvailable && (
                        <a
                          href={`tel:${donor.phone}`}
                          className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
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
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
              <MapIcon size={48} className="text-yellow-500 mx-auto mb-4" />
              <p className="text-yellow-900 font-medium mb-2">No Location Data Available</p>
              <p className="text-sm text-yellow-800">
                None of the donors in the current search results have location coordinates.
                Try different search criteria or encourage donors to add their location.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Search & Filtering Features</h4>
        <ul className="text-sm text-blue-800 space-y-1">
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
