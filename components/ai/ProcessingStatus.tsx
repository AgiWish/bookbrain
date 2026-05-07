"use client";

import React from "react";

interface ProcessingStatusProps {
  processed: number;
  total: number;
  isProcessing: boolean;
}

export default function ProcessingStatus({ processed, total, isProcessing }: ProcessingStatusProps) {
  const percentage = total > 0 ? Math.round((processed / total) * 100) : 100;
  const isFinished = processed === total && total > 0;

  return (
    <div className="p-6 rounded-2xl border border-[#e6edf5]" style={{ backgroundColor: "#fff" }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-[#1f2937] flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={isFinished ? "#34D399" : "#8B6CF7"} strokeWidth="1.3" className={isProcessing ? "animate-pulse" : ""}>
            <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41"/>
          </svg>
          AI 处理引擎状态
        </h3>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest ${
          isProcessing ? "bg-[#f3f7fc] text-[#8B6CF7]" : "bg-[#f0fdf4] text-[#34D399]"
        }`}>
          {isProcessing ? "运行中" : "就绪"}
        </span>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-[#98a2b3]">索引进度 ({processed}/{total})</span>
          <span className="text-[#1f2937] font-bold">{percentage}%</span>
        </div>

        <div className="h-2 bg-[#f3f7fc] rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 ease-out ${
              isFinished ? "bg-[#34D399]" : "bg-[#8B6CF7]"
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="p-3 rounded-lg bg-[#f3f7fc] border border-[#e6edf5]">
            <p className="text-[10px] text-[#98a2b3] uppercase mb-1">GPU 负载</p>
            <p className="text-sm font-bold text-[#1f2937]">{isProcessing ? "42%" : "0%"}</p>
          </div>
          <div className="p-3 rounded-lg bg-[#f3f7fc] border border-[#e6edf5]">
            <p className="text-[10px] text-[#98a2b3] uppercase mb-1">内存占用</p>
            <p className="text-sm font-bold text-[#1f2937]">{isProcessing ? "1.4 GB" : "256 MB"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
