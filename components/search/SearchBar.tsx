"use client";

import React, { useEffect, useRef } from "react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  placeholder?: string;
}

export default function SearchBar({ value, onChange, onSearch, placeholder }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="relative group">
      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#98a2b3] group-focus-within:text-[#2f96d4] transition-colors">
        <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="7" cy="7" r="5"/><path d="M11 11l3.5 3.5"/>
        </svg>
      </div>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onSearch()}
        placeholder={placeholder || "搜索书签..."}
        className="w-full pl-14 pr-24 py-5 bg-white border border-[#e6edf5] rounded-xl text-[15px] text-[#1f2937] placeholder-[#98a2b3] focus:outline-none focus:border-[#2f96d4] shadow-sm transition-all"
      />
      <div className="absolute right-5 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1.5 px-2 py-1 rounded border border-[#e6edf5] bg-[#f3f7fc] text-[10px] text-[#98a2b3]">
        <span className="font-sans">⌘</span>
        <span>K</span>
      </div>
    </div>
  );
}
