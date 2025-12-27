'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, getAuthToken } from '@/lib/api-client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table } from '@/components/ui/Table';
import { Input } from '@/components/ui/Input';
import { Teacher } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    full_name: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const { isAdmin, loading: authLoading, isAuthenticated } = useAuth();

  const loadTeachers = async () => {
    try {
      // Check if we have a token before making the request
      const token = getAuthToken();
      
      if (!token) {
        // No token, don't make the request - DashboardLayout will handle redirect
        setLoading(false);
        return;
      }

      const response = await api.getTeachers();
      if (response.success && response.data) {
        setTeachers((response.data as Teacher[]) || []);
      } else {
        if (response.error?.includes('Forbidden') || response.error?.includes('Admin')) {
          router.push('/dashboard');
        }
      }
    } catch (error: any) {
      // Don't redirect on 401 - let DashboardLayout handle it
      // The API client will clear tokens and dispatch auth-token-cleared event
      // which will update AuthContext, and DashboardLayout will redirect
      if (error?.status === 403) {
        router.push('/dashboard');
      } else if (error?.status === 401) {
        // Just set loading to false, let DashboardLayout handle redirect
        // The token has already been cleared by the API client
        console.error('Authentication error:', error.message);
      } else {
        console.error('Error loading teachers:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) {
      return;
    }
    // If not authenticated, don't do anything - DashboardLayout will redirect
    if (!isAuthenticated) {
      return;
    }
    if (!isAdmin) {
      router.push('/dashboard');
      return;
    }
    loadTeachers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, authLoading, isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const trimmedUsername = formData.username.trim();
    if (!trimmedUsername) {
      setError('اسم المستخدم مطلوب');
      setSubmitting(false);
      return;
    }
    if (!editingTeacher && !formData.password) {
      setError('كلمة المرور مطلوبة');
      setSubmitting(false);
      return;
    }

    try {
      if (editingTeacher) {
        // Update teacher
        const updateData: any = {
          full_name: formData.full_name,
          phone: formData.phone || null,
          username: trimmedUsername,
        };
        if (formData.password.trim()) {
          updateData.password = formData.password;
        }
        const response = await api.updateTeacher(editingTeacher.id, updateData);
        if (response.success) {
          await loadTeachers();
          resetForm();
        } else {
          setError(response.error || 'فشل تحديث المعلم');
        }
      } else {
        // Create teacher
        const response = await api.createTeacher({
          username: trimmedUsername,
          password: formData.password,
          full_name: formData.full_name,
          phone: formData.phone,
        });
        if (response.success) {
          await loadTeachers();
          resetForm();
        } else {
          setError(response.error || 'فشل إضافة المعلم');
        }
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setFormData({
      username: teacher.user?.username || '',
      password: '',
      full_name: teacher.full_name,
      phone: teacher.phone || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا المعلم؟')) {
      return;
    }

    try {
      const response = await api.deleteTeacher(id);
      if (response.success) {
        await loadTeachers();
      } else {
        alert(response.error || 'فشل حذف المعلم');
      }
    } catch (err: any) {
      alert(err.message || 'حدث خطأ');
    }
  };

  const resetForm = () => {
    setFormData({ username: '', password: '', full_name: '', phone: '' });
    setEditingTeacher(null);
    setShowForm(false);
    setError('');
  };

  const columns = [
    { key: 'id', header: 'الرقم' },
    { key: 'full_name', header: 'الاسم الكامل' },
    { key: 'phone', header: 'الهاتف' },
    {
      key: 'user',
      header: 'اسم المستخدم',
      render: (teacher: any) => teacher.user?.username || '-',
    },
    ...(isAdmin
      ? [
          {
            key: 'actions',
            header: 'الإجراءات',
            render: (teacher: Teacher) => (
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleEdit(teacher)}
                >
                  تعديل
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDelete(teacher.id)}
                >
                  حذف
                </Button>
              </div>
            ),
          },
        ]
      : []),
  ];

  if (loading || authLoading) {
    return <div className="text-center py-8 text-gray-900">جاري التحميل...</div>;
  }

  return (
    <div dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">المعلمون</h1>
        {!showForm && isAdmin && (
          <Button onClick={() => setShowForm(true)}>
            إضافة معلم جديد
          </Button>
        )}
      </div>

      {showForm && isAdmin && (
        <Card title={editingTeacher ? 'تعديل المعلم' : 'إضافة معلم جديد'} className="mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <Input
              label="اسم المستخدم"
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
            />
            {editingTeacher ? (
              <Input
                label="كلمة المرور الجديدة (اختياري)"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="اتركه فارغًا للإبقاء على الحالية"
              />
            ) : (
              <Input
                label="كلمة المرور"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            )}

            <Input
              label="الاسم الكامل"
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              required
            />
            <Input
              label="الهاتف"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />

            <div className="flex gap-2">
              <Button type="submit" isLoading={submitting}>
                {editingTeacher ? 'حفظ التغييرات' : 'إضافة'}
              </Button>
              <Button type="button" variant="secondary" onClick={resetForm}>
                إلغاء
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        <Table
          columns={columns}
          data={teachers}
          emptyMessage="لا يوجد معلمون"
        />
      </Card>
    </div>
  );
}
