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
    <div className="flex min-h-screen bg-gray-100" dir="rtl">
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={closeSidebar}
            aria-hidden="true"
          />
          <div className="ml-auto relative h-full w-64">
            <Sidebar isMobile onClose={closeSidebar} className="min-h-full" />
          </div>
        </div>
      )}

      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-between mb-4 lg:hidden">
          <Button
            type="button"
            variant="outline"
            className="flex items-center gap-2"
            onClick={openSidebar}
          >
            ☰ القائمة
          </Button>
        </div>
        {children}
      </main>
    </div>
  );
}

