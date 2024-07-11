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
  data: GraphData;
  onNodeClick: (pageNumber: number) => void;
  key?: string | number; // key 속성 정의
}

const Graph: React.FC<GraphProps> = ({ data, onNodeClick }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [level, setLevel] = useState<number>(3);
  const [nodes, setNodes] = useState<Node[]>(data.nodes);
  const [links, setLinks] = useState<Link[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // useEffect(() => {
  //   setNodes(data.nodes.filter((node) => node.level <= level));
  // }, [data.nodes, level]);
  useEffect(() => {
    if (!data.links[0]) return;
    const filteredNodes = data.nodes.filter((node) => node.level <= level);

    setNodes(filteredNodes);
    console.log('data', data);
    console.log('filteredNodes', filteredNodes);

    setLinks(
      data.links.filter((link) => {
        const sourceId =
          typeof link.source === 'number'
            ? link.source
            : (link.source as Node).id;
        const targetId =
          typeof link.target === 'number'
            ? link.target
            : (link.target as Node).id;

        const isSourceValid = filteredNodes.some(
          (node) => node.id === sourceId,
        );
        const isTargetValid = filteredNodes.some(
          (node) => node.id === targetId,
        );

        // console.log('sourceId', sourceId);
        // console.log('targetId', targetId);
        // console.log('isSourceValid', isSourceValid);
        // console.log('isTargetValid', isTargetValid);

        return isSourceValid && isTargetValid && link.value >= 0.85;
      }),
    );
  }, [data.nodes, data.links, level]);

  useEffect(() => {
    console.log('links===>', links);
  }, [links]);

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
      .forceSimulation<Node>(nodes)
      .force(
        'link',
        d3
          .forceLink<Node, Link>(links)
          .id((d) => d.id)
          // .distance(500), // 링크의 길이를 줄입니다.
      )
      .force('charge', d3.forceManyBody()) // 충돌 강도를 높입니다.
      // .force('center', d3.forceCenter(width / 2, height / 2))
      .force('x', d3.forceX())
      .force('y', d3.forceY())
      .force('collision', d3.forceCollide().radius(300)); // 충돌 방지 영역을 좁힙니다.

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
          return '#0349ec'; // 짙은 파란색
        case 2:
          return '#00b4d8'; // 중간 파란색
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
      .attr('r', (d: Node) => Math.max(5, 100 / d.level)) // 레벨에 따라 반지름을 조정하고 최소값을 설정합니다.
      .attr('fill', (d: Node) => getNodeColor(d.level)) // 레벨에 따라 색상 설정
      .on('click', (event: MouseEvent, d: Node) => {
        onNodeClick(d.page); // 페이지 번호를 상위 컴포넌트로 전달
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

      node.attr('transform', (d) => `translate(${d.x},${d.y})`);
    });

    // 노드가 줄어들 때 시뮬레이션 강제 재시작
    simulation.nodes(filteredNodes).alpha(1).restart();

    const initialScale = 0.08;
    const initialTranslate: [number, number] = [width / 2, height / 2];

    svg.call(
      zoom.transform,
      d3.zoomIdentity
        .translate(initialTranslate[0], initialTranslate[1])
        .scale(initialScale),
    );
  }, [nodes, links, level, searchTerm]);

  return (
    <div className="w-[800px] flex-shrink-0">
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
