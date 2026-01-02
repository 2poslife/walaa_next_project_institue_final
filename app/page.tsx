'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { RulesSection } from '@/components/sections/RulesSection';
import { 
  TeacherIcon, 
  StudentIcon, 
  LessonIcon, 
  PaymentIcon, 
  StatsIcon, 
  SecurityIcon 
} from '@/components/icons/FeatureIcons';

export default function HomePage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  if (loading) {
    return (
      <PublicLayout>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
          <div className="text-center">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mx-auto"></div>
              <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-r-green-600 rounded-full animate-spin mx-auto" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
            </div>
            <p className="mt-6 text-gray-700 font-semibold text-lg animate-pulse">جاري التحميل...</p>
          </div>
        </div>
      </PublicLayout>
    );
  }

  const features = [
    {
      Icon: TeacherIcon,
      title: 'إدارة المعلمين',
      description: 'إدارة المعلمين، متابعة جداولهم ومراقبة الأداء',
      gradient: 'from-orange-500 to-orange-600',
      bgGradient: 'from-gray-50 to-gray-100',
      delay: '0ms',
    },
    {
      Icon: StudentIcon,
      title: 'إدارة الطلاب',
      description: 'متابعة الطلاب وتقدمهم والحضور',
      gradient: 'from-orange-500 to-orange-600',
      bgGradient: 'from-gray-50 to-gray-100',
      delay: '100ms',
    },
    {
      Icon: LessonIcon,
      title: 'تخطيط الدروس',
      description: 'تنظيم الدروس الفردية والجماعية بكفاءة',
      gradient: 'from-orange-500 to-orange-600',
      bgGradient: 'from-gray-50 to-gray-100',
      delay: '200ms',
    },
    {
      Icon: PaymentIcon,
      title: 'تتبع المدفوعات',
      description: 'مراقبة المدفوعات وإدارة السجلات المالية',
      gradient: 'from-orange-500 to-orange-600',
      bgGradient: 'from-gray-50 to-gray-100',
      delay: '300ms',
    },
    {
      Icon: StatsIcon,
      title: 'الإحصائيات والتقارير',
      description: 'إنشاء تقارير شاملة وتحليلات مفصلة',
      gradient: 'from-orange-500 to-orange-600',
      bgGradient: 'from-gray-50 to-gray-100',
      delay: '400ms',
    },
    {
      Icon: SecurityIcon,
      title: 'الوصول الآمن',
      description: 'التحكم في الوصول بناءً على الأدوار للمديرين والمعلمين',
      gradient: 'from-orange-500 to-orange-600',
      bgGradient: 'from-gray-50 to-gray-100',
      delay: '500ms',
    },
  ];

  return (
    <PublicLayout>
      {/* Hero Section - Modern with animations */}
      <section className="relative py-20 md:py-32 flex items-center justify-center overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" dir="rtl">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div 
            className="absolute w-96 h-96 bg-orange-500/10 rounded-full blur-3xl transition-all duration-1000 ease-out"
            style={{
              left: `${mousePosition.x / 20}px`,
              top: `${mousePosition.y / 20}px`,
            }}
          ></div>
          <div className="absolute top-20 right-20 w-72 h-72 bg-orange-500/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        {/* Reduced floating particles - less noise */}
        <div className="absolute inset-0">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white/20 rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 4}s`,
              }}
            ></div>
          ))}
        </div>

        {/* Dark overlay/blur mask behind headline */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/30 pointer-events-none"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center animate-fadeIn">
              <h1 className="text-6xl md:text-7xl lg:text-8xl font-extrabold mb-6 leading-tight">
                <span className="block text-white drop-shadow-2xl mb-2">مرحباً بك في</span>
                <span className="block">
                  <span className="text-orange-500 drop-shadow-2xl relative inline-block">
                    <span className="relative z-10">مركز</span>
                    <span className="absolute bottom-0 left-0 right-0 h-2 bg-orange-500/50 blur-md animate-pulse"></span>
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 animate-pulse"></span>
                  </span>
                  {' '}
                  <span className="text-green-500 drop-shadow-lg relative inline-block">
                    <span className="relative z-10">تميز</span>
                    <span className="absolute bottom-0 left-0 right-0 h-1 bg-green-500/30 blur-sm"></span>
                  </span>
                </span>
              </h1>
              
              <p className="text-2xl md:text-3xl mb-12 text-white/90 font-normal max-w-3xl mx-auto leading-loose">
                نظام متكامل لإدارة شؤون المعهد وتنظيم العمل التعليمي
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center gap-6 items-center mb-16">
                {isAuthenticated ? (
                  <Link href="/dashboard">
                    <Button variant="secondary" size="lg" className="text-xl px-10 py-5 shadow-2xl transform hover:scale-105 transition-all animate-pulse hover:animate-none">
                      <span className="flex items-center gap-2">
                        الانتقال إلى لوحة التحكم
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </span>
                    </Button>
                  </Link>
                ) : (
                  <Link href="/login">
                    <Button variant="secondary" size="lg" className="text-xl px-10 py-5 shadow-2xl transform hover:scale-110 transition-all animate-pulse hover:animate-none">
                      <span className="flex items-center gap-2">
                        ابدأ الآن
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </span>
                    </Button>
                  </Link>
                )}
                <Link href="/about">
                  <Button variant="outline" size="lg" className="text-lg px-6 py-3 bg-transparent backdrop-blur-lg border-2 border-white/40 text-white hover:bg-white/10 shadow-lg transform hover:scale-105 transition-all">
                    اعرف المزيد
                  </Button>
                </Link>
              </div>

              {/* Trust Signals Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-center hover:bg-white/15 transition-all">
                  <div className="text-3xl mb-2">👨‍🎓</div>
                  <div className="text-white/90 font-semibold text-sm mb-1">عدد الطلاب</div>
                  <div className="text-orange-400 font-bold text-xl">500+</div>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-center hover:bg-white/15 transition-all">
                  <div className="text-3xl mb-2">🧑‍🏫</div>
                  <div className="text-white/90 font-semibold text-sm mb-1">معلمون معتمدون</div>
                  <div className="text-orange-400 font-bold text-xl">50+</div>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-center hover:bg-white/15 transition-all">
                  <div className="text-3xl mb-2">🏫</div>
                  <div className="text-white/90 font-semibold text-sm mb-1">سنوات الخبرة</div>
                  <div className="text-orange-400 font-bold text-xl">10+</div>
                </div>
              </div>
        </div>
      </section>

      {/* Features Section - Modern cards */}
      <section className="py-24 bg-gradient-to-b from-white via-gray-50/50 to-white relative overflow-hidden" dir="rtl">
        {/* Smooth divider from previous section */}
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
        
        {/* Very transparent accent circles */}
        <div className="absolute top-20 right-20 w-64 h-64 bg-orange-500/3 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-orange-500/2 rounded-full blur-3xl"></div>
        
        {/* Subtle dot pattern background */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
          backgroundImage: `radial-gradient(circle, #6b7280 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-block mb-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-xl mx-auto">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <h2 className="text-5xl md:text-6xl font-extrabold mb-4 text-gray-900">
              المميزات
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              اكتشف كيف تساعد المنصة في تنظيم وإدارة المعهد
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const IconComponent = feature.Icon;
              return (
                <div
                  key={feature.title}
                  className={`
                    group relative p-8 rounded-2xl bg-white
                    border border-gray-200/50 shadow-sm hover:shadow-md
                    transform hover:scale-[1.02] hover:-translate-y-1
                    transition-all duration-300 overflow-hidden
                    animate-fadeIn
                  `}
                  style={{ animationDelay: feature.delay }}
                >
                  {/* Gradient overlay on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
                  
                  {/* Icon */}
                  <div className={`
                    relative z-10 w-20 h-20 rounded-2xl bg-gradient-to-br ${feature.gradient}
                    flex items-center justify-center mb-6 shadow-lg mx-auto
                    transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300
                  `}>
                    <IconComponent className="w-10 h-10 text-white" />
                  </div>
                  
                  {/* Content */}
                  <div className="relative z-10 text-center">
                    <h3 className="text-2xl font-bold mb-3 text-gray-900">
                      {feature.title}
                    </h3>
                    <p className="text-gray-700 leading-relaxed text-lg">
                      {feature.description}
                    </p>
                  </div>

                  {/* Decorative corner */}
                  <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${feature.gradient} opacity-5 rounded-bl-full`}></div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Rules Section */}
      <RulesSection />

      {/* CTA Section - Modern design */}
      <section className="py-24 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden" dir="rtl">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-8 inline-block">
            <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-lg border border-white/30 flex items-center justify-center shadow-xl">
              <span className="text-4xl">🚀</span>
            </div>
          </div>
          
          <h2 className="text-5xl md:text-6xl font-extrabold mb-6 text-white drop-shadow-lg">
            هل أنت مستعد للبدء؟
          </h2>
          <p className="text-2xl text-white/90 mb-12 font-medium leading-relaxed">
            انضم إلينا اليوم واجعل إدارة معهدك أكثر سهولة وفعالية
          </p>
          
          {!isAuthenticated && (
            <Link href="/login">
              <Button 
                variant="secondary" 
                size="lg" 
                className="text-lg px-10 py-4 bg-orange-500 text-white hover:bg-orange-600 shadow-2xl transform hover:scale-105 transition-all"
              >
                <span className="flex items-center gap-2">
                  تسجيل الدخول الآن
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </Button>
            </Link>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
