"use client";

import React, { useState, useEffect, useCallback } from "react";

interface BookmarkDetailProps {
  id: string | null;
  onClose: () => void;
  onTogglePin?: (id: string) => void;
  onDelete?: (id: string) => Promise<void> | void;
  onUpdated?: () => void;
}

interface RelatedBookmark {
  id: string;
  title: string;
  url: string;
}

interface BookmarkExtended {
  id: string;
  title: string;
  url: string;
  summary?: string;
  tags: string[];
  category?: string;
  subfolder?: string;
  pinned?: boolean;
}

export default function BookmarkDetail({ id, onClose, onTogglePin, onDelete, onUpdated }: BookmarkDetailProps) {
  const [bookmark, setBookmark] = useState<BookmarkExtended | null>(null);
  const [related, setRelated] = useState<RelatedBookmark[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [editingUrl, setEditingUrl] = useState(false);
  const [urlDraft, setUrlDraft] = useState("");
  const [savingUrl, setSavingUrl] = useState(false);
  const [urlError, setUrlError] = useState("");

  const fetchDetail = useCallback(async (targetId: string) => {
    try {
      const res = await fetch(`/api/bookmarks/${targetId}`);
      const data = await res.json();
      setBookmark(data);

      const relatedRes = await fetch(`/api/bookmarks/${targetId}/related`);
      const relatedData = await relatedRes.json();
      setRelated(relatedData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(true);
      // Reset all per-bookmark UI state when switching detail targets, so
      // residual flags from a previous delete/edit don't bleed across.
      setDeleteConfirm(false);
      setDeleteError("");
      setDeleting(false);
      setEditingUrl(false);
      setUrlError("");
      setSavingUrl(false);
      fetchDetail(id);
    }
  }, [id, fetchDetail]);

  const handleDelete = async () => {
    if (!bookmark || deleting) return;

    if (!deleteConfirm) {
      setDeleteConfirm(true);
      setDeleteError("");
      return;
    }

    setDeleting(true);
    setDeleteError("");
    try {
      const res = await fetch(`/api/bookmarks/${bookmark.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `删除失败（${res.status}）`);
      }
      // Reset local state BEFORE handing off to the parent. The parent
      // typically closes the panel by clearing the `id` query param, but the
      // component stays mounted, so without this the next bookmark you open
      // would still show "删除中…".
      setDeleting(false);
      setDeleteConfirm(false);
      void Promise.resolve(onDelete?.(bookmark.id)).catch((error) => {
        console.error("Failed to refresh after deleting bookmark", error);
      });
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "删除失败");
      setDeleting(false);
    }
  };

  const handleStartEditUrl = () => {
    if (!bookmark) return;
    setUrlDraft(bookmark.url);
    setUrlError("");
    setEditingUrl(true);
  };

  const handleCancelEditUrl = () => {
    setEditingUrl(false);
    setUrlError("");
    setUrlDraft("");
  };

  const handleSaveUrl = async () => {
    if (!bookmark || savingUrl) return;
    const next = urlDraft.trim();
    if (!next) {
      setUrlError("请输入新的网址");
      return;
    }
    if (next === bookmark.url) {
      setEditingUrl(false);
      return;
    }
    setSavingUrl(true);
    setUrlError("");
    try {
      const res = await fetch(`/api/bookmarks/${bookmark.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `更新失败（${res.status}）`);
      }
      const updated = data.bookmark as BookmarkExtended | undefined;
      if (updated) {
        setBookmark((prev) => (prev ? { ...prev, ...updated } : updated));
      }
      setEditingUrl(false);
      onUpdated?.();
    } catch (error) {
      setUrlError(error instanceof Error ? error.message : "更新失败");
    } finally {
      setSavingUrl(false);
    }
  };

  if (!id) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/20 transition-opacity"
        onClick={onClose}
      />

      <div
        className="relative w-full max-w-[480px] h-full shadow-2xl flex flex-col animate-slide-in-right"
        style={{ backgroundColor: "#fff", borderLeft: "1px solid #e6edf5" }}
      >
        <div className="p-4 border-b border-[#e6edf5] flex items-center justify-between">
          <h2 className="text-[12px] font-bold uppercase tracking-wider text-[#98a2b3]">书签详情</h2>
          <button onClick={onClose} className="p-2 hover:bg-[#f3f7fc] rounded-lg transition-colors text-[#98a2b3]">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M1 1l12 12M13 1L1 13"/>
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {loading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-8 bg-[#f3f7fc] rounded w-3/4" />
              <div className="h-4 bg-[#f3f7fc] rounded w-1/2" />
              <div className="h-24 bg-[#f3f7fc] rounded" />
            </div>
          ) : bookmark ? (
            <>
              <section className="space-y-3">
                <div className="flex items-start gap-2">
                  <h1 className="text-lg font-bold text-[#1f2937] leading-tight flex-1">{bookmark.title}</h1>
                  {onTogglePin && (
                    <button
                      onClick={() => onTogglePin(bookmark.id)}
                      className="p-1.5 rounded-lg hover:bg-[#f3f7fc] transition-colors flex-shrink-0 mt-0.5"
                      title={bookmark.pinned ? "取消收藏" : "收藏"}
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 16 16"
                        fill={bookmark.pinned ? "#F59E0B" : "none"}
                        stroke={bookmark.pinned ? "#F59E0B" : "#c0c7d5"}
                        strokeWidth="1.3"
                      >
                        <path d="M8 1l2.2 4.5L15 6.3l-3.5 3.4.8 4.9L8 12.4l-4.3 2.2.8-4.9L1 6.3l4.8-.8z"/>
                      </svg>
                    </button>
                  )}
                </div>
                {editingUrl ? (
                  <div className="space-y-2">
                    <input
                      type="url"
                      value={urlDraft}
                      onChange={(e) => setUrlDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveUrl();
                        if (e.key === "Escape") handleCancelEditUrl();
                      }}
                      autoFocus
                      placeholder="https://example.com"
                      className="w-full px-3 py-2 rounded-md text-sm border border-[#d0d7de] focus:border-[#2f96d4] focus:outline-none text-[#1f2937]"
                    />
                    {urlError && (
                      <p className="text-[12px] text-red-500">{urlError}</p>
                    )}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSaveUrl}
                        disabled={savingUrl}
                        className="px-3 py-1.5 rounded-md text-[12px] font-bold text-white bg-[#2f96d4] hover:bg-[#1f7eb8] disabled:opacity-60 transition-colors"
                      >
                        {savingUrl ? "保存中..." : "保存"}
                      </button>
                      <button
                        onClick={handleCancelEditUrl}
                        disabled={savingUrl}
                        className="px-3 py-1.5 rounded-md text-[12px] font-bold text-[#6b7280] hover:bg-[#f3f7fc] transition-colors"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <a
                      href={bookmark.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-[#2f96d4] hover:underline break-all flex-1"
                    >
                      {bookmark.url}
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" className="flex-shrink-0">
                        <path d="M3 9L9 3M9 3H4M9 3v5"/>
                      </svg>
                    </a>
                    <button
                      onClick={handleStartEditUrl}
                      title="网站换域名了？修改网址"
                      className="p-1 rounded hover:bg-[#f3f7fc] transition-colors flex-shrink-0 text-[#98a2b3] hover:text-[#2f96d4]"
                    >
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M11 2l3 3-9 9H2v-3l9-9z"/>
                      </svg>
                    </button>
                  </div>
                )}
                {(bookmark.category || bookmark.subfolder) && (
                  <div className="flex items-center gap-1.5 text-xs text-[#98a2b3]">
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
                      <path d="M2 3h4l2-2h6a1 1 0 011 1v10a1 1 0 01-1 1H2a1 1 0 01-1-1V4a1 1 0 011-1z"/>
                    </svg>
                    <span>{bookmark.category}{bookmark.subfolder ? ` / ${bookmark.subfolder}` : ''}</span>
                  </div>
                )}
              </section>

              {bookmark.summary && (
                <section className="space-y-2">
                  <h3 className="text-[11px] font-bold text-[#2f96d4] uppercase tracking-wide">AI 总结</h3>
                  <div className="p-3 rounded-lg text-sm text-[#4b5563] leading-relaxed" style={{ backgroundColor: "#f3f7fc" }}>
                    {bookmark.summary}
                  </div>
                </section>
              )}

              <section className="space-y-2">
                <h3 className="text-[11px] font-bold text-[#98a2b3] uppercase tracking-wide">标签</h3>
                <div className="flex flex-wrap gap-1.5">
                  {bookmark.tags?.map((tag: string) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 rounded-full text-[11px] font-medium text-[#6b7280]"
                      style={{ backgroundColor: "#f3f7fc" }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </section>

              {related.length > 0 && (
                <section className="space-y-3 pt-4 border-t border-[#e6edf5]">
                  <h3 className="text-[11px] font-bold text-[#98a2b3] uppercase tracking-wide">相似推荐</h3>
                  <div className="space-y-2">
                    {related.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-lg hover:bg-[#f3f7fc] transition-colors cursor-pointer"
                      >
                        <p className="text-[13px] font-medium text-[#1f2937] truncate">{item.title}</p>
                        <p className="text-[10px] text-[#98a2b3] mt-0.5">{new URL(item.url).hostname}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {onDelete && (
                <section className="space-y-3 pt-4 border-t border-[#e6edf5]">
                  <div className="p-4 rounded-lg border border-red-200/70 bg-red-50/70">
                    <h3 className="text-[13px] font-bold text-red-500">删除书签</h3>
                    <p className="text-[12px] text-red-400 mt-1 leading-relaxed">
                      删除后会同时清理关联标签关系和向量索引，此操作不可撤销。
                    </p>
                    {deleteError && (
                      <p className="text-[12px] text-red-500 mt-2">{deleteError}</p>
                    )}
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="px-3 py-1.5 rounded-md text-[12px] font-bold text-white bg-red-500 hover:bg-red-600 disabled:opacity-60 transition-colors"
                      >
                        {deleting ? "删除中..." : deleteConfirm ? "确认删除" : "删除这个书签"}
                      </button>
                      {deleteConfirm && !deleting && (
                        <button
                          onClick={() => {
                            setDeleteConfirm(false);
                            setDeleteError("");
                          }}
                          className="px-3 py-1.5 rounded-md text-[12px] font-bold text-[#6b7280] hover:bg-[#f3f7fc] transition-colors"
                        >
                          取消
                        </button>
                      )}
                    </div>
                  </div>
                </section>
              )}
            </>
          ) : (
            <div className="text-center py-20 text-[#98a2b3]">找不到该书签</div>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes slide-in-right {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </div>
  );
}
