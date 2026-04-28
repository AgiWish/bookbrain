"use client";

import React, { useState, useEffect, useCallback } from "react";
import KnowledgeGraph from "@/components/graph/KnowledgeGraph";
import GraphControls from "@/components/graph/GraphControls";
import BookmarkDetail from "@/components/bookmarks/BookmarkDetail";

interface GraphNode {
  id: string;
  title: string;
  tag: string;
  val: number;
}

interface GraphLink {
  source: string;
  target: string;
  similarity: number;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export default function GraphPage() {
  const [data, setData] = useState<GraphData>({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [threshold, setThreshold] = useState(0.7);
  const [limit, setLimit] = useState(100);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const fetchGraphData = useCallback(async () => {
    try {
      const res = await fetch(`/api/graph?limit=${limit}`);
      const graphData = await res.json();
      setData(graphData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchGraphData();
  }, [fetchGraphData]);

  const handleLimitChange = (newLimit: number) => {
    setLoading(true);
    setLimit(newLimit);
  };

  // Filter links by threshold
  const filteredLinks = data.links.filter(link => link.similarity >= threshold);

  return (
    <div className="flex-1 relative overflow-hidden" style={{ backgroundColor: "#0F1117" }}>
      {loading ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
          <div className="w-10 h-10 border-2 border-[#4F8EF7]/30 border-t-[#4F8EF7] rounded-full animate-spin" />
          <p className="text-xs text-[#9099B5] font-bold tracking-widest uppercase">正在构建知识网络...</p>
        </div>
      ) : (
        <>
          <KnowledgeGraph 
            data={{ nodes: data.nodes, links: filteredLinks as any }} 
            onNodeClick={setSelectedId} 
          />
          
          <GraphControls 
            threshold={threshold} 
            setThreshold={setThreshold} 
            limit={limit} 
            setLimit={handleLimitChange} 
          />

          {/* Legend */}
          <div className="absolute bottom-6 left-6 p-4 rounded-xl border border-[#2E3347] bg-[#1A1D27]/80 backdrop-blur-md space-y-2">
            <h4 className="text-[10px] font-bold text-[#9099B5] uppercase mb-2">分类说明</h4>
            <div className="flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full bg-[#4F8EF7]" /> <span className="text-[#E8EAF0]">技术开发</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full bg-[#8B6CF7]" /> <span className="text-[#E8EAF0]">人工智能</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full bg-[#34D399]" /> <span className="text-[#E8EAF0]">产品设计</span>
            </div>
          </div>
        </>
      )}

      <BookmarkDetail id={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}
