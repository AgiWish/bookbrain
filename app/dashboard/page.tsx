"use client";

import React, { useState, useEffect, useCallback } from "react";
import StatsCard from "@/components/stats/StatsCard";
import ProcessingStatus from "@/components/ai/ProcessingStatus";

interface TagStat {
  name: string;
  count: number;
}

interface DashboardStats {
  totalBookmarks: number;
  processedBookmarks: number;
  totalTags: number;
  pendingBookmarks: number;
  tagDistribution: TagStat[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/stats");
      const data = await res.json();
      setStats(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Avoid synchronous setState in effect
    void fetchStats();
  }, [fetchStats]);

  if (loading || !stats) {
    return (
      <div className="p-8 space-y-8 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-[#1A1D27] rounded-2xl border border-[#2E3347]" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 bg-[#1A1D27] rounded-2xl border border-[#2E3347]" />
          <div className="h-80 bg-[#1A1D27] rounded-2xl border border-[#2E3347]" />
        </div>
      </div>
    );
  }

  const maxCount = Math.max(...stats.tagDistribution.map((t) => t.count));

  return (
    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8" style={{ backgroundColor: "#0F1117" }}>
      <header>
        <h1 className="text-2xl font-bold text-white">统计仪表盘</h1>
        <p className="text-sm text-[#9099B5]">概览您的知识库状态与 AI 索引进度</p>
      </header>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard label="总书签数" value={stats.totalBookmarks} icon="📚" trend={{ value: 12, isUp: true }} />
        <StatsCard label="已处理" value={stats.processedBookmarks} icon="✨" />
        <StatsCard label="知识标签" value={stats.totalTags} icon="🏷️" />
        <StatsCard label="待优化" value={stats.pendingBookmarks} icon="⏳" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tag Distribution - CSS Bar Chart */}
        <div className="lg:col-span-2 p-6 rounded-2xl border border-[#2E3347]" style={{ backgroundColor: "#1A1D27" }}>
          <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-wider">热门标签分布</h3>
          <div className="space-y-4">
            {stats.tagDistribution.map((tag) => (
              <div key={tag.name} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-[#E8EAF0]">{tag.name}</span>
                  <span className="text-[#9099B5]">{tag.count} 书签</span>
                </div>
                <div className="h-1.5 w-full bg-[#0F1117] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#4F8EF7] rounded-full transition-all duration-1000"
                    style={{ width: `${(tag.count / maxCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Status */}
        <ProcessingStatus 
          processed={stats.processedBookmarks} 
          total={stats.totalBookmarks} 
          isProcessing={stats.pendingBookmarks > 0} 
        />
      </div>

      {/* Recent Activity */}
      <section className="p-6 rounded-2xl border border-[#2E3347]" style={{ backgroundColor: "#1A1D27" }}>
        <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">最近动态</h3>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 text-sm text-[#9099B5] border-b border-[#2E3347]/50 pb-3 last:border-0 last:pb-0">
              <div className="w-2 h-2 rounded-full bg-[#4F8EF7]" />
              <p className="flex-1">
                <span className="text-[#E8EAF0]">新导入</span> 了 24 个书签，来源：Chrome 导出
              </p>
              <span className="text-[10px]">2小时前</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
