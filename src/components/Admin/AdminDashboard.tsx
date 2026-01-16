import React from 'react';
import { Users, UserPlus, BarChart, Shield } from 'lucide-react';

interface Props {
  onNavigate: (view: 'add' | 'list') => void;
}

export function AdminDashboard({ onNavigate }: Props) {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-red-100 rounded-full">
            <Shield className="text-red-600" size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage blood donors and system settings</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          {/* Add Donor Card */}
          <button
            onClick={() => onNavigate('add')}
            className="bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-lg p-6 text-left transition-all hover:shadow-lg border-2 border-blue-200"
          >
            <div className="flex items-center gap-4">
              <div className="p-4 bg-blue-600 rounded-full">
                <UserPlus className="text-white" size={32} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Add New Donor</h2>
                <p className="text-gray-600 mt-1">Manually register a donor to the system</p>
              </div>
            </div>
          </button>

          {/* View All Donors Card */}
          <button
            onClick={() => onNavigate('list')}
            className="bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 rounded-lg p-6 text-left transition-all hover:shadow-lg border-2 border-green-200"
          >
            <div className="flex items-center gap-4">
              <div className="p-4 bg-green-600 rounded-full">
                <Users className="text-white" size={32} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">View All Donors</h2>
                <p className="text-gray-600 mt-1">Browse and manage all registered donors</p>
              </div>
            </div>
          </button>
        </div>

        <div className="mt-8 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
            <Shield size={20} />
            Admin Privileges
          </h3>
          <ul className="text-sm text-yellow-800 space-y-1">
            <li>✓ Add donors manually without OTP verification</li>
            <li>✓ View complete list of all registered donors</li>
            <li>✓ Access detailed donor information and statistics</li>
            <li>✓ Manage donor availability and contact details</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
