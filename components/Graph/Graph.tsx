import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { OriginGraphData } from '@/app/(main)/page';
import { useRecoilState, useRecoilValue } from 'recoil';
import {
  pdfFileState,
  selectedPdfIdState,
  selectedTocState,
  pdfDataState,
} from '@/recoil/atoms';
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
  filename: string;
  summary: string;
  keywords: string[];
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
  summary: string;
  level: string;
  bookmarked: number;
  keywords: string[];
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
export interface Data {
  nodes: Node[];
  links: Link[];
  session_nodes: SessionNode[];
  session_links: SessionLink[];
}

export interface GraphProps {
  iskey: string; // 일반 그래프인지, 북마크 그래프인지
  data: OriginGraphData;
  handleNodeClick: (pageNumber: number) => void;
  handleSessionNodeClick: (sessionId: number) => void;
}

// 데이터 변환 함수
const transformData = (iskey: string, data: any): Data => {
  // 노드 변환
  let nodeIds: string[] = [];
  let nodes: Node[] = data.nodes.map((node: any) => ({
    ...node,
    id: String(node.id), // id를 string으로 변환
    group: String(node.group), // group을 string으로 변환
    level: String(node.level),
  }));

  // 세션노드 변환
  let session_nodes: SessionNode[] = data.session_nodes.map(
    (session_node: any) => ({
      ...session_node,
      id: String(session_node.id), // id를 string으로 변환
      level: String(session_node.level),
    }),
  );

  if (iskey === 'bookmarked') {
    nodes = nodes.filter((node) => {
      if (node.bookmarked === 1) {
        nodeIds.push(node.id);
      }
      return node.bookmarked === 1;
    });
  }

  // 챕터 링크 변환
  const links: Link[] = data.links
    .filter((link: any) => {
      const sourceExists = nodes.find(
        (node) => node.id === String(link.source),
      );
      const targetExists = nodes.find(
        (node) => node.id === String(link.target),
      );
      // similarity가 0.8 이상과 -1만 연결
      return sourceExists && targetExists;

      // return sourceExists && targetExists && link.similarity >= 0.8;
      // return sourceExists && targetExists;
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
      return sourceExists && targetExists;
    })
    .map((session_link: any) => ({
      ...session_link,
      id: String(session_link.id),
      source: String(session_link.source),
      target: String(session_link.target),
    }));

  if (iskey === 'bookmarked') {
    let sessionIds: string[] = [];
    session_links.map((session_link) => {
      if (nodeIds.includes(String(session_link.target))) {
        sessionIds.push(String(session_link.source));
      }
    });

    session_nodes = session_nodes.filter((session_node) => {
      return sessionIds.includes(session_node.id);
    });
  }

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

export default function Graph({
  iskey,
  data,
  handleNodeClick,
  handleSessionNodeClick,
}: GraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [transformedData, setTransformedData] = useState<Data>({
    nodes: [],
    links: [],
    session_nodes: [],
    session_links: [],
  });
  const [pdfData, setPdfData] = useRecoilState<Data | null>(pdfDataState); // pdf link, node 전역업데이트
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Node[]>([]);
  const [selectedToc, setSelectedToc] = useRecoilState(selectedTocState);
  const selectedPdfId = useRecoilValue(selectedPdfIdState);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const [sourceNode, setSourceNode] = useState<string>('');
  const [targetNode, setTargetNode] = useState<string>('');

  const [hoveredNodeName, setHoveredNodeName] = useState<string>('');
  const [hoveredNodeSummary, setHoveredNodeSummary] = useState<string>('');
  const [hoveredNodeKeywords, setHoveredNodeKeywords] = useState<string>('');
  const [similarityThreshold, setSimilarityThreshold] = useState<number>(0.8); // similarity threshold 추가
  const [structLink, setStructLink] = useState<boolean>(true);

  useEffect(() => {
    setStructLink(true);
  }, [pdfData]);

  // 버튼 클릭 핸들러
  const structLinkToggle = () => {
    setStructLink(!structLink);
    console.log('pdfData', pdfData);
    // transformedData를 변경 가능한 새로운 객체로 복제
    const mutableTransformedData = JSON.parse(JSON.stringify(pdfData));

    const normalLinks = [
      ...transformedData.links,
      ...transformedData.session_links,
    ].filter((link) => (link as Link).similarity !== -1);

    setTransformedData((prevData) => {
      return {
        ...prevData,
        links: structLink ? normalLinks : mutableTransformedData.links, // 또는 pdfData.links 사용
      };
    });
  };

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

  const updateDimensions = useCallback(() => {
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      setDimensions({ width, height });
    }
  }, []);

  useEffect(() => {
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    updateDimensions(); // 초기 크기 설정

    return () => {
      resizeObserver.disconnect();
    };
  }, [updateDimensions]);

  useEffect(() => {
    setTransformedData(transformData(iskey, data));
    setPdfData(transformData(iskey, data));
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

    // similarity가 -1인 경우는 기존 연결대로 연결
    const filteredLinks = [
      ...transformedData.links,
      ...transformedData.session_links,
    ].filter((link) => (link as Link).similarity === -1);

    const link = g
      .append('g')
      .attr('stroke', '#000')
      .attr('stroke-opacity', 1)
      .selectAll('line')
      .data(filteredLinks) // filtered links
      .join('line')
      .attr('stroke-width', 2);

    // similarity가 -1이 아닌 링크는 약한 연결로 연결
    const normalLinks = [
      ...transformedData.links,
      ...transformedData.session_links,
    ].filter(
      (link) =>
        (link as Link).similarity !== -1 &&
        (link as Link).similarity >= similarityThreshold,
    );

    const normalLinksGroup = g
      .append('g')
      .attr('stroke', '#0f0') // Change stroke color to green
      .attr('stroke-opacity', 1)
      .selectAll('line')
      .data(normalLinks) // normal links
      .join('line')
      .attr('stroke-width', 1.5);

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
        if ('start_page' in d) {
          // selectedToc 업데이트
          // selectedToc가 업데이트 되면 page.tsx에 있는 selectedToc를 구독하는 useEffect가 작동해서 탭 열어줌
          setSelectedToc({
            id: Number(d.id),
            startPage: d.start_page,
            bookmarked: d.bookmarked,
          });
        } else if ('chapter_id' in d) {
          // chapter_id의 존재로 세션노드 구분
          handleSessionNodeClick(Number(d.id));
        }
      })
      .on('mouseover', (event, d: Node | SessionNode) => {
        setHoveredNodeName(d.name);
        setHoveredNodeSummary(d.summary);
        setHoveredNodeKeywords(d.keywords.join(', '));
        d3.select(event.currentTarget).classed('node-highlight', true); // 노드 강조 클래스 추가
        const text = svg.selectAll('text').filter((node) => node === d);
        text.style('display', 'block'); // 제목 강조 표시
      })
      .on('mouseout', (event) => {
        setHoveredNodeName('');
        setHoveredNodeSummary('');
        setHoveredNodeKeywords('');
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

    // node.append('title').text((d) => d.id);

    const text = g
      .append('g')
      .selectAll('text')
      .data([...transformedData.nodes, ...transformedData.session_nodes]) // 세션 노드 추가
      .join('text')
      .attr('class', 'node-title') // 제목 클래스 추가
      .attr('x', 12)
      .attr('y', '0.31em')
      .style('font-size', '12px')
      .style('display', 'none')
      .text((d) => d.name);

    const updateTextVisibility = (zoomLevel: number) => {
      const levelVisibility = (level: string, zoomLevel: number) => {
        switch (level) {
          case '1':
            return zoomLevel >= 0 ? 'block' : 'none';
          case '2':
            return zoomLevel >= 4 ? 'block' : 'none';
          case '3':
            return zoomLevel >= 5 ? 'block' : 'none';
          case '4':
            return zoomLevel >= 6 ? 'block' : 'none';
          default:
            return 'none';
        }
      };

      text
        .style(
          'font-size',
          (d: Node | SessionNode) => `${Math.max(16 / zoomLevel, 2)}px`,
        )
        .style('display', (d: Node | SessionNode) =>
          levelVisibility((d as Node).level, zoomLevel),
        );
    };

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.6, 6]) // 줌의 최소 및 최대 비율 설정
      .on('zoom', (event) => {
        g.attr('transform', event.transform); // g 요소에 변환 적용
        updateTextVisibility(event.transform.k); // 텍스트 가시성 업데이트
      });

    svg
      .call(zoom)
      .call(zoom.transform, d3.zoomIdentity.translate(0, 0).scale(3)); // 초기 확대/축소 비율 설정

    simulation.on('tick', () => {
      link
        .attr('x1', (d) => (d.source as Node | SessionNode).x!)
        .attr('y1', (d) => (d.source as Node | SessionNode).y!)
        .attr('x2', (d) => (d.target as Node | SessionNode).x!)
        .attr('y2', (d) => (d.target as Node | SessionNode).y!);

      normalLinksGroup
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
  }, [transformedData, dimensions, searchResults, similarityThreshold]); // searchResults를 dependency로 추가

  const performSearch = () => {
    const trimmedQuery = searchQuery.trim();

    if (trimmedQuery === '') {
      setSearchResults([]);
      return;
    }
    // 검색어를 포함하는 노드 필터링
    const filteredNodes = transformedData.nodes.filter((node) => {
      // name 속성 검색
      const nameMatch = node.name
        .toLowerCase()
        .includes(trimmedQuery.toLowerCase());

      // keywords 배열 검색
      const keywordsMatch = node.keywords.some((keyword) =>
        keyword.toLowerCase().includes(trimmedQuery.toLowerCase()),
      );

      return nameMatch || keywordsMatch;
    });

    setSearchResults(filteredNodes);
  };

  // Handler for key press
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      performSearch();
    }
  };

  const getCookieValue = (name: string) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
    return null;
  };

  const customLink = async () => {
    const token = getCookieValue('token');
    try {
      const response = await fetch(
        'http://3.38.176.179:4000/pdf/bookmark/connection',
        {
          method: 'POST',
          headers: {
            token: `${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            source: Number(sourceNode),
            target: Number(targetNode),
            pdfId: Number(selectedPdfId),
          }),
        },
      );

      if (response.ok) {
        const newLink: any = {
          source: sourceNode,
          target: targetNode,
          pdfId: selectedPdfId,
        };

        setTransformedData((prevData) => ({
          ...prevData,
          links: [...prevData.links, newLink],
        }));

        setIsModalOpen(false);
      } else {
        console.error('Failed to create custom link');
      }
    } catch (error) {
      console.error('Error creating custom link:', error);
    }
  };

  const handleSimilarityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSimilarityThreshold(parseFloat(e.target.value));
  };

  return (
    <div ref={containerRef} className="relative h-full w-full">
      <div className="flex">
        <input
          type="text"
          className="search-box"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder='검색어를 입력하세요. (예: "10장")'
        />
        <button className="search-button" onClick={performSearch}>
          검색
        </button>
        {iskey === 'bookmarked' && (
          <button
            className="ml-auto bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            onClick={() => setIsModalOpen(true)}
          >
            커스텀링크
          </button>
        )}
      </div>
      <svg ref={svgRef}></svg>
      {isModalOpen && (
        <div className="absolute inset-0 flex justify-center items-center top-0 left-0">
          <div className="bg-white p-6 rounded shadow-lg w-[400px]">
            <h2 className="text-lg font-bold mb-4">모달 창</h2>
            <select
              className="block appearance-none w-full bg-white border border-gray-400 hover:border-gray-500 px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:shadow-outline mb-4"
              value={sourceNode}
              onChange={(e) => setSourceNode(e.target.value)}
            >
              <option value="">출발 노드를 선택하세요</option>
              {pdfData &&
                pdfData.nodes.map((node) => (
                  <option key={node.id} value={node.id}>
                    {node.name}
                  </option>
                ))}
            </select>
            <select
              className="block appearance-none w-full bg-white border border-gray-400 hover:border-gray-500 px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:shadow-outline mb-4"
              value={targetNode}
              onChange={(e) => setTargetNode(e.target.value)}
            >
              <option value="">도착 노드를 선택하세요</option>
              {pdfData &&
                pdfData.nodes.map((node) => (
                  <option key={node.id} value={node.id}>
                    {node.name}
                  </option>
                ))}
            </select>
            <div className="flex gap-1">
              <button
                className="ml-auto bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                onClick={() => setIsModalOpen(false)}
              >
                취소
              </button>
              <button
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                onClick={customLink}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="absolute w-[160px] bottom-0 right-0 flex">
        <div className="flex flex-col items-end">
          <button
            className={`mb-4 ${structLink ? 'opacity-100' : 'opacity-50'}`}
            onClick={structLinkToggle}
          >
            <svg viewBox="0 0 100 100" width="45" height="45">
              <circle cx="32" cy="20" r="6" fill="#2563EB" />
              <line x1="32" y1="20" x2="58" y2="50" stroke="#2563EB" />
              <circle cx="80" cy="20" r="14" fill="#2563EB" />
              <line x1="80" y1="20" x2="58" y2="50" stroke="#2563EB" />
              <circle cx="58" cy="50" r="12" fill="#2563EB" />
              <circle cx="22" cy="65" r="19" fill="#2563EB" />
              <line x1="22" y1="65" x2="58" y2="50" stroke="#2563EB" />
              <circle cx="48" cy="80" r="5" fill="#2563EB" />
              <circle cx="84" cy="80" r="13" fill="#2563EB" />
              <line x1="84" y1="80" x2="58" y2="50" stroke="#2563EB" />
            </svg>
          </button>
          <label htmlFor="similarity-slider">
            유사도 연결강도: <span>{similarityThreshold.toFixed(2)}</span>
          </label>
          <input
            id="similarity-slider"
            className="w-full"
            type="range"
            min="0.5"
            max="1"
            step="0.01"
            value={similarityThreshold}
            onChange={handleSimilarityChange}
          />
        </div>
      </div>
      {hoveredNodeSummary && hoveredNodeName && (
        <div className="node-title-box flex flex-col">
          <strong className="mt-auto">{hoveredNodeName}</strong>
          {hoveredNodeSummary && (
            <>
              <p className="mt-7 text-slate-300 text-3xl leading-normal">
                키워드: <br />
                {hoveredNodeKeywords}
              </p>
              <hr className="border my-4" />
              {hoveredNodeSummary}
            </>
          )}
        </div>
      )}
    </div>
  );
}
