import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import Slider from 'react-slider';
import './slider.css';

interface Node {
  id: number;
  name: string;
  page: number;
  level: number;
  bookmarked: number;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface Link {
  id: number;
  source: number | Node;
  target: number | Node;
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
  if (!data) return null;
  const svgRef = useRef<SVGSVGElement>(null);
  const [level, setLevel] = useState<number>(3);
  const [nodes, setNodes] = useState<Node[]>(data.nodes);
  const [links, setLinks] = useState<Link[]>(data.links);
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    setNodes(data.nodes.filter((node) => node.level <= level));
  }, [data]);

  useEffect(() => {
    setLinks(
      data.links.filter((link) => {
        const isSourceNode = typeof link.source !== 'number';
        const isTargetNode = typeof link.target !== 'number';

        const isSourceValid = isSourceNode
          ? nodes.some((node) => node.id === (link.source as Node).id)
          : nodes.some((node) => node.id === link.source);
        const isTargetValid = isTargetNode
          ? nodes.some((node) => node.id === (link.target as Node).id)
          : nodes.some((node) => node.id === link.target);

        return isSourceValid && isTargetValid && link.value >= 0.85;
      }),
    );
  }, [nodes]);

  useEffect(() => {
    if (!nodes.length || !svgRef.current) return;

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
          .forceLink<Node, Link>(links)
          .id((d: Node) => d.id)
          .distance(2000),
      )
      .force('charge', d3.forceManyBody().strength(-100))
      .force('center', d3.forceCenter(width / 2, height / 2));

    const link = g
      .append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('class', 'link')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', (d: Link) => Math.sqrt(d.value) * 2);

    const getNodeColor = (level: number) => {
      switch (level) {
        case 1:
          return '#0349ec'; // 빨간색
        case 2:
          return '#00b4d8'; // 파란색
        case 3:
          return '#90e0ef'; // 연한 파란색
        default:
          return '#00b4d8'; // 기본 색상
      }
    };

    const filteredNodes = nodes.filter((node) =>
      node.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    const node = g
      .append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(filteredNodes)
      .enter()
      .append('g');

    node
      .append('circle')
      .attr('r', (d: Node) => 100 / d.level) // 레벨에 따라 반지름 설정
      .attr('fill', (d: Node) => getNodeColor(d.level)) // 레벨에 따라 색상 설정
      .on('click', (event: MouseEvent, d: Node) => {
        onNodeClick(d.page); // 페이지 번호를 상위 컴포넌트로 전달
        console.log('page 전달 : ', d.page);
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
      .text((d: Node) => d.name);

    simulation.on('tick', () => {
      link
        .attr('x1', (d: Link) => (d.source as Node).x!)
        .attr('y1', (d: Link) => (d.source as Node).y!)
        .attr('x2', (d: Link) => (d.target as Node).x!)
        .attr('y2', (d: Link) => (d.target as Node).y!);

      node.attr('transform', (d: Node) => `translate(${d.x},${d.y})`);
    });

    // 노드가 줄어들 때 시뮬레이션 강제 재시작
    simulation.nodes(filteredNodes).alpha(1).restart();

    const initialScale = 0.1;
    const initialTranslate: [number, number] = [width / 2, height / 2];

    svg.call(
      zoom.transform,
      d3.zoomIdentity
        .translate(initialTranslate[0], initialTranslate[1])
        .scale(initialScale),
    );
  }, [links, searchTerm]); // 검색어에 따라 useEffect가 호출되도록 추가

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
