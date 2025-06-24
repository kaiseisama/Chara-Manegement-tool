
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
}

export const Card: React.FC<CardProps> = ({ children, className, onClick }) => {
  return (
    <div
      className={`bg-slate-800 p-4 sm:p-6 rounded-lg shadow-lg border border-slate-700 ${className || ''}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};
