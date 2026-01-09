import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, MapPin, Droplet, Activity, PieChart } from 'lucide-react';
import { BarChart, Bar, PieChart as RechartsPie, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { Statistics as StatsType, BloodGroup } from '../types';

export function Statistics() {
  const [stats, setStats] = useState<StatsType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    setLoading(true);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6e4ea9c3/statistics`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch statistics');
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Statistics error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading statistics...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>Failed to load statistics</p>
      </div>
    );
  }

  // Prepare chart data
  const bloodGroupData = Object.entries(stats.byBloodGroup).map(([group, count]) => ({
    bloodGroup: group,
    count,
  }));

  const cityData = Object.entries(stats.byCity)
    .map(([city, count]) => ({
      city,
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // Top 10 cities

  const availabilityData = [
    { name: 'Available', value: stats.availableDonors, color: '#22c55e' },
    { name: 'Unavailable', value: stats.unavailableDonors, color: '#ef4444' },
  ];

  const statusData = [
    { name: 'Active', value: stats.activeDonors, color: '#3b82f6' },
    { name: 'Inactive', value: stats.inactiveDonors, color: '#9ca3af' },
  ];

  const COLORS = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">Statistical Analysis & Reports</h2>
          <p className="text-gray-600 mt-1">Comprehensive donor statistics and analytics</p>
        </div>
        <button
          onClick={fetchStatistics}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
        >
          <Activity size={18} />
          Refresh Data
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Donors</p>
              <p className="text-3xl font-bold mt-2">{stats.totalDonors}</p>
              <p className="text-blue-100 text-xs mt-2">
                {stats.activeDonors} active
              </p>
            </div>
            <Users size={40} className="text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Available Donors</p>
              <p className="text-3xl font-bold mt-2">{stats.availableDonors}</p>
              <p className="text-green-100 text-xs mt-2">
                {((stats.availableDonors / stats.totalDonors) * 100).toFixed(1)}% of total
              </p>
            </div>
            <Droplet size={40} className="text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm">Unavailable Donors</p>
              <p className="text-3xl font-bold mt-2">{stats.unavailableDonors}</p>
              <p className="text-red-100 text-xs mt-2">
                Within 90-day period
              </p>
            </div>
            <Activity size={40} className="text-red-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Inactive Profiles</p>
              <p className="text-3xl font-bold mt-2">{stats.inactiveDonors}</p>
              <p className="text-purple-100 text-xs mt-2">
                Soft deleted
              </p>
            </div>
            <TrendingUp size={40} className="text-purple-200" />
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Blood Group Distribution */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Droplet className="text-red-600" size={20} />
            Blood Group-wise Donor Count
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={bloodGroupData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="bloodGroup" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#ef4444" name="Donors" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* City Distribution */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MapPin className="text-red-600" size={20} />
            City-wise Donor Distribution (Top 10)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={cityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="city" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#3b82f6" name="Donors" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Availability Status */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Activity className="text-red-600" size={20} />
            Donor Availability Status
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPie>
              <Pie
                data={availabilityData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {availabilityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </RechartsPie>
          </ResponsiveContainer>
        </div>

        {/* Active vs Inactive */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="text-red-600" size={20} />
            Active vs Inactive Donors
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPie>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </RechartsPie>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Blood Group Table */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Blood Group Statistics</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Blood Group</th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Count</th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Percentage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {bloodGroupData
                  .sort((a, b) => b.count - a.count)
                  .map((item, index) => (
                    <tr key={item.bloodGroup} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm">
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                          {item.bloodGroup}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm text-right font-medium">{item.count}</td>
                      <td className="px-4 py-2 text-sm text-right text-gray-600">
                        {((item.count / stats.totalDonors) * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* City Table */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">City-wise Statistics</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">City</th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Count</th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Percentage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {cityData.map((item, index) => (
                  <tr key={item.city} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-gray-400" />
                        {item.city}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-sm text-right font-medium">{item.count}</td>
                    <td className="px-4 py-2 text-sm text-right text-gray-600">
                      {((item.count / stats.totalDonors) * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <PieChart size={20} />
            Database Health
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-blue-800">Active Donor Rate:</span>
              <span className="font-medium text-blue-900">
                {((stats.activeDonors / stats.totalDonors) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-800">Availability Rate:</span>
              <span className="font-medium text-blue-900">
                {((stats.availableDonors / stats.activeDonors) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-800">Retention Rate:</span>
              <span className="font-medium text-blue-900">
                {((stats.activeDonors / stats.totalDonors) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h4 className="font-semibold text-green-900 mb-3">Data Quality</h4>
          <ul className="space-y-2 text-sm text-green-800">
            <li>✓ Normalized database (3NF)</li>
            <li>✓ Duplicate prevention active</li>
            <li>✓ Data validation enforced</li>
            <li>✓ Soft delete implemented</li>
          </ul>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
          <h4 className="font-semibold text-purple-900 mb-3">System Features</h4>
          <ul className="space-y-2 text-sm text-purple-800">
            <li>✓ 90-day availability logic</li>
            <li>✓ Blood compatibility rules</li>
            <li>✓ Location-based search</li>
            <li>✓ Privacy protection</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
