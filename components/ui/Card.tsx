import React from 'react';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
  variant?: 'default' | 'gradient' | 'glass' | 'elevated';
  hover?: boolean;
}

export function Card({ 
  title, 
  children, 
  className = '', 
  actions,
  variant = 'default',
  hover = false
}: CardProps) {
  const baseStyles = 'rounded-xl p-4 sm:p-6 transition-all duration-300';
  
  const variants = {
    default: 'bg-white shadow-lg border border-gray-100',
    gradient: 'bg-gradient-to-br from-white via-gray-50 to-gray-100 shadow-xl border border-gray-200',
    glass: 'bg-white/80 backdrop-blur-lg shadow-xl border border-white/20',
    elevated: 'bg-white shadow-2xl border border-gray-100 transform hover:scale-[1.02]',
  };

  const hoverStyles = hover 
    ? 'hover:shadow-2xl hover:-translate-y-1 cursor-pointer' 
    : '';

  return (
    <div className={`${baseStyles} ${variants[variant]} ${hoverStyles} ${className}`}>
      {(title || actions) && (
        <div className="flex items-center justify-between mb-4" dir="rtl">
          {actions && <div>{actions}</div>}
          {title && (
            <h3 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              {title}
            </h3>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

