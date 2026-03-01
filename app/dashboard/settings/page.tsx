'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { api } from '@/lib/api-client';

interface AppSettings {
  teachers_can_add_students?: boolean;
  lesson_submission_deadline_day?: string | number;
  lesson_submission_deadline_inclusive?: boolean;
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

  const saveAll = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const teachersCanAdd = settings.teachers_can_add_students ?? true;
      const day = String(Number(settings.lesson_submission_deadline_day) || 2);
      const inclusive = settings.lesson_submission_deadline_inclusive ?? true;

      const r1 = await api.updateSetting('teachers_can_add_students', teachersCanAdd);
      if (!r1.success) {
        setError(r1.error || 'فشل حفظ الإعدادات');
        return;
      }
      const r2 = await api.updateSetting('lesson_submission_deadline_day', day);
      if (!r2.success) {
        setError(r2.error || 'فشل حفظ الإعدادات');
        return;
      }
      const r3 = await api.updateSetting('lesson_submission_deadline_inclusive', inclusive);
      if (!r3.success) {
        setError(r3.error || 'فشل حفظ الإعدادات');
        return;
      }

      setSuccess('تم حفظ الإعدادات بنجاح');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err?.message || 'حدث خطأ أثناء حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-900">جاري التحميل...</div>;
  }

  return (
    <div dir="rtl">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <h1 className="text-3xl font-bold text-gray-900">الإعدادات</h1>
        <Button onClick={saveAll} disabled={saving}>
          {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
        </Button>
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
                    setSettings((prev) => ({ ...prev, teachers_can_add_students: e.target.checked }))
                  }
                  className="sr-only peer"
                />
                <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:right-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>
      </Card>

      <Card title="موعد إضافة الدروس" variant="elevated" className="mb-6">
        <p className="text-sm text-gray-600 mb-4">
          آخر موعد يسمح فيه للمعلمين بإضافة دروس لشهر معيّن: يوم من الشهر التالي. مثلاً: يوم 2 يعني أن دروس شباط يمكن إضافتها حتى 2 آذار (إن كان مشمولاً).
        </p>
        <div className="space-y-6">
          <div className="p-4 bg-gray-50 rounded-lg">
            <label className="block font-semibold text-gray-900 mb-1">
              يوم الشهر التالي (آخر يوم مسموح)
            </label>
            <p className="text-sm text-gray-600 mb-2">
              من 1 (الأول) إلى 31. القيمة الافتراضية: 2.
            </p>
            <Input
              type="number"
              min={1}
              max={31}
              value={Number(settings.lesson_submission_deadline_day) || 2}
              onChange={(e) => {
                const v = e.target.value ? parseInt(e.target.value, 10) : 2;
                const num = Number.isFinite(v) && v >= 1 && v <= 31 ? v : 2;
                setSettings((prev) => ({ ...prev, lesson_submission_deadline_day: num }));
              }}
              className="w-24 text-left"
            />
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">
                ذلك اليوم مشمول (مسموح فيه)
              </h3>
              <p className="text-sm text-gray-600">
                إذا مفعّل: آخر يوم مسموح = ذلك اليوم. إذا غير مفعّل: ذلك اليوم غير مسموح (آخر يوم = اليوم السابق).
              </p>
            </div>
            <div className="ml-6">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.lesson_submission_deadline_inclusive ?? true}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, lesson_submission_deadline_inclusive: e.target.checked }))
                  }
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

