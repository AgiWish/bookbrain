"use client";

import React, { useState, useMemo } from "react";

interface TagFilterProps {
  tags: { name: string; count: number }[];
  selectedTags: string[];
  onToggleTag: (tagName: string) => void;
  onClear: () => void;
}

// Top N tags shown as quick-access chips (no search needed)
const HOT_TAG_LIMIT = 12;
// Below hot section, show more in compact list
const LIST_LIMIT = 40;

export default function TagFilter({ tags, selectedTags, onToggleTag, onClear }: TagFilterProps) {
  const [showAll, setShowAll] = useState(false);
  const [search, setSearch] = useState("");

  // Split into hot (top 12 by count) and rest (count >= 2)
  const significant = useMemo(
    () => tags.filter((t) => t.count >= 2).sort((a, b) => b.count - a.count),
    [tags]
  );
  const hotTags = significant.slice(0, HOT_TAG_LIMIT);
  const moreTags = significant.slice(HOT_TAG_LIMIT);

  const filteredMore = useMemo(() => {
    if (!search.trim()) return moreTags;
    return moreTags.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()));
  }, [moreTags, search]);

  const visibleMore = showAll ? filteredMore : filteredMore.slice(0, LIST_LIMIT);

  return (
    <div
      className="w-56 flex-shrink-0 flex flex-col h-full border-r border-[#2E3347] overflow-hidden"
      style={{ backgroundColor: "#1A1D27" }}
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#4A5070]">标签</span>
        {selectedTags.length > 0 && (
          <button
            onClick={onClear}
            className="text-[10px] text-[#4F8EF7] hover:underline"
          >
            清除 ({selectedTags.length})
          </button>
        )}
      </div>

      {/* Selected tags — highlighted at very top */}
      {selectedTags.length > 0 && (
        <div className="px-3 pb-3 flex flex-wrap gap-1.5">
          {selectedTags.map((name) => (
            <button
              key={name}
              onClick={() => onToggleTag(name)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#4F8EF7] text-white shadow-md shadow-[#4F8EF7]/20 hover:bg-[#3b7de3] transition-all"
            >
              {name}
              <span className="opacity-60 text-[10px]">×</span>
            </button>
          ))}
        </div>
      )}

      {/* Hot tags — always visible as chip grid */}
      <div className="px-3 pb-3">
        <p className="text-[9px] text-[#4A5070] uppercase tracking-wider mb-2">热门</p>
        <div className="flex flex-wrap gap-1.5">
          {hotTags.map((tag) => {
            const isSelected = selectedTags.includes(tag.name);
            return (
              <button
                key={tag.name}
                onClick={() => onToggleTag(tag.name)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all border ${
                  isSelected
                    ? "bg-[#4F8EF7] border-[#4F8EF7] text-white shadow-md shadow-[#4F8EF7]/20"
                    : "bg-[#22263A] border-[#2E3347] text-[#9099B5] hover:border-[#4F8EF7] hover:text-[#E8EAF0]"
                }`}
              >
                {tag.name}
                <span className={`ml-1 text-[9px] ${isSelected ? "opacity-70" : "opacity-50"}`}>
                  {tag.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Divider */}
      <div className="mx-3 mb-2 border-t border-[#2E3347]" />

      {/* Search for more tags */}
      <div className="px-3 pb-2">
        <input
          type="text"
          placeholder="找其他标签..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setShowAll(true); }}
          className="w-full text-[11px] px-2.5 py-1.5 rounded-lg bg-[#0F1117] border border-[#2E3347] text-[#E8EAF0] placeholder-[#4A5070] focus:outline-none focus:border-[#4F8EF7] transition-colors"
        />
      </div>

      {/* More tags list */}
      <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5 custom-scrollbar">
        {visibleMore.map((tag) => {
          const isSelected = selectedTags.includes(tag.name);
          return (
            <button
              key={tag.name}
              onClick={() => onToggleTag(tag.name)}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-all text-[11px] ${
                isSelected
                  ? "bg-[#4F8EF7]/10 text-[#4F8EF7] border border-[#4F8EF7]/30"
                  : "text-[#9099B5] hover:bg-[#2A2F45] hover:text-[#E8EAF0]"
              }`}
            >
              <span className="truncate">{tag.name}</span>
              <span className="text-[9px] px-1 py-0.5 rounded bg-[#22263A] flex-shrink-0 ml-1 opacity-60">
                {tag.count}
              </span>
            </button>
          );
        })}

        {!showAll && filteredMore.length > LIST_LIMIT && (
          <button
            onClick={() => setShowAll(true)}
            className="w-full text-center text-[10px] text-[#4F8EF7] hover:text-[#7ab0ff] py-2"
          >
            还有 {filteredMore.length - LIST_LIMIT} 个 · 展开
          </button>
        )}
        {showAll && filteredMore.length > LIST_LIMIT && (
          <button
            onClick={() => setShowAll(false)}
            className="w-full text-center text-[10px] text-[#4A5070] hover:text-[#9099B5] py-2"
          >
            收起
          </button>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-[#2E3347]">
        <p className="text-[9px] text-[#4A5070]">共 {significant.length} 个标签</p>
      </div>
    </div>
  );
}
