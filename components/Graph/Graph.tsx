// src/components/Graph.tsx
import React, { useRef, useEffect, useState } from "react";
import * as d3 from "d3";
import { useQuery } from "@tanstack/react-query";
import { fetchPdf, DataResponse } from "./getPdf";

interface Node {
  id: string;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface Link {
  source: string | Node;
  target: string | Node;
  value: number;
}

interface GraphData {
  nodes: Node[];
  links: Link[];
}

interface GraphProps {
  onNodeClick: (pageNumber: number) => void;
}

const Graph: React.FC<GraphProps> = ({ onNodeClick }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  // const [data, setData] = useState<GraphData | null>(null);
  const [count, setCount] = useState<Number>(0);
  const { data, error, isPending } = useQuery<DataResponse>({
    queryKey: ["fetchPdf"],
    queryFn: fetchPdf,
  });

  if (isPending) return <div>Loading...</div>;
  if (error) return <div>Error loading data</div>;
  if (1) return;

  // useEffect(() => {
  //   fetch("/graph_data.json")
  //     .then((response) => response.json())
  //     .then((data) => {
  //       console.log(data);
  //       // setData(data);
  //     })
  //     .catch((error) => console.error("Error loading JSON:", error));
  // }, []);

  useEffect(() => {
    if (count) return;
    if (!data || !svgRef.current) return;

    const width = 600;
    const height = 800;

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    const g = svg.append("g");

    const zoom = d3.zoom<SVGSVGElement, unknown>().on("zoom", (event) => {
      g.attr("transform", event.transform);
    });

    svg.call(zoom);

    const simulation = d3
      .forceSimulation<Node, Link>(data.nodes)
      .force(
        "link",
        d3
          .forceLink<Node, Link>(data.links)
          .id((d) => (d as Node).id)
          .distance(600)
      )
      .force("charge", d3.forceManyBody().strength(-500))
      .force("center", d3.forceCenter(width / 2, height / 2));

    const link = g
      .append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(data.links)
      .enter()
      .append("line")
      .attr("class", "link")
      .attr("stroke-width", (d) => Math.sqrt(d.value));

    const node = g
      .append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(data.nodes)
      .enter()
      .append("g");

    node
      .append("circle")
      .attr("r", 100)
      .attr("fill", "#00b4d8")
      .on("click", (event, d) => {
        const id = (d as Node).id;
        const pageNumber = parseInt(
          id.replace("page_", "").replace(".txt", "")
        );
        onNodeClick(pageNumber); // 페이지 번호를 상위 컴포넌트로 전달
      })
      .call(
        d3
          .drag<SVGCircleElement, Node>()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      );

    node
      .append("text")
      .attr("x", 6)
      .attr("y", 3)
      .attr("fill", "#0077b6")
      .attr("font-weight", "bold")
      .text((d) => d.id);

    simulation.on("tick", () => {
      link
        .attr("x1", (d) => (d.source as Node).x!)
        .attr("y1", (d) => (d.source as Node).y!)
        .attr("x2", (d) => (d.target as Node).x!)
        .attr("y2", (d) => (d.target as Node).y!);

      node.attr("transform", (d) => `translate(${d.x},${d.y})`);
    });

    // 초기 줌 설정
    const initialScale = 0.03; // 초기 줌 비율 (적절히 조정 가능)
    const initialTranslate: [number, number] = [width / 2, height / 2]; // 초기 이동 위치

    svg.call(
      zoom.transform,
      d3.zoomIdentity
        .translate(initialTranslate[0], initialTranslate[1])
        .scale(initialScale)
    );
    setCount(1);
  }, [data]);

  return <svg ref={svgRef} className="w-[600px] flex-shrink-0"></svg>;
};

export default Graph;
