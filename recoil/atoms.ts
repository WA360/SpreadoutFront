import { atom } from 'recoil';

// 사용자 및 인증 상태를 정의
export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
}

export const authAtom = atom<AuthState>({
  key: 'auth',
  default: {
    isAuthenticated: false,
    user: null,
  },
});

// PDF 파일 상태 정의
export const pdfFileState = atom<File | null>({
  key: 'pdfFileState',
  default: null,
});

// 그래프 데이터 상태 정의
export interface Node {
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

export interface Link {
  id: number;
  source: Node;
  target: Node;
  value: number;
}

export interface GraphData {
  nodes: Node[];
  links: Link[];
}

export const graphDataState = atom<GraphData | null>({
  key: "graphDataState",
  default: null,
});
