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
    <div className="p-6 rounded-2xl border border-[#2E3347]" style={{ backgroundColor: "#1A1D27" }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <span className={isProcessing ? "animate-pulse" : ""}>{isFinished ? "✅" : "✨"}</span>
          AI 处理引擎状态
        </h3>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest ${
          isProcessing ? "bg-[#8B6CF7]/20 text-[#8B6CF7]" : "bg-[#34D399]/20 text-[#34D399]"
        }`}>
          {isProcessing ? "运行中" : "就绪"}
        </span>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-[#9099B5]">索引进度 ({processed}/{total})</span>
          <span className="text-white font-bold">{percentage}%</span>
        </div>
        
        <div className="h-2 bg-[#2A2F45] rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-1000 ease-out ${
              isFinished ? "bg-[#34D399]" : "bg-[#8B6CF7]"
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="p-3 rounded-lg bg-[#0F1117] border border-[#2E3347]">
            <p className="text-[10px] text-[#9099B5] uppercase mb-1">GPU 负载</p>
            <p className="text-sm font-bold text-white">{isProcessing ? "42%" : "0%"}</p>
          </div>
          <div className="p-3 rounded-lg bg-[#0F1117] border border-[#2E3347]">
            <p className="text-[10px] text-[#9099B5] uppercase mb-1">内存占用</p>
            <p className="text-sm font-bold text-white">{isProcessing ? "1.4 GB" : "256 MB"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
