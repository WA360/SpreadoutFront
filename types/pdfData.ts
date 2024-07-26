// Node 인터페이스 정의
interface Node extends d3.SimulationNodeDatum {
  id: string; // 바꿔야함
  name: string; // 바꿀필요 없음
  start_page: number; // 바꿀필요 없음
  end_page: number; // 바꿀필요 없음
  level: string; // 바꿔야함
  bookmarked: number; // 바꿀필요 없음
  group: string; // 바꿔야함
  pdf_file_id: number; // 바꿀필요 없음
  summary: string; // 바꿀필요 없음
  keywords: string[]; // 바꿀필요 없음
  filename: string; // 바꿀 필요 없음
}

// Link 인터페이스 정의
interface Link extends d3.SimulationLinkDatum<Node> {
  id: number; // 바꿔야함
  similarity: number; // 바꿀필요 없음
  source: string | Node; // 바꿔야함
  target: string | Node; // 바꿔야함
  source_id: number; // ?
  target_id: number; // ?
  pdf_file_id: number; // 바꿀필요 없음
  bookmarked?: number; // 바꿀필요 없음
  content?: string; // 바꿀필요 없음
}