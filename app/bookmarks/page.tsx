"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import TagFilter from "@/components/bookmarks/TagFilter";
import BookmarkCard from "@/components/bookmarks/BookmarkCard";
import BookmarkDetail from "@/components/bookmarks/BookmarkDetail";

interface Bookmark {
  id: string;
  title: string;
  url: string;
  summary?: string;
  tags: string[];
  processed: boolean;
  favicon?: string;
}

interface Tag {
  name: string;
  count: number;
}

export default function BookmarksPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const detailId = searchParams.get("detail");

  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [aiStatus, setAiStatus] = useState({ processed: 0, total: 0 });

  const fetchData = useCallback(async () => {
    try {
      const [tagsRes, bookmarksRes] = await Promise.all([
        fetch("/api/tags"),
        fetch(`/api/bookmarks?tags=${selectedTags.join(",")}`)
      ]);
      
      const tagsData = await tagsRes.json();
      const bookmarksData = await bookmarksRes.json();
      
      setTags(tagsData);
      setBookmarks(bookmarksData);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedTags]);

  const fetchAiStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/ai/status/global");
      const data = await res.json();
      if (data) setAiStatus(data);
    } catch {
      // Ignore error
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchAiStatus, 5000);
    return () => {
      clearInterval(interval);
    };
  }, [fetchData, fetchAiStatus]);

  const handleToggleTag = (tagName: string) => {
    setLoading(true);
    setSelectedTags(prev => 
      prev.includes(tagName) ? prev.filter(t => t !== tagName) : [...prev, tagName]
    );
  };

  const filteredBookmarks = bookmarks.filter(b => 
    b.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    b.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const progressPct = aiStatus.total > 0 ? Math.round((aiStatus.processed / aiStatus.total) * 100) : 100;

  const handleOpenDetail = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("detail", id);
    router.push(`?${params.toString()}`);
  };

  const handleCloseDetail = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("detail");
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Sidebar Filter */}
      <TagFilter 
        tags={tags} 
        selectedTags={selectedTags} 
        onToggleTag={handleToggleTag} 
        onClear={() => { setLoading(true); setSelectedTags([]); }} 
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0" style={{ backgroundColor: "#0F1117" }}>
        {/* Header */}
        <header className="p-6 border-b border-[#2E3347] flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">书签库</h1>
            
            {/* AI Progress */}
            {progressPct < 100 && (
              <div className="flex items-center gap-3 bg-[#1A1D27] px-4 py-2 rounded-lg border border-[#2E3347]">
                <span className="text-xs text-[#8B6CF7] font-medium flex items-center gap-1">
                  <span className="animate-pulse">✨</span> AI 处理中...
                </span>
                <div className="w-32 h-1.5 bg-[#2A2F45] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#8B6CF7] transition-all duration-500" 
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <span className="text-[10px] text-[#9099B5]">{aiStatus.processed}/{aiStatus.total}</span>
              </div>
            )}
          </div>

          {/* Quick Search */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9099B5]">🔍</span>
            <input 
              type="text"
              placeholder="快速过滤标题或 URL..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#1A1D27] border border-[#2E3347] rounded-lg text-sm focus:outline-none focus:border-[#4F8EF7] transition-colors"
            />
          </div>
        </header>

        {/* Grid Area */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-40 rounded-xl bg-[#1A1D27] animate-pulse border border-[#2E3347]" />
              ))}
            </div>
          ) : filteredBookmarks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBookmarks.map(bookmark => (
                <BookmarkCard 
                  key={bookmark.id} 
                  bookmark={bookmark} 
                  onClick={handleOpenDetail} 
                />
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-[#9099B5] space-y-4">
              <span className="text-4xl">🏜️</span>
              <p>没有找到相关书签</p>
            </div>
          )}
        </div>
      </div>

      {/* Detail View */}
      <BookmarkDetail id={detailId} onClose={handleCloseDetail} />
    </div>
  );
}
