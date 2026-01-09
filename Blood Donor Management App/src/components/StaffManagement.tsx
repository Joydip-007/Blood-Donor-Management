import React from 'react';
import { Users, Phone, UserCheck, ClipboardCheck } from 'lucide-react';
import { recordingStaff, diseaseFinders, managers, bloodDonors, recipients } from '../data/mockData';

export function StaffManagement() {
  const getStaffDonorCount = (recoId: number) => {
    return bloodDonors.filter(d => d.reco_ID === recoId).length;
  };

  const getStaffRecipientCount = (recoId: number) => {
    return recipients.filter(r => r.reco_ID === recoId).length;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold">Staff Management</h2>
        <p className="text-gray-600 mt-1">Manage recording staff, managers, and disease finders</p>
      </div>

      {/* Blood Bank Managers */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-2 mb-4">
          <UserCheck className="text-purple-600" size={24} />
          <h3 className="text-lg font-semibold">Blood Bank Managers</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {managers.map((manager) => (
            <div key={manager.M_id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold">{manager.mName}</h4>
                  <p className="text-sm text-gray-600">ID: {manager.M_id}</p>
                </div>
                <div className="p-2 bg-purple-100 rounded-full">
                  <UserCheck className="text-purple-600" size={18} />
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone size={14} />
                {manager.m_phNo}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recording Staff */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="text-blue-600" size={24} />
          <h3 className="text-lg font-semibold">Recording Staff</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Staff ID</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Name</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Phone Number</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Donors Registered</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Recipients Registered</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Total Records</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recordingStaff.map((staff) => {
                const donorCount = getStaffDonorCount(staff.reco_ID);
                const recipientCount = getStaffRecipientCount(staff.reco_ID);
                const total = donorCount + recipientCount;
                
                return (
                  <tr key={staff.reco_ID} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium">{staff.reco_ID}</td>
                    <td className="px-4 py-3 text-sm">{staff.reco_Name}</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Phone size={14} />
                        {staff.reco_phNo}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                        {donorCount} donors
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        {recipientCount} recipients
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold">{total}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Disease Finders */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-2 mb-4">
          <ClipboardCheck className="text-green-600" size={24} />
          <h3 className="text-lg font-semibold">Disease Finders</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {diseaseFinders.map((finder) => (
            <div key={finder.dfind_ID} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold">{finder.dfind_name}</h4>
                  <p className="text-sm text-gray-600">ID: {finder.dfind_ID}</p>
                </div>
                <div className="p-2 bg-green-100 rounded-full">
                  <ClipboardCheck className="text-green-600" size={18} />
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone size={14} />
                {finder.dfind_PhNo}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Statistics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Total Managers</p>
              <p className="text-3xl font-semibold mt-2">{managers.length}</p>
            </div>
            <UserCheck size={40} className="text-purple-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Recording Staff</p>
              <p className="text-3xl font-semibold mt-2">{recordingStaff.length}</p>
            </div>
            <Users size={40} className="text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Disease Finders</p>
              <p className="text-3xl font-semibold mt-2">{diseaseFinders.length}</p>
            </div>
            <ClipboardCheck size={40} className="text-green-200" />
          </div>
        </div>
      </div>
    </div>
  );
}
