'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useCallback } from 'react';

interface NavItem {
  name: string;
  href: string;
  icon: string;
  adminOnly?: boolean;
}

const navigation: NavItem[] = [
  { name: 'Statistics', href: '/dashboard/statistics', icon: '📈' },
  { name: 'Lessons', href: '/dashboard/lessons', icon: '📘' },
  { name: 'Students', href: '/dashboard/students', icon: '👩‍🎓', adminOnly: true },
  { name: 'Teachers', href: '/dashboard/teachers', icon: '👨‍🏫', adminOnly: true },
  { name: 'Payments', href: '/dashboard/payments', icon: '💰', adminOnly: true },
  { name: 'Pricing', href: '/dashboard/pricing', icon: '💵', adminOnly: true },
  { name: 'Profile', href: '/dashboard/profile', icon: '👤' },
];

interface SidebarProps {
  isMobile?: boolean;
  onClose?: () => void;
  className?: string;
}

export function Sidebar({ isMobile = false, onClose, className = '' }: SidebarProps) {
  const pathname = usePathname();
  const { isAdmin, logout } = useAuth();

  const filteredNav = navigation.filter((item) => !item.adminOnly || isAdmin);

  const handleNavClick = useCallback(() => {
    if (isMobile) {
      onClose?.();
    }
  }, [isMobile, onClose]);

  return (
    <div className={`w-64 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white ${isMobile ? 'h-full' : 'min-h-screen'} relative flex flex-col shadow-2xl ${className}`}>
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/10 to-transparent pointer-events-none"></div>
      
      <div className="p-6 flex items-center justify-between flex-shrink-0 relative z-10 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg">
            <span className="text-xl">🎓</span>
          </div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Institute
          </h2>
        </div>
        {isMobile && (
          <button
            onClick={onClose}
            className="text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white rounded-lg p-2 transition-colors"
            aria-label="إغلاق القائمة"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      <nav className="mt-4 flex-1 overflow-y-auto px-3 relative z-10">
        {filteredNav.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center px-4 py-3 mb-2 rounded-xl transition-all duration-300
                ${isActive 
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/50 transform scale-105' 
                  : 'hover:bg-white/10 text-gray-300 hover:text-white hover:translate-x-[-4px]'
                }
              `}
              onClick={handleNavClick}
            >
              <span className={`mr-3 text-xl ${isActive ? 'scale-110' : ''} transition-transform`}>
                {item.icon}
              </span>
              <span className="font-medium">{item.name}</span>
              {isActive && (
                <div className="mr-auto w-2 h-2 rounded-full bg-white animate-pulse"></div>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto w-full p-6 flex-shrink-0 relative z-10 border-t border-white/10">
        <button
          onClick={logout}
          className="w-full px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-xl text-white font-semibold shadow-lg shadow-red-500/50 hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95"
        >
          تسجيل الخروج
        </button>
      </div>
    </div>
  );
}

