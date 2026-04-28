"use client";

import React from "react";

interface TagFilterProps {
  tags: { name: string; count: number }[];
  selectedTags: string[];
  onToggleTag: (tagName: string) => void;
  onClear: () => void;
}

export default function TagFilter({ tags, selectedTags, onToggleTag, onClear }: TagFilterProps) {
  return (
    <div className="w-60 flex-shrink-0 flex flex-col h-full border-r border-[#2E3347] overflow-hidden" style={{ backgroundColor: "#1A1D27" }}>
      <div className="p-4 flex items-center justify-between border-bottom border-[#2E3347]">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#9099B5]">标签筛选</h3>
        {selectedTags.length > 0 && (
          <button 
            onClick={onClear}
            className="text-[10px] text-[#4F8EF7] hover:underline"
          >
            清除
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
        {tags.map((tag) => {
          const isSelected = selectedTags.includes(tag.name);
          return (
            <button
              key={tag.name}
              onClick={() => onToggleTag(tag.name)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all text-sm group ${
                isSelected 
                  ? "bg-[#4F8EF7] text-white" 
                  : "text-[#9099B5] hover:bg-[#2A2F45] hover:text-[#E8EAF0]"
              }`}
            >
              <span className="truncate">{tag.name}</span>
              <span 
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  isSelected ? "bg-white/20" : "bg-[#22263A] group-hover:bg-[#3D4460]"
                }`}
              >
                {tag.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
