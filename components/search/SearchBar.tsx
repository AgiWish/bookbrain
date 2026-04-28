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
      <div className="absolute left-6 top-1/2 -translate-y-1/2 text-[#9099B5] group-focus-within:text-[#4F8EF7] transition-colors">
        <span className="text-xl">🔍</span>
      </div>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onSearch()}
        placeholder={placeholder || "搜索书签..."}
        className="w-full pl-16 pr-24 py-6 bg-[#1A1D27] border border-[#2E3347] rounded-2xl text-lg text-white placeholder-[#9099B5] focus:outline-none focus:border-[#4F8EF7] shadow-xl transition-all"
      />
      <div className="absolute right-6 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1.5 px-2 py-1 rounded border border-[#2E3347] bg-[#0F1117] text-[10px] text-[#9099B5]">
        <span className="font-sans">⌘</span>
        <span>K</span>
      </div>
    </div>
  );
}
