"use client";

import React, { useState } from "react";

interface FileUploadZoneProps {
  onUpload: (files: File[]) => void;
}

export default function FileUploadZone({ onUpload }: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      setFiles(prev => [...prev, ...droppedFiles].slice(0, 2));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...selectedFiles].slice(0, 2));
    }
  };

  return (
    <div className="space-y-6">
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative h-64 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all ${
          isDragging
            ? "border-[#2f96d4] bg-[#eef7fc]"
            : "border-[#e6edf5] bg-white hover:border-[#d1d5db]"
        }`}
      >
        <input
          type="file"
          multiple
          onChange={handleFileChange}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#98a2b3" strokeWidth="1" className="mb-4">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
        </svg>
        <p className="text-[#1f2937] font-medium">点击或拖拽 HTML 文件到此处</p>
        <p className="text-[#98a2b3] text-sm mt-2">支持 Chrome / Tabbit 书签导出文件</p>
        <p className="text-[#98a2b3] text-xs mt-1">（最多同时上传 2 个文件）</p>
      </div>

      {files.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-[#98a2b3] uppercase">已选择文件</h4>
          {files.map((file, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#e6edf5]">
              <div className="flex items-center gap-3">
                <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="#98a2b3" strokeWidth="1.3">
                  <path d="M9 1H4a1 1 0 00-1 1v12a1 1 0 001 1h8a1 1 0 001-1V5L9 1z"/>
                </svg>
                <div>
                  <p className="text-sm font-medium text-[#1f2937]">{file.name}</p>
                  <p className="text-[10px] text-[#98a2b3]">{(file.size / 1024).toFixed(2)} KB</p>
                </div>
              </div>
              <button
                onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))}
                className="text-[#98a2b3] hover:text-red-400 p-1"
              >
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M1 1l12 12M13 1L1 13"/>
                </svg>
              </button>
            </div>
          ))}

          <button
            onClick={() => onUpload(files)}
            className="w-full py-3 mt-4 bg-[#2f96d4] hover:bg-[#2580b8] text-white rounded-xl font-bold transition-all shadow-sm active:scale-[0.98]"
          >
            开始分析
          </button>
        </div>
      )}
    </div>
  );
}
