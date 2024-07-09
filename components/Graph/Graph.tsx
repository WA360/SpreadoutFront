import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import Slider from 'react-slider';
import './slider.css';

interface Node {
  id: number;
  name: string;
  start_page: number;
  end_page: number;
  level: number;
  bookmarked: number;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface Link {
  id: number;
  source: Node;
  target: Node;
  value: number;
}

interface GraphData {
  nodes: Node[];
  links: Link[];
}

interface GraphProps {
  data: GraphData | null;
  onNodeClick: (pageNumber: number) => void;
}

const Graph: React.FC<GraphProps> = ({ data, onNodeClick }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [level, setLevel] = useState<number>(3);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [links, setLinks] = useState<Link[]>([]);

  // 데이터가 준비되면 상태 업데이트
  useEffect(() => {
    if (data) {
      setNodes(data.nodes.filter((node) => node.level <= level));
    }
  }, [level, data]);

  useEffect(() => {
    if (data) {
      console.log('asdfasdfasdfa', data);
      console.log('alsdkjflaskd', nodes);
      const nodeMap = new Map(nodes.map((node) => [node.id, node]));
      setLinks(
        data.links.map((conn) => ({
          id: conn.id,
          source: nodeMap.get(conn.source.id)!,
          target: nodeMap.get(conn.target.id)!,
          value: conn.value,
        })),
      );
    }
  }, [data, nodes]);

  useEffect(() => {
    if (!nodes.length || !links.length || !svgRef.current) return;

    const width = 600;
    const height = 800;

    const svg = d3
      .select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    svg.selectAll('*').remove(); // 기존 그래픽 지우기

    const g = svg.append('g');

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .on('zoom', (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
        g.attr('transform', event.transform.toString());
      });

    svg.call(zoom);

    const simulation = d3
      .forceSimulation<Node>()
      .force(
        'link',
        d3
          .forceLink<Link>()
          .id((d: Node) => d.id)
          .distance(150)
      )
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .nodes(nodes) // 노드 데이터를 시뮬레이션에 설정
      .on('tick', () => {
        link
          .attr('x1', (d: Link) => d.source.x ?? 0) // 옵셔널 체이닝을 사용하여 기본값 설정
          .attr('y1', (d: Link) => d.source.y ?? 0)
          .attr('x2', (d: Link) => d.target.x ?? 0)
          .attr('y2', (d: Link) => d.target.y ?? 0);

        node.attr('transform', (d: Node) => `translate(${d.x ?? 0},${d.y ?? 0})`);
      });

    simulation.force('link').links(links); // 링크 데이터를 시뮬레이션에 설정

    const link = g
      .append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('class', 'link')
      .attr('stroke', '#999')
      .attr('stroke-width', (d: Link) => Math.sqrt(d.value) * 2);

    const node = g
      .append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g');

    node
      .append('circle')
      .attr('r', 50)
      .attr('fill', '#00b4d8')
      .on('click', (event: MouseEvent, d: Node) => {
        onNodeClick(d.start_page); // start_page를 상위 컴포넌트로 전달
      })
      .call(
        d3
          .drag<SVGCircleElement, Node>()
          .on(
            'start',
            (event: d3.D3DragEvent<SVGCircleElement, Node, Node>, d: Node) => {
              if (!event.active) simulation.alphaTarget(0.3).restart();
              d.fx = d.x;
              d.fy = d.y;
            },
          )
          .on(
            'drag',
            (event: d3.D3DragEvent<SVGCircleElement, Node, Node>, d: Node) => {
              d.fx = event.x;
              d.fy = event.y;
            },
          )
          .on(
            'end',
            (event: d3.D3DragEvent<SVGCircleElement, Node, Node>, d: Node) => {
              if (!event.active) simulation.alphaTarget(0);
              d.fx = null;
              d.fy = null;
            },
          ),
      );

    node
      .append('text')
      .attr('x', 6)
      .attr('y', 3)
      .attr('fill', '#0077b6')
      .attr('font-weight', 'bold')
      .text((d: Node) => d.name.toString()); // 노드 텍스트를 name으로 표시

    const initialScale = 0.5;
    const initialTranslate: [number, number] = [width / 2, height / 2];

    svg.call(
      zoom.transform,
      d3.zoomIdentity
        .translate(initialTranslate[0], initialTranslate[1])
        .scale(initialScale),
    );
  }, [nodes, links]);

  if (!data) return <div>Loading...</div>; // 데이터가 없을 때 로딩 메시지 표시

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
