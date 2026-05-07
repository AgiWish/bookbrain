"use client";

import React, { useState, useEffect, useCallback } from "react";
import StatsCard from "@/components/stats/StatsCard";
import ProcessingStatus from "@/components/ai/ProcessingStatus";

interface TagStat {
  name: string;
  count: number;
}

interface DashboardStats {
  total: number;
  processed: number;
  pending: number;
  tagCount: number;
  topTags: TagStat[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/stats");
      const data = await res.json();
      setStats({
        total: data.total ?? 0,
        processed: data.processed ?? 0,
        pending: data.pending ?? 0,
        tagCount: data.tagCount ?? 0,
        topTags: Array.isArray(data.topTags) ? data.topTags : [],
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // This client dashboard loads stats after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchStats();
  }, [fetchStats]);

  if (loading || !stats) {
    return (
      <div className="p-8 space-y-8 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-white rounded-2xl border border-[#e6edf5]" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 bg-white rounded-2xl border border-[#e6edf5]" />
          <div className="h-80 bg-white rounded-2xl border border-[#e6edf5]" />
        </div>
      </div>
    );
  }

  const tagDistribution = stats.topTags ?? [];
  const maxCount = Math.max(1, ...tagDistribution.map((t) => t.count));

  return (
    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8" style={{ backgroundColor: "#f3f7fc" }}>
      <header>
        <h1 className="text-2xl font-bold text-[#1f2937]">统计仪表盘</h1>
        <p className="text-sm text-[#98a2b3]">概览您的知识库状态与 AI 索引进度</p>
      </header>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard label="总书签数" value={stats.total} icon={<svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="#2f96d4" strokeWidth="1.3"><path d="M3 2h10a1 1 0 011 1v11l-6-3-6 3V3a1 1 0 011-1z"/></svg>} trend={{ value: 12, isUp: true }} />
        <StatsCard label="已处理" value={stats.processed} icon={<svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="#34D399" strokeWidth="1.3"><path d="M4 8l3 3 5-6"/></svg>} />
        <StatsCard label="知识标签" value={stats.tagCount} icon={<svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="#F59E0B" strokeWidth="1.3"><path d="M2 3h4l2-2h6a1 1 0 011 1v10a1 1 0 01-1 1H2a1 1 0 01-1-1V4a1 1 0 011-1z"/></svg>} />
        <StatsCard label="待优化" value={stats.pending} icon={<svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="#98a2b3" strokeWidth="1.3"><circle cx="8" cy="8" r="6"/><path d="M8 4v4l2.5 2.5"/></svg>} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tag Distribution - CSS Bar Chart */}
        <div className="lg:col-span-2 p-6 rounded-2xl border border-[#e6edf5]" style={{ backgroundColor: "#fff" }}>
          <h3 className="text-sm font-bold text-[#1f2937] mb-6 uppercase tracking-wider">热门标签分布</h3>
          <div className="space-y-4">
            {tagDistribution.map((tag) => (
              <div key={tag.name} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-[#1f2937]">{tag.name}</span>
                  <span className="text-[#98a2b3]">{tag.count} 书签</span>
                </div>
                <div className="h-1.5 w-full bg-[#f3f7fc] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#2f96d4] rounded-full transition-all duration-1000"
                    style={{ width: `${(tag.count / maxCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Status */}
          <ProcessingStatus
          processed={stats.processed}
          total={stats.total}
          isProcessing={stats.pending > 0}
        />
      </div>

      {/* Recent Activity */}
      <section className="p-6 rounded-2xl border border-[#e6edf5]" style={{ backgroundColor: "#fff" }}>
        <h3 className="text-sm font-bold text-[#1f2937] mb-4 uppercase tracking-wider">最近动态</h3>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 text-sm text-[#98a2b3] border-b border-[#e6edf5] pb-3 last:border-0 last:pb-0">
              <div className="w-2 h-2 rounded-full bg-[#2f96d4]" />
              <p className="flex-1">
                <span className="text-[#1f2937]">新导入</span> 了 24 个书签，来源：Chrome 导出
              </p>
              <span className="text-[10px]">2小时前</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
