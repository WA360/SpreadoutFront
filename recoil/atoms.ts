import { atom } from 'recoil';

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

export const pdfFileState = atom<File | null>({
  key: 'pdfFileState',
  default: null,
});
