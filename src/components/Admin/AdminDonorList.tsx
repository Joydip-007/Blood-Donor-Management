import React, { useState, useEffect } from 'react';
import { Users, Search, Droplet, MapPin, Phone, Mail, ArrowLeft, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE_URL } from '../../utils/api';
import { Donor } from '../../types';

interface Props {
  onBack: () => void;
}

export function AdminDonorList({ onBack }: Props) {
  const { token } = useAuth();
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredDonors = donors.filter(donor =>
    donor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    donor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    donor.phone.includes(searchTerm) ||
    donor.bloodGroup.includes(searchTerm.toUpperCase()) ||
    donor.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    donor.area.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="text-red-600" size={28} />
            All Registered Donors
          </h2>
          <p className="text-gray-600 mt-1">Complete list of donors in the system</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
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

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-gray-600 text-sm">Total Donors</p>
            <p className="text-2xl font-semibold mt-1">{donors.length}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-gray-600 text-sm">Available</p>
            <p className="text-2xl font-semibold mt-1 text-green-600">
              {donors.filter(d => d.isAvailable).length}
            </p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <p className="text-gray-600 text-sm">Unavailable</p>
            <p className="text-2xl font-semibold mt-1 text-yellow-600">
              {donors.filter(d => !d.isAvailable).length}
            </p>
          </div>
          <div className="bg-red-50 rounded-lg p-4">
            <p className="text-gray-600 text-sm">Search Results</p>
            <p className="text-2xl font-semibold mt-1">{filteredDonors.length}</p>
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
              {searchTerm ? 'No donors found matching your search' : 'No donors registered yet'}
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
