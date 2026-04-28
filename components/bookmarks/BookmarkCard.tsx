"use client";

import React from "react";
import Image from "next/image";

interface BookmarkCardProps {
  bookmark: {
    id: string;
    title: string;
    url: string;
    summary?: string;
    tags: string[];
    processed: boolean;
    favicon?: string;
  };
  onClick: (id: string) => void;
}

export default function BookmarkCard({ bookmark, onClick }: BookmarkCardProps) {
  const domain = new URL(bookmark.url).hostname;

  return (
    <div
      onClick={() => onClick(bookmark.id)}
      className="group relative flex flex-col p-4 rounded-xl border border-[#2E3347] transition-all hover:border-[#3D4460] cursor-pointer"
      style={{ backgroundColor: "#1A1D27" }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center border border-[#2E3347]" style={{ backgroundColor: "#22263A" }}>
            {bookmark.favicon ? (
              <Image 
                src={bookmark.favicon} 
                alt="" 
                width={20} 
                height={20} 
                className="w-5 h-5 object-contain" 
                unoptimized
              />
            ) : (
              <span className="text-xs text-[#9099B5]">🌍</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold truncate group-hover:text-[#4F8EF7] transition-colors">
              {bookmark.title}
            </h3>
            <p className="text-[10px] text-[#9099B5] truncate font-mono" style={{ fontFamily: "var(--font-jetbrains-mono)" }}>
              {domain}
            </p>
          </div>
        </div>
        
        {/* Status indicator */}
        <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1 ${bookmark.processed ? 'bg-[#34D399]' : 'bg-[#F59E0B]'}`} />
      </div>

      {/* AI Summary */}
      {bookmark.summary && (
        <div 
          className="mb-4 p-3 rounded-lg text-xs leading-relaxed border-l-2 border-[#8B6CF7]" 
          style={{ backgroundColor: "rgba(139, 92, 246, 0.08)", color: "#E8EAF0" }}
        >
          <span className="inline-block mr-1 text-[#8B6CF7] font-bold">✨ AI:</span>
          {bookmark.summary}
        </div>
      )}

      {/* Tags */}
      <div className="mt-auto flex flex-wrap gap-2">
        {bookmark.tags.map(tag => (
          <span 
            key={tag} 
            className="px-2 py-0.5 rounded text-[10px] font-medium" 
            style={{ backgroundColor: "#2A2F45", color: "#9099B5", border: "1px solid #3D4460" }}
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
