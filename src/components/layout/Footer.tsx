import React from "react";

interface FooterProps {
  bgColor: string;
}

export const Footer: React.FC<FooterProps> = ({ bgColor = "#F5F2EE" }) => {
  return (
    <footer style={{ backgroundColor: bgColor }} className="text-center p-2">
      <small>&copy; 2025 Allyana's Foodhouse LLC. All rights reserved.</small>
    </footer>
  );
};
