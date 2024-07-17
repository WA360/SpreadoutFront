import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { OriginGraphData } from '@/app/(main)/page';
import { useRecoilState } from 'recoil';
import { selectedTocState } from '@/recoil/atoms';
import './style.css';

// Node 인터페이스 정의
interface Node extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  group: string;
  level: string;
  start_page: number;
  end_page: number;
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

// SessionNode 인터페이스 정의
interface SessionNode extends d3.SimulationNodeDatum {
  id: string;
  chapter_id: string;
  name: string;
  level: string;
}

// SessionLink 인터페이스 정의
interface SessionLink extends d3.SimulationLinkDatum<Node | SessionNode> {
  id: number;
  pdf_file_id: number;
  similarity: number;
  source: string | SessionNode; // 세션노드
  target: string | Node; // 챕터노드
}

// Data 인터페이스 정의
interface Data {
  nodes: Node[];
  links: Link[];
  session_nodes: SessionNode[];
  session_links: SessionLink[];
}

interface GraphProps {
  data: OriginGraphData;
  handleNodeClick: (pageNumber: number) => void;
  handleSessionNodeClick: (sessionId: number) => void;
}

// 데이터 변환 함수
const transformData = (data: any): Data => {
  // 노드 변환
  const nodes: Node[] = data.nodes.map((node: any) => ({
    ...node,
    id: String(node.id), // id를 string으로 변환
    group: String(node.group), // group을 string으로 변환
    level: String(node.level),
  }));

  // 세션노드 변환
  const session_nodes: SessionNode[] = data.session_nodes.map(
    (session_node: any) => ({
      ...session_node,
      id: String(session_node.id), // id를 string으로 변환
      level: String(session_node.level),
    }),
  );

  // 챕터 링크 변환
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

  // 세션 링크 변환
  const session_links: SessionLink[] = data.session_links
    .filter((session_link: any) => {
      const sourceExists = session_nodes.find(
        // source에 세션노드
        (session_node) => session_node.id === String(session_link.source),
      );
      const targetExists = nodes.find(
        // target에 챕터노드
        (node) => node.id === String(session_link.target),
      );
      if (!sourceExists)
        console.warn(
          `SessionNode not found for source: ${session_link.source}`,
        );
      if (!targetExists)
        console.warn(`Node not found for target: ${session_link.target}`);
      return sourceExists && targetExists;
    })
    .map((session_link: any) => ({
      ...session_link,
      id: String(session_link.id),
      source: String(session_link.source),
      target: String(session_link.target),
    }));

  return { nodes, links, session_nodes, session_links };
};

const dragstarted = (
  event: d3.D3DragEvent<
    SVGCircleElement,
    Node | SessionNode,
    Node | SessionNode
  >,
  simulation: d3.Simulation<Node | SessionNode, Link | SessionLink>,
) => {
  if (!event.active) simulation.alphaTarget(0.3).restart();
  event.subject.fx = event.subject.x;
  event.subject.fy = event.subject.y;
};

const dragged = (
  event: d3.D3DragEvent<
    SVGCircleElement,
    Node | SessionNode,
    Node | SessionNode
  >,
) => {
  event.subject.fx = event.x;
  event.subject.fy = event.y;
};

const dragended = (
  event: d3.D3DragEvent<
    SVGCircleElement,
    Node | SessionNode,
    Node | SessionNode
  >,
  simulation: d3.Simulation<Node | SessionNode, Link | SessionLink>,
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
      return 5; // 기본 크기
  }
};

const Graph: React.FC<GraphProps> = ({
  data,
  handleNodeClick,
  handleSessionNodeClick,
}) => {
  console.log("test");
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [transformedData, setTransformedData] = useState<Data>({
    nodes: [],
    links: [],
    session_nodes: [],
    session_links: [],
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Node[]>([]);
  const [selectedToc, setSelectedToc] = useRecoilState(selectedTocState);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const handleResize = () => {
      if (svgRef.current) {
        setDimensions({
          width: svgRef.current.parentElement!.parentElement!.clientWidth,
          height: svgRef.current.parentElement!.parentElement!.clientHeight,
        });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    console.log('dimensions', dimensions);
  }, [dimensions]);

  useEffect(() => {
    setTransformedData(transformData(data));
  }, [data]);

  useEffect(() => {
    // 그룹별로 노드 분류 및 초기 위치 설정
    const groupedNodes = d3.group(transformedData.nodes, (d) => d.group);
    const groups = Array.from(groupedNodes.keys());

    const width = dimensions.width;
    const height = dimensions.height;

    // 그룹 위치 계산
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 3;

    groups.forEach((group, index) => {
      const angle = (index / groups.length) * 2 * Math.PI;
      const groupX = centerX + radius * Math.cos(angle);
      const groupY = centerY + radius * Math.sin(angle);

      const groupNodes = groupedNodes.get(group) || [];
      groupNodes.forEach((node, i) => {
        const nodeRadius = 50 + i * 20;
        const nodeAngle = angle + ((i / groupNodes.length) * Math.PI) / 2;
        node.x = groupX + nodeRadius * Math.cos(nodeAngle);
        node.y = groupY + nodeRadius * Math.sin(nodeAngle);
      });
    });
  }, [transformedData]);

  useEffect(() => {
    if (!svgRef.current || transformedData.nodes.length === 0) return;

    const width = dimensions.width;
    const height = dimensions.height;

    const color = d3.scaleOrdinal(d3.schemeCategory10);

    const simulation: d3.Simulation<Node | SessionNode, Link | SessionLink> = d3
      .forceSimulation<Node | SessionNode>([
        ...transformedData.nodes,
        ...transformedData.session_nodes,
      ]) // 세션 노드 추가
      .force(
        'link',
        d3
          .forceLink<
            Node | SessionNode,
            Link | SessionLink
          >([...transformedData.links, ...transformedData.session_links])
          .id((d: Node | SessionNode) => d.id),
      )
      .force('charge', d3.forceManyBody<Node | SessionNode>())
      .force('x', d3.forceX<Node | SessionNode>())
      .force('y', d3.forceY<Node | SessionNode>());

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
      .data([...transformedData.links, ...transformedData.session_links]) // 세션 링크 추가
      .join('line')
      .attr('stroke-width', 2);

    const node = g
      .append('g')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5)
      .selectAll<SVGCircleElement, Node | SessionNode>('circle')
      .data([...transformedData.nodes, ...transformedData.session_nodes]) // 세션 노드 추가
      .join('circle')
      .attr('r', (d) => getNodeSize((d as Node).level)) // Node와 SessionNode 모두 처리
      .attr('fill', (d) => color((d as Node).level))
      .attr('class', (d) => (searchResults.includes(d as Node) ? 'pulse' : '')) // 검색된 노드에 펄스 애니메이션
      .on('click', (event, d: Node | SessionNode) => {
        console.log('testtttt');
        if ('start_page' in d) {
          // selectedToc 업데이트
          // selectedToc가 업데이트 되면 page.tsx에 있는 selectedToc를 구독하는 useEffect가 작동해서 탭 열어줌
          setSelectedToc({
            id: Number(d.id),
            startPage: d.start_page,
            bookmarked: d.bookmarked
          });
        } else if ('chapter_id' in d) {
          // chapter_id의 존재로 세션노드 구분
          handleSessionNodeClick(Number(d.id));
        }
      })
      .on('mouseover', (event, d: Node | SessionNode) => {
        d3.select(event.currentTarget).classed('node-highlight', true); // 노드 강조 클래스 추가
        const text = svg.selectAll('text').filter((node) => node === d);
        text.style('display', 'block'); // 제목 강조 표시
      })
      .on('mouseout', (event) => {
        d3.select(event.currentTarget).classed('node-highlight', false); // 노드 강조 클래스 제거
        svg.selectAll('text').style('display', 'none'); // 제목 강조 제거
      })
      .call(
        d3
          .drag<SVGCircleElement, Node | SessionNode>()
          .on('start', (event) => dragstarted(event, simulation))
          .on('drag', dragged)
          .on('end', (event) => dragended(event, simulation)),
      );

    node.append('title').text((d) => d.id);

    const text = g
      .append('g')
      .selectAll('text')
      .data([...transformedData.nodes, ...transformedData.session_nodes]) // 세션 노드 추가
      .join('text')
      .attr('class', 'node-title') // 제목 클래스 추가
      .attr('x', 12)
      .attr('y', '0.31em')
      .style('font-size', '16px')
      .style('display', 'none')
      .text((d) => d.name);

    const updateTextVisibility = (zoomLevel: number) => {
      const levelVisibility = (level: string, zoomLevel: number) => {
        switch (level) {
          case '1':
            return zoomLevel >= 0 ? 'block' : 'none';
          case '2':
            return zoomLevel >= 2 ? 'block' : 'none';
          case '3':
            return zoomLevel >= 4 ? 'block' : 'none';
          case '4':
            return zoomLevel >= 6 ? 'block' : 'none';
          default:
            return 'none';
        }
      };

      text
        .style(
          'font-size',
          (d: Node | SessionNode) => `${Math.max(12 / zoomLevel, 2)}px`,
        )
        .style('display', (d: Node | SessionNode) =>
          levelVisibility((d as Node).level, zoomLevel),
        );
    };

    simulation.on('tick', () => {
      link
        .attr('x1', (d) => (d.source as Node | SessionNode).x!)
        .attr('y1', (d) => (d.source as Node | SessionNode).y!)
        .attr('x2', (d) => (d.target as Node | SessionNode).x!)
        .attr('y2', (d) => (d.target as Node | SessionNode).y!);

      node
        .attr('cx', (d) => (d as Node | SessionNode).x!)
        .attr('cy', (d) => (d as Node | SessionNode).y!);

      text
        .attr('x', (d) => (d as Node | SessionNode).x!)
        .attr('y', (d) => (d as Node | SessionNode).y!);
    });

    return () => {
      simulation.stop();
    };
  }, [transformedData, searchResults]); // searchResults를 dependency로 추가

  const handleSearch = () => {
    const trimmedQuery = searchQuery.trim();

    if (trimmedQuery === '') {
      setSearchResults([]);
      return;
    }
    // 검색어를 포함하는 노드 필터링
    const filteredNodes = transformedData.nodes.filter((node) =>
      node.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    setSearchResults(filteredNodes);
  };

  return (
    <div>
      <div>
        <input
          type="text"
          className="search-box"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button className="search-button" onClick={handleSearch}>
          검색
        </button>
      </div>
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default Graph;
