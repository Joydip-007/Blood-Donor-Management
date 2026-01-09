import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { BloodGroup } from '../types';

interface BloodInventoryChartProps {
  data: { bloodGroup: BloodGroup; available: number; needed: number }[];
}

export function BloodInventoryChart({ data }: BloodInventoryChartProps) {
  const COLORS = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6'];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">Blood Inventory Overview</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="bloodGroup" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="available" fill="#22c55e" name="Available Units" />
          <Bar dataKey="needed" fill="#ef4444" name="Needed Units" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface BloodGroupDistributionProps {
  data: { name: string; value: number }[];
}

export function BloodGroupDistribution({ data }: BloodGroupDistributionProps) {
  const COLORS = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6'];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">Donor Blood Group Distribution</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
