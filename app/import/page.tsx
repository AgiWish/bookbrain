"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import FileUploadZone from "@/components/import/FileUploadZone";
import DedupPreview from "@/components/import/DedupPreview";

type Step = 1 | 2 | 3 | 4;

interface PreviewData {
  stats: {
    total: number;
    unique: number;
    duplicate: number;
  };
  duplicates: { id: string; title: string; url: string; source: string }[];
}

export default function ImportPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);

  const handleUpload = useCallback(async (files: File[]) => {
    setStep(2); // Parsing...
    
    try {
      const formData = new FormData();
      files.forEach(file => formData.append("files", file));
      
      const res = await fetch("/api/bookmarks/dedup-preview", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setPreviewData(data);
      setStep(3); // Preview
    } catch (e) {
      console.error(e);
      setStep(1);
    }
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!previewData) return;
    try {
      await fetch("/api/bookmarks/import", {
        method: "POST",
        body: JSON.stringify({ data: previewData }),
        headers: { "Content-Type": "application/json" },
      });
      
      // Trigger AI process
      fetch("/api/ai/process-batch", { method: "POST" }).catch(() => {});
      
      setStep(4); // Finished
      setTimeout(() => router.push("/bookmarks"), 2000);
    } catch (e) {
      console.error(e);
    }
  }, [previewData, router]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6" style={{ backgroundColor: "#0F1117" }}>
      <div className="w-full max-w-2xl space-y-8">
        {/* Progress Header */}
        <div className="flex items-center justify-between px-4">
          <StepIndicator current={step} step={1} label="上传文件" />
          <div className="h-px bg-[#2E3347] flex-1 mx-4" />
          <StepIndicator current={step} step={2} label="解析去重" />
          <div className="h-px bg-[#2E3347] flex-1 mx-4" />
          <StepIndicator current={step} step={3} label="确认预览" />
          <div className="h-px bg-[#2E3347] flex-1 mx-4" />
          <StepIndicator current={step} step={4} label="导入完成" />
        </div>

        {/* Content Area */}
        <div className="min-h-[400px]">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-white mb-2">导入您的书签</h1>
                <p className="text-[#9099B5]">我们支持从各大浏览器导出的 HTML 文件中提取并智能分类您的书签</p>
              </div>
              <FileUploadZone onUpload={handleUpload} />
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <div className="w-12 h-12 border-4 border-[#4F8EF7] border-t-transparent rounded-full animate-spin" />
              <p className="text-[#E8EAF0] font-medium">正在解析书签内容并识别重复项...</p>
              <p className="text-[#9099B5] text-sm italic">这通常需要几秒钟</p>
            </div>
          )}

          {step === 3 && previewData && (
            <DedupPreview 
              stats={previewData.stats} 
              duplicates={previewData.duplicates}
              onConfirm={handleConfirm}
              onCancel={() => setStep(1)}
            />
          )}

          {step === 4 && (
            <div className="flex flex-col items-center justify-center h-64 space-y-4 text-center animate-in zoom-in duration-500">
              <div className="w-16 h-16 bg-[#34D399] rounded-full flex items-center justify-center text-3xl shadow-lg shadow-[#34D399]/20">
                ✓
              </div>
              <h2 className="text-xl font-bold text-white">导入成功！</h2>
              <p className="text-[#9099B5]">正在为您跳转到书签库，AI 助手已开始后台处理...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StepIndicator({ current, step, label }: { current: Step, step: Step, label: string }) {
  const active = current === step;
  const done = current > step;

  return (
    <div className="flex flex-col items-center gap-2">
      <div 
        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border transition-all ${
          active 
            ? "bg-[#4F8EF7] border-[#4F8EF7] text-white scale-110 shadow-lg" 
            : done 
              ? "bg-[#34D399] border-[#34D399] text-white" 
              : "bg-[#1A1D27] border-[#2E3347] text-[#9099B5]"
        }`}
      >
        {done ? "✓" : step}
      </div>
      <span className={`text-[10px] font-bold uppercase tracking-widest ${active ? "text-white" : "text-[#9099B5]"}`}>
        {label}
      </span>
    </div>
  );
}
