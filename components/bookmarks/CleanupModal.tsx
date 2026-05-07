"use client";

import React, { useState, useCallback } from "react";

interface BrokenBookmark {
  id: string;
  title: string;
  url: string;
  category?: string;
  subfolder?: string;
  error: string;
}

interface CleanupModalProps {
  onClose: () => void;
  onDeleted: (count: number) => void;
}

type Phase = "scanning" | "review" | "confirm" | "deleting" | "done";

export default function CleanupModal({ onClose, onDeleted }: CleanupModalProps) {
  const [phase, setPhase] = useState<Phase>("scanning");
  const [broken, setBroken] = useState<BrokenBookmark[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState({ total: 0, broken: 0 });
  const [deletedCount, setDeletedCount] = useState(0);
  const [error, setError] = useState("");

  // Start scanning on mount
  React.useEffect(() => {
    // This effect runs once on mount to check URLs.
    fetch("/api/bookmarks/cleanup")
      .then((r) => r.json())
      .then((data) => {
        setStats({ total: data.total, broken: data.broken });
        setBroken(data.bookmarks ?? []);
        setSelected(new Set((data.bookmarks ?? []).map((b: BrokenBookmark) => b.id)));
        setPhase("review");
      })
      .catch((e) => {
        setError(e.message);
        setPhase("review");
      });
  }, []);

  const handleToggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selected.size === broken.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(broken.map((b) => b.id)));
    }
  };

  const handleDelete = useCallback(async () => {
    setPhase("deleting");
    try {
      const res = await fetch("/api/bookmarks/cleanup", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected) }),
      });
      const data = await res.json();
      setDeletedCount(data.deleted);
      setPhase("done");
      onDeleted(data.deleted);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "删除失败");
      setPhase("review");
    }
  }, [selected, onDeleted]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />

      <div
        className="relative w-full max-w-[640px] max-h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in duration-200"
        style={{ backgroundColor: "#fff", border: "1px solid #e6edf5" }}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#e6edf5] flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-semibold text-[#1f2937]">清理失效链接</h2>
            <p className="text-[11px] text-[#98a2b3] mt-0.5">扫描并清除无法访问的书签</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#f3f7fc] rounded-lg text-[#98a2b3]">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M1 1l12 12M13 1L1 13"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Scanning phase */}
          {phase === "scanning" && (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <div className="w-10 h-10 border-2 border-[#2f96d4]/30 border-t-[#2f96d4] rounded-full animate-spin" />
              <p className="text-[13px] text-[#4b5563]">正在扫描域名可用性...</p>
              <p className="text-[11px] text-[#98a2b3]">通过 DNS 检查域名是否可解析，通常几秒内完成</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-[12px]">
              {error}
            </div>
          )}

          {/* Review phase */}
          {phase === "review" && !error && (
            <>
              {/* Stats bar */}
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] text-[#98a2b3]">共扫描</span>
                  <span className="text-[14px] font-bold text-[#1f2937]">{stats.total}</span>
                  <span className="text-[12px] text-[#98a2b3]">条书签</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-400" />
                  <span className="text-[14px] font-bold text-red-500">{stats.broken}</span>
                  <span className="text-[12px] text-[#98a2b3]">条失效</span>
                </div>
              </div>

              {broken.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-[#f0fdf4] flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="#34D399" strokeWidth="1.5">
                      <path d="M4 8l3 3 5-6"/>
                    </svg>
                  </div>
                  <p className="text-[13px] text-[#4b5563] font-medium">所有链接正常！</p>
                  <p className="text-[11px] text-[#98a2b3]">没有发现失效的书签</p>
                </div>
              ) : (
                <>
                  {/* Select all */}
                  <div className="flex items-center gap-2 mb-3 pb-3 border-b border-[#e6edf5]">
                    <button
                      onClick={handleSelectAll}
                      className="flex items-center gap-2 text-[12px] text-[#2f96d4] hover:underline"
                    >
                      <span className={`w-4 h-4 rounded border flex items-center justify-center ${
                        selected.size === broken.length
                          ? "bg-[#2f96d4] border-[#2f96d4]"
                          : "border-[#d1d5db]"
                      }`}>
                        {selected.size === broken.length && (
                          <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="2.5">
                            <path d="M4 8l3 3 5-6"/>
                          </svg>
                        )}
                      </span>
                      {selected.size === broken.length ? "取消全选" : "全选"}
                    </button>
                    <span className="text-[11px] text-[#98a2b3]">
                      已选 {selected.size} / {broken.length}
                    </span>
                  </div>

                  {/* Broken list */}
                  <div className="space-y-1">
                    {broken.map((b) => {
                      const isSelected = selected.has(b.id);
                      return (
                        <div
                          key={b.id}
                          onClick={() => handleToggle(b.id)}
                          className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                            isSelected ? "bg-[#fef2f2]" : "hover:bg-[#f3f7fc]"
                          }`}
                        >
                          {/* Checkbox */}
                          <div className={`w-4 h-4 mt-0.5 rounded border flex-shrink-0 flex items-center justify-center ${
                            isSelected
                              ? "bg-red-500 border-red-500"
                              : "border-[#d1d5db]"
                          }`}>
                            {isSelected && (
                              <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="2.5">
                                <path d="M4 8l3 3 5-6"/>
                              </svg>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className={`text-[13px] truncate ${isSelected ? "text-red-700" : "text-[#1f2937]"}`}>
                              {b.title}
                            </p>
                            <p className="text-[11px] text-[#98a2b3] truncate">{b.url}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {b.category && (
                                <span className="text-[10px] text-[#c0c7d5]">{b.category} / {b.subfolder}</span>
                              )}
                            </div>
                          </div>

                          {/* Error badge */}
                          <span className="flex-shrink-0 text-[10px] px-2 py-0.5 rounded-full bg-red-50 text-red-400 font-medium">
                            {b.error}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </>
          )}

          {/* Confirm phase */}
          {phase === "confirm" && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="#EF4444" strokeWidth="1.5">
                  <path d="M2 4h12M5 4V3a1 1 0 011-1h4a1 1 0 011 1v1M6 7v5M10 7v5M3 4l1 9a1 1 0 001 1h6a1 1 0 001-1l1-9"/>
                </svg>
              </div>
              <h3 className="text-[14px] font-semibold text-[#1f2937]">确认删除</h3>
              <p className="text-[12px] text-[#98a2b3]">
                将删除 <span className="text-red-500 font-bold">{selected.size}</span> 条失效书签，此操作不可撤销
              </p>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setPhase("review")}
                  className="px-5 py-2 rounded-lg border border-[#e6edf5] text-[13px] text-[#6b7280] hover:bg-[#f3f7fc] transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleDelete}
                  className="px-5 py-2 rounded-lg bg-red-500 text-white text-[13px] font-medium hover:bg-red-600 transition-colors"
                >
                  确认删除
                </button>
              </div>
            </div>
          )}

          {/* Deleting phase */}
          {phase === "deleting" && (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <div className="w-10 h-10 border-2 border-red-200 border-t-red-500 rounded-full animate-spin" />
              <p className="text-[13px] text-[#4b5563]">正在删除...</p>
            </div>
          )}

          {/* Done phase */}
          {phase === "done" && (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <div className="w-14 h-14 rounded-full bg-[#f0fdf4] flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 16 16" fill="none" stroke="#34D399" strokeWidth="2">
                  <path d="M4 8l3 3 5-6"/>
                </svg>
              </div>
              <h3 className="text-[14px] font-semibold text-[#1f2937]">清理完成</h3>
              <p className="text-[12px] text-[#98a2b3]">
                已删除 <span className="text-[#34D399] font-bold">{deletedCount}</span> 条失效书签
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {(phase === "review" && broken.length > 0) && (
          <div className="px-6 py-4 border-t border-[#e6edf5] flex justify-end">
            <button
              onClick={() => setPhase("confirm")}
              disabled={selected.size === 0}
              className={`px-5 py-2 rounded-lg text-[13px] font-medium transition-all ${
                selected.size > 0
                  ? "bg-red-500 text-white hover:bg-red-600"
                  : "bg-[#f3f7fc] text-[#c0c7d5] cursor-not-allowed"
              }`}
            >
              删除选中的 {selected.size} 条
            </button>
          </div>
        )}

        {(phase === "done" || (phase === "review" && broken.length === 0)) && (
          <div className="px-6 py-4 border-t border-[#e6edf5] flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-lg bg-[#2f96d4] text-white text-[13px] font-medium hover:bg-[#2580b8] transition-colors"
            >
              完成
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
