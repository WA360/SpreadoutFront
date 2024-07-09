// src/components/Graph.tsx
import React, { useRef, useEffect, useState } from "react";
import * as d3 from "d3";
import { useQuery } from "@tanstack/react-query";
import Slider from 'react-slider';
import './slider.css';
import test from "node:test";
// import { fetchPdf, DataResponse } from "./getPdf";

interface Node {
  id: number;
  level: number;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface Link {
  source: number | Node;
  target: number | Node;
  value: number;
}

interface GraphData {
  nodes: Node[];
  links: Link[];
}

interface GraphProps {
  data: GraphData;
  onNodeClick: (pageNumber: number) => void;
}

const Graph: React.FC<GraphProps> = ({ data, onNodeClick }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [level, setLevel] = useState<number>(3);
  // const [data, setData] = useState<GraphData | null>(null);
  const [nodes, setNodes] = useState<Node[]>(data.nodes);
  const [links, setLinks] = useState<Link[]>(data.links);
  const [links2, setLinks2] = useState<Link[]>(data.links);
// 테스트 하느라 잠깐 data에 고정된 값 넣어줌
  // const { data, error, isPending } = useQuery<DataResponse>({
  //   queryKey: ["fetchPdf"],
  //   queryFn: fetchPdf,
  // });


  // if (isPending) return <div>Loading...</div>;
  // if (error) return <div>Error loading data</div>;
  // if (1) return;

  // useEffect(() => {
  //   fetch("/graph_data.json")
  //     .then((response) => response.json())
  //     .then((data) => {
  //       console.log(data);
  //       // setData(data);
  //     })
  //     .catch((error) => console.error("Error loading JSON:", error));
  // }, []);

  // 선택한 레벨에 따라 필터링된 노드와 링크

  useEffect(()=>{
    setNodes(data.nodes.filter(node => node.level <= level));
  },[level])

  useEffect(()=>{

    setLinks(data.links.filter(link => {
      const isSourceNode = typeof link.source !== "number";
      const isTargetNode = typeof link.target !== "number";
  
      const isSourceValid = isSourceNode ? nodes.some(node => node.id === (link.source as Node).id) : nodes.some(node => node.id === link.source);
      const isTargetValid = isTargetNode ? nodes.some(node => node.id === (link.target as Node).id) : nodes.some(node => node.id === link.target);
  
      return isSourceValid && isTargetValid;
    }));
  },[nodes])


  useEffect(() => {
    if (!data || !svgRef.current) return;

    const width = 600;
    const height = 800;

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    svg.selectAll("*").remove(); // 기존 그래픽 지우기

    const g = svg.append("g");

    const zoom = d3.zoom<SVGSVGElement, unknown>().on("zoom", (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
      g.attr("transform", event.transform);
    });

    svg.call(zoom);

    const simulation = d3
      .forceSimulation<Node, Link>(nodes)
      .force(
        "link",
        d3
          .forceLink<Node, Link>(links)
          .id((d : Node) => (d as Node).id)
          .distance(150)
      )
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2));
      // .force("radial", d3.forceRadial(Math.min(width, height) / 3).strength(0.02)); // 원형으로 배치되게

    const link = g
      .append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .attr("class", "link")
      .attr("stroke", "#999")
      .attr("stroke-width", (d : Link) => Math.sqrt(d.value) * 2);

    const node = g
      .append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(nodes)
      .enter()
      .append("g");

    node
      .append("circle")
      .attr("r", 50)
      .attr("fill", "#00b4d8")
      .on("click", (event: MouseEvent, d : Node) => {
        const id = (d as Node).id;
        onNodeClick(id); // 페이지 번호를 상위 컴포넌트로 전달
      })
      .call(
        d3
          .drag<SVGCircleElement, Node>()
          .on("start", (event: d3.D3DragEvent<SVGCircleElement, Node>, d : Node) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event: d3.D3DragEvent<SVGCircleElement, Node>, d : Node) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event: d3.D3DragEvent<SVGCircleElement, Node>, d : Node) => {
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
      .text((d : Node) => d.id.toString());

    simulation.on("tick", () => {
      link
        .attr("x1", (d : Link) => (d.source as Node).x!)
        .attr("y1", (d : Link) => (d.source as Node).y!)
        .attr("x2", (d : Link) => (d.target as Node).x!)
        .attr("y2", (d : Link) => (d.target as Node).y!);

      node.attr("transform", (d : Node) => `translate(${d.x},${d.y})`);
    });

    const initialScale = 0.5;
    const initialTranslate: [number, number] = [width / 2, height / 2];

    svg.call(
      zoom.transform,
      d3.zoomIdentity.translate(initialTranslate[0], initialTranslate[1]).scale(initialScale)
    );

  }, [nodes, links, level]);

  return (
    <div className="w-[600px] flex-shrink-0">
      <Slider
        value={level}
        onChange={setLevel}
        min={1}
        max={3}
        step={1}
        renderThumb={(props, state) => <div {...props}>{state.valueNow}</div>}
        className="my-slider"
        thumbClassName="slider-thumb"
        trackClassName="slider-track"
      />
      <svg ref={svgRef} className="w-[600px]"></svg>
    </div>
  );
};

export default Graph;
