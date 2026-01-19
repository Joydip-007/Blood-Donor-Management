import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  color: string;
}

export function StatCard({ title, value, icon: Icon, trend, color }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 md:p-8 border-l-4 min-h-[140px] flex items-center" style={{ borderLeftColor: color }}>
      <div className="flex items-center justify-between w-full">
        <div className="flex-1">
          <p className="text-gray-700 text-sm md:text-base font-medium">{title}</p>
          <p className="text-3xl md:text-4xl font-semibold mt-2">{value}</p>
          {trend && (
            <p className={`text-sm md:text-base mt-2 font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.isPositive ? '↑' : '↓'} {trend.value}
            </p>
          )}
        </div>
        <div className="ml-4 md:ml-6 p-3 md:p-4 rounded-full" style={{ backgroundColor: `${color}20` }}>
          <Icon size={32} className="md:w-10 md:h-10" style={{ color }} />
        </div>
      </div>
    </div>
  );
}
