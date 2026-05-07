"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  title: string;
  tag: string;
  val: number;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
  similarity: number;
}

interface KnowledgeGraphProps {
  data: {
    nodes: GraphNode[];
    links: GraphLink[];
  };
  onNodeClick: (id: string) => void;
}

export default function KnowledgeGraph({ data, onNodeClick }: KnowledgeGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);

  const initGraph = useCallback(() => {
    if (!svgRef.current || !data.nodes.length) return;

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg.append("g");

    // Zoom setup
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => g.attr("transform", event.transform));

    svg.call(zoom);

    // Simulation setup
    const simulation = d3.forceSimulation<GraphNode>(data.nodes)
      .force("link", d3.forceLink<GraphNode, GraphLink>(data.links).id(d => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-150))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(30));

    // Colors
    const colorScale = d3.scaleOrdinal(d3.schemeTableau10);

    // Links
    const link = g.append("g")
      .attr("stroke", "#e6edf5")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(data.links)
      .join("line")
      .attr("stroke-width", d => Math.sqrt(d.similarity) * 2);

    // Nodes
    const node = g.append("g")
      .selectAll<SVGCircleElement, GraphNode>("circle")
      .data(data.nodes)
      .join("circle")
      .attr("r", d => 6 + (d.val || 1))
      .attr("fill", d => colorScale(d.tag))
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .style("cursor", "pointer")
      .on("click", (_event, d) => onNodeClick(d.id))
      .on("mouseover", (event, d) => {
        setHoveredNode(d);
        d3.select(event.currentTarget).attr("stroke", "#2f96d4").attr("stroke-width", 3);
      })
      .on("mouseout", (event) => {
        setHoveredNode(null);
        d3.select(event.currentTarget).attr("stroke", "#fff").attr("stroke-width", 1.5);
      })
      .call(d3.drag<SVGCircleElement, GraphNode>()
        .on("start", (event) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          event.subject.fx = event.subject.x;
          event.subject.fy = event.subject.y;
        })
        .on("drag", (event) => {
          event.subject.fx = event.x;
          event.subject.fy = event.y;
        })
        .on("end", (event) => {
          if (!event.active) simulation.alphaTarget(0);
          event.subject.fx = null;
          event.subject.fy = null;
        })
      );

    simulation.on("tick", () => {
      link
        .attr("x1", d => (d.source as GraphNode).x!)
        .attr("y1", d => (d.source as GraphNode).y!)
        .attr("x2", d => (d.target as GraphNode).x!)
        .attr("y2", d => (d.target as GraphNode).y!);

      node
        .attr("cx", d => d.x!)
        .attr("cy", d => d.y!);
    });

    return () => { simulation.stop(); };
  }, [data, onNodeClick]);

  useEffect(() => {
    return initGraph();
  }, [initGraph]);

  return (
    <div className="relative w-full h-full">
      <svg ref={svgRef} className="w-full h-full" />

      {/* Tooltip */}
      {hoveredNode && (
        <div
          className="absolute pointer-events-none p-3 rounded-lg border border-[#e6edf5] shadow-xl text-xs max-w-xs animate-in fade-in duration-200"
          style={{
            backgroundColor: "#fff",
            left: "50%",
            bottom: "40px",
            transform: "translateX(-50%)"
          }}
        >
          <p className="text-[#1f2937] font-bold truncate">{hoveredNode.title}</p>
          <p className="text-[#98a2b3] mt-1">分类: {hoveredNode.tag}</p>
        </div>
      )}
    </div>
  );
}
