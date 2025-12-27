'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { User, UserRole } from '@/types';

interface ProfileResponse {
  user: {
    id: number;
    username: string;
    role: string;
    is_active: boolean;
  };
  teacher?: {
    id: number;
    full_name: string;
    phone: string | null;
  };
}

export default function ProfilePage() {
  const { isTeacher, updateAuthState } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    full_name: '',
    phone: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.getProfile();
      if (response.success && response.data) {
        const data = response.data as ProfileResponse;
        setFormData({
          username: data.user.username,
          password: '',
          full_name: data.teacher?.full_name || '',
          phone: data.teacher?.phone || '',
        });
      } else {
        setError(response.error || 'فشل تحميل البيانات');
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const payload: Record<string, any> = {
        username: formData.username,
      };
      if (formData.password.trim()) {
        payload.password = formData.password;
      }
      if (isTeacher) {
        payload.full_name = formData.full_name;
        payload.phone = formData.phone;
      }

      const response = await api.updateProfile(payload);
      if (response.success && response.data) {
        const data = response.data as ProfileResponse;
        const normalizedUser: User = {
          id: data.user.id,
          username: data.user.username,
          role: data.user.role as UserRole,
          is_active: data.user.is_active,
        };
        const normalizedTeacher = data.teacher
          ? {
              id: data.teacher.id,
              user_id: normalizedUser.id,
              full_name: data.teacher.full_name,
              phone: data.teacher.phone,
            }
          : null;
        updateAuthState({
          user: normalizedUser,
          teacher: normalizedTeacher,
        });
        setSuccess('تم حفظ التغييرات بنجاح');
        setFormData((prev) => ({ ...prev, password: '' }));
      } else {
        setError(response.error || 'فشل تحديث المعلومات');
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء التحديث');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-900">جاري التحميل...</div>;
  }

  return (
    <div dir="rtl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">الملف الشخصي</h1>
        <p className="text-gray-600 mt-2">قم بتحديث معلومات حسابك</p>
      </div>

      <Card title="بيانات الحساب" className="max-w-2xl w-full">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
              {success}
            </div>
          )}

          <Input
            label="اسم المستخدم"
            type="text"
            value={formData.username}
            onChange={(e) =>
              setFormData({ ...formData, username: e.target.value })
            }
            required
          />

          <Input
            label="كلمة المرور الجديدة (اختياري)"
            type="password"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            placeholder="اتركه فارغًا للإبقاء على الحالية"
          />

          {isTeacher && (
            <>
              <Input
                label="الاسم الكامل"
                type="text"
                value={formData.full_name}
                onChange={(e) =>
                  setFormData({ ...formData, full_name: e.target.value })
                }
                required
              />
              <Input
                label="الهاتف (يجب أن يبدأ بـ 05)"
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
            </>
          )}

          <div className="flex gap-2">
            <Button type="submit" isLoading={submitting}>
              حفظ التغييرات
            </Button>
            <Button type="button" variant="secondary" onClick={loadProfile}>
              إعادة التعيين
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}


