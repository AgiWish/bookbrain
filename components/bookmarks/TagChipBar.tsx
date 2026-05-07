"use client";

import React, { useMemo } from "react";

interface TagChipBarProps {
  tags: { name: string; count: number }[];
  selectedTags: string[];
  onToggleTag: (name: string) => void;
  onClear: () => void;
}

export default function TagChipBar({
  tags,
  selectedTags,
  onToggleTag,
  onClear,
}: TagChipBarProps) {
  const hot = useMemo(
    () =>
      tags
        .filter((t) => t.count >= 3)
        .sort((a, b) => b.count - a.count)
        .slice(0, 12),
    [tags]
  );

  if (hot.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {selectedTags.length > 0 && (
        <button
          onClick={onClear}
          className="text-[10px] text-[#2f96d4] hover:underline mr-1 flex-shrink-0"
        >
          清除筛选
        </button>
      )}
      {hot.map((tag) => {
        const sel = selectedTags.includes(tag.name);
        return (
          <button
            key={tag.name}
            onClick={() => onToggleTag(tag.name)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
              sel
                ? "bg-[#2f96d4] text-white shadow-sm"
                : "bg-[#f3f7fc] text-[#6b7280] hover:bg-[#eef7fc] hover:text-[#2f96d4]"
            }`}
          >
            {tag.name}
          </button>
        );
      })}
    </div>
  );
}
