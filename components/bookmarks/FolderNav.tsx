"use client";

import React, { useState, useMemo } from "react";

interface Subfolder {
  name: string;
  count: number;
}

interface CategoryNode {
  name: string;
  totalCount: number;
  subfolders: Subfolder[];
}

interface FolderNavProps {
  categories: CategoryNode[];
  selectedCategory: string | null;
  selectedSubfolder: string | null;
  onSelectCategory: (name: string | null) => void;
  onSelectSubfolder: (categoryName: string, subfolderName: string) => void;
  totalBookmarks: number;
}

// Category color palette
const CAT_COLORS: Record<string, string> = {
  "开发工程": "#2f96d4",
  "智能工具": "#8B6CF7",
  "生活其他": "#34D399",
  "学习资源": "#F59E0B",
  "数据分析": "#EF4444",
  "工具箱": "#EC4899",
  "运维管理": "#06B6D4",
  "设计素材": "#84CC16",
  "项目管理": "#F97316",
  "办公协作": "#6366F1",
  "存储服务": "#14B8A6",
  "地图地理": "#A855F7",
  "开源项目": "#64748B",
  "未分类": "#c0c7d5",
};

const DEFAULT_COLOR = "#98a2b3";

export default function FolderNav({
  categories,
  selectedCategory,
  selectedSubfolder,
  onSelectCategory,
  onSelectSubfolder,
}: FolderNavProps) {
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const s = new Set<string>();
    categories.slice(0, 3).forEach((c) => s.add(c.name));
    return s;
  });

  const effectiveExpanded = useMemo(() => {
    const s = new Set(expanded);
    if (selectedCategory && selectedSubfolder) s.add(selectedCategory);
    return s;
  }, [expanded, selectedCategory, selectedSubfolder]);

  const toggleExpand = (name: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const isAllSelected = selectedCategory === null && selectedSubfolder === null;

  return (
    <div
      className="w-56 flex-shrink-0 flex flex-col h-full overflow-hidden"
      style={{ backgroundColor: "#fff", borderRight: "1px solid #e6edf5" }}
    >
      {/* Title */}
      <div className="px-4 pt-5 pb-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#98a2b3]">
          分类目录
        </span>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto pb-4 custom-scrollbar">
        {/* All */}
        <button
          onClick={() => onSelectCategory(null)}
          className={`w-full flex items-center gap-2.5 px-4 py-[7px] text-left text-[13px] transition-colors rounded-sm mx-1 ${
            isAllSelected
              ? "text-[#2f96d4] font-medium"
              : "text-[#4b5563] hover:text-[#1f2937] hover:bg-[#f3f7fc]"
          }`}
          style={isAllSelected ? { backgroundColor: "#eef7fc" } : undefined}
        >
          <span className="w-[6px] h-[6px] rounded-full flex-shrink-0" style={{ backgroundColor: "#2f96d4" }} />
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" className="flex-shrink-0 opacity-60">
            <path d="M2 3h4l2-2h6a1 1 0 011 1v10a1 1 0 01-1 1H2a1 1 0 01-1-1V4a1 1 0 011-1z"/>
          </svg>
          <span className="truncate">全部</span>
          <span className="ml-auto text-[10px] text-[#98a2b3] tabular-nums">{categories.reduce((s, c) => s + c.totalCount, 0)}</span>
        </button>

        {categories.map((cat) => {
          const isCatSelected = selectedCategory === cat.name && !selectedSubfolder;
          const isExpanded = effectiveExpanded.has(cat.name);
          const catColor = CAT_COLORS[cat.name] ?? DEFAULT_COLOR;

          return (
            <div key={cat.name}>
              {/* Category row */}
              <button
                onClick={() => {
                  toggleExpand(cat.name);
                  onSelectCategory(cat.name);
                }}
                className={`w-full flex items-center gap-2 px-4 py-[7px] text-left text-[13px] transition-colors ${
                  isCatSelected
                    ? "text-[#2f96d4] font-medium"
                    : "text-[#4b5563] hover:text-[#1f2937] hover:bg-[#f3f7fc]"
                }`}
                style={isCatSelected ? { backgroundColor: "#eef7fc" } : undefined}
              >
                <span className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
                  <svg
                    width="7"
                    height="7"
                    viewBox="0 0 10 10"
                    fill="currentColor"
                    className="transition-transform duration-150 text-[#c0c7d5]"
                    style={{ transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)" }}
                  >
                    <path d="M3 1l5 4-5 4V1z" />
                  </svg>
                </span>
                <span className="w-[6px] h-[6px] rounded-full flex-shrink-0" style={{ backgroundColor: catColor }} />
                <span className="truncate flex-1">{cat.name}</span>
                <span
                  className="text-[10px] tabular-nums px-1.5 py-0.5 rounded-full"
                  style={{ backgroundColor: isCatSelected ? "#d4eef9" : "#f3f7fc", color: isCatSelected ? "#2f96d4" : "#98a2b3" }}
                >
                  {cat.totalCount}
                </span>
              </button>

              {/* Subfolders */}
              {isExpanded && (
                <div className="pb-1">
                  {cat.subfolders.map((sub) => {
                    const isSubSelected = selectedCategory === cat.name && selectedSubfolder === sub.name;
                    return (
                      <button
                        key={sub.name}
                        onClick={() => onSelectSubfolder(cat.name, sub.name)}
                        className={`w-full flex items-center gap-2 pl-[3.25rem] pr-4 py-[6px] text-left text-[12px] transition-colors ${
                          isSubSelected
                            ? "text-[#2f96d4] font-medium"
                            : "text-[#6b7280] hover:text-[#1f2937] hover:bg-[#f3f7fc]"
                        }`}
                        style={isSubSelected ? { backgroundColor: "#eef7fc" } : undefined}
                      >
                        <span className="truncate flex-1">{sub.name}</span>
                        <span
                          className="text-[9px] tabular-nums px-1.5 py-0.5 rounded-full"
                          style={{ backgroundColor: isSubSelected ? "#d4eef9" : "#f6f8fa", color: isSubSelected ? "#2f96d4" : "#c0c7d5" }}
                        >
                          {sub.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer actions */}
      <div className="px-4 py-3 border-t border-[#e6edf5]">
        <button
          onClick={() => setExpanded(new Set())}
          className="text-[10px] text-[#98a2b3] hover:text-[#6b7280] transition-colors"
        >
          全部收起
        </button>
      </div>
    </div>
  );
}
