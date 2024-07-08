import React from 'react';
import LogoutButton from './LogoutButton/LogoutButton';
 
const Header = () => {
  return (
    <div className="h-16 w-full border-b flex justify-between items-center p-5">
      <div>Logo</div>
      <LogoutButton />
      <div>Login</div>
    </div>
  );
};

export default Header;
