"use client";

import React from "react";

interface StatsCardProps {
  label: string;
  value: string | number;
  icon?: string;
  trend?: { value: number; isUp: boolean };
}

export default function StatsCard({ label, value, icon, trend }: StatsCardProps) {
  return (
    <div 
      className="p-6 rounded-2xl border border-[#2E3347] flex flex-col gap-2 transition-all hover:border-[#3D4460]"
      style={{ backgroundColor: "#1A1D27" }}
    >
      <div className="flex items-center justify-between">
        <span className="text-2xl">{icon}</span>
        {trend && (
          <span className={`text-[10px] font-bold ${trend.isUp ? 'text-[#34D399]' : 'text-red-400'}`}>
            {trend.isUp ? '↑' : '↓'} {trend.value}%
          </span>
        )}
      </div>
      <div>
        <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
        <p className="text-xs text-[#9099B5] font-medium uppercase tracking-wider mt-1">{label}</p>
      </div>
    </div>
  );
}
