'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api-client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table } from '@/components/ui/Table';
import { Input } from '@/components/ui/Input';
import { ComboBox } from '@/components/ui/ComboBox';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Payment, Student, IndividualLesson, GroupLesson, GroupPricingTier, RemedialLesson } from '@/types';
import { config } from '@/lib/config';
import { useAuth } from '@/contexts/AuthContext';
import { getTodayLocalDate, getFirstDayOfMonth, getLastDayOfMonth } from '@/lib/utils/date';
import { downloadCSV, LessonExportRow } from '@/lib/utils/export';

interface StudentPaymentSummary {
  studentId: number;
  studentName: string;
  levelName: string;
  individualDue: number;
  groupDue: number;
  remedialDue: number;
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
  const [remedialLessons, setRemedialLessons] = useState<RemedialLesson[]>([]);
  const [formData, setFormData] = useState({
    student_id: '',
    amount: '',
    payment_date: getTodayLocalDate(),
    note: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [autoCompletingPayment, setAutoCompletingPayment] = useState<number | null>(null);
  const [summarySearch, setSummarySearch] = useState('');
  const [paymentSearch, setPaymentSearch] = useState('');
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportStudentId, setExportStudentId] = useState<number | null>(null);
  const [exportStudentName, setExportStudentName] = useState('');
  const [exportYear, setExportYear] = useState(new Date().getFullYear());
  const [exportMonth, setExportMonth] = useState(String(new Date().getMonth() + 1).padStart(2, '0'));
  const { isAdmin } = useAuth();

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = String(currentDate.getMonth() + 1).padStart(2, '0');

  const exportYears = [2024, 2025, 2026, 2027];
  const exportMonths = [
    { value: '01', label: 'يناير' },
    { value: '02', label: 'فبراير' },
    { value: '03', label: 'مارس' },
    { value: '04', label: 'أبريل' },
    { value: '05', label: 'مايو' },
    { value: '06', label: 'يونيو' },
    { value: '07', label: 'يوليو' },
    { value: '08', label: 'أغسطس' },
    { value: '09', label: 'سبتمبر' },
    { value: '10', label: 'أكتوبر' },
    { value: '11', label: 'نوفمبر' },
    { value: '12', label: 'ديسمبر' },
  ];

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
        api.getRemedialLessons({ approved: true }),
      ];
      if (config.app.groupPricingMode === 'tiers') {
        promises.push(api.getGroupPricingTiers());
      }
      const results = await Promise.all(promises);
      const [paymentsRes, studentsRes, individualLessonsRes, groupLessonsRes, remedialLessonsRes, tiersRes] =
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
      if (remedialLessonsRes.success && remedialLessonsRes.data) {
        setRemedialLessons(remedialLessonsRes.data as RemedialLesson[]);
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

  const handleAutoCompletePayment = async (studentId: number) => {
    const summary = summaryByStudent.get(studentId);
    if (!summary || summary.remaining <= 0) {
      alert('لا يوجد مبلغ متبقٍ لهذا الطالب');
      return;
    }

    if (!confirm(`هل تريد إنشاء دفعة تلقائية بمبلغ ${formatCurrency(summary.remaining)} للطالب ${summary.studentName}؟`)) {
      return;
    }

    setAutoCompletingPayment(studentId);
    try {
      const response = await api.createPayment({
        student_id: studentId,
        amount: summary.remaining,
        payment_date: getTodayLocalDate(),
        note: 'دفع تلقائي',
      });

      if (response.success) {
        alert(`تم إنشاء دفعة تلقائية بمبلغ ${formatCurrency(summary.remaining)} بنجاح`);
        await loadData();
      } else {
        alert(response.error || 'فشل إنشاء الدفعة التلقائية');
      }
    } catch (err: any) {
      alert(err.message || 'حدث خطأ أثناء إنشاء الدفعة التلقائية');
    } finally {
      setAutoCompletingPayment(null);
    }
  };

  const resetForm = () => {
    setFormData({
      student_id: '',
      amount: '',
      payment_date: getTodayLocalDate(),
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
          remedialDue: 0,
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

    remedialLessons.forEach((lesson) => {
      if (!lesson.approved || !lesson.student_id) return;
      const cost = Number(lesson.total_cost) || 0;
      if (cost <= 0) return;
      const entry = ensureEntry(
        lesson.student_id,
        lesson.student?.full_name || `طالب ${lesson.student_id}`,
        lesson.student?.education_level?.name_ar || 'غير محدد'
      );
      entry.remedialDue += cost;
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
      const totalDue = entry.individualDue + entry.groupDue + entry.remedialDue;
      const remaining = totalDue - entry.totalPaid;
      return {
        ...entry,
        totalDue,
        remaining,
      };
    });
  }, [students, individualLessons, groupLessons, remedialLessons, payments, groupPricingTiers]);

  const filteredSummaries = useMemo(() => {
    if (!summarySearch.trim()) {
      return studentSummaries;
    }
    const search = summarySearch.toLowerCase();
    return studentSummaries.filter((summary) =>
      summary.studentName.toLowerCase().includes(search)
    );
  }, [studentSummaries, summarySearch]);

  const handleOpenExportModal = (studentId: number, studentName: string) => {
    setExportStudentId(studentId);
    setExportStudentName(studentName);
    setExportYear(currentYear);
    setExportMonth(currentMonth);
    setExportModalOpen(true);
  };

  const handleExportStudentLessonsCSV = (studentId: number, studentName: string, year: number, month: string) => {
    const monthStart = getFirstDayOfMonth(year, parseInt(month));
    const monthEnd = getLastDayOfMonth(year, parseInt(month));
    
    // Filter lessons for this student in current month, approved only
    const studentIndividualLessons = individualLessons.filter(
      (lesson) =>
        lesson.student_id === studentId &&
        lesson.approved &&
        lesson.date >= monthStart &&
        lesson.date <= monthEnd &&
        !lesson.deleted_at
    );
    
    const studentGroupLessons = groupLessons.filter(
      (lesson) =>
        lesson.approved &&
        lesson.date >= monthStart &&
        lesson.date <= monthEnd &&
        !lesson.deleted_at &&
        lesson.students?.some((s) => s.id === studentId)
    );
    
    const studentRemedialLessons = remedialLessons.filter(
      (lesson) =>
        lesson.student_id === studentId &&
        lesson.approved &&
        lesson.date >= monthStart &&
        lesson.date <= monthEnd &&
        !lesson.deleted_at
    );
    
    // Prepare export data
    const exportData: any[] = [];
    
    // Individual lessons
    studentIndividualLessons.forEach((lesson) => {
      exportData.push({
        type: 'درس فردي',
        date: lesson.date,
        start_time: lesson.start_time || '',
        teacher: lesson.teacher?.full_name || '',
        student: lesson.student?.full_name || studentName,
        education_level: lesson.education_level?.name_ar || '',
        hours: Number(lesson.hours) || 0,
        total_cost: lesson.total_cost || 0,
        approved: 'نعم',
      });
    });
    
    // Group lessons
    studentGroupLessons.forEach((lesson) => {
      const studentShare = lesson.total_cost ? (lesson.total_cost / (lesson.students?.length || 1)) : 0;
      exportData.push({
        type: 'درس جماعي',
        date: lesson.date,
        start_time: lesson.start_time || '',
        teacher: lesson.teacher?.full_name || '',
        student: studentName,
        education_level: lesson.education_level?.name_ar || '',
        hours: Number(lesson.hours) || 0,
        total_cost: studentShare,
        approved: 'نعم',
      });
    });
    
    // Remedial lessons
    studentRemedialLessons.forEach((lesson) => {
      exportData.push({
        type: 'הוראה מתקנת',
        date: lesson.date,
        start_time: lesson.start_time || '',
        teacher: lesson.teacher?.full_name || '',
        student: lesson.student?.full_name || studentName,
        education_level: '',
        hours: Number(lesson.hours) || 0,
        total_cost: lesson.total_cost || 0,
        approved: 'نعم',
      });
    });
    
    if (exportData.length === 0) {
      alert('لا توجد دروس معتمدة لهذا الطالب في هذا الشهر');
      return;
    }
    
    // Sort by date
    exportData.sort((a, b) => a.date.localeCompare(b.date));
    
    // Create CSV with extended headers (without cost)
    const headers = ['النوع', 'التاريخ', 'وقت البدء', 'المعلم', 'الطالب', 'المستوى التعليمي', 'الساعات', 'معتمد'];
    const rows = exportData.map((row) => [
      row.type,
      row.date,
      row.start_time,
      row.teacher,
      row.student,
      row.education_level,
      row.hours.toString(),
      row.approved,
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');
    
    const csvWithBOM = '\uFEFF' + csvContent;
    const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    
    const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    const monthName = monthNames[parseInt(month) - 1];
    const safeStudentName = studentName.replace(/\s+/g, '_').replace(/[^\w\u0600-\u06FF]/g, '');
    const filename = `${safeStudentName}_lessons_${year}_${month}_${monthName}.csv`;
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const summaryColumns = [
    { key: 'studentName', header: 'الطالب' },
    {
      key: 'export',
      header: 'تصدير',
      render: (row: StudentPaymentSummary) => (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => handleOpenExportModal(row.studentId, row.studentName)}
          title="تحميل دروس الطالب"
        >
          📥 CSV
        </Button>
      ),
    },
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
      key: 'remedialDue',
      header: 'הוראה מתקנת',
      render: (row: StudentPaymentSummary) => formatCurrency(row.remedialDue),
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
    ...(isAdmin
      ? [
          {
            key: 'autoComplete',
            header: 'دفع تلقائي',
            render: (row: StudentPaymentSummary) => (
              <Button
                size="sm"
                variant="primary"
                onClick={() => handleAutoCompletePayment(row.studentId)}
                disabled={row.remaining <= 0 || autoCompletingPayment === row.studentId}
                isLoading={autoCompletingPayment === row.studentId}
                title={row.remaining > 0 ? `إنشاء دفعة تلقائية بمبلغ ${formatCurrency(row.remaining)}` : 'لا يوجد مبلغ متبقٍ'}
              >
                ✓ دفع كامل
              </Button>
            ),
          },
        ]
      : []),
  ];

  const summaryByStudent = useMemo(() => {
    const map = new Map<number, StudentPaymentSummary>();
    studentSummaries.forEach((summary) => {
      map.set(summary.studentId, summary);
    });
    return map;
  }, [studentSummaries]);

  const filteredPayments = useMemo(() => {
    if (!paymentSearch.trim()) {
      return payments;
    }
    const search = paymentSearch.toLowerCase();
    return payments.filter((payment) =>
      payment.student?.full_name?.toLowerCase().includes(search)
    );
  }, [payments, paymentSearch]);

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

      <Card className="mb-6">
        <div className="flex items-center justify-between mb-4" dir="rtl">
          <div className="w-64">
            <Input
              placeholder="ابحث عن طالب"
              value={summarySearch}
              onChange={(e) => setSummarySearch(e.target.value)}
            />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 flex-1 text-center">مستحقات الطلاب</h3>
          <div className="w-64"></div>
        </div>
        <Table
          columns={summaryColumns}
          data={filteredSummaries}
          emptyMessage="لا توجد بيانات لعرضها"
        />
      </Card>

      <Card
        title="سجل المدفوعات"
        className="mb-6"
        actions={
          <div className="w-64">
            <Input
              placeholder="ابحث عن طالب"
              value={paymentSearch}
              onChange={(e) => setPaymentSearch(e.target.value)}
            />
          </div>
        }
      >
        <Table
          columns={columns}
          data={filteredPayments}
          emptyMessage="لا يوجد مدفوعات"
        />
      </Card>

      <Modal
        open={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        ariaLabel="تصدير دروس الطالب"
      >
        <Card title={`تصدير دروس ${exportStudentName}`}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="السنة"
                value={exportYear.toString()}
                onChange={(e) => setExportYear(Number(e.target.value))}
                options={exportYears.map((year) => ({
                  value: year.toString(),
                  label: year.toString(),
                }))}
              />
              <Select
                label="الشهر"
                value={exportMonth}
                onChange={(e) => setExportMonth(e.target.value)}
                options={exportMonths}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="secondary"
                onClick={() => setExportModalOpen(false)}
              >
                إلغاء
              </Button>
              <Button
                onClick={() => {
                  if (exportStudentId) {
                    handleExportStudentLessonsCSV(exportStudentId, exportStudentName, exportYear, exportMonth);
                    setExportModalOpen(false);
                  }
                }}
              >
                تحميل CSV
              </Button>
            </div>
          </div>
        </Card>
      </Modal>
    </div>
  );
}
