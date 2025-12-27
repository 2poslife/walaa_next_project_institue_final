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

  return (
    <div dir="rtl">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">لوحة التحكم</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <div className="text-center">
            <div className="text-4xl font-bold text-brand-orange">مرحباً</div>
            <div className="mt-2 text-gray-900 font-semibold">
              {isAdmin ? 'مدير' : 'معلم'}
            </div>
          </div>
        </Card>

        <Card>
          <div>
            <div className="text-sm text-gray-700 font-medium mb-1">اسم المستخدم</div>
            <div className="text-xl font-semibold text-gray-900">{user?.username}</div>
          </div>
        </Card>

        {teacher && (
          <Card>
            <div>
              <div className="text-sm text-gray-700 font-medium mb-1">الاسم</div>
              <div className="text-xl font-semibold text-gray-900">{teacher.full_name}</div>
            </div>
          </Card>
        )}
      </div>

      <Card title="إجراءات سريعة">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <a
            href="/dashboard/students"
            className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 text-center transition-colors"
          >
            <div className="text-2xl mb-2">👩‍🎓</div>
            <div className="font-semibold text-gray-900">الطلاب</div>
          </a>
          <a
            href="/dashboard/lessons"
            className="p-4 bg-green-50 rounded-lg hover:bg-green-100 text-center transition-colors"
          >
            <div className="text-2xl mb-2">📘</div>
            <div className="font-semibold text-gray-900">الدروس</div>
          </a>
          {isAdmin && (
            <>
              <a
                href="/dashboard/teachers"
                className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 text-center transition-colors"
              >
                <div className="text-2xl mb-2">👨‍🏫</div>
                <div className="font-semibold text-gray-900">المعلمون</div>
              </a>
              <a
                href="/dashboard/payments"
                className="p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 text-center transition-colors"
              >
                <div className="text-2xl mb-2">💰</div>
                <div className="font-semibold text-gray-900">المدفوعات</div>
              </a>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}

