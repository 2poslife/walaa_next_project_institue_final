'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { RulesSection } from '@/components/sections/RulesSection';

export default function HomePage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <PublicLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange mx-auto"></div>
            <p className="mt-4 text-gray-900">جاري التحميل...</p>
          </div>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-brand-blue to-brand-blue/80 text-white py-20" dir="rtl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-6">
              مرحباً بك في <span className="text-brand-orange">مركز</span>{' '}
              <span className="text-brand-green">تميز</span>
            </h1>
            <p className="text-xl mb-8 text-blue-100">
              إدارة فعالة لمعهدك من خلال منصتنا الشاملة
            </p>
            <div className="flex justify-center gap-4">
              {isAuthenticated ? (
                <Link href="/dashboard">
                  <Button variant="secondary" size="lg">
                    الانتقال إلى لوحة التحكم
                  </Button>
                </Link>
              ) : (
                <Link href="/login">
                  <Button variant="secondary" size="lg">
                    ابدأ الآن
                  </Button>
                </Link>
              )}
              <Link href="/about">
                <Button variant="outline" size="lg" className="bg-white text-brand-orange hover:bg-gray-100">
                  اعرف المزيد
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white" dir="rtl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">
            المميزات
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="text-5xl mb-4">👨‍🏫</div>
              <h3 className="text-xl font-semibold mb-2 text-brand-orange">إدارة المعلمين</h3>
              <p className="text-gray-800">
                إدارة المعلمين، متابعة جداولهم ومراقبة الأداء
              </p>
            </div>
            <div className="text-center p-6">
              <div className="text-5xl mb-4">👩‍🎓</div>
              <h3 className="text-xl font-semibold mb-2 text-brand-green">إدارة الطلاب</h3>
              <p className="text-gray-800">
                متابعة الطلاب وتقدمهم والحضور
              </p>
            </div>
            <div className="text-center p-6">
              <div className="text-5xl mb-4">📘</div>
              <h3 className="text-xl font-semibold mb-2 text-brand-blue">تخطيط الدروس</h3>
              <p className="text-gray-800">
                تنظيم الدروس الفردية والجماعية بكفاءة
              </p>
            </div>
            <div className="text-center p-6">
              <div className="text-5xl mb-4">💰</div>
              <h3 className="text-xl font-semibold mb-2 text-brand-orange">تتبع المدفوعات</h3>
              <p className="text-gray-800">
                مراقبة المدفوعات وإدارة السجلات المالية
              </p>
            </div>
            <div className="text-center p-6">
              <div className="text-5xl mb-4">📊</div>
              <h3 className="text-xl font-semibold mb-2 text-brand-green">الإحصائيات والتقارير</h3>
              <p className="text-gray-800">
                إنشاء تقارير شاملة وتحليلات مفصلة
              </p>
            </div>
            <div className="text-center p-6">
              <div className="text-5xl mb-4">🔐</div>
              <h3 className="text-xl font-semibold mb-2 text-brand-blue">الوصول الآمن</h3>
              <p className="text-gray-800">
                التحكم في الوصول بناءً على الأدوار للمديرين والمعلمين
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Rules Section */}
      <RulesSection />

      {/* CTA Section */}
      <section className="py-20 bg-white" dir="rtl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-4 text-gray-800">
            هل أنت مستعد للبدء؟
          </h2>
          <p className="text-xl text-gray-800 mb-8">
            انضم إلينا اليوم واجعل إدارة معهدك أكثر سهولة
          </p>
          {!isAuthenticated && (
            <Link href="/login">
              <Button variant="primary" size="lg">
                تسجيل الدخول الآن
              </Button>
            </Link>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
