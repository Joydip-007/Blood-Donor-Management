import React, { useState } from 'react';
import { Building2, MapPin, Phone, AlertCircle, CheckCircle } from 'lucide-react';
import { hospitals, hospitalNeeds, cities, managers, bloodSpecimens, diseaseFinders } from '../data/mockData';

export function HospitalInventory() {
  const [selectedHospital, setSelectedHospital] = useState<number | null>(null);
  const [view, setView] = useState<'hospitals' | 'inventory'>('hospitals');

  const getCityName = (cityId: number) => {
    return cities.find(c => c.City_ID === cityId)?.City_name || 'Unknown';
  };

  const getManagerName = (mId: number) => {
    return managers.find(m => m.M_id === mId)?.mName || 'Unknown';
  };

  const getManagerPhone = (mId: number) => {
    return managers.find(m => m.M_id === mId)?.m_phNo || 0;
  };

  const getDiseaseFinderName = (dfindId: number) => {
    return diseaseFinders.find(d => d.dfind_ID === dfindId)?.dfind_name || 'Unknown';
  };

  const getHospitalNeeds = (hospId: number) => {
    return hospitalNeeds.filter(h => h.hosp_ID === hospId);
  };

  const availableSpecimens = bloodSpecimens.filter(s => s.status === 1);
  const unavailableSpecimens = bloodSpecimens.filter(s => s.status === 0);

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const inventorySummary = bloodGroups.map(bg => ({
    bloodGroup: bg,
    available: availableSpecimens.filter(s => s.b_group === bg).length,
    unavailable: unavailableSpecimens.filter(s => s.b_group === bg).length,
    total: bloodSpecimens.filter(s => s.b_group === bg).length,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Hospital & Inventory Management</h2>
          <p className="text-gray-600 mt-1">Manage hospitals and blood specimen inventory</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setView('hospitals')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              view === 'hospitals'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Hospitals
          </button>
          <button
            onClick={() => setView('inventory')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              view === 'inventory'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Blood Inventory
          </button>
        </div>
      </div>

      {/* Hospitals View */}
      {view === 'hospitals' && (
        <>
          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow-md p-4">
              <p className="text-gray-600 text-sm">Total Hospitals</p>
              <p className="text-2xl font-semibold mt-1">{hospitals.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <p className="text-gray-600 text-sm">Total Blood Requests</p>
              <p className="text-2xl font-semibold mt-1">{hospitalNeeds.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <p className="text-gray-600 text-sm">Critical Needs</p>
              <p className="text-2xl font-semibold mt-1 text-red-600">
                {hospitalNeeds.filter(h => h.hosp_needed_qnty > 30).length}
              </p>
            </div>
          </div>

          {/* Hospitals Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hospitals.map((hospital) => {
              const needs = getHospitalNeeds(hospital.hosp_ID);
              const criticalNeeds = needs.filter(n => n.hosp_needed_qnty > 30);
              
              return (
                <div key={hospital.hosp_ID} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-purple-100 rounded-lg">
                        <Building2 className="text-purple-600" size={24} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{hospital.hosp_name}</h3>
                        <p className="text-sm text-gray-600">ID: {hospital.hosp_ID}</p>
                      </div>
                    </div>
                    {criticalNeeds.length > 0 && (
                      <span className="px-2 py-1 bg-red-100 text-red-600 text-xs rounded-full flex items-center gap-1">
                        <AlertCircle size={12} />
                        Critical
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin size={16} />
                      {getCityName(hospital.City_ID)}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone size={16} />
                      {getManagerPhone(hospital.M_id)}
                    </div>
                    <div className="text-sm text-gray-600">
                      Manager: {getManagerName(hospital.M_id)}
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <p className="text-sm font-medium mb-2">Blood Requirements:</p>
                    {needs.length > 0 ? (
                      <div className="space-y-1">
                        {needs.slice(0, 3).map((need, idx) => (
                          <div key={idx} className="flex justify-between items-center text-sm">
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">
                              {need.hosp_needed_Bgrp}
                            </span>
                            <span className={`${need.hosp_needed_qnty > 30 ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                              {need.hosp_needed_qnty} units
                            </span>
                          </div>
                        ))}
                        {needs.length > 3 && (
                          <p className="text-xs text-gray-500 mt-1">+{needs.length - 3} more</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No current requirements</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Inventory View */}
      {view === 'inventory' && (
        <>
          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-md p-4">
              <p className="text-gray-600 text-sm">Total Specimens</p>
              <p className="text-2xl font-semibold mt-1">{bloodSpecimens.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <p className="text-gray-600 text-sm">Available</p>
              <p className="text-2xl font-semibold mt-1 text-green-600">{availableSpecimens.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <p className="text-gray-600 text-sm">Unavailable</p>
              <p className="text-2xl font-semibold mt-1 text-red-600">{unavailableSpecimens.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <p className="text-gray-600 text-sm">Availability Rate</p>
              <p className="text-2xl font-semibold mt-1 text-blue-600">
                {((availableSpecimens.length / bloodSpecimens.length) * 100).toFixed(0)}%
              </p>
            </div>
          </div>

          {/* Inventory Summary */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Inventory by Blood Group</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {inventorySummary.map((item) => (
                <div key={item.bloodGroup} className="border rounded-lg p-4">
                  <div className="text-center">
                    <span className="text-2xl font-bold text-red-600">{item.bloodGroup}</span>
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Available:</span>
                        <span className="font-medium text-green-600">{item.available}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Unavailable:</span>
                        <span className="font-medium text-red-600">{item.unavailable}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm pt-2 border-t">
                        <span className="text-gray-600 font-medium">Total:</span>
                        <span className="font-semibold">{item.total}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Specimen Details Table */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold">Blood Specimen Details</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Specimen No.</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Blood Group</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Disease Finder</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Manager</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {bloodSpecimens.map((specimen) => (
                    <tr key={specimen.specimen_number} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium">{specimen.specimen_number}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                          {specimen.b_group}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {specimen.status === 1 ? (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium flex items-center gap-1 w-fit">
                            <CheckCircle size={12} />
                            Available
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium flex items-center gap-1 w-fit">
                            <AlertCircle size={12} />
                            Unavailable
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {getDiseaseFinderName(specimen.dfind_ID)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {getManagerName(specimen.M_id)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
