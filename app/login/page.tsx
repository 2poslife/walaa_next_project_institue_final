'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(username, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'فشل تسجيل الدخول. يرجى التحقق من بيانات الاعتماد الخاصة بك.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PublicLayout>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-orange-50/30 to-gray-50 py-16 relative overflow-hidden" dir="rtl">
        {/* Decorative Elements */}
        <div className="absolute top-20 right-20 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-green-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl"></div>

        <div className="w-full max-w-7xl mx-auto px-4 relative z-10">
          {/* Login Card - Centered */}
          <div className="flex justify-center">
            <div className="w-full max-w-md bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-gray-200/50">
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold mb-2">
                  <span className="text-brand-orange">مركز</span>{' '}
                  <span className="text-brand-green">تميز</span>
                </h1>
                <h2 className="text-xl font-semibold text-gray-700">
                  تسجيل الدخول
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <Input
                  label="اسم المستخدم"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoFocus
                />

                <Input
                  label="كلمة المرور"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  isLoading={isLoading}
                  disabled={!username || !password}
                >
                  تسجيل الدخول
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
