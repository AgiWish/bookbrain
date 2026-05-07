"use client";

import React, { Suspense, useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import FolderNav from "@/components/bookmarks/FolderNav";
import BookmarkCard from "@/components/bookmarks/BookmarkCard";
import BookmarkDetail from "@/components/bookmarks/BookmarkDetail";
import TagChipBar from "@/components/bookmarks/TagChipBar";
import CleanupModal from "@/components/bookmarks/CleanupModal";
import AddBookmarkModal from "@/components/bookmarks/AddBookmarkModal";

interface Bookmark {
  id: string;
  title: string;
  url: string;
  summary?: string;
  tags: string[];
  processed: boolean;
  pinned: boolean;
  favicon?: string;
  folder?: string;
  category?: string;
  subfolder?: string;
}

interface CategoryNode {
  name: string;
  totalCount: number;
  subfolders: { name: string; count: number }[];
}

interface BookmarksResponse {
  bookmarks: Bookmark[];
  total: number;
  page: number;
  limit: number;
}

type Notice = {
  id: number;
  type: "success" | "error" | "warning";
  message: string;
};

export default function BookmarksPage() {
  return (
    <Suspense fallback={<BookmarksFallback />}>
      <BookmarksContent />
    </Suspense>
  );
}

function BookmarksFallback() {
  return (
    <div className="flex h-full overflow-hidden">
      <div className="w-56 bg-white" style={{ borderRight: "1px solid #e6edf5" }} />
      <div className="flex-1 p-6">
        <div className="grid grid-cols-4 gap-3">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="h-24 rounded-lg bg-white animate-pulse" style={{ border: "1px solid #e6edf5" }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function BookmarksContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const detailId = searchParams.get("detail");

  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [pinnedList, setPinnedList] = useState<Bookmark[]>([]);
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [tags, setTags] = useState<{ name: string; count: number }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubfolder, setSelectedSubfolder] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCleanup, setShowCleanup] = useState(false);
  const [showAddBookmark, setShowAddBookmark] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const showNotice = useCallback((type: Notice["type"], message: string) => {
    const id = Date.now();
    setNotice({ id, type, message });
    window.setTimeout(() => {
      setNotice((current) => (current?.id === id ? null : current));
    }, 3200);
  }, []);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetch("/api/folders")
      .then((r) => r.json())
      .then((data: CategoryNode[]) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const refreshCategories = useCallback(() => {
    fetch("/api/folders")
      .then((r) => r.json())
      .then((data: CategoryNode[]) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const refreshTags = useCallback(() => {
    fetch("/api/tags")
      .then((r) => r.json())
      .then((data) => setTags(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/tags")
      .then((r) => r.json())
      .then((data) => setTags(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const fetchBookmarks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      // When searching, use server-side search with larger limit
      if (debouncedQuery.trim()) {
        params.set("q", debouncedQuery.trim());
      }
      params.set("limit", "200");
      if (selectedCategory) params.set("category", selectedCategory);
      if (selectedSubfolder) params.set("subfolder", selectedSubfolder);
      if (selectedTags.length > 0) params.set("tags", selectedTags.join(","));

      const res = await fetch(`/api/bookmarks?${params}`);
      const bData = (await res.json()) as BookmarksResponse;
      setBookmarks(Array.isArray(bData.bookmarks) ? bData.bookmarks : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedSubfolder, selectedTags, debouncedQuery]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchBookmarks();
  }, [fetchBookmarks]);

  // Always fetch all pinned bookmarks (independent of current filter)
  const fetchPinned = useCallback(async () => {
    try {
      const res = await fetch("/api/bookmarks?limit=1000&pinned=true");
      const data = (await res.json()) as BookmarksResponse;
      setPinnedList(Array.isArray(data.bookmarks) ? data.bookmarks : []);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPinned();
  }, [fetchPinned]);

  const handleTogglePin = useCallback(async (id: string) => {
    const currentBookmark =
      bookmarks.find((bookmark) => bookmark.id === id) ??
      pinnedList.find((bookmark) => bookmark.id === id);
    const nextPinned = !currentBookmark?.pinned;

    try {
      const res = await fetch(`/api/bookmarks/${id}/pin`, { method: "PATCH" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `收藏状态更新失败（${res.status}）`);
      }

      // Optimistic local update
      setBookmarks((prev) =>
        prev.map((b) => (b.id === id ? { ...b, pinned: nextPinned } : b))
      );
      setPinnedList((prev) =>
        nextPinned
          ? prev.map((b) => (b.id === id ? { ...b, pinned: true } : b))
          : prev.filter((b) => b.id !== id)
      );

      // Refresh pinned list from server
      fetchPinned();
      showNotice("success", nextPinned ? "已加入常用收藏" : "已取消常用收藏");
    } catch (e) {
      console.error(e);
      showNotice("error", e instanceof Error ? e.message : "收藏状态更新失败");
    }
  }, [bookmarks, fetchPinned, pinnedList, showNotice]);

  // Bookmarks are already server-filtered, no client-side filtering needed
  const filteredBookmarks = bookmarks;

  const handleOpenDetail = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("detail", id);
    router.push(`?${params.toString()}`);
  };

  const handleCloseDetail = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("detail");
    router.push(`?${params.toString()}`);
  }, [router, searchParams]);

  const handleDeleteBookmark = useCallback((id: string) => {
    setBookmarks((prev) => prev.filter((bookmark) => bookmark.id !== id));
    setPinnedList((prev) => prev.filter((bookmark) => bookmark.id !== id));
    handleCloseDetail();
    showNotice("success", "书签已删除");

    void Promise.allSettled([
      fetchBookmarks(),
      fetchPinned(),
      refreshCategories(),
      refreshTags(),
    ]).then((results) => {
      let hasRefreshFailure = false;
      results.forEach((result) => {
        if (result.status === "rejected") {
          console.error("Failed to refresh bookmark data after delete", result.reason);
          hasRefreshFailure = true;
        }
      });
      if (hasRefreshFailure) {
        showNotice("warning", "书签已删除，部分列表刷新失败");
      }
    });
  }, [fetchBookmarks, fetchPinned, handleCloseDetail, refreshCategories, refreshTags, showNotice]);

  const handleSelectCategory = (name: string | null) => {
    setSelectedCategory(name);
    setSelectedSubfolder(null);
    setSearchQuery("");
  };

  const handleSelectSubfolder = (categoryName: string, subfolderName: string) => {
    setSelectedCategory(categoryName);
    setSelectedSubfolder(subfolderName);
    setSearchQuery("");
  };

  const handleToggleTag = (name: string) => {
    setSelectedTags((prev) =>
      prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name]
    );
  };

  // Section title
  const sectionTitle = selectedSubfolder
    ? selectedSubfolder
    : selectedCategory ?? "全部书签";

  // Pinned bookmarks section (always from dedicated pinned list)
  const pinnedBookmarks = useMemo(() => {
    if (selectedCategory || selectedSubfolder || searchQuery || selectedTags.length > 0) return [];
    return pinnedList;
  }, [pinnedList, selectedCategory, selectedSubfolder, searchQuery, selectedTags]);

  // Remaining bookmarks (exclude pinned when showing all)
  const pinnedIds = new Set(pinnedBookmarks.map((b) => b.id));
  const displayBookmarks = selectedCategory || selectedSubfolder || searchQuery || selectedTags.length > 0
    ? filteredBookmarks
    : filteredBookmarks.filter((b) => !pinnedIds.has(b.id));

  // Group by subfolder when showing all
  let grouped: Map<string, Bookmark[]> | null = null;
  if (!selectedSubfolder && !searchQuery && selectedTags.length === 0) {
    grouped = new Map();
    for (const b of displayBookmarks) {
      const key = b.subfolder || "未分类";
      const arr = grouped.get(key);
      if (arr) arr.push(b);
      else grouped.set(key, [b]);
    }
  }

  return (
    <div className="flex h-full overflow-hidden">
      {notice && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed right-4 top-4 z-[70] max-w-[320px] rounded-lg border px-4 py-3 text-[13px] font-medium shadow-xl ${
            notice.type === "success"
              ? "border-emerald-300/60 bg-emerald-50 text-emerald-700"
              : notice.type === "warning"
                ? "border-amber-300/60 bg-amber-50 text-amber-700"
                : "border-red-300/60 bg-red-50 text-red-700"
          }`}
        >
          {notice.message}
        </div>
      )}

      <FolderNav
        categories={categories}
        selectedCategory={selectedCategory}
        selectedSubfolder={selectedSubfolder}
        onSelectCategory={handleSelectCategory}
        onSelectSubfolder={handleSelectSubfolder}
        totalBookmarks={categories.reduce((s, c) => s + c.totalCount, 0)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0" style={{ backgroundColor: "#f3f7fc" }}>
        {/* Top bar */}
        <div
          className="flex items-center gap-3 px-6 py-3"
          style={{ backgroundColor: "#fff", borderBottom: "1px solid #e6edf5" }}
        >
          <h2 className="text-[15px] font-semibold text-[#1f2937] truncate">
            {sectionTitle}
          </h2>
          <span className="text-[11px] text-[#98a2b3] tabular-nums">
            {loading ? "..." : `${filteredBookmarks.length} 条`}
          </span>
          {(selectedCategory || selectedSubfolder) && (
            <button
              onClick={() => handleSelectCategory(null)}
              className="text-[11px] text-[#2f96d4] hover:underline"
            >
              全部
            </button>
          )}

          <button
            onClick={() => setShowCleanup(true)}
            className="flex items-center gap-1.5 text-[11px] text-[#98a2b3] hover:text-red-400 transition-colors px-2 py-1 rounded hover:bg-red-50"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
              <path d="M2 4h12M5 4V3a1 1 0 011-1h4a1 1 0 011 1v1M6 7v5M10 7v5M3 4l1 9a1 1 0 001 1h6a1 1 0 001-1l1-9"/>
            </svg>
            清理失效链接
          </button>

          <button
            onClick={() => setShowAddBookmark(true)}
            className="flex items-center gap-1.5 text-[12px] font-medium text-white transition-colors px-3 py-1.5 rounded-md hover:opacity-90"
            style={{ backgroundColor: "#2f96d4" }}
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M8 3v10M3 8h10" />
            </svg>
            添加收藏
          </button>

          <div className="relative ml-auto" style={{ width: 220 }}>
            <input
              type="text"
              placeholder="搜索书签..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-[12px] pl-8 pr-3 py-1.5 rounded-md text-[#1f2937] placeholder-[#98a2b3] focus:outline-none transition-colors"
              style={{ backgroundColor: "#f3f7fc", border: "1px solid #e6edf5" }}
            />
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#98a2b3]">
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="7" cy="7" r="5"/>
                <path d="M11 11l3.5 3.5"/>
              </svg>
            </span>
          </div>
        </div>

        {/* Tag chips */}
        {tags.length > 0 && (
          <div className="px-6 py-2" style={{ backgroundColor: "#fff", borderBottom: "1px solid #e6edf5" }}>
            <TagChipBar
              tags={tags}
              selectedTags={selectedTags}
              onToggleTag={handleToggleTag}
              onClear={() => setSelectedTags([])}
            />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
          {loading ? (
            <div className="grid grid-cols-4 gap-3">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="h-20 rounded-lg bg-white animate-pulse" style={{ border: "1px solid #e6edf5" }} />
              ))}
            </div>
          ) : (
            <>
              {/* Pinned section */}
              {pinnedBookmarks.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="#F59E0B" stroke="#F59E0B" strokeWidth="0.5">
                      <path d="M8 1l2.2 4.5L15 6.3l-3.5 3.4.8 4.9L8 12.4l-4.3 2.2.8-4.9L1 6.3l4.8-.8z"/>
                    </svg>
                    <span className="text-[13px] font-semibold text-[#1f2937]">常用收藏</span>
                    <span className="text-[10px] text-[#98a2b3]">{pinnedBookmarks.length}</span>
                  </div>
                  <div
                    className="rounded-lg p-4"
                    style={{ backgroundColor: "#fff", border: "1px solid #f5e6b8" }}
                  >
                    <div className="grid grid-cols-4 gap-0">
                      {pinnedBookmarks.map((bookmark) => (
                        <BookmarkCard
                          key={bookmark.id}
                          bookmark={bookmark}
                          onClick={handleOpenDetail}
                          onTogglePin={handleTogglePin}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Empty pinned hint (only when showing all, no filters, and no pinned) */}
              {!selectedCategory && !selectedSubfolder && !searchQuery && selectedTags.length === 0 && pinnedBookmarks.length === 0 && (
                <div className="mb-6 p-4 rounded-lg flex items-center gap-3" style={{ backgroundColor: "#fff", border: "1px dashed #e6edf5" }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#c0c7d5" strokeWidth="1.3">
                    <path d="M8 1l2.2 4.5L15 6.3l-3.5 3.4.8 4.9L8 12.4l-4.3 2.2.8-4.9L1 6.3l4.8-.8z"/>
                  </svg>
                  <p className="text-[12px] text-[#98a2b3]">
                    点击书签右上角的星标，收藏常用网站到这里
                  </p>
                </div>
              )}

              {/* Grouped or flat grid */}
              {grouped ? (
                [...grouped.entries()].map(([group, items]) => (
                  <div key={group} className="mb-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[12px] font-semibold text-[#4b5563]">{group}</span>
                      <span className="text-[10px] text-[#c0c7d5]">{items.length}</span>
                    </div>
                    <div
                      className="rounded-lg p-4"
                      style={{ backgroundColor: "#fff", border: "1px solid #e6edf5" }}
                    >
                      <div className="grid grid-cols-4 gap-0">
                        {items.map((bookmark) => (
                          <BookmarkCard
                            key={bookmark.id}
                            bookmark={bookmark}
                            onClick={handleOpenDetail}
                            onTogglePin={handleTogglePin}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              ) : displayBookmarks.length > 0 ? (
                <div
                  className="rounded-lg p-4"
                  style={{ backgroundColor: "#fff", border: "1px solid #e6edf5" }}
                >
                  <div className="grid grid-cols-4 gap-0">
                    {displayBookmarks.map((bookmark) => (
                      <BookmarkCard
                        key={bookmark.id}
                        bookmark={bookmark}
                        onClick={handleOpenDetail}
                        onTogglePin={handleTogglePin}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-[#98a2b3] space-y-2">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="opacity-30">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
                  </svg>
                  <p className="text-[13px]">没有找到书签</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <BookmarkDetail
        id={detailId}
        onClose={handleCloseDetail}
        onTogglePin={handleTogglePin}
        onDelete={handleDeleteBookmark}
        onUpdated={() => {
          void Promise.allSettled([fetchBookmarks(), fetchPinned()]);
        }}
      />

      {showCleanup && (
        <CleanupModal
          onClose={() => setShowCleanup(false)}
          onDeleted={() => {
            setShowCleanup(false);
            fetchBookmarks();
            fetchPinned();
            refreshCategories();
            refreshTags();
          }}
        />
      )}

      {showAddBookmark && (
        <AddBookmarkModal
          categories={categories}
          initialCategory={selectedCategory}
          initialSubfolder={selectedSubfolder}
          onClose={() => setShowAddBookmark(false)}
          onCreated={() => {
            setShowAddBookmark(false);
            fetchBookmarks();
            fetchPinned();
            refreshCategories();
            refreshTags();
          }}
        />
      )}
    </div>
  );
}
