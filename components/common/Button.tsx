
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', className, ...props }) => {
  const baseStyle = "px-4 py-2 rounded-md font-semibold text-sm shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 transition-colors duration-150 ease-in-out";
  
  let variantStyle = '';
  switch (variant) {
    case 'primary':
      variantStyle = 'bg-sky-600 hover:bg-sky-700 text-white focus:ring-sky-500';
      break;
    case 'secondary':
      variantStyle = 'bg-slate-600 hover:bg-slate-700 text-slate-100 focus:ring-slate-500';
      break;
    case 'danger':
      variantStyle = 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500';
      break;
  }

  return (
    <button
      {...props}
      className={`${baseStyle} ${variantStyle} ${className || ''}`}
    >
      {children}
    </button>
  );
};
    