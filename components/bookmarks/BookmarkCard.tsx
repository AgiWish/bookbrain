"use client";

import React, { useState } from "react";

interface BookmarkCardProps {
  bookmark: {
    id: string;
    title: string;
    url: string;
    summary?: string;
    tags: string[];
    processed: boolean;
    pinned?: boolean;
    favicon?: string;
    category?: string;
    subfolder?: string;
  };
  onClick: (id: string) => void;
  onTogglePin?: (id: string) => void;
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

function getFaviconUrl(url: string): string | null {
  try {
    const { origin } = new URL(url);
    return `${origin}/favicon.ico`;
  } catch {
    return null;
  }
}

function domainColor(domain: string): string {
  const colors = [
    "#2f96d4", "#8B6CF7", "#34D399", "#F59E0B", "#EF4444",
    "#EC4899", "#06B6D4", "#84CC16", "#F97316", "#6366F1",
  ];
  let hash = 0;
  for (let i = 0; i < domain.length; i++) {
    hash = ((hash << 5) - hash + domain.charCodeAt(i)) | 0;
  }
  return colors[Math.abs(hash) % colors.length];
}

function FaviconImage({ src, domain, alt, color }: { src: string; domain: string; alt: string; color: string }) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [allFailed, setAllFailed] = useState(false);

  const handleError = () => {
    // Try DuckDuckGo as fallback
    if (currentSrc.includes('/favicon.ico')) {
      setCurrentSrc(`https://icons.duckduckgo.com/ip3/${domain}.ico`);
    } else {
      setAllFailed(true);
    }
  };

  if (allFailed) {
    return (
      <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold text-white" style={{ backgroundColor: color }}>
        {alt}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={currentSrc}
      alt=""
      width={32}
      height={32}
      className="w-8 h-8 object-cover rounded-full"
      onError={handleError}
    />
  );
}

export default function BookmarkCard({ bookmark, onClick, onTogglePin }: BookmarkCardProps) {
  const domain = getDomain(bookmark.url);
  const subtitle = bookmark.subfolder
    ? `${bookmark.subfolder} · ${domain}`
    : domain;
  const initial = domain.charAt(0).toUpperCase();
  const color = domainColor(domain);
  // Use stored favicon if available, otherwise generate from URL
  const faviconSrc = bookmark.favicon || getFaviconUrl(bookmark.url);

  return (
    <div
      onClick={() => onClick(bookmark.id)}
      className="group relative flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-[#f6fbff]"
    >
      {/* Pin button */}
      {onTogglePin && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onTogglePin(bookmark.id);
          }}
          className={`absolute top-2 right-2 p-1 rounded transition-opacity ${
            bookmark.pinned
              ? "opacity-100"
              : "opacity-0 group-hover:opacity-100"
          }`}
          title={bookmark.pinned ? "取消收藏" : "收藏"}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill={bookmark.pinned ? "#F59E0B" : "none"}
            stroke={bookmark.pinned ? "#F59E0B" : "#c0c7d5"}
            strokeWidth="1.3"
          >
            <path d="M8 1l2.2 4.5L15 6.3l-3.5 3.4.8 4.9L8 12.4l-4.3 2.2.8-4.9L1 6.3l4.8-.8z"/>
          </svg>
        </button>
      )}

      {/* Favicon */}
      <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden shadow-sm mt-0.5">
        {faviconSrc ? (
          <FaviconImage src={faviconSrc} domain={domain} alt={initial} color={color} />
        ) : (
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold text-white" style={{ backgroundColor: color }}>
            {initial}
          </div>
        )}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0 pr-4">
        <p className="text-[14px] text-[#1f2937] truncate leading-snug font-medium group-hover:text-[#187dbd] transition-colors">
          {bookmark.title}
        </p>
        <p className="text-[12px] text-[#98a2b3] truncate mt-0.5 leading-relaxed">
          {subtitle}
        </p>
      </div>
    </div>
  );
}
