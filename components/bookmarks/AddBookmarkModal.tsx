"use client";

import React, { useMemo, useState } from "react";

interface CategoryNode {
  name: string;
  totalCount: number;
  subfolders: { name: string; count: number }[];
}

interface AddBookmarkModalProps {
  categories: CategoryNode[];
  initialCategory?: string | null;
  initialSubfolder?: string | null;
  onClose: () => void;
  onCreated: () => void;
}

async function parseJsonResponse<T = unknown>(res: Response): Promise<T> {
  const ct = res.headers.get("content-type") ?? "";
  if (!ct.includes("application/json")) {
    const snippet = (await res.text()).slice(0, 200);
    throw new Error(`服务器返回了非 JSON 响应（${res.status}）。\n${snippet}`);
  }
  return res.json() as Promise<T>;
}

function inferTitle(url: string): string {
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export default function AddBookmarkModal({
  categories,
  initialCategory,
  initialSubfolder,
  onClose,
  onCreated,
}: AddBookmarkModalProps) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(initialCategory ?? "");
  const [subfolder, setSubfolder] = useState(initialSubfolder ?? "");
  const [description, setDescription] = useState("");
  const [faviconUrl, setFaviconUrl] = useState("");
  const [pinned, setPinned] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fetchingMeta, setFetchingMeta] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subfolderOptions = useMemo(() => {
    const node = categories.find((c) => c.name === category);
    return node?.subfolders.map((s) => s.name) ?? [];
  }, [categories, category]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const cleanUrl = url.trim();
      const cleanTitle = title.trim() || inferTitle(cleanUrl);
      const res = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: cleanUrl,
          title: cleanTitle,
          category: category.trim() || undefined,
          subfolder: subfolder.trim() || undefined,
          folder: subfolder.trim() || undefined,
          description: description.trim() || undefined,
          faviconUrl: faviconUrl.trim() || undefined,
          pinned,
        }),
      });
      const data = await parseJsonResponse<{ error?: string; bookmark?: { id: string } }>(res);
      if (!res.ok) {
        if (res.status === 409 && data.bookmark?.id) {
          throw new Error("这个网址已经收藏过了，可在书签库搜索查看。");
        }
        throw new Error(data.error ?? `保存失败（${res.status}）`);
      }
      onCreated();
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  const fetchMetadata = async () => {
    const cleanUrl = url.trim();
    if (!cleanUrl) return;

    setFetchingMeta(true);
    setError(null);
    try {
      const res = await fetch(`/api/bookmarks/metadata?url=${encodeURIComponent(cleanUrl)}`);
      const data = await parseJsonResponse<{
        title?: string;
        description?: string;
        faviconUrl?: string;
        error?: string;
      }>(res);
      if (!res.ok) throw new Error(data.error ?? "无法获取网页信息");
      if (!title.trim() && data.title) setTitle(data.title);
      if (!description.trim() && data.description) setDescription(data.description);
      if (!faviconUrl.trim() && data.faviconUrl) setFaviconUrl(data.faviconUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "无法获取网页信息");
    } finally {
      setFetchingMeta(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 px-4">
      <div
        className="w-full max-w-md rounded-lg bg-white shadow-xl"
        style={{ border: "1px solid #e6edf5" }}
      >
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #e6edf5" }}>
          <h3 className="text-[15px] font-semibold text-[#1f2937]">添加收藏</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-[#98a2b3] hover:text-[#1f2937] hover:bg-[#f3f7fc]"
            aria-label="关闭"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-600">
              {error}
            </div>
          )}

          <label className="block space-y-1.5">
            <span className="flex items-center justify-between text-[12px] font-medium text-[#4b5563]">
              <span>网址</span>
              <button
                type="button"
                onClick={fetchMetadata}
                disabled={fetchingMeta || !url.trim()}
                className="text-[11px] font-medium text-[#2f96d4] disabled:text-[#c0c7d5]"
              >
                {fetchingMeta ? "获取中..." : "自动补全"}
              </button>
            </span>
            <input
              autoFocus
              type="text"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onBlur={fetchMetadata}
              placeholder="https://example.com"
              className="w-full rounded-md px-3 py-2 text-[13px] text-[#1f2937] placeholder-[#98a2b3] focus:outline-none"
              style={{ border: "1px solid #e6edf5", backgroundColor: "#f8fbff" }}
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-[12px] font-medium text-[#4b5563]">描述</span>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="可由网页 meta description 自动补全"
              className="w-full rounded-md px-3 py-2 text-[13px] text-[#1f2937] placeholder-[#98a2b3] focus:outline-none"
              style={{ border: "1px solid #e6edf5", backgroundColor: "#f8fbff" }}
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-[12px] font-medium text-[#4b5563]">标题</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="留空则使用域名"
              className="w-full rounded-md px-3 py-2 text-[13px] text-[#1f2937] placeholder-[#98a2b3] focus:outline-none"
              style={{ border: "1px solid #e6edf5", backgroundColor: "#f8fbff" }}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1.5">
              <span className="text-[12px] font-medium text-[#4b5563]">分类</span>
              <input
                type="text"
                list="bookbrain-categories"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="未分类"
                className="w-full rounded-md px-3 py-2 text-[13px] text-[#1f2937] placeholder-[#98a2b3] focus:outline-none"
                style={{ border: "1px solid #e6edf5", backgroundColor: "#f8fbff" }}
              />
              <datalist id="bookbrain-categories">
                {categories.map((c) => (
                  <option key={c.name} value={c.name} />
                ))}
              </datalist>
            </label>

            <label className="block space-y-1.5">
              <span className="text-[12px] font-medium text-[#4b5563]">子目录</span>
              <input
                type="text"
                list="bookbrain-subfolders"
                value={subfolder}
                onChange={(e) => setSubfolder(e.target.value)}
                placeholder="默认"
                className="w-full rounded-md px-3 py-2 text-[13px] text-[#1f2937] placeholder-[#98a2b3] focus:outline-none"
                style={{ border: "1px solid #e6edf5", backgroundColor: "#f8fbff" }}
              />
              <datalist id="bookbrain-subfolders">
                {subfolderOptions.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </label>
          </div>

          <label className="flex items-center gap-2 text-[12px] text-[#4b5563]">
            <input
              type="checkbox"
              checked={pinned}
              onChange={(e) => setPinned(e.target.checked)}
              className="h-4 w-4 rounded border-[#c0c7d5]"
            />
            加入常用收藏
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-3 py-2 text-[12px] text-[#6b7280] hover:bg-[#f3f7fc]"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-md px-4 py-2 text-[12px] font-medium text-white disabled:opacity-60"
              style={{ backgroundColor: "#2f96d4" }}
            >
              {saving ? "保存中..." : "保存"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
