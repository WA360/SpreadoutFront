import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import Slider from 'react-slider';
import './slider.css';

// Node 인터페이스 정의
interface Node extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  group: string;
  level: string;
  start_page?: number;
  end_page?: number;
  bookmarked: number;
  pdf_file_id: number;
}

// Link 인터페이스 정의
interface Link extends d3.SimulationLinkDatum<Node> {
  id: number;
  similarity: number;
  source_id: number;
  target_id: number;
  source: string | Node;
  target: string | Node;
  pdf_file_id: number;
}

// Data 인터페이스 정의
interface Data {
  nodes: Node[];
  links: Link[];
}

interface GraphProps {
  data: Data;
  onNodeClick: (node: Node) => void;
}

// 데이터 변환 함수
const transformData = (data: any): Data => {
  const nodes: Node[] = data.nodes.map((node: any) => ({
    ...node,
    id: String(node.id), // id를 string으로 변환
    group: String(node.group), // group을 string으로 변환
    level: String(node.level),
  }));

  const links: Link[] = data.links
    .filter((link: any) => {
      const sourceExists = nodes.find(
        (node) => node.id === String(link.source),
      );
      const targetExists = nodes.find(
        (node) => node.id === String(link.target),
      );
      if (!sourceExists)
        console.warn(`Node not found for source: ${link.source}`);
      if (!targetExists)
        console.warn(`Node not found for target: ${link.target}`);
      return sourceExists && targetExists;
    })
    .map((link: any) => ({
      ...link,
      id: String(link.id),
      source: String(link.source),
      target: String(link.target),
    }));

  return { nodes, links };
};

const dragstarted = (
  event: d3.D3DragEvent<SVGCircleElement, Node, Node>,
  simulation: d3.Simulation<Node, Link>,
) => {
  if (!event.active) simulation.alphaTarget(0.3).restart();
  event.subject.fx = event.subject.x;
  event.subject.fy = event.subject.y;
};

const dragged = (event: d3.D3DragEvent<SVGCircleElement, Node, Node>) => {
  event.subject.fx = event.x;
  event.subject.fy = event.y;
};

const dragended = (
  event: d3.D3DragEvent<SVGCircleElement, Node, Node>,
  simulation: d3.Simulation<Node, Link>,
) => {
  if (!event.active) simulation.alphaTarget(0);
  event.subject.fx = null;
  event.subject.fy = null;
};

// 노드 크기를 결정하는 함수
const getNodeSize = (level: string): number => {
  switch (level) {
    case '1':
      return 10; // 레벨 1이 가장 큼
    case '2':
      return 7;
    case '3':
      return 5;
    case '4':
      return 3;
    default:
      return 1; // 기본 크기
  }
};

const Graph: React.FC<GraphProps> = ({ data, onNodeClick }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [transformedData, setTransformedData] = useState<Data>({
    nodes: [],
    links: [],
  });

  useEffect(() => {
    setTransformedData(transformData(data));
  }, [data]);

  useEffect(() => {
    if (!svgRef.current || transformedData.nodes.length === 0) return;

    const width = 600;
    const height = 800;

    const color = d3.scaleOrdinal(d3.schemeCategory10);

    const simulation: d3.Simulation<Node, Link> = d3
      .forceSimulation<Node>(transformedData.nodes)
      .force(
        'link',
        d3.forceLink<Node, Link>(transformedData.links).id((d: Node) => d.id),
      )
      .force('charge', d3.forceManyBody<Node>())
      .force('x', d3.forceX<Node>())
      .force('y', d3.forceY<Node>());

    const svg = d3
      .select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [-width / 2, -height / 2, width, height]);

    svg.selectAll('*').remove(); // Clear previous render

    const g = svg.append('g');

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.6, 6])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
        updateTextVisibility(event.transform.k);
      });

    svg.call(zoom);

    const link = g
      .append('g')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .selectAll('line')
      .data(transformedData.links)
      .join('line')
      .attr('stroke-width', 2);

    const node = g
      .append('g')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5)
      .selectAll<SVGCircleElement, Node>('circle')
      .data(transformedData.nodes)
      .join('circle')
      .attr('r', (d) => getNodeSize(d.level))
      .attr('fill', (d) => color(d.level))
      .on('click', (event, d) => onNodeClick(d))
      .call(
        d3
          .drag<SVGCircleElement, Node>()
          .on('start', (event) => dragstarted(event, simulation))
          .on('drag', dragged)
          .on('end', (event) => dragended(event, simulation)),
      );

    node.append('title').text((d) => d.id);

    const text = g
      .append('g')
      .selectAll('text')
      .data(transformedData.nodes)
      .join('text')
      .attr('x', 12)
      .attr('y', '0.31em')
      .style('font-size', '16px')
      .text((d) => d.name);

    const updateTextVisibility = (zoomLevel: number) => {
      text
        .style('font-size', `${Math.max(12 / zoomLevel, 2)}px`)
        .style('display', zoomLevel > 3 ? 'block' : 'none');
    };

    simulation.on('tick', () => {
      link
        .attr('x1', (d) => (d.source as Node).x!)
        .attr('y1', (d) => (d.source as Node).y!)
        .attr('x2', (d) => (d.target as Node).x!)
        .attr('y2', (d) => (d.target as Node).y!);

      node.attr('cx', (d) => d.x!).attr('cy', (d) => d.y!);

      text.attr('x', (d) => d.x!).attr('y', (d) => d.y!);
    });

    return () => {
      simulation.stop();
    };
  }, [transformedData, onNodeClick]);

  return (
    <div>
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default Graph;
