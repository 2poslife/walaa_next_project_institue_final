import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-base font-semibold text-gray-700 mb-2">
          {label}
        </label>
      )}
      <input
        className={`
          w-full px-4 py-3 border-2 rounded-xl 
          focus:outline-none focus:ring-2 focus:ring-offset-2 
          text-gray-900 text-base font-medium
          transition-all duration-300
          bg-white/80 backdrop-blur-sm
          ${error 
            ? 'border-red-400 focus:border-red-500 focus:ring-red-500' 
            : 'border-gray-300 focus:border-orange-500 focus:ring-orange-500 hover:border-gray-400'
          } 
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="mt-2 text-sm font-medium text-red-600 flex items-center gap-1">
          <span>⚠️</span>
          {error}
        </p>
      )}
    </div>
  );
}

