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
            ? "border-[#4F8EF7] bg-[#4F8EF7]/10" 
            : "border-[#2E3347] bg-[#1A1D27] hover:border-[#3D4460]"
        }`}
      >
        <input
          type="file"
          multiple
          onChange={handleFileChange}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
        <div className="text-4xl mb-4">📂</div>
        <p className="text-[#E8EAF0] font-medium">点击或拖拽 HTML 文件到此处</p>
        <p className="text-[#9099B5] text-sm mt-2">支持 Chrome / Tabbit 书签导出文件</p>
        <p className="text-[#9099B5] text-xs mt-1">（最多同时上传 2 个文件）</p>
      </div>

      {files.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-[#9099B5] uppercase">已选择文件</h4>
          {files.map((file, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-[#22263A] border border-[#2E3347]">
              <div className="flex items-center gap-3">
                <span className="text-xl">📄</span>
                <div>
                  <p className="text-sm font-medium text-white">{file.name}</p>
                  <p className="text-[10px] text-[#9099B5]">{(file.size / 1024).toFixed(2)} KB</p>
                </div>
              </div>
              <button 
                onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))}
                className="text-[#9099B5] hover:text-red-400 p-1"
              >
                ✕
              </button>
            </div>
          ))}
          
          <button
            onClick={() => onUpload(files)}
            className="w-full py-3 mt-4 bg-[#4F8EF7] hover:bg-[#3b7de3] text-white rounded-xl font-bold transition-all shadow-lg active:scale-[0.98]"
          >
            开始分析
          </button>
        </div>
      )}
    </div>
  );
}
