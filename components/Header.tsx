'use client';

import React, { useEffect } from 'react';
import LogoutButton from './LogoutButton/LogoutButton';
import { leftAsideVisibleState } from '@/recoil/atoms';
import { useRecoilState } from 'recoil';

export default function Header() {
  const [leftAsideVisible, setLeftAsideVisible] = useRecoilState(leftAsideVisibleState);

  const toggleAside = () => {
    setLeftAsideVisible(!leftAsideVisible);
  };

  return (
    <div className="group h-[60px] w-full border-b flex justify-between items-center p-5">
      <div className="flex justify-between w-[292px]">
        <div>
          <svg viewBox="0 0 100 100" width="45" height="45" stroke="black" strokeWidth="3">
            <circle cx="32" cy="20" r="6" fill="black" />
            <line x1="32" y1="20" x2="58" y2="50" />
            <circle cx="80" cy="20" r="14" fill="black" />
            <line x1="80" y1="20" x2="58" y2="50" />
            <circle cx="58" cy="50" r="12" fill="black" />
            <circle cx="22" cy="65" r="19" fill="black" />
            <line x1="22" y1="65" x2="58" y2="50" />
            <circle cx="48" cy="80" r="5" fill="black" />
            <circle cx="84" cy="80" r="13" fill="black" />
            <line x1="84" y1="80" x2="58" y2="50" />
          </svg>
        </div>
        <span className="mr-auto ml-[12px] text-[28px] font-extrabold">Spread Out</span>
        <button
          className={`opacity-0 pointer-events-none group-hover:pointer-events-auto transition-all duration-300 ease-in-out ${!leftAsideVisible && 'group-hover:opacity-100'}`}
          onClick={toggleAside}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 80" width="40" height="40">
            <rect width="100" height="12" rx="8"></rect>
            <rect y="30" width="100" height="12" rx="8"></rect>
            <rect y="60" width="100" height="12" rx="8"></rect>
          </svg>
        </button>
      </div>
      <LogoutButton />
    </div>
  );
}
