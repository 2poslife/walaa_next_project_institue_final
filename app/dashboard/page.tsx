'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/Card';

export default function DashboardPage() {
  const router = useRouter();
  const { user, teacher, isAdmin, isTeacher, loading } = useAuth();

  useEffect(() => {
    if (!loading && isTeacher && !isAdmin) {
      router.replace('/dashboard/statistics');
    }
  }, [loading, isTeacher, isAdmin, router]);

  if (isTeacher && !isAdmin) {
    return null;
  }

  const quickActions = [
    {
      href: '/dashboard/students',
      icon: '👩‍🎓',
      title: 'الطلاب',
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-50 to-cyan-50',
    },
    {
      href: '/dashboard/lessons',
      icon: '📘',
      title: 'الدروس',
      gradient: 'from-green-500 to-emerald-500',
      bgGradient: 'from-green-50 to-emerald-50',
    },
    ...(isAdmin ? [
      {
        href: '/dashboard/teachers',
        icon: '👨‍🏫',
        title: 'المعلمون',
        gradient: 'from-purple-500 to-pink-500',
        bgGradient: 'from-purple-50 to-pink-50',
      },
      {
        href: '/dashboard/payments',
        icon: '💰',
        title: 'المدفوعات',
        gradient: 'from-yellow-500 to-orange-500',
        bgGradient: 'from-yellow-50 to-orange-50',
      },
    ] : []),
  ];

  return (
    <div dir="rtl" className="animate-fadeIn">
      {/* Hero Section */}
      <div className="mb-8">
        <h1 className="text-5xl font-extrabold mb-4 bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 bg-clip-text text-transparent">
          لوحة التحكم
        </h1>
        <p className="text-gray-600 text-lg">مرحباً بك في نظام إدارة المعهد</p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card variant="gradient" hover className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-400/20 to-transparent rounded-full blur-2xl"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg">
                <span className="text-3xl">👋</span>
              </div>
            </div>
            <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent mb-2">
              مرحباً
            </div>
            <div className="text-gray-600 font-semibold">
              {isAdmin ? 'مدير النظام' : 'معلم'}
            </div>
          </div>
        </Card>

        <Card variant="gradient" hover className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-transparent rounded-full blur-2xl"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                <span className="text-3xl">👤</span>
              </div>
            </div>
            <div className="text-sm text-gray-600 font-medium mb-2">اسم المستخدم</div>
            <div className="text-2xl font-bold text-gray-900">{user?.username}</div>
          </div>
        </Card>

        {teacher && (
          <Card variant="gradient" hover className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-400/20 to-transparent rounded-full blur-2xl"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
                  <span className="text-3xl">🎓</span>
                </div>
              </div>
              <div className="text-sm text-gray-600 font-medium mb-2">الاسم الكامل</div>
              <div className="text-2xl font-bold text-gray-900">{teacher.full_name}</div>
            </div>
          </Card>
        )}
      </div>

      {/* Quick Actions */}
      <Card title="إجراءات سريعة" variant="elevated">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <a
              key={action.href}
              href={action.href}
              className={`
                group relative p-6 rounded-2xl bg-gradient-to-br ${action.bgGradient}
                hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-2
                border border-white/50 overflow-hidden
              `}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Gradient overlay on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
              
              <div className="relative z-10 text-center">
                <div className={`
                  text-4xl mb-3 transform group-hover:scale-110 group-hover:rotate-6
                  transition-all duration-300 inline-block
                `}>
                  {action.icon}
                </div>
                <div className="font-bold text-gray-900 group-hover:text-gray-800 transition-colors">
                  {action.title}
                </div>
              </div>
              
              {/* Shine effect */}
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
            </a>
          ))}
        </div>
      </Card>
    </div>
  );
}

