"use client";

import React from "react";

interface StatsCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: { value: number; isUp: boolean };
}

export default function StatsCard({ label, value, icon, trend }: StatsCardProps) {
  return (
    <div
      className="p-6 rounded-2xl border border-[#e6edf5] flex flex-col gap-2 transition-all hover:border-[#d1d5db]"
      style={{ backgroundColor: "#fff" }}
    >
      <div className="flex items-center justify-between">
        <span>{icon}</span>
        {trend && (
          <span className={`text-[10px] font-bold ${trend.isUp ? 'text-[#34D399]' : 'text-red-400'}`}>
            {trend.isUp ? '↑' : '↓'} {trend.value}%
          </span>
        )}
      </div>
      <div>
        <p className="text-3xl font-bold text-[#1f2937] tracking-tight">{value}</p>
        <p className="text-xs text-[#98a2b3] font-medium uppercase tracking-wider mt-1">{label}</p>
      </div>
    </div>
  );
}
