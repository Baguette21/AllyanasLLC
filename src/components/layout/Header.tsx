import React from "react";

interface HeaderProps {
  isSticky?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ isSticky }) => {
  return (
    <header
      className={`
        bg-[#F5F2EE] 
        shadow-[0px_4px_4px_rgba(0,0,0,0.25)] 
        flex 
        flex-col 
        justify-center 
        px-2 
        py-[7px]
        ${isSticky ? 'sticky top-0 z-50' : ''}
      `}
    >
      <img
        loading="lazy"
        src="/images/header.png"
        alt="Allyana's Food House"
        className="aspect-[2.94] object-contain object-center w-[200px] overflow-hidden shrink-0"
      />
    </header>
  );
};
