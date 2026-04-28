"use client";

import React from "react";

interface GraphControlsProps {
  threshold: number;
  setThreshold: (val: number) => void;
  limit: number;
  setLimit: (val: number) => void;
}

export default function GraphControls({ threshold, setThreshold, limit, setLimit }: GraphControlsProps) {
  return (
    <div className="absolute top-6 right-6 w-64 p-5 rounded-2xl border border-[#2E3347] shadow-2xl space-y-6 animate-in slide-in-from-top-4 duration-500" style={{ backgroundColor: "#1A1D27" }}>
      <h3 className="text-xs font-bold uppercase tracking-wider text-[#9099B5]">图谱设置</h3>
      
      {/* Similarity Threshold */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <label className="text-xs text-[#E8EAF0]">相似度阈值</label>
          <span className="text-[10px] font-mono text-[#4F8EF7]">{threshold.toFixed(2)}</span>
        </div>
        <input 
          type="range" 
          min="0.5" 
          max="1.0" 
          step="0.05" 
          value={threshold}
          onChange={(e) => setThreshold(parseFloat(e.target.value))}
          className="w-full accent-[#4F8EF7] bg-[#2E3347] h-1 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      {/* Node Limit */}
      <div className="space-y-3">
        <label className="text-xs text-[#E8EAF0]">节点显示数量</label>
        <div className="grid grid-cols-4 gap-2">
          {[50, 100, 200, 500].map(val => (
            <button
              key={val}
              onClick={() => setLimit(val)}
              className={`py-1.5 rounded-lg text-[10px] font-bold transition-all border ${
                limit === val 
                  ? "bg-[#4F8EF7] border-[#4F8EF7] text-white" 
                  : "bg-[#0F1117] border-[#2E3347] text-[#9099B5] hover:border-[#3D4460]"
              }`}
            >
              {val}
            </button>
          ))}
        </div>
      </div>

      <div className="pt-2">
        <button className="w-full py-2 bg-[#2A2F45] hover:bg-[#3D4460] text-[#E8EAF0] text-xs font-bold rounded-lg transition-colors">
          🔄 重新布局
        </button>
      </div>
    </div>
  );
}
