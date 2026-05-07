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

export default function DedupPreview({
  stats = { total: 0, unique: 0, duplicate: 0 },
  duplicates = [],
  onConfirm,
  onCancel,
}: DedupPreviewProps) {
  const safeStats = {
    total: stats.total ?? 0,
    unique: stats.unique ?? 0,
    duplicate: stats.duplicate ?? 0,
  };
  const safeDuplicates = Array.isArray(duplicates) ? duplicates : [];
  const estimatedCost = (safeStats.unique * 0.005).toFixed(2); // Mock: 0.005 CNY per bookmark

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="总计书签" value={safeStats.total} color="#1f2937" />
        <StatCard label="独立条目" value={safeStats.unique} color="#34D399" />
        <StatCard label="重复项" value={safeStats.duplicate} color="#F59E0B" />
      </div>

      {/* Info Box */}
      <div className="p-4 rounded-xl border border-[#e6edf5] flex items-center justify-between" style={{ backgroundColor: "#fff" }}>
        <div className="flex items-center gap-3">
          <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="#F59E0B" strokeWidth="1.3">
            <circle cx="8" cy="8" r="6"/><path d="M8 4v4M8 10v1"/>
          </svg>
          <div>
            <p className="text-sm font-medium text-[#1f2937]">预估 AI 向量化 & 摘要费用</p>
            <p className="text-xs text-[#98a2b3]">基于深度分析模型计算</p>
          </div>
        </div>
        <p className="text-xl font-bold" style={{ color: "#F59E0B" }}>≈ ¥{estimatedCost}</p>
      </div>

      {/* Duplicate List */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold text-[#98a2b3] uppercase">重复项预览（已自动过滤）</h4>
        <div className="max-h-60 overflow-y-auto border border-[#e6edf5] rounded-xl bg-white custom-scrollbar">
          {safeDuplicates.length > 0 ? (
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-white text-[#98a2b3] border-b border-[#e6edf5]">
                <tr>
                  <th className="px-4 py-3 font-semibold">标题</th>
                  <th className="px-4 py-3 font-semibold">域名</th>
                  <th className="px-4 py-3 font-semibold">来源</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e6edf5]">
                {safeDuplicates.map((item) => (
                  <tr key={item.id} className="hover:bg-[#f3f7fc]">
                    <td className="px-4 py-3 text-[#1f2937] truncate max-w-[200px]">{item.title}</td>
                    <td className="px-4 py-3 text-[#98a2b3] font-mono">{new URL(item.url).hostname}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded bg-[#f3f7fc] text-[10px] text-[#6b7280]">{item.source}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-12 text-center text-[#98a2b3]">未发现重复项</div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4 pt-4">
        <button
          onClick={onCancel}
          className="flex-1 py-3 border border-[#e6edf5] hover:border-[#d1d5db] text-[#6b7280] rounded-xl font-bold transition-all"
        >
          重新上传
        </button>
        <button
          onClick={onConfirm}
          className="flex-[2] py-3 bg-[#2f96d4] hover:bg-[#2580b8] text-white rounded-xl font-bold transition-all shadow-sm active:scale-[0.98]"
        >
          确认导入并开启 AI 处理
        </button>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="p-4 rounded-xl border border-[#e6edf5] text-center" style={{ backgroundColor: "#fff" }}>
      <p className="text-2xl font-bold mb-1" style={{ color }}>{value}</p>
      <p className="text-[10px] text-[#98a2b3] uppercase font-bold tracking-wider">{label}</p>
    </div>
  );
}
