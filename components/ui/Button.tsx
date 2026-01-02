import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = 'font-semibold rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 transform hover:scale-105 active:scale-95';
  
  const variants = {
    primary: 'bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 text-white shadow-lg shadow-orange-500/50 hover:shadow-xl hover:shadow-orange-500/60 focus:ring-orange-500',
    secondary: 'bg-gradient-to-r from-green-500 via-green-600 to-green-700 text-white shadow-lg shadow-green-500/50 hover:shadow-xl hover:shadow-green-500/60 focus:ring-green-500',
    danger: 'bg-gradient-to-r from-red-500 via-red-600 to-red-700 text-white shadow-lg shadow-red-500/50 hover:shadow-xl hover:shadow-red-500/60 focus:ring-red-500',
    outline: 'border-2 border-gray-300 text-gray-700 bg-white/80 backdrop-blur-sm hover:bg-gray-50 hover:border-gray-400 focus:ring-gray-500 shadow-md hover:shadow-lg',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-2.5 text-base',
    lg: 'px-8 py-3 text-lg',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className} ${(disabled || isLoading) ? 'opacity-50 cursor-not-allowed hover:scale-100' : ''}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          جاري التحميل...
        </span>
      ) : (
        children
      )}
    </button>
  );
}

