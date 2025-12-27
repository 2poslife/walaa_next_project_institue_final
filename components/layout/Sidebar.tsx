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
  { name: 'Students', href: '/dashboard/students', icon: '👩‍🎓' },
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
    <div className={`w-64 bg-gray-800 text-white min-h-screen relative flex flex-col ${className}`}>
      <div className="p-6 flex items-center justify-between">
        <h2 className="text-xl font-bold">Institute Management</h2>
        {isMobile && (
          <button
            onClick={onClose}
            className="text-white focus:outline-none focus:ring-2 focus:ring-white rounded-full p-1"
            aria-label="إغلاق القائمة"
          >
            ×
          </button>
        )}
      </div>
      <nav className="mt-8">
        {filteredNav.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center px-6 py-3 hover:bg-gray-700 ${
                isActive ? 'bg-gray-700 border-r-4 border-blue-500' : ''
              }`}
              onClick={handleNavClick}
            >
              <span className="mr-3">{item.icon}</span>
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto w-full p-6">
        <button
          onClick={logout}
          className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white"
        >
          Logout
        </button>
      </div>
    </div>
  );
}

