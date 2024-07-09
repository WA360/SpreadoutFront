// src/recoil/atom.ts

import { atom } from 'recoil';

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
