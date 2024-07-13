import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import Slider from 'react-slider';
import './slider.css';
import { set } from 'zod';

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

// 데이터 변환 함수
const transformData = (data: any): Data => {
  const nodes: Node[] = data.nodes.map((node: any) => ({
    ...node,
    id: String(node.id), // id를 string으로 변환
    group: String(node.group), // group을 string으로 변환
    level: String(node.level),
  }));

  const links: Link[] = data.links
    .map((link: any) => ({
      ...link,
      id: String(link.id),
      source: String(link.source),
      target: String(link.target),
    }))
    .filter((link: any) => {
      const sourceExists = nodes.find((node) => node.id === link.source);
      const targetExists = nodes.find((node) => node.id === link.target);
      if (!sourceExists)
        console.warn(`Node not found for source: ${link.source}`);
      if (!targetExists)
        console.warn(`Node not found for target: ${link.target}`);
      return sourceExists && targetExists;
    });

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

const Graph: React.FC<any> = ({ data, onNodeClick }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [level, setLevel] = useState<number>(3);
  const [useData, setUseData] = useState<Data>(data);
  const [nodes, setNodes] = useState<Node[]>(data.nodes);
  const [links, setLinks] = useState<Link[]>([data.links]);
  const [searchTerm, setSearchTerm] = useState<string>('');


  useEffect(() => {
    console.log();
    if (svgRef.current) {
      const width = 600;
      const height = 800;

      // 노드의 색상을 결정하는 스케일 함수 정의
      const color = d3.scaleOrdinal(d3.schemeCategory10);

      // 데이터 변환 및 준비
      const { nodes, links } = transformData(data);

      if (svgRef.current) {
        // 힘 시뮬레이션 설정
        const simulation: d3.Simulation<Node, Link> = d3
          .forceSimulation<Node, Link>(nodes)
          .force(
            'link',
            d3.forceLink<Node, Link>(links).id((d: Node) => d.id),
          )
          .force('charge', d3.forceManyBody<Node>())
          .force('x', d3.forceX<Node>())
          .force('y', d3.forceY<Node>());

        // 초기 줌 상태 설정
        const initialZoom = 1; // 초기 줌 레벨을 1로 설정 (필요에 따라 조정 가능)

        const updateTextVisibility = (zoomLevel: number) => {
          d3.select(svgRef.current)
            .selectAll('text')
            .style('font-size', `${Math.max(12 / zoomLevel, 2)}px`)
            .style('display', zoomLevel > 3 ? 'block' : 'none');
        };

        const zoom = d3
          .zoom<SVGSVGElement, unknown>()
          .scaleExtent([0.6, 5]) // 줌 스케일 범위 설정 (60% ~ 300%)
          .on('zoom', (event) => {
            if (!svgRef.current) return;
            // 줌 이벤트에 따라 SVG 그룹 요소 변환
            d3.select(svgRef.current)
              .select('g')
              .attr('transform', event.transform);
            updateTextVisibility(event.transform.k);
          });

        // SVG 요소 생성 및 설정
        const svg = d3
          .select(svgRef.current)
          .attr('width', width)
          .attr('height', height)
          .attr('viewBox', [-width / 2, -height / 2, width, height])
          .attr('style', 'max-width: 100%; height: auto;')
          .call(zoom)
          .call(zoom.transform, d3.zoomIdentity.scale(initialZoom)) // 초기 줌 상태 적용
          .append('g');

        // 링크(선) 요소 생성
        const link = svg
          .append('g')
          .attr('stroke', '#999')
          .attr('stroke-opacity', 0.6)
          .selectAll('line')
          .data(links)
          .join('line')
          .attr('stroke-width', 2);

        // 노드(원) 요소 생성
        const node = svg
          .append('g')
          .attr('stroke', '#fff')
          .attr('stroke-width', 1.5)
          .selectAll<SVGCircleElement, Node>('circle')
          .data(nodes)
          .join('circle')
          .attr('r', (d) => getNodeSize(d.level))
          .attr('fill', (d) => color(d.level));

        // 노드에 타이틀(툴팁) 추가
        node.append('title').text((d) => d.id);

        // 텍스트 라벨 생성
        const text = svg
          .append('g')
          .selectAll('text')
          .data(nodes)
          .join('text')
          .attr('x', 10)
          .attr('y', '0.31em')
          .style('font-size', '12px')
          .text((d) => d.name);

        // 초기 텍스트 가시성 설정
        updateTextVisibility(initialZoom);

        node.call(
          d3
            .drag<SVGCircleElement, Node>()
            .on('start', (event) => dragstarted(event, simulation))
            .on('drag', dragged)
            .on('end', (event) => dragended(event, simulation)),
        );

        // 시뮬레이션 틱 이벤트 처리 (매 프레임마다 요소 위치 업데이트)
        simulation.on('tick', () => {
          link
            .attr('x1', (d) =>
              typeof d.source === 'string' ? 0 : (d.source as Node).x!,
            )
            .attr('y1', (d) =>
              typeof d.source === 'string' ? 0 : (d.source as Node).y!,
            )
            .attr('x2', (d) =>
              typeof d.target === 'string' ? 0 : (d.target as Node).x!,
            )
            .attr('y2', (d) =>
              typeof d.target === 'string' ? 0 : (d.target as Node).y!,
            );

          node.attr('cx', (d) => d.x!).attr('cy', (d) => d.y!);
          text.attr('x', (d) => d.x!).attr('y', (d) => d.y!);
        });

        // 컴포넌트 언마운트 시 시뮬레이션 정지
        return () => {
          simulation.stop();
        };
      }
    }
  }, [data, useData]);

  return (
    <div className="w-[600px] flex-shrink-0">
      <input
        type="text"
        placeholder="Search nodes"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="search-input"
      />
      <Slider
        value={level}
        onChange={setLevel}
        min={1}
        max={3}
        step={1}
        renderThumb={(props, state) => {
          const { key, ...restProps } = props;
          return (
            <div key={key} {...restProps}>
              {state.valueNow}
            </div>
          );
        }}
        className="my-slider"
        thumbClassName="slider-thumb"
        trackClassName="slider-track"
      />
      <svg ref={svgRef} className="w-[800px]"></svg>
    </div>
  );
};

export default Graph;
