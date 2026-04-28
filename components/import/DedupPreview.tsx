"use client";

import React from "react";

interface DedupPreviewProps {
  stats: {
    total: number;
    unique: number;
    duplicate: number;
  };
  duplicates: { id: string; title: string; url: string; source: string }[];
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DedupPreview({ stats, duplicates, onConfirm, onCancel }: DedupPreviewProps) {
  const estimatedCost = (stats.unique * 0.005).toFixed(2); // Mock: 0.005 CNY per bookmark

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="总计书签" value={stats.total} color="#E8EAF0" />
        <StatCard label="独立条目" value={stats.unique} color="#34D399" />
        <StatCard label="重复项" value={stats.duplicate} color="#F59E0B" />
      </div>

      {/* Info Box */}
      <div className="p-4 rounded-xl border border-[#2E3347] flex items-center justify-between" style={{ backgroundColor: "#1A1D27" }}>
        <div className="flex items-center gap-3">
          <span className="text-xl">💰</span>
          <div>
            <p className="text-sm font-medium text-white">预估 AI 向量化 & 摘要费用</p>
            <p className="text-xs text-[#9099B5]">基于深度分析模型计算</p>
          </div>
        </div>
        <p className="text-xl font-bold" style={{ color: "#F59E0B" }}>≈ ¥{estimatedCost}</p>
      </div>

      {/* Duplicate List */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold text-[#9099B5] uppercase">重复项预览（已自动过滤）</h4>
        <div className="max-h-60 overflow-y-auto border border-[#2E3347] rounded-xl bg-[#0F1117] custom-scrollbar">
          {duplicates.length > 0 ? (
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-[#1A1D27] text-[#9099B5] border-b border-[#2E3347]">
                <tr>
                  <th className="px-4 py-3 font-semibold">标题</th>
                  <th className="px-4 py-3 font-semibold">域名</th>
                  <th className="px-4 py-3 font-semibold">来源</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2E3347]">
                {duplicates.map((item) => (
                  <tr key={item.id} className="hover:bg-[#1A1D27]/50">
                    <td className="px-4 py-3 text-white truncate max-w-[200px]">{item.title}</td>
                    <td className="px-4 py-3 text-[#9099B5] font-mono">{new URL(item.url).hostname}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded bg-[#22263A] text-[10px]">{item.source}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-12 text-center text-[#9099B5]">未发现重复项</div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4 pt-4">
        <button
          onClick={onCancel}
          className="flex-1 py-3 border border-[#2E3347] hover:border-[#3D4460] text-[#9099B5] rounded-xl font-bold transition-all"
        >
          重新上传
        </button>
        <button
          onClick={onConfirm}
          className="flex-[2] py-3 bg-[#4F8EF7] hover:bg-[#3b7de3] text-white rounded-xl font-bold transition-all shadow-lg active:scale-[0.98]"
        >
          确认导入并开启 AI 处理
        </button>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="p-4 rounded-xl border border-[#2E3347] text-center" style={{ backgroundColor: "#1A1D27" }}>
      <p className="text-2xl font-bold mb-1" style={{ color }}>{value}</p>
      <p className="text-[10px] text-[#9099B5] uppercase font-bold tracking-wider">{label}</p>
    </div>
  );
}
