'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api-client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table } from '@/components/ui/Table';
import { Input } from '@/components/ui/Input';
import { ComboBox } from '@/components/ui/ComboBox';
import { Payment, Student, IndividualLesson, GroupLesson, GroupPricingTier } from '@/types';
import { config } from '@/lib/config';
import { useAuth } from '@/contexts/AuthContext';

interface StudentPaymentSummary {
  studentId: number;
  studentName: string;
  levelName: string;
  individualDue: number;
  groupDue: number;
  totalDue: number;
  totalPaid: number;
  remaining: number;
}

const formatCurrency = (value: number) => `${value.toFixed(2)} ₪`;

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [individualLessons, setIndividualLessons] = useState<IndividualLesson[]>([]);
  const [groupLessons, setGroupLessons] = useState<GroupLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [groupPricingTiers, setGroupPricingTiers] = useState<GroupPricingTier[]>([]);
  const [formData, setFormData] = useState({
    student_id: '',
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    note: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [summarySearch, setSummarySearch] = useState('');
  const { isAdmin } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const promises: Promise<any>[] = [
        api.getPayments(),
        api.getStudents(),
        api.getIndividualLessons({ approved: true }),
        api.getGroupLessons({ approved: true }),
      ];
      if (config.app.groupPricingMode === 'tiers') {
        promises.push(api.getGroupPricingTiers());
      }
      const results = await Promise.all(promises);
      const [paymentsRes, studentsRes, individualLessonsRes, groupLessonsRes, tiersRes] =
        results;

      if (paymentsRes.success && paymentsRes.data) {
        setPayments(paymentsRes.data);
      }
      if (studentsRes.success && studentsRes.data) {
        setStudents(studentsRes.data);
      }
      if (individualLessonsRes.success && individualLessonsRes.data) {
        setIndividualLessons(individualLessonsRes.data as IndividualLesson[]);
      }
      if (groupLessonsRes.success && groupLessonsRes.data) {
        setGroupLessons(groupLessonsRes.data as GroupLesson[]);
      }
      if (tiersRes && tiersRes.success && tiersRes.data) {
        setGroupPricingTiers(tiersRes.data as GroupPricingTier[]);
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
      const studentId = parseInt(formData.student_id);
      const amountValue = parseFloat(formData.amount);

      if (!studentId || Number.isNaN(amountValue) || amountValue <= 0) {
        setError('يرجى إدخال طالب ومبلغ صالح');
        setSubmitting(false);
        return;
      }

      const summary = summaryByStudent.get(studentId);
      const editAllowance =
        editingPayment && editingPayment.student_id === studentId ? editingPayment.amount : 0;
      const maxAllowed =
        summary && Number.isFinite(summary.remaining)
          ? Math.max(summary.remaining + editAllowance, 0)
          : undefined;

      if (maxAllowed !== undefined && amountValue - maxAllowed > 0.001) {
        setError('لا يمكن دفع أكثر من المبلغ المتبقي للطالب');
        setSubmitting(false);
        return;
      }

      const submitData = {
        student_id: studentId,
        amount: amountValue,
        payment_date: formData.payment_date,
        note: formData.note || null,
      };

      if (editingPayment) {
        const response = await api.updatePayment(editingPayment.id, submitData);
        if (response.success) {
          await loadData();
          resetForm();
        } else {
          setError(response.error || 'فشل تحديث الدفعة');
        }
      } else {
        const response = await api.createPayment(submitData);
        if (response.success) {
          await loadData();
          resetForm();
        } else {
          setError(response.error || 'فشل إضافة الدفعة');
        }
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (payment: Payment) => {
    setEditingPayment(payment);
    setFormData({
      student_id: payment.student_id.toString(),
      amount: payment.amount.toString(),
      payment_date: payment.payment_date,
      note: payment.note || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذه الدفعة؟')) {
      return;
    }

    try {
      const response = await api.deletePayment(id);
      if (response.success) {
        await loadData();
      } else {
        alert(response.error || 'فشل حذف الدفعة');
      }
    } catch (err: any) {
      alert(err.message || 'حدث خطأ');
    }
  };

  const resetForm = () => {
    setFormData({
      student_id: '',
      amount: '',
      payment_date: new Date().toISOString().split('T')[0],
      note: '',
    });
    setEditingPayment(null);
    setShowForm(false);
    setError('');
  };

  const columns = [
    { key: 'id', header: 'الرقم' },
    {
      key: 'student',
      header: 'الطالب',
      render: (payment: any) => payment.student?.full_name || '-',
    },
    {
      key: 'amount',
      header: 'المبلغ',
      render: (payment: Payment) => `${payment.amount.toFixed(2)} ₪`,
    },
    { key: 'payment_date', header: 'تاريخ الدفع' },
    { key: 'note', header: 'ملاحظات' },
    ...(isAdmin
      ? [
          {
            key: 'actions',
            header: 'الإجراءات',
            render: (payment: Payment) => (
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleEdit(payment)}
                >
                  تعديل
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDelete(payment.id)}
                >
                  حذف
                </Button>
              </div>
            ),
          },
        ]
      : []),
  ];

  const studentSummaries = useMemo(() => {
    const map = new Map<number, StudentPaymentSummary>();

    const ensureEntry = (
      studentId: number,
      studentName: string,
      levelName: string
    ) => {
      if (!map.has(studentId)) {
        map.set(studentId, {
          studentId,
          studentName,
          levelName,
          individualDue: 0,
          groupDue: 0,
          totalDue: 0,
          totalPaid: 0,
          remaining: 0,
        });
      }
      return map.get(studentId)!;
    };

    students.forEach((student) => {
      ensureEntry(
        student.id,
        student.full_name,
        student.education_level?.name_ar || 'غير محدد'
      );
    });

    individualLessons.forEach((lesson) => {
      if (!lesson.approved || !lesson.student_id) return;
      const cost = Number(lesson.total_cost) || 0;
      if (cost <= 0) return;
      const entry = ensureEntry(
        lesson.student_id,
        lesson.student?.full_name || `طالب ${lesson.student_id}`,
        lesson.education_level?.name_ar ||
          lesson.student?.education_level?.name_ar ||
          'غير محدد'
      );
      entry.individualDue += cost;
    });

    groupLessons.forEach((lesson) => {
      if (!lesson.approved) return;
      const participants = lesson.students || [];
      if (!participants.length) return;

      let totalForLesson = Number(lesson.total_cost) || 0;

      if (config.app.groupPricingMode === 'tiers') {
        const tier = groupPricingTiers.find(
          (t) =>
            t.education_level_id === lesson.education_level_id &&
            t.student_count === participants.length
        );
        if (tier) {
          const pricePerHour = tier.total_price; // per-hour total for the group
          totalForLesson = pricePerHour * Number(lesson.hours || 1);
        }
      }

      if (totalForLesson <= 0) return;
      const share = totalForLesson / participants.length;
      participants.forEach((student) => {
        const entry = ensureEntry(
          student.id,
          student.full_name,
          lesson.education_level?.name_ar || student.education_level?.name_ar || 'غير محدد'
        );
        entry.groupDue += share;
      });
    });

    payments.forEach((payment) => {
      if (!payment.student_id) return;
      const entry = ensureEntry(
        payment.student_id,
        payment.student?.full_name || `طالب ${payment.student_id}`,
        payment.student?.education_level?.name_ar || 'غير محدد'
      );
      entry.totalPaid += Number(payment.amount) || 0;
    });

    return Array.from(map.values()).map((entry) => {
      const totalDue = entry.individualDue + entry.groupDue;
      const remaining = totalDue - entry.totalPaid;
      return {
        ...entry,
        totalDue,
        remaining,
      };
    });
  }, [students, individualLessons, groupLessons, payments, groupPricingTiers]);

  const filteredSummaries = useMemo(() => {
    if (!summarySearch.trim()) {
      return studentSummaries;
    }
    const search = summarySearch.toLowerCase();
    return studentSummaries.filter((summary) =>
      summary.studentName.toLowerCase().includes(search)
    );
  }, [studentSummaries, summarySearch]);

  const summaryColumns = [
    { key: 'studentName', header: 'الطالب' },
    { key: 'levelName', header: 'المستوى' },
    {
      key: 'individualDue',
      header: 'مستحق فردي',
      render: (row: StudentPaymentSummary) => formatCurrency(row.individualDue),
    },
    {
      key: 'groupDue',
      header: 'مستحق جماعي',
      render: (row: StudentPaymentSummary) => formatCurrency(row.groupDue),
    },
    {
      key: 'totalDue',
      header: 'إجمالي المستحق',
      render: (row: StudentPaymentSummary) => formatCurrency(row.totalDue),
    },
    {
      key: 'totalPaid',
      header: 'المدفوع',
      render: (row: StudentPaymentSummary) => formatCurrency(row.totalPaid),
    },
    {
      key: 'remaining',
      header: 'المتبقي',
      render: (row: StudentPaymentSummary) => (
        <span className={row.remaining > 0 ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>
          {formatCurrency(row.remaining)}
        </span>
      ),
    },
  ];

  const summaryByStudent = useMemo(() => {
    const map = new Map<number, StudentPaymentSummary>();
    studentSummaries.forEach((summary) => {
      map.set(summary.studentId, summary);
    });
    return map;
  }, [studentSummaries]);

  const selectedStudentId = formData.student_id ? parseInt(formData.student_id, 10) : null;
  const selectedSummary = selectedStudentId ? summaryByStudent.get(selectedStudentId) : undefined;
  const editAllowance =
    editingPayment && editingPayment.student_id === selectedStudentId ? editingPayment.amount : 0;
  const maxPayable =
    selectedSummary && Number.isFinite(selectedSummary.remaining)
      ? Math.max(selectedSummary.remaining + editAllowance, 0)
      : 0;

  if (loading) {
    return <div className="text-center py-8 text-gray-900">جاري التحميل...</div>;
  }

  return (
    <div dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">المدفوعات</h1>
        {!showForm && isAdmin && (
          <Button onClick={() => setShowForm(true)}>
            إضافة دفعة جديدة
          </Button>
        )}
      </div>

      {showForm && isAdmin && (
        <Card title={editingPayment ? 'تعديل الدفعة' : 'إضافة دفعة جديدة'} className="mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <ComboBox
              label="الطالب"
              value={formData.student_id}
              onChange={(val) => setFormData({ ...formData, student_id: val })}
              options={[
                ...students.map((s) => ({ value: s.id.toString(), label: s.full_name })),
              ]}
              placeholder="ابحث باسم الطالب ثم اختر"
              required
            />
            <Input
              label="المبلغ (₪)"
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
            />
            {selectedStudentId && (
              <p className="text-sm text-gray-500">
                {maxPayable > 0
                  ? `المبلغ المتبقي لهذا الطالب: ${formatCurrency(maxPayable)}`
                  : 'لا يوجد مبلغ متبقٍ لهذا الطالب'}
              </p>
            )}
            <Input
              label="تاريخ الدفع"
              type="date"
              value={formData.payment_date}
              onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
              required
            />
            <Input
              label="ملاحظات"
              type="text"
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
            />

            <div className="flex gap-2">
              <Button type="submit" isLoading={submitting}>
                {editingPayment ? 'حفظ التغييرات' : 'إضافة'}
              </Button>
              <Button type="button" variant="secondary" onClick={resetForm}>
                إلغاء
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card
        title="مستحقات الطلاب"
        className="mb-6"
        actions={
          <div className="w-64">
            <Input
              placeholder="ابحث عن طالب"
              value={summarySearch}
              onChange={(e) => setSummarySearch(e.target.value)}
            />
          </div>
        }
      >
        <Table
          columns={summaryColumns}
          data={filteredSummaries}
          emptyMessage="لا توجد بيانات لعرضها"
        />
      </Card>

      <Card>
        <Table
          columns={columns}
          data={payments}
          emptyMessage="لا يوجد مدفوعات"
        />
      </Card>
    </div>
  );
}
