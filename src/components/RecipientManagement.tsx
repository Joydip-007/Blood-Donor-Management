import React, { useState } from 'react';
import { Search, Plus, Edit, Trash2, MapPin, Calendar, Droplet } from 'lucide-react';
import { recipients, cities, managers } from '../data/mockData';
import { Recipient } from '../types';

export function RecipientManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedBloodGroup, setSelectedBloodGroup] = useState('All');
  const [recipientList, setRecipientList] = useState<Recipient[]>(recipients);

  const bloodGroups = ['All', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  const filteredRecipients = recipientList.filter(recipient => {
    const matchesSearch = recipient.reci_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         recipient.reci_ID.toString().includes(searchTerm);
    const matchesBloodGroup = selectedBloodGroup === 'All' || recipient.reci_Brgp === selectedBloodGroup;
    return matchesSearch && matchesBloodGroup;
  });

  const getCityName = (cityId: number) => {
    return cities.find(c => c.City_ID === cityId)?.City_name || 'Unknown';
  };

  const getManagerName = (mId: number) => {
    return managers.find(m => m.M_id === mId)?.mName || 'Unknown';
  };

  const getUrgencyLevel = (quantity: number) => {
    if (quantity >= 2) return { label: 'Critical', color: 'bg-red-100 text-red-800' };
    if (quantity >= 1) return { label: 'High', color: 'bg-orange-100 text-orange-800' };
    return { label: 'Normal', color: 'bg-green-100 text-green-800' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Recipient Management</h2>
          <p className="text-gray-600 mt-1">Track blood recipients and their requirements</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Register New Recipient
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by name or recipient ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Blood Group Filter */}
          <select
            value={selectedBloodGroup}
            onChange={(e) => setSelectedBloodGroup(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {bloodGroups.map(bg => (
              <option key={bg} value={bg}>{bg === 'All' ? 'All Blood Groups' : bg}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-gray-600 text-sm">Total Recipients</p>
          <p className="text-2xl font-semibold mt-1">{recipientList.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-gray-600 text-sm">Critical Requests</p>
          <p className="text-2xl font-semibold mt-1 text-red-600">
            {recipientList.filter(r => r.reci_Bqnty >= 2).length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-gray-600 text-sm">Total Blood Needed</p>
          <p className="text-2xl font-semibold mt-1">
            {recipientList.reduce((sum, r) => sum + r.reci_Bqnty, 0).toFixed(1)} L
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-gray-600 text-sm">Search Results</p>
          <p className="text-2xl font-semibold mt-1">{filteredRecipients.length}</p>
        </div>
      </div>

      {/* Recipients Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Recipient ID</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Name</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Blood Group</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Quantity (L)</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Urgency</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Age</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Gender</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">City</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Registration Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Managed By</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredRecipients.map((recipient) => {
                const urgency = getUrgencyLevel(recipient.reci_Bqnty);
                return (
                  <tr key={recipient.reci_ID} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium">{recipient.reci_ID}</td>
                    <td className="px-4 py-3 text-sm">{recipient.reci_name}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium flex items-center gap-1 w-fit">
                        <Droplet size={12} />
                        {recipient.reci_Brgp}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">{recipient.reci_Bqnty}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${urgency.color}`}>
                        {urgency.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{recipient.reci_age}</td>
                    <td className="px-4 py-3 text-sm">{recipient.reci_sex === 'M' ? 'Male' : 'Female'}</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-1 text-gray-600">
                        <MapPin size={14} />
                        {getCityName(recipient.City_ID)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Calendar size={14} />
                        {recipient.reci_reg_date}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{getManagerName(recipient.M_id)}</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <button className="text-blue-600 hover:text-blue-800">
                          <Edit size={18} />
                        </button>
                        <button className="text-red-600 hover:text-red-800">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {filteredRecipients.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <p className="text-gray-500">No recipients found matching your criteria</p>
        </div>
      )}

      {/* Add Recipient Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-4">Register New Recipient</h3>
              <form className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Full Name</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Age</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter age"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Gender</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Select gender</option>
                      <option value="M">Male</option>
                      <option value="F">Female</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Blood Group Required</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Select blood group</option>
                      {bloodGroups.filter(bg => bg !== 'All').map(bg => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Quantity Required (Liters)</label>
                    <input
                      type="number"
                      step="0.1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter quantity"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">City</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Select city</option>
                      {cities.map(city => (
                        <option key={city.City_ID} value={city.City_ID}>{city.City_name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Register Recipient
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
