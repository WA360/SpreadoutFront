import React from 'react';
import LogoutButton from './LogoutButton/LogoutButton';

const Header = () => {
  return (
    <div className="h-[60px] w-full border-b flex justify-between items-center p-5">
      <div>Logo</div>
      <LogoutButton />
    </div>
  );
};

export default Header;
