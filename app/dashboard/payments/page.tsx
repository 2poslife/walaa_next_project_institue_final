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
import { Payment, Student, IndividualLesson, GroupLesson, GroupPricingTier, RemedialLesson, EducationLevel } from '@/types';
import { config } from '@/lib/config';
import { useAuth } from '@/contexts/AuthContext';
import { getTodayLocalDate, getFirstDayOfMonth, getLastDayOfMonth } from '@/lib/utils/date';
import { downloadCSV, LessonExportRow } from '@/lib/utils/export';
import { withBustanFallback } from '@/lib/utils/education-levels';

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

interface CalculationRow {
  type: 'individual' | 'group' | 'remedial';
  typeLabel: string;
  date: string;
  hours: number;
  cost: number;
  note?: string;
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
  const [educationLevels, setEducationLevels] = useState<EducationLevel[]>([]);
  const [selectedEducationLevel, setSelectedEducationLevel] = useState<string>('');
  const [paymentStatus, setPaymentStatus] = useState<string>('all'); // 'all', 'paid', 'unpaid'
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportStudentId, setExportStudentId] = useState<number | null>(null);
  const [exportStudentName, setExportStudentName] = useState('');
  const [exportYear, setExportYear] = useState(new Date().getFullYear());
  const [exportMonth, setExportMonth] = useState(String(new Date().getMonth() + 1).padStart(2, '0'));
  const [calculationModalStudentId, setCalculationModalStudentId] = useState<number | null>(null);
  const [calculationModalLessons, setCalculationModalLessons] = useState<{
    individual: IndividualLesson[];
    group: GroupLesson[];
    remedial: RemedialLesson[];
  } | null>(null);
  const [calculationModalLoading, setCalculationModalLoading] = useState(false);
  const [duesSummary, setDuesSummary] = useState<StudentPaymentSummary[] | null>(null);
  const [duesSummaryError, setDuesSummaryError] = useState('');
  // When user opens "كيف تم الحساب", we get correct group/remedial from that student's lessons; merge into table
  const [correctedSummariesByStudent, setCorrectedSummariesByStudent] = useState<
    Record<number, Pick<StudentPaymentSummary, 'individualDue' | 'groupDue' | 'remedialDue' | 'totalDue' | 'totalPaid' | 'remaining'>>
  >({});
  const { isAdmin } = useAuth();

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = String(currentDate.getMonth() + 1).padStart(2, '0');

  const exportYears = [2024, 2025, 2026, 2027];
  const exportMonths = [
    { value: 'all', label: 'كل الشهور' },
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
        api.getDuesSummary(),
        api.getEducationLevels(),
      ];
      if (config.app.groupPricingMode === 'tiers') {
        promises.push(api.getGroupPricingTiers());
      }
      const results = await Promise.all(promises);
      const [paymentsRes, studentsRes, duesSummaryRes, levelsRes, tiersRes] = results;

      if (paymentsRes.success && paymentsRes.data) {
        setPayments(paymentsRes.data);
      }
      if (studentsRes.success && studentsRes.data) {
        setStudents(studentsRes.data);
      }
      if (levelsRes.success && Array.isArray(levelsRes.data)) {
        setEducationLevels(withBustanFallback(levelsRes.data as EducationLevel[]));
      }
      if (tiersRes && tiersRes.success && tiersRes.data) {
        setGroupPricingTiers(tiersRes.data as GroupPricingTier[]);
      }

      setDuesSummaryError('');
      const rawRows = duesSummaryRes?.success && Array.isArray(duesSummaryRes.data) ? duesSummaryRes.data : null;
      const tiers = tiersRes?.success && Array.isArray(tiersRes?.data) ? (tiersRes.data as GroupPricingTier[]) : [];
      if (rawRows && rawRows.length > 0) {
        const rows = rawRows as Array<Record<string, unknown>>;
        const initialSummary: StudentPaymentSummary[] = rows.map((r) => ({
          studentId: Number(r.student_id ?? r.studentId),
          studentName: String(r.student_name ?? r.studentName ?? ''),
          levelName: String(r.level_name ?? r.levelName ?? 'غير محدد'),
          individualDue: Number(r.individual_due ?? r.individualDue ?? 0),
          groupDue: Number(r.group_due ?? r.groupDue ?? 0),
          remedialDue: Number(r.remedial_due ?? r.remedialDue ?? 0),
          totalDue: Number(r.total_due ?? r.totalDue ?? 0),
          totalPaid: Number(r.total_paid ?? r.totalPaid ?? 0),
          remaining: Number(r.remaining ?? 0),
        }));
        setIndividualLessons([]);
        // Fetch group + remedial so we can show correct group/remedial on load (DB often returns 0)
        const lessonsLimit = 10000;
        const [groupRes, remedialRes] = await Promise.all([
          api.getGroupLessons({ approved: true, limit: lessonsLimit }),
          api.getRemedialLessons({ approved: true, limit: lessonsLimit }),
        ]);
        const groupLessonsList = (groupRes.success && Array.isArray(groupRes.data) ? groupRes.data : []) as GroupLesson[];
        const remedialLessonsList = (remedialRes.success && Array.isArray(remedialRes.data) ? remedialRes.data : []) as RemedialLesson[];
        setGroupLessons(groupLessonsList);
        setRemedialLessons(remedialLessonsList);
        // Patch group/remedial per student (same logic as fallback)
        const patchMap: Record<number, { groupDue: number; remedialDue: number }> = {};
        initialSummary.forEach((r) => {
          patchMap[r.studentId] = { groupDue: 0, remedialDue: 0 };
        });
        groupLessonsList.forEach((lesson) => {
          if (!lesson.approved) return;
          const participants = lesson.students || [];
          if (!participants.length) return;
          let totalForLesson = Number(lesson.total_cost) || 0;
          if (config.app.groupPricingMode === 'tiers') {
            const tier = tiers.find(
              (t) =>
                t.education_level_id === lesson.education_level_id &&
                t.student_count === participants.length
            );
            if (tier) totalForLesson = Number(tier.total_price) * Number(lesson.hours || 1);
          }
          if (totalForLesson <= 0) return;
          const share = totalForLesson / participants.length;
          participants.forEach((student: { id: number }) => {
            if (patchMap[student.id]) patchMap[student.id].groupDue += share;
          });
        });
        remedialLessonsList.forEach((lesson) => {
          if (!lesson.approved || !lesson.student_id) return;
          const cost = Number(lesson.total_cost) || 0;
          if (cost <= 0) return;
          if (patchMap[lesson.student_id]) patchMap[lesson.student_id].remedialDue += cost;
        });
        const patchedSummary = initialSummary.map((r) => {
          const p = patchMap[r.studentId] || { groupDue: 0, remedialDue: 0 };
          const groupDue = parseFloat(p.groupDue.toFixed(2));
          const remedialDue = parseFloat(p.remedialDue.toFixed(2));
          const totalDue = r.individualDue + groupDue + remedialDue;
          const remaining = totalDue - r.totalPaid;
          return { ...r, groupDue, remedialDue, totalDue, remaining };
        });
        setDuesSummary(patchedSummary);
      } else {
        // Fallback: DB function missing or failed – fetch lessons and compute on client
        setDuesSummary(null);
        setDuesSummaryError(
          rawRows === null
            ? 'ملخص المستحقات من قاعدة البيانات غير متوفر. جاري استخدام طريقة بديلة (تحميل الدروس).'
            : ''
        );
        const lessonsLimit = 10000;
        const [individualRes, groupRes, remedialRes] = await Promise.all([
          api.getIndividualLessons({ approved: true, limit: lessonsLimit }),
          api.getGroupLessons({ approved: true, limit: lessonsLimit }),
          api.getRemedialLessons({ approved: true, limit: lessonsLimit }),
        ]);
        if (individualRes.success && Array.isArray(individualRes.data)) {
          setIndividualLessons(individualRes.data as IndividualLesson[]);
        }
        if (groupRes.success && Array.isArray(groupRes.data)) {
          setGroupLessons(groupRes.data as GroupLesson[]);
        }
        if (remedialRes.success && Array.isArray(remedialRes.data)) {
          setRemedialLessons(remedialRes.data as RemedialLesson[]);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setDuesSummary([]);
      setDuesSummaryError('فشل تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const openCalculationModal = async (studentId: number) => {
    setCalculationModalStudentId(studentId);
    setCalculationModalLessons(null);
    setCalculationModalLoading(true);
    try {
      const [individualRes, groupRes, remedialRes] = await Promise.all([
        api.getIndividualLessons({ student_id: studentId, approved: true }),
        api.getGroupLessons(isAdmin ? { approved: true, for_payment: true } : { approved: true }),
        api.getRemedialLessons({ student_id: studentId, approved: true }),
      ]);
      const individual = (individualRes.success && Array.isArray(individualRes.data) ? individualRes.data : []) as IndividualLesson[];
      const groupRaw = (groupRes.success && Array.isArray(groupRes.data) ? groupRes.data : []) as GroupLesson[];
      const groupForStudent = groupRaw.filter((g) => g.students?.some((s: { id: number }) => s.id === studentId));
      const remedial = (remedialRes.success && Array.isArray(remedialRes.data) ? remedialRes.data : []) as RemedialLesson[];
      setCalculationModalLessons({ individual, group: groupForStudent, remedial });
    } catch (err) {
      console.error('Error loading calculation modal lessons:', err);
      setCalculationModalLessons({ individual: [], group: [], remedial: [] });
    } finally {
      setCalculationModalLoading(false);
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

  // Dues from DB (get_student_dues_summary) – no lesson fetch for the table
  const studentSummaries = useMemo(() => {
    if (duesSummary != null) return duesSummary;
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
  }, [duesSummary, students, individualLessons, groupLessons, remedialLessons, payments, groupPricingTiers]);

  const filteredSummaries = useMemo(() => {
    let filtered = studentSummaries;

    // Filter by education level
    if (selectedEducationLevel) {
      const levelId = parseInt(selectedEducationLevel, 10);
      filtered = filtered.filter((summary) => {
        const student = students.find((s) => s.id === summary.studentId);
        return student?.education_level_id === levelId;
      });
    }

    // Filter by payment status
    if (paymentStatus === 'paid') {
      filtered = filtered.filter((summary) => summary.remaining <= 0);
    } else if (paymentStatus === 'unpaid') {
      filtered = filtered.filter((summary) => summary.remaining > 0);
    }

    // Filter by search text
    if (summarySearch.trim()) {
      const search = summarySearch.toLowerCase();
      filtered = filtered.filter((summary) =>
        summary.studentName.toLowerCase().includes(search)
      );
    }

    // Sort by remaining balance (descending - highest first)
    return filtered.sort((a, b) => b.remaining - a.remaining);
  }, [studentSummaries, summarySearch, selectedEducationLevel, paymentStatus, students]);

  // Merge in corrected totals from "كيف تم الحساب" so table shows correct group/remedial after user opens details
  const displaySummaries = useMemo(() => {
    return filteredSummaries.map((s) => {
      const corrected = correctedSummariesByStudent[s.studentId];
      if (!corrected) return s;
      return { ...s, ...corrected };
    });
  }, [filteredSummaries, correctedSummariesByStudent]);

  const calculationBreakdown = useMemo(() => {
    if (calculationModalStudentId == null || !calculationModalLessons) return null;
    const studentId = calculationModalStudentId;
    const { individual: ind, group: grp, remedial: rem } = calculationModalLessons;
    const rows: CalculationRow[] = [];
    let individualDue = 0;
    let groupDue = 0;
    let remedialDue = 0;
    let studentName = '';
    let levelName = '';

    ind.forEach((lesson) => {
      if (!lesson.approved || lesson.student_id !== studentId) return;
      studentName = lesson.student?.full_name || `طالب ${studentId}`;
      levelName = lesson.education_level?.name_ar || lesson.student?.education_level?.name_ar || 'غير محدد';
      const cost = Number(lesson.total_cost) || 0;
      const hours = Number(lesson.hours) || 0;
      // Always show the lesson row (even if cost is 0) so no approved lesson is hidden
      rows.push({
        type: 'individual',
        typeLabel: 'فردي',
        date: lesson.date,
        hours,
        cost,
        note: cost <= 0 ? 'لم يُحسب في المستحق' : undefined,
      });
      if (cost > 0) individualDue += cost;
    });

    grp.forEach((lesson) => {
      if (!lesson.approved) return;
      const participants = lesson.students || [];
      if (!participants.some((s) => s.id === studentId)) return;
      let totalForLesson = Number(lesson.total_cost) || 0;
      if (config.app.groupPricingMode === 'tiers' && totalForLesson <= 0) {
        const tier = groupPricingTiers.find(
          (t) =>
            t.education_level_id === lesson.education_level_id &&
            t.student_count === participants.length
        );
        if (tier) {
          totalForLesson = Number(tier.total_price) * Number(lesson.hours || 1);
        }
      }
      const hours = Number(lesson.hours) || 1;
      const share = totalForLesson > 0 ? totalForLesson / participants.length : 0;
      // Always show the lesson row (even if cost is 0) so no approved lesson is hidden
      rows.push({
        type: 'group',
        typeLabel: 'جماعي',
        date: lesson.date,
        hours,
        cost: parseFloat(share.toFixed(2)),
        note: totalForLesson > 0
          ? `حصة من ${participants.length}`
          : `حصة من ${participants.length} — إجمالي الدرس غير محدد (لم يُحسب في المستحق)`,
      });
      if (totalForLesson > 0) groupDue += share;
    });

    rem.forEach((lesson) => {
      if (!lesson.approved || lesson.student_id !== studentId) return;
      const cost = Number(lesson.total_cost) || 0;
      if (cost <= 0) return;
      studentName = lesson.student?.full_name || studentName || `طالب ${studentId}`;
      levelName = lesson.student?.education_level?.name_ar || levelName || 'غير محدد';
      const hours = Number(lesson.hours) || 0;
      rows.push({
        type: 'remedial',
        typeLabel: 'הוראה מתקנת',
        date: lesson.date,
        hours,
        cost,
      });
      remedialDue += cost;
    });

    const totalDue = individualDue + groupDue + remedialDue;
    const summary = studentSummaries.find((s) => s.studentId === studentId);
    if (summary) {
      studentName = summary.studentName;
      levelName = summary.levelName;
    }

    return {
      studentName,
      levelName,
      rows: rows.sort((a, b) => b.date.localeCompare(a.date)),
      individualDue: parseFloat(individualDue.toFixed(2)),
      groupDue: parseFloat(groupDue.toFixed(2)),
      remedialDue: parseFloat(remedialDue.toFixed(2)),
      totalDue: parseFloat(totalDue.toFixed(2)),
    };
  }, [calculationModalStudentId, calculationModalLessons, groupPricingTiers, studentSummaries]);

  // When "كيف تم الحساب" is opened and we have correct breakdown (incl. group/remedial), save it so the table row shows correct totals
  useEffect(() => {
    if (calculationBreakdown == null || calculationModalStudentId == null) return;
    const summary = studentSummaries.find((s) => s.studentId === calculationModalStudentId);
    const totalPaid = summary?.totalPaid ?? 0;
    const remaining = calculationBreakdown.totalDue - totalPaid;
    setCorrectedSummariesByStudent((prev) => ({
      ...prev,
      [calculationModalStudentId]: {
        individualDue: calculationBreakdown.individualDue,
        groupDue: calculationBreakdown.groupDue,
        remedialDue: calculationBreakdown.remedialDue,
        totalDue: calculationBreakdown.totalDue,
        totalPaid,
        remaining,
      },
    }));
  }, [calculationBreakdown, calculationModalStudentId, studentSummaries]);

  const handleOpenExportModal = (studentId: number, studentName: string) => {
    setExportStudentId(studentId);
    setExportStudentName(studentName);
    setExportYear(currentYear);
    setExportMonth(currentMonth);
    setExportModalOpen(true);
  };

  const handleExportStudentLessonsCSV = async (studentId: number, studentName: string, year: number, month: string) => {
    const isAllMonths = month === 'all';
    const monthStart = isAllMonths ? `${year}-01-01` : getFirstDayOfMonth(year, parseInt(month));
    const monthEnd = isAllMonths ? `${year}-12-31` : getLastDayOfMonth(year, parseInt(month));

    // Fetch this student's lessons for the period (no need to have all lessons in state)
    const [individualRes, groupRes, remedialRes] = await Promise.all([
      api.getIndividualLessons({ student_id: studentId, approved: true, date_from: monthStart, date_to: monthEnd }),
      api.getGroupLessons({ approved: true, date_from: monthStart, date_to: monthEnd }),
      api.getRemedialLessons({ student_id: studentId, approved: true, date_from: monthStart, date_to: monthEnd }),
    ]);
    const studentIndividualLessons = (individualRes.success && Array.isArray(individualRes.data) ? individualRes.data : []) as IndividualLesson[];
    const groupRaw = (groupRes.success && Array.isArray(groupRes.data) ? groupRes.data : []) as GroupLesson[];
    const studentGroupLessons = groupRaw.filter((g) => g.students?.some((s: { id: number }) => s.id === studentId));
    const studentRemedialLessons = (remedialRes.success && Array.isArray(remedialRes.data) ? remedialRes.data : []) as RemedialLesson[];

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
      alert(isAllMonths 
        ? `لا توجد دروس معتمدة لهذا الطالب في السنة ${year}` 
        : 'لا توجد دروس معتمدة لهذا الطالب في هذا الشهر');
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
    
    const safeStudentName = studentName.replace(/\s+/g, '_').replace(/[^\w\u0600-\u06FF]/g, '');
    let filename: string;
    if (isAllMonths) {
      filename = `${safeStudentName}_lessons_${year}_all_months.csv`;
    } else {
      const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
      const monthName = monthNames[parseInt(month) - 1];
      filename = `${safeStudentName}_lessons_${year}_${month}_${monthName}.csv`;
    }
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
    ...(isAdmin
      ? [
          {
            key: 'howCalculated',
            header: 'كيف تم الحساب',
            render: (row: StudentPaymentSummary) => (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => openCalculationModal(row.studentId)}
                title="عرض تفاصيل حساب المستحق"
              >
                كيف تم الحساب
              </Button>
            ),
          },
        ]
      : []),
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

      {duesSummaryError && (
        <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded">
          {duesSummaryError}
        </div>
      )}

      <Card className="mb-6">
        <div className="flex items-center justify-between mb-4 gap-4" dir="rtl">
          <div className="flex gap-2">
            <div className="w-64">
              <Input
                placeholder="ابحث عن طالب"
                value={summarySearch}
                onChange={(e) => setSummarySearch(e.target.value)}
              />
            </div>
            <div className="w-48">
              <Select
                value={selectedEducationLevel}
                onChange={(e) => setSelectedEducationLevel(e.target.value)}
                options={[
                  { value: '', label: 'جميع المستويات' },
                  ...educationLevels.map((level) => ({
                    value: level.id.toString(),
                    label: level.name_ar,
                  })),
                ]}
              />
            </div>
            <div className="w-40">
              <Select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
                options={[
                  { value: 'all', label: 'الكل' },
                  { value: 'paid', label: 'مدفوع' },
                  { value: 'unpaid', label: 'غير مدفوع' },
                ]}
              />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 flex-1 text-center">مستحقات الطلاب</h3>
          <div className="w-64"></div>
        </div>
        <Table
          columns={summaryColumns}
          data={displaySummaries}
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
        open={calculationModalStudentId != null}
        onClose={() => {
          setCalculationModalStudentId(null);
          setCalculationModalLessons(null);
        }}
        ariaLabel="كيف تم حساب المستحق"
      >
        <Card
          title={calculationBreakdown ? `كيف تم الحساب - ${calculationBreakdown.studentName}` : 'كيف تم الحساب'}
          className="max-w-4xl max-h-[85vh] flex flex-col"
        >
          <div className="overflow-auto flex-1 min-h-0 space-y-4">
            {calculationModalLoading ? (
              <p className="text-gray-500">جاري التحميل...</p>
            ) : !calculationBreakdown ? (
              <p className="text-gray-500">—</p>
            ) : (
              <>
                <p className="text-sm text-gray-600">
                  <strong>المستوى:</strong> {calculationBreakdown.levelName}
                </p>
                <div className="border rounded overflow-hidden">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="text-right py-2 px-3">النوع</th>
                        <th className="text-right py-2 px-3">التاريخ</th>
                        <th className="text-right py-2 px-3">الساعات</th>
                        <th className="text-right py-2 px-3">المبلغ</th>
                        <th className="text-right py-2 px-3">ملاحظة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {calculationBreakdown.rows.map((row, i) => (
                        <tr key={i} className="border-t">
                          <td className="py-2 px-3">{row.typeLabel}</td>
                          <td className="py-2 px-3">{row.date}</td>
                          <td className="py-2 px-3">{row.hours}</td>
                          <td className="py-2 px-3 font-medium">{row.cost.toFixed(2)} ₪</td>
                          <td className="py-2 px-3 text-gray-500">{row.note ?? '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="border-t pt-3 text-sm font-semibold space-y-1">
                  <p>مستحق فردي: {calculationBreakdown.individualDue.toFixed(2)} ₪</p>
                  <p>مستحق جماعي: {calculationBreakdown.groupDue.toFixed(2)} ₪</p>
                  <p>הוראה מתקנת: {calculationBreakdown.remedialDue.toFixed(2)} ₪</p>
                  <p className="text-lg pt-2">إجمالي المستحق: {calculationBreakdown.totalDue.toFixed(2)} ₪</p>
                </div>
              </>
            )}
          </div>
          <div className="pt-4 border-t mt-4 flex justify-end">
            <Button
              variant="secondary"
              onClick={() => {
                setCalculationModalStudentId(null);
                setCalculationModalLessons(null);
              }}
            >
              إغلاق
            </Button>
          </div>
        </Card>
      </Modal>

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
