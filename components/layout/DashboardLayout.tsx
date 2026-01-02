'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from './Sidebar';
import { getAuthToken } from '@/lib/api-client';
import { Button } from '../ui/Button';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (loading) {
      return;
    }

    // Check if user is authenticated
    // Only redirect if definitely not authenticated (no token AND no user)
    const token = getAuthToken();
    
    if (!isAuthenticated && !token) {
      // Add a delay to allow token refresh to complete
      // This prevents race conditions where tokens are being refreshed
      const timeoutId = setTimeout(() => {
        const tokenAfterDelay = getAuthToken();
        if (!tokenAfterDelay) {
          console.log('[DashboardLayout] No token found, redirecting to login');
          setRedirecting(true);
          router.push('/login');
        }
      }, 1000); // Wait 1 second before redirecting to allow refresh to complete

      return () => clearTimeout(timeoutId);
    } else if (isAuthenticated) {
      setRedirecting(false);
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <div className="text-lg text-gray-900">جاري التحميل...</div>
      </div>
    );
  }

  if (redirecting) {
    return null;
  }

  const openSidebar = () => setSidebarOpen(true);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30" dir="rtl">
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden animate-fadeIn">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeSidebar}
            aria-hidden="true"
          />
          <div className="ml-auto relative h-full w-64 flex flex-col animate-slideIn">
            <Sidebar isMobile onClose={closeSidebar} className="h-full" />
          </div>
        </div>
      )}

      <main className="flex-1 p-4 sm:p-6 lg:p-8 relative">
        {/* Decorative background elements */}
        <div className="fixed top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl -z-10"></div>
        <div className="fixed bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-orange-400/10 to-pink-400/10 rounded-full blur-3xl -z-10"></div>
        
        <div className="flex items-center justify-between mb-6 lg:hidden">
          <Button
            type="button"
            variant="outline"
            className="flex items-center gap-2"
            onClick={openSidebar}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            القائمة
          </Button>
        </div>
        <div className="relative z-10">
          {children}
        </div>
      </main>
    </div>
  );
}

