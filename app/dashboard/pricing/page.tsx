'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { config } from '@/lib/config';
import { api } from '@/lib/api-client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table } from '@/components/ui/Table';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Pricing, EducationLevel } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

export default function PricingPage() {
  const [pricing, setPricing] = useState<Pricing[]>([]);
  const [educationLevels, setEducationLevels] = useState<EducationLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    education_level_id: '',
    lesson_type: '',
    price_per_hour: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { isAdmin } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [pricingRes, levelsRes] = await Promise.all([
        api.getPricing(),
        api.getEducationLevels(),
      ]);

      if (pricingRes.success && pricingRes.data) {
        setPricing(pricingRes.data as Pricing[]);
      }
      if (levelsRes.success && levelsRes.data) {
        setEducationLevels(levelsRes.data as EducationLevel[]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const submitData = {
        education_level_id: parseInt(formData.education_level_id),
        lesson_type: formData.lesson_type,
        price_per_hour: parseFloat(formData.price_per_hour),
      };

      const response = await api.savePricing(submitData);
      if (response.success) {
        await loadData();
        resetForm();
      } else {
        setError(response.error || 'فشل حفظ التسعير');
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      education_level_id: '',
      lesson_type: '',
      price_per_hour: '',
    });
    setShowForm(false);
    setError('');
  };

  const columns = [
    {
      key: 'education_level',
      header: 'المستوى التعليمي',
      render: (item: any) => item.education_level?.name_ar || '-',
    },
    {
      key: 'lesson_type',
      header: 'نوع الدرس',
      render: (item: Pricing) => (item.lesson_type === 'individual' ? 'فردي' : 'جماعي'),
    },
    {
      key: 'price_per_hour',
      header: 'السعر لكل ساعة (₪)',
      render: (item: Pricing) => item.price_per_hour.toFixed(2),
    },
  ];

  if (loading) {
    return <div className="text-center py-8 text-gray-900">جاري التحميل...</div>;
  }

  return (
    <div dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">التسعير</h1>
        <div className="flex items-center gap-2">
          {config.app.groupPricingMode === 'tiers' && (
            <Link href="/dashboard/pricing/tiers">
              <Button variant="secondary">شرائح التسعير الجماعي</Button>
            </Link>
          )}
          {!showForm && isAdmin && (
            <Button onClick={() => setShowForm(true)}>إضافة/تحديث سعر</Button>
          )}
        </div>
      </div>

      {showForm && isAdmin && (
        <Card title="إضافة/تحديث السعر" className="mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <Select
              label="المستوى التعليمي"
              value={formData.education_level_id}
              onChange={(e) =>
                setFormData({ ...formData, education_level_id: e.target.value })
              }
              options={[
                { value: '', label: 'اختر المستوى التعليمي' },
                ...educationLevels.map((level) => ({
                  value: level.id.toString(),
                  label: level.name_ar,
                })),
              ]}
              required
            />
            <Select
              label="نوع الدرس"
              value={formData.lesson_type}
              onChange={(e) =>
                setFormData({ ...formData, lesson_type: e.target.value })
              }
              options={
                config.app.groupPricingMode === 'tiers'
                  ? [
                      { value: '', label: 'اختر نوع الدرس' },
                      { value: 'individual', label: 'فردي' },
                    ]
                  : [
                      { value: '', label: 'اختر نوع الدرس' },
                      { value: 'individual', label: 'فردي' },
                      { value: 'group', label: 'جماعي' },
                    ]
              }
              required
            />
            {config.app.groupPricingMode === 'tiers' && (
              <p className="text-sm text-gray-600">
                ملاحظة: في وضع الشرائح، يتم إدارة الأسعار الجماعية من صفحة شرائح التسعير الجماعي فقط.
              </p>
            )}
            <Input
              label="السعر لكل ساعة (₪)"
              type="number"
              step="0.01"
              min="0"
              value={formData.price_per_hour}
              onChange={(e) =>
                setFormData({ ...formData, price_per_hour: e.target.value })
              }
              required
            />

            <div className="flex gap-2">
              <Button type="submit" isLoading={submitting}>
                حفظ
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
          data={
            config.app.groupPricingMode === 'tiers'
              ? pricing.filter((p) => p.lesson_type === 'individual')
              : pricing
          }
          emptyMessage="لا يوجد أسعار محددة"
        />
      </Card>
    </div>
  );
}
