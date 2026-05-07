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
  bookmarks: {
    url: string;
    title: string;
    addDate?: string;
    folder?: string;
    source: "chrome" | "tabbit";
  }[];
  duplicates: { id: string; title: string; url: string; source: string }[];
}

interface DedupReport {
  totalInput?: number;
  uniqueCount?: number;
  duplicateCount?: number;
  uniqueBookmarks?: PreviewData["bookmarks"];
  duplicatePairs?: {
    kept: { id: string; title: string; url: string; source: string };
    removed: { id: string; title: string; url: string; source: string };
  }[];
}

async function parseJsonResponse<T = unknown>(res: Response): Promise<T> {
  const ct = res.headers.get("content-type") ?? "";
  if (!ct.includes("application/json")) {
    const snippet = (await res.text()).slice(0, 200);
    throw new Error(
      `服务器返回了非 JSON 响应（${res.status}）。可能是代理拦截了请求，请检查系统代理设置。\n${snippet}`
    );
  }
  return res.json() as Promise<T>;
}

export default function ImportPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = useCallback(async (files: File[]) => {
    setStep(2); // Parsing...
    setError(null);

    try {
      const formData = new FormData();
      files.forEach(file => formData.append("files", file));

      const res = await fetch("/api/bookmarks/dedup-preview", {
        method: "POST",
        body: formData,
      });
      const data = await parseJsonResponse<DedupReport>(res);
      setPreviewData({
        stats: {
          total: data.totalInput ?? 0,
          unique: data.uniqueCount ?? 0,
          duplicate: data.duplicateCount ?? 0,
        },
        bookmarks: Array.isArray(data.uniqueBookmarks) ? data.uniqueBookmarks : [],
        duplicates: (data.duplicatePairs ?? []).map((pair) => pair.removed),
      });
      setStep(3); // Preview
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "解析失败");
      setStep(1);
    }
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!previewData) return;
    setError(null);
    try {
      const res = await fetch("/api/bookmarks/import", {
        method: "POST",
        body: JSON.stringify({ bookmarks: previewData.bookmarks }),
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const errData = await parseJsonResponse<{ error?: string }>(res);
        throw new Error(errData.error ?? `导入失败（${res.status}）`);
      }
      await parseJsonResponse(res);

      // Keep bulk AI processing opt-in so importing large bookmark files does not create surprise token cost.
      if (process.env.NEXT_PUBLIC_BOOKBRAIN_AUTO_AI_PROCESS === "true") {
        fetch("/api/ai/process-batch", { method: "POST" }).catch(() => {});
      }

      setStep(4); // Finished
      setTimeout(() => router.push("/bookmarks"), 2000);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "导入失败");
    }
  }, [previewData, router]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6" style={{ backgroundColor: "#f3f7fc" }}>
      <div className="w-full max-w-2xl space-y-8">
        {/* Progress Header */}
        <div className="flex items-center justify-between px-4">
          <StepIndicator current={step} step={1} label="上传文件" />
          <div className="h-px bg-[#e6edf5] flex-1 mx-4" />
          <StepIndicator current={step} step={2} label="解析去重" />
          <div className="h-px bg-[#e6edf5] flex-1 mx-4" />
          <StepIndicator current={step} step={3} label="确认预览" />
          <div className="h-px bg-[#e6edf5] flex-1 mx-4" />
          <StepIndicator current={step} step={4} label="导入完成" />
        </div>

        {/* Content Area */}
        <div className="min-h-[400px]">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-[12px] text-red-600 whitespace-pre-line">{error}</p>
              <button onClick={() => setError(null)} className="mt-1 text-[11px] text-red-400 hover:underline">
                关闭
              </button>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-[#1f2937] mb-2">导入您的书签</h1>
                <p className="text-[#98a2b3]">我们支持从各大浏览器导出的 HTML 文件中提取并智能分类您的书签</p>
              </div>
              <FileUploadZone onUpload={handleUpload} />
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <div className="w-12 h-12 border-4 border-[#2f96d4] border-t-transparent rounded-full animate-spin" />
              <p className="text-[#1f2937] font-medium">正在解析书签内容并识别重复项...</p>
              <p className="text-[#98a2b3] text-sm italic">这通常需要几秒钟</p>
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
              <div className="w-16 h-16 bg-[#34D399] rounded-full flex items-center justify-center text-3xl shadow-lg">
                <svg width="24" height="24" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="2">
                  <path d="M4 8l3 3 5-6"/>
                </svg>
              </div>
              <h2 className="text-xl font-bold text-[#1f2937]">导入成功！</h2>
              <p className="text-[#98a2b3]">正在为您跳转到书签库，深度 AI 处理可后续手动触发。</p>
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
            ? "bg-[#2f96d4] border-[#2f96d4] text-white scale-110 shadow-sm"
            : done
              ? "bg-[#34D399] border-[#34D399] text-white"
              : "bg-white border-[#e6edf5] text-[#98a2b3]"
        }`}
      >
        {done ? <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 8l3 3 5-6"/></svg> : step}
      </div>
      <span className={`text-[10px] font-bold uppercase tracking-widest ${active ? "text-[#1f2937]" : "text-[#98a2b3]"}`}>
        {label}
      </span>
    </div>
  );
}
