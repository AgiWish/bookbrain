"use client";

import React, { useState, useEffect, useCallback } from "react";

interface BookmarkDetailProps {
  id: string | null;
  onClose: () => void;
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
}

export default function BookmarkDetail({ id, onClose }: BookmarkDetailProps) {
  const [bookmark, setBookmark] = useState<BookmarkExtended | null>(null);
  const [related, setRelated] = useState<RelatedBookmark[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDetail = useCallback(async (targetId: string) => {
    // We defer the setLoading(true) to avoid sync setState in effect
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
      setLoading(true); // This is fine if it's the only call in a separate render or if we handle it
      fetchDetail(id);
    }
  }, [id, fetchDetail]);

  if (!id) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Panel */}
      <div 
        className="relative w-full max-w-[480px] h-full shadow-2xl flex flex-col animate-slide-in-right"
        style={{ backgroundColor: "#1A1D27", borderLeft: "1px solid #2E3347" }}
      >
        <div className="p-4 border-b border-[#2E3347] flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#9099B5]">书签详情</h2>
          <button onClick={onClose} className="p-2 hover:bg-[#2A2F45] rounded-lg transition-colors text-[#9099B5]">
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          {loading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-8 bg-[#2A2F45] rounded w-3/4" />
              <div className="h-4 bg-[#2A2F45] rounded w-1/2" />
              <div className="h-32 bg-[#2A2F45] rounded" />
            </div>
          ) : bookmark ? (
            <>
              {/* Main Info */}
              <section className="space-y-4">
                <h1 className="text-xl font-bold text-white leading-tight">{bookmark.title}</h1>
                <a 
                  href={bookmark.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-[#4F8EF7] hover:underline break-all"
                >
                  {bookmark.url} <span>↗</span>
                </a>
              </section>

              {/* AI Summary */}
              {bookmark.summary && (
                <section className="space-y-2">
                  <h3 className="text-xs font-bold text-[#8B6CF7] uppercase">AI 智能总结</h3>
                  <div className="p-4 rounded-xl border border-[#8B6CF7]/20 leading-relaxed text-sm" style={{ backgroundColor: "rgba(139, 92, 246, 0.05)" }}>
                    {bookmark.summary}
                  </div>
                </section>
              )}

              {/* Tags */}
              <section className="space-y-3">
                <h3 className="text-xs font-bold text-[#9099B5] uppercase">标签</h3>
                <div className="flex flex-wrap gap-2">
                  {bookmark.tags?.map((tag: string) => (
                    <span 
                      key={tag} 
                      className="px-3 py-1 rounded-full text-xs font-medium border border-[#3D4460]"
                      style={{ backgroundColor: "#22263A", color: "#E8EAF0" }}
                    >
                      {tag}
                    </span>
                  ))}
                  <button className="px-3 py-1 rounded-full text-xs font-medium border border-dashed border-[#3D4460] text-[#9099B5] hover:border-[#4F8EF7] hover:text-[#4F8EF7] transition-colors">
                    + 编辑标签
                  </button>
                </div>
              </section>

              {/* Related */}
              {related.length > 0 && (
                <section className="space-y-4 pt-4 border-t border-[#2E3347]">
                  <h3 className="text-xs font-bold text-[#9099B5] uppercase">相似推荐</h3>
                  <div className="space-y-3">
                    {related.map((item) => (
                      <div 
                        key={item.id}
                        className="p-3 rounded-lg border border-[#2E3347] hover:border-[#3D4460] transition-colors cursor-pointer"
                        style={{ backgroundColor: "#0F1117" }}
                        onClick={() => {}} 
                      >
                        <p className="text-sm font-medium text-white truncate">{item.title}</p>
                        <p className="text-[10px] text-[#9099B5] mt-1 font-mono">{new URL(item.url).hostname}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          ) : (
            <div className="text-center py-20 text-[#9099B5]">找不到该书签</div>
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
