'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table } from '@/components/ui/Table';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { GroupPricingTier, EducationLevel } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { config } from '@/lib/config';

export default function GroupPricingTiersPage() {
  const router = useRouter();
  // If mode is default, redirect away
  useEffect(() => {
    if (config.app.groupPricingMode !== 'tiers') {
      router.replace('/dashboard/pricing');
    }
  }, [router]);

  const [tiers, setTiers] = useState<GroupPricingTier[]>([]);
  const [educationLevels, setEducationLevels] = useState<EducationLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<GroupPricingTier | null>(null);
  const [formData, setFormData] = useState({
    id: '' as number | string,
    education_level_id: '' as number | string,
    student_count: '' as number | string,
    total_price: '' as number | string,
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { isAdmin } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [tiersRes, levelsRes] = await Promise.all([
        api.getGroupPricingTiers(),
        api.getEducationLevels(),
      ]);
      if (tiersRes.success && tiersRes.data) setTiers(tiersRes.data as GroupPricingTier[]);
      if (levelsRes.success && levelsRes.data) setEducationLevels(levelsRes.data as EducationLevel[]);
    } catch (e) {
      console.error('Error loading tiers:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (tier: GroupPricingTier) => {
    setEditing(tier);
    setFormData({
      id: tier.id,
      education_level_id: tier.education_level_id,
      student_count: tier.student_count,
      total_price: tier.total_price,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setEditing(null);
    setFormData({
      id: '',
      education_level_id: '',
      student_count: '',
      total_price: '',
    });
    setShowForm(false);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      // Client-side duplicate guard
      const exists = tiers.find(
        (t) =>
          t.education_level_id === parseInt(String(formData.education_level_id || -1), 10) &&
          t.student_count === parseInt(String(formData.student_count || -1), 10) &&
          (!formData.id || t.id !== parseInt(String(formData.id), 10))
      );
      if (exists) {
        setError('هذه الشريحة موجودة بالفعل لهذا المستوى وعدد الطلاب');
        setSubmitting(false);
        return;
      }
      const payload: any = {
        education_level_id: parseInt(String(formData.education_level_id), 10),
        student_count: parseInt(String(formData.student_count), 10),
        total_price: parseFloat(String(formData.total_price)),
      };
      if (formData.id) payload.id = parseInt(String(formData.id), 10);

      const res = await api.saveGroupPricingTier(payload);
      if (!res.success) {
        setError(res.error || 'فشل حفظ الشريحة');
      } else {
        await loadData();
        resetForm();
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (tier: GroupPricingTier) => {
    if (!confirm('هل تريد حذف هذه الشريحة؟')) return;
    try {
      const res = await api.deleteGroupPricingTier(tier.id);
      if (!res.success) {
        alert(res.error || 'فشل الحذف');
      } else {
        await loadData();
      }
    } catch (e: any) {
      alert(e.message || 'حدث خطأ');
    }
  };

  const columns = [
    {
      key: 'education_level',
      header: 'المستوى',
      render: (item: any) => item.education_level?.name_ar || '-',
    },
    { key: 'student_count', header: 'عدد الطلاب' },
    {
      key: 'total_price',
      header: 'السعر الإجمالي/ساعة (₪)',
      render: (item: GroupPricingTier) => Number(item.total_price).toFixed(2),
    },
    ...(isAdmin
      ? [
          {
            key: 'actions',
            header: 'الإجراءات',
            render: (item: GroupPricingTier) => (
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => handleEdit(item)}>
                  تعديل
                </Button>
                <Button variant="danger" size="sm" onClick={() => handleDelete(item)}>
                  حذف
                </Button>
              </div>
            ),
          },
        ]
      : []),
  ];

  if (loading) {
    return <div className="text-center py-8 text-gray-900">جاري التحميل...</div>;
  }

  return (
    <div dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">شرائح التسعير الجماعي</h1>
        {!showForm && isAdmin && (
          <Button onClick={() => setShowForm(true)}>إضافة/تحديث شريحة</Button>
        )}
      </div>

      {showForm && isAdmin && (
        <Card title="إضافة/تحديث شريحة" className="mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <Select
              label="المستوى التعليمي"
              value={String(formData.education_level_id)}
              onChange={(e) => setFormData({ ...formData, education_level_id: e.target.value })}
              options={[
                { value: '', label: 'اختر المستوى' },
                ...educationLevels.map((l) => ({ value: l.id.toString(), label: l.name_ar })),
              ]}
              required
            />
            <Input
              label="عدد الطلاب"
              type="number"
              min="2"
              step="1"
              value={String(formData.student_count)}
              onChange={(e) => setFormData({ ...formData, student_count: e.target.value })}
              required
            />
            <Input
              label="السعر الإجمالي للساعة (₪)"
              type="number"
              step="0.01"
              min="0"
              value={String(formData.total_price)}
              onChange={(e) => setFormData({ ...formData, total_price: e.target.value })}
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
        <Table columns={columns} data={tiers} emptyMessage="لا توجد شرائح حالياً" />
      </Card>
    </div>
  );
}


