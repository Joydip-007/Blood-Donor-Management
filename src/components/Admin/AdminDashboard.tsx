import React, { useState, useEffect } from 'react';
import { Users, UserPlus, BarChart, Shield, Settings, RefreshCcw, Download, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE_URL } from '../../utils/api';

interface Props {
  onNavigate: (view: 'add' | 'list' | 'stats' | 'settings' | 'emergency-requests') => void;
}

export function AdminDashboard({ onNavigate }: Props) {
  const { token } = useAuth();
  const [stats, setStats] = useState({
    total: 0,
    available: 0,
    unavailable: 0,
    inactive: 0,
    pendingRequests: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Fetch donor stats
      const donorResponse = await fetch(`${API_BASE_URL}/admin/donors/all`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (donorResponse.ok) {
        const donorData = await donorResponse.json();
        const donors = donorData.donors || [];
        
        // Fetch emergency requests stats
        const requestsResponse = await fetch(`${API_BASE_URL}/admin/requests/pending`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        let pendingCount = 0;
        if (requestsResponse.ok) {
          const requestsData = await requestsResponse.json();
          pendingCount = requestsData.count || 0;
        }

        setStats({
          total: donors.filter((d: any) => !d.isDeleted).length,
          available: donors.filter((d: any) => !d.isDeleted && d.isAvailable).length,
          unavailable: donors.filter((d: any) => !d.isDeleted && !d.isAvailable).length,
          inactive: donors.filter((d: any) => d.isDeleted).length,
          pendingRequests: pendingCount
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportAll = () => {
    // TODO: Implement export functionality
    alert('Export functionality will be implemented in a future update');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 rounded-full">
              <Shield className="text-red-600" size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">Comprehensive donor management and system controls</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchStats}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <RefreshCcw size={18} />
              Refresh Data
            </button>
            <button
              onClick={handleExportAll}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              <Download size={18} />
              Export All
            </button>
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <p className="text-gray-600 text-sm font-medium">Total Donors</p>
            <p className="text-3xl font-bold text-blue-600 mt-1">
              {loading ? '...' : stats.total}
            </p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <p className="text-gray-600 text-sm font-medium">Available</p>
            <p className="text-3xl font-bold text-green-600 mt-1">
              {loading ? '...' : stats.available}
            </p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <p className="text-gray-600 text-sm font-medium">Unavailable</p>
            <p className="text-3xl font-bold text-yellow-600 mt-1">
              {loading ? '...' : stats.unavailable}
            </p>
          </div>
          <div className="bg-red-50 rounded-lg p-4 border border-red-200">
            <p className="text-gray-600 text-sm font-medium">Inactive</p>
            <p className="text-3xl font-bold text-red-600 mt-1">
              {loading ? '...' : stats.inactive}
            </p>
          </div>
        </div>

        {/* 5 Main Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mt-8">
          {/* Emergency Requests - NEW */}
          <button
            onClick={() => onNavigate('emergency-requests')}
            className="bg-gradient-to-br from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 rounded-lg p-6 text-left transition-all hover:shadow-lg border-2 border-red-200 relative"
          >
            <div className="flex items-center gap-4">
              <div className="p-4 bg-red-600 rounded-full">
                <AlertCircle className="text-white" size={28} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Emergency Requests</h2>
                <p className="text-gray-600 text-sm mt-1">Review and approve requests</p>
              </div>
            </div>
            {stats.pendingRequests > 0 && (
              <div className="absolute top-4 right-4 px-3 py-1 bg-red-600 text-white rounded-full text-sm font-bold">
                {stats.pendingRequests}
              </div>
            )}
          </button>

          {/* Add New Donor */}
          <button
            onClick={() => onNavigate('add')}
            className="bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-lg p-6 text-left transition-all hover:shadow-lg border-2 border-blue-200"
          >
            <div className="flex items-center gap-4">
              <div className="p-4 bg-blue-600 rounded-full">
                <UserPlus className="text-white" size={28} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Add New Donor</h2>
                <p className="text-gray-600 text-sm mt-1">Register donors manually</p>
              </div>
            </div>
          </button>

          {/* Manage All Donors */}
          <button
            onClick={() => onNavigate('list')}
            className="bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 rounded-lg p-6 text-left transition-all hover:shadow-lg border-2 border-green-200"
          >
            <div className="flex items-center gap-4">
              <div className="p-4 bg-green-600 rounded-full">
                <Users className="text-white" size={28} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Manage All Donors</h2>
                <p className="text-gray-600 text-sm mt-1">View and manage profiles</p>
              </div>
            </div>
          </button>

          {/* Statistics & Reports */}
          <button
            onClick={() => onNavigate('stats')}
            className="bg-gradient-to-br from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 rounded-lg p-6 text-left transition-all hover:shadow-lg border-2 border-orange-200"
          >
            <div className="flex items-center gap-4">
              <div className="p-4 bg-orange-600 rounded-full">
                <BarChart size={28} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Statistics & Reports</h2>
                <p className="text-gray-600 text-sm mt-1">View detailed analytics</p>
              </div>
            </div>
          </button>

          {/* System Settings */}
          <button
            onClick={() => onNavigate('settings')}
            className="bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 rounded-lg p-6 text-left transition-all hover:shadow-lg border-2 border-gray-200"
          >
            <div className="flex items-center gap-4">
              <div className="p-4 bg-gray-600 rounded-full">
                <Settings className="text-white" size={28} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">System Settings</h2>
                <p className="text-gray-600 text-sm mt-1">Configure preferences</p>
              </div>
            </div>
          </button>
        </div>

        {/* Admin Footer */}
        <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
          <p className="text-sm text-gray-600">
            As an admin, you have full access to manage donors, review requests, and configure system settings.
          </p>
        </div>
      </div>
    </div>
  );
}
