'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api-client';

interface AppSettings {
  teachers_can_add_students?: boolean;
}

export default function SettingsPage() {
  const { isAdmin } = useAuth();
  const [settings, setSettings] = useState<AppSettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await api.getSettings();
      if (response.success && response.data) {
        setSettings(response.data);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: string, value: boolean) => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await api.updateSetting(key, value);
      if (response.success) {
        setSettings((prev) => ({ ...prev, [key]: value }));
        setSuccess('تم حفظ الإعدادات بنجاح');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(response.error || 'فشل حفظ الإعدادات');
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-900">جاري التحميل...</div>;
  }

  return (
    <div dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">الإعدادات</h1>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          {success}
        </div>
      )}

      <Card title="إعدادات المعلمين" variant="elevated" className="mb-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">
                السماح للمعلمين بإضافة طلاب
              </h3>
              <p className="text-sm text-gray-600">
                عند تفعيل هذا الخيار، يمكن للمعلمين إضافة طلاب جدد. عند إلغاء التفعيل، يمكن
                للمعلمين فقط اختيار طلاب موجودين.
              </p>
            </div>
            <div className="ml-6">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.teachers_can_add_students ?? true}
                  onChange={(e) =>
                    updateSetting('teachers_can_add_students', e.target.checked)
                  }
                  disabled={saving}
                  className="sr-only peer"
                />
                <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:right-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

