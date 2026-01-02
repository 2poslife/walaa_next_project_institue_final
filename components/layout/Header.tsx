'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import Image from 'next/image';

export function Header() {
  const pathname = usePathname();
  const { isAuthenticated, logout, user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    // Close the mobile menu when route changes
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (path: string) => pathname === path;

  return (
    <header className={`bg-white/80 backdrop-blur-lg shadow-lg sticky top-0 z-50 border-b border-gray-200/50 transition-all duration-300 ${scrolled ? 'bg-white/95 shadow-xl' : ''}`} dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative w-16 h-16 flex items-center justify-center">
                <Image 
                  src="/log2.png" 
                  alt="مركز تميز" 
                  width={64}
                  height={64}
                  className="w-full h-full object-contain group-hover:scale-110 transition-transform"
                  priority
                  unoptimized
                />
              </div>
              <div>
                <div className="text-2xl font-extrabold">
                  <span className="bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent">مركز</span>
                  {' '}
                  <span className="bg-gradient-to-r from-green-600 to-emerald-700 bg-clip-text text-transparent">تميز</span>
                </div>
              </div>
            </Link>
          </div>

          {/* Navigation (desktop) */}
          <nav className="hidden md:flex gap-2">
            <Link
              href="/"
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 relative ${
                isActive('/')
                  ? 'text-orange-600'
                  : 'text-gray-700 hover:text-orange-600'
              }`}
            >
              الرئيسية
              {isActive('/') && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600 rounded-full"></span>
              )}
            </Link>
            <Link
              href="/about"
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 relative ${
                isActive('/about')
                  ? 'text-orange-600'
                  : 'text-gray-700 hover:text-orange-600'
              }`}
            >
              من نحن
              {isActive('/about') && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600 rounded-full"></span>
              )}
            </Link>
            <Link
              href="/contact"
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 relative ${
                isActive('/contact')
                  ? 'text-orange-600'
                  : 'text-gray-700 hover:text-orange-600'
              }`}
            >
              اتصل بنا
              {isActive('/contact') && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600 rounded-full"></span>
              )}
            </Link>
          </nav>

          {/* Right side: auth + hamburger (mobile) */}
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-4">
              {isAuthenticated ? (
                <>
                  <Link href="/dashboard">
                    <Button variant="primary" size="sm">
                      لوحة التحكم
                    </Button>
                  </Link>
                  <Button variant="outline" size="sm" onClick={logout}>
                    تسجيل الخروج
                  </Button>
                </>
              ) : (
                <Link href="/login">
                  <Button variant="primary" size="sm">
                    تسجيل الدخول
                  </Button>
                </Link>
              )}
            </div>

            {/* Hamburger - mobile only */}
            <button
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-brand-orange hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-orange"
              aria-label="فتح القائمة"
              onClick={() => setMobileOpen((v) => !v)}
            >
              <span className="sr-only">فتح القائمة</span>
              {/* Simple hamburger icon */}
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu (collapsible) */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white shadow-sm">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link
              href="/"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive('/')
                  ? 'text-brand-orange bg-orange-50'
                  : 'text-gray-700 hover:text-brand-orange hover:bg-gray-50'
              }`}
            >
              الرئيسية
            </Link>
            <Link
              href="/about"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive('/about')
                  ? 'text-brand-orange bg-orange-50'
                  : 'text-gray-700 hover:text-brand-orange hover:bg-gray-50'
              }`}
            >
              من نحن
            </Link>
            <Link
              href="/contact"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive('/contact')
                  ? 'text-brand-orange bg-orange-50'
                  : 'text-gray-700 hover:text-brand-orange hover:bg-gray-50'
              }`}
            >
              اتصل بنا
            </Link>

            {/* Auth actions inside mobile menu */}
            <div className="mt-3 flex gap-2 px-3 pb-2">
              {isAuthenticated ? (
                <>
                  <Link href="/dashboard" className="flex-1">
                    <Button variant="primary" size="sm" className="w-full">
                      لوحة التحكم
                    </Button>
                  </Link>
                  <Button variant="outline" size="sm" className="flex-1" onClick={logout}>
                    تسجيل الخروج
                  </Button>
                </>
              ) : (
                <Link href="/login" className="w-full">
                  <Button variant="primary" size="sm" className="w-full">
                    تسجيل الدخول
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
 
