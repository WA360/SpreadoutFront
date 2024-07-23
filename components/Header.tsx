import React from 'react';
import LogoutButton from './LogoutButton/LogoutButton';

export default function Header() {
  return (
    <div className="h-[60px] w-full border-b flex justify-between items-center p-5">
      <div>
        <svg
          viewBox="0 0 100 100"
          width="45"
          height="45"
          stroke="black"
          stroke-width="3"
        >
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
      <LogoutButton />
    </div>
  );
}
