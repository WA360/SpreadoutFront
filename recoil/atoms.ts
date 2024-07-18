import { atom, RecoilState } from 'recoil';
import { Data } from '@/components/Graph/Graph';

// 기존 atom 정의

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

export const selectedPdfIdState = atom<number | null>({
  key: 'selectedPdfIdState',
  default: null,
});

// 선택된 목차 항목 상태 정의
export const selectedTocState = atom<{
  id: number;
  startPage: number;
  bookmarked: number;
} | null>({
  key: 'selectedTocState',
  default: null,
});

// pdfData
export const pdfDataState: RecoilState<Data | null> = atom<Data | null>({
  key: 'pdfDataState',
  default: null,
});
