import React from 'react';
import { Users, Droplet, Building2, UserCheck, AlertTriangle, Activity } from 'lucide-react';
import { StatCard } from './StatCard';
import { BloodInventoryChart, BloodGroupDistribution } from './Charts';
import { bloodDonors, recipients, hospitals, bloodSpecimens, hospitalNeeds } from '../data/mockData';
import { BloodGroup } from '../types';

export function Dashboard() {
  // Calculate statistics
  const totalDonors = bloodDonors.length;
  const totalRecipients = recipients.length;
  const totalHospitals = hospitals.length;
  const availableSpecimens = bloodSpecimens.filter(s => s.status === 1).length;
  const criticalRequests = hospitalNeeds.filter(h => h.hosp_needed_qnty > 30).length;

  // Blood inventory data
  const bloodGroups: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const inventoryData = bloodGroups.map(bg => {
    const available = bloodSpecimens.filter(s => s.b_group === bg && s.status === 1).length;
    const needed = hospitalNeeds
      .filter(h => h.hosp_needed_Bgrp === bg)
      .reduce((sum, h) => sum + h.hosp_needed_qnty, 0);
    return { bloodGroup: bg, available, needed: Math.floor(needed / 10) };
  });

  // Blood group distribution
  const distributionData = bloodGroups.map(bg => ({
    name: bg,
    value: bloodDonors.filter(d => d.bd_Bgroup === bg).length,
  })).filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Total Blood Donors"
          value={totalDonors}
          icon={Users}
          trend={{ value: '12% from last month', isPositive: true }}
          color="#ef4444"
        />
        <StatCard
          title="Total Recipients"
          value={totalRecipients}
          icon={UserCheck}
          trend={{ value: '8% from last month', isPositive: true }}
          color="#3b82f6"
        />
        <StatCard
          title="Registered Hospitals"
          value={totalHospitals}
          icon={Building2}
          color="#8b5cf6"
        />
        <StatCard
          title="Available Specimens"
          value={availableSpecimens}
          icon={Droplet}
          trend={{ value: '5% from last week', isPositive: false }}
          color="#22c55e"
        />
        <StatCard
          title="Critical Requests"
          value={criticalRequests}
          icon={AlertTriangle}
          color="#f59e0b"
        />
        <StatCard
          title="Active Today"
          value={23}
          icon={Activity}
          trend={{ value: '15% increase', isPositive: true }}
          color="#06b6d4"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BloodInventoryChart data={inventoryData} />
        <BloodGroupDistribution data={distributionData} />
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Donations</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Donor Name</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Blood Group</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Registration Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Age</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {bloodDonors.slice(0, 5).map((donor) => (
                <tr key={donor.bd_ID} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{donor.bd_name}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                      {donor.bd_Bgroup}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{donor.bd_reg_date}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{donor.bd_age}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
