"use client";

import React, { useState, useEffect, useCallback } from "react";
import SearchBar from "@/components/search/SearchBar";
import BookmarkCard from "@/components/bookmarks/BookmarkCard";
import BookmarkDetail from "@/components/bookmarks/BookmarkDetail";

type SearchMode = "keyword" | "semantic" | "hybrid";

interface Bookmark {
  id: string;
  title: string;
  url: string;
  summary?: string;
  tags: string[];
  processed: boolean;
  favicon?: string;
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<SearchMode>("hybrid");
  const [results, setResults] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ count: 0, time: 0 });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setStats({ count: 0, time: 0 });
      return;
    }

    setLoading(true);
    const start = performance.now();
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&mode=${mode}`);
      const data = await res.json();
      setResults(data);
      setStats({
        count: data.length,
        time: Math.round(performance.now() - start),
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [mode]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, handleSearch]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden" style={{ backgroundColor: "#0F1117" }}>
      <div className="max-w-5xl mx-auto w-full px-6 pt-12 pb-8 flex flex-col gap-8">
        {/* Search Header */}
        <div className="space-y-6">
          <SearchBar 
            value={query} 
            onChange={setQuery} 
            onSearch={() => handleSearch(query)} 
            placeholder="用自然语言搜索，例如：Spring Boot 部署教程"
          />

          <div className="flex items-center justify-between">
            {/* Mode Switcher */}
            <div className="flex p-1 rounded-xl bg-[#1A1D27] border border-[#2E3347]">
              <ModeButton 
                active={mode === "keyword"} 
                onClick={() => setMode("keyword")}
              >
                关键词
              </ModeButton>
              <ModeButton 
                active={mode === "semantic"} 
                onClick={() => setMode("semantic")}
              >
                语义
              </ModeButton>
              <ModeButton 
                active={mode === "hybrid"} 
                onClick={() => setMode("hybrid")}
              >
                混合
              </ModeButton>
            </div>

            {/* Stats */}
            {query && !loading && (
              <p className="text-xs text-[#9099B5]">
                找到 {stats.count} 条结果，耗时 {stats.time}ms
              </p>
            )}
          </div>
        </div>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar pb-20">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-40 rounded-xl bg-[#1A1D27] animate-pulse border border-[#2E3347]" />
              ))}
            </div>
          ) : results.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((bookmark: Bookmark) => (
                <BookmarkCard 
                  key={bookmark.id} 
                  bookmark={bookmark} 
                  onClick={setSelectedId} 
                />
              ))}
            </div>
          ) : query ? (
            <div className="py-20 text-center space-y-2">
              <p className="text-[#E8EAF0] font-medium">未找到匹配项</p>
              <p className="text-sm text-[#9099B5]">尝试切换搜索模式或使用更通用的词汇</p>
            </div>
          ) : (
            <div className="py-20 text-center space-y-4 opacity-50">
              <span className="text-6xl block">🧠</span>
              <p className="text-[#9099B5]">输入内容开始探索您的知识库</p>
            </div>
          )}
        </div>
      </div>

      <BookmarkDetail id={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}

function ModeButton({ active, onClick, children }: { active: boolean, onClick: () => void, children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
        active 
          ? "bg-[#4F8EF7] text-white shadow-lg" 
          : "text-[#9099B5] hover:text-[#E8EAF0]"
      }`}
    >
      {children}
    </button>
  );
}
