'use client';

import { useEffect, useState, useMemo } from 'react';
import { api } from '@/lib/api-client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table, TableColumn } from '@/components/ui/Table';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ComboBox } from '@/components/ui/ComboBox';
import { TimePicker } from '@/components/ui/TimePicker';
import { Modal } from '@/components/ui/Modal';
import { SpecialLessonNote, Student, EducationLevel, Teacher } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { getTodayLocalDate } from '@/lib/utils/date';

export default function SpecialLessonsPage() {
  const { isAdmin, isTeacher, teacher } = useAuth();
  const [notes, setNotes] = useState<SpecialLessonNote[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [educationLevels, setEducationLevels] = useState<EducationLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    date: getTodayLocalDate(),
    start_time: '',
    hours: '',
    student_ids: [] as number[],
    teacher_note: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    teacher_id: '',
    is_read: 'all', // 'all', 'read', 'unread'
    date_from: '',
    date_to: '',
  });
  const [adminNoteModalOpen, setAdminNoteModalOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<SpecialLessonNote | null>(null);
  const [adminNote, setAdminNote] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [notesRes, studentsRes, levelsRes] = await Promise.all([
        api.getSpecialLessonNotes({
          teacher_id: filters.teacher_id ? parseInt(filters.teacher_id) : undefined,
          is_read: filters.is_read === 'read' ? true : filters.is_read === 'unread' ? false : undefined,
          date_from: filters.date_from || undefined,
          date_to: filters.date_to || undefined,
        }),
        api.getStudents(),
        api.getEducationLevels(),
      ]);

      if (notesRes.success && notesRes.data) {
        setNotes(notesRes.data as SpecialLessonNote[]);
      }
      if (studentsRes.success && studentsRes.data) {
        setStudents(studentsRes.data as Student[]);
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

  useEffect(() => {
    loadData();
  }, [filters.teacher_id, filters.is_read, filters.date_from, filters.date_to]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (formData.student_ids.length === 0 || !formData.teacher_note.trim()) {
        setError('جميع الحقول إلزامية: التاريخ، الطلاب، والملاحظة');
        setSubmitting(false);
        return;
      }

      const payload = {
        date: formData.date,
        start_time: formData.start_time || undefined,
        hours: formData.hours ? parseFloat(formData.hours) : undefined,
        student_ids: formData.student_ids,
        teacher_note: formData.teacher_note.trim(),
      };

      const response = await api.createSpecialLessonNote(payload);

      if (!response.success) {
        setError(response.error || 'فشل إنشاء الملاحظة');
        return;
      }

      await loadData();
      resetForm();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء إنشاء الملاحظة');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      date: getTodayLocalDate(),
      start_time: '',
      hours: '',
      student_ids: [],
      teacher_note: '',
    });
    setShowForm(false);
    setError('');
  };

  const handleMarkRead = async (note: SpecialLessonNote, isRead: boolean) => {
    if (!isAdmin) return;

    try {
      const response = await api.markSpecialLessonNoteRead(note.id, isRead);
      if (response.success) {
        await loadData();
      } else {
        alert(response.error || 'فشل تحديث حالة القراءة');
      }
    } catch (err: any) {
      alert(err.message || 'حدث خطأ');
    }
  };

  const handleOpenAdminNoteModal = (note: SpecialLessonNote) => {
    setSelectedNote(note);
    setAdminNote(note.admin_note || '');
    setAdminNoteModalOpen(true);
  };

  const handleSaveAdminNote = async () => {
    if (!selectedNote || !isAdmin) return;

    try {
      const response = await api.updateSpecialLessonNote(selectedNote.id, adminNote.trim() || null);
      if (response.success) {
        await loadData();
        setAdminNoteModalOpen(false);
        setSelectedNote(null);
        setAdminNote('');
      } else {
        alert(response.error || 'فشل حفظ الملاحظة الإدارية');
      }
    } catch (err: any) {
      alert(err.message || 'حدث خطأ');
    }
  };

  const sortedStudents = useMemo(
    () => [...students].sort((a, b) => a.full_name.localeCompare(b.full_name, 'ar')),
    [students]
  );

  const studentOptions = useMemo(
    () =>
      sortedStudents.map((student) => ({
        value: student.id.toString(),
        label: student.class ? `${student.full_name} - ${student.class}` : student.full_name,
      })),
    [sortedStudents]
  );

  const selectedStudents = useMemo(
    () => students.filter((s) => formData.student_ids.includes(s.id)),
    [students, formData.student_ids]
  );

  const filteredNotes = useMemo(() => {
    let filtered = notes;

    if (filters.search.trim()) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(
        (note) =>
          note.teacher?.full_name?.toLowerCase().includes(search) ||
          note.teacher_note.toLowerCase().includes(search) ||
          (note.class && note.class.toLowerCase().includes(search)) ||
          note.students?.some((s) => s.full_name.toLowerCase().includes(search))
      );
    }

    return filtered;
  }, [notes, filters.search]);

  const columns: TableColumn<SpecialLessonNote>[] = [
    { key: 'date', header: 'التاريخ' },
    {
      key: 'teacher',
      header: 'المعلم',
      render: (note) => note.teacher?.full_name || '-',
    },
    {
      key: 'education_level',
      header: 'المستوى',
      render: (note) => note.education_level?.name_ar || '-',
    },
    { 
      key: 'class', 
      header: 'الصف',
      render: (note: SpecialLessonNote) => note.class || '-',
    },
    {
      key: 'students',
      header: 'الطلاب',
      render: (note) =>
        note.students && note.students.length > 0
          ? note.students.map((s) => s.full_name).join('، ')
          : '-',
    },
    {
      key: 'teacher_note',
      header: 'ملاحظة المعلم',
      render: (note) => (
        <div className="max-w-md">
          <p className="text-sm whitespace-pre-wrap">{note.teacher_note}</p>
        </div>
      ),
    },
    ...(isAdmin
      ? [
          {
            key: 'is_read',
            header: 'الحالة',
            render: (note: SpecialLessonNote) => (
              <span className={`px-2 py-1 rounded text-xs ${note.is_read ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                {note.is_read ? 'مقروء' : 'غير مقروء'}
              </span>
            ),
          },
          {
            key: 'actions',
            header: 'الإجراءات',
            render: (note: SpecialLessonNote) => (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={note.is_read ? 'secondary' : 'primary'}
                  onClick={() => handleMarkRead(note, !note.is_read)}
                >
                  {note.is_read ? 'إلغاء المقروء' : 'وضع مقروء'}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleOpenAdminNoteModal(note)}
                >
                  ملاحظة إدارية
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
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ملاحظات الدروس الخاصة</h1>
          <p className="text-gray-600 mt-1">
            إضافة ومراجعة ملاحظات الدروس الخاصة/الاستثنائية
          </p>
        </div>
        {isTeacher && (
          <Button onClick={() => setShowForm(true)}>إضافة ملاحظة درس خاص</Button>
        )}
      </div>

      {showForm && isTeacher && (
        <Card title="إضافة ملاحظة درس خاص" className="mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="التاريخ *"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
              <TimePicker
                label="وقت البدء"
                value={formData.start_time}
                onChange={(value) => setFormData({ ...formData, start_time: value || '' })}
              />
            </div>

            <Select
              label="عدد الساعات"
              value={formData.hours}
              onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
              options={[
                { value: '', label: 'اختر عدد الساعات' },
                ...Array.from({ length: 11 }, (_, i) => {
                  const hours = 0.5 + (i * 0.25);
                  const hoursStr = hours.toString();
                  let label = '';
                  if (hours === 0.5) {
                    label = 'نصف ساعة';
                  } else if (hours === 1) {
                    label = 'ساعة واحدة';
                  } else if (hours === 1.5) {
                    label = 'ساعة ونصف';
                  } else if (hours === 2) {
                    label = 'ساعتان';
                  } else if (hours === 2.5) {
                    label = 'ساعتان ونصف';
                  } else if (hours === 3) {
                    label = 'ثلاث ساعات';
                  } else {
                    label = `${hours} ساعة`;
                  }
                  return { value: hoursStr, label };
                }),
              ]}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الطلاب * (يمكن اختيار عدة طلاب)
              </label>
              <ComboBox
                value=""
                onChange={(value) => {
                  const studentId = parseInt(value);
                  if (studentId && !formData.student_ids.includes(studentId)) {
                    setFormData({
                      ...formData,
                      student_ids: [...formData.student_ids, studentId],
                    });
                  }
                }}
                options={studentOptions.filter(
                  (opt) => !formData.student_ids.includes(Number(opt.value))
                )}
                placeholder="اختر طالب"
              />
              {selectedStudents.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedStudents.map((student) => (
                    <span
                      key={student.id}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                    >
                      {student.full_name}
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            student_ids: formData.student_ids.filter((id) => id !== student.id),
                          });
                        }}
                        className="mr-2 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الملاحظة * (وصف الدرس الخاص/الاستثنائي)
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                rows={4}
                value={formData.teacher_note}
                onChange={(e) => setFormData({ ...formData, teacher_note: e.target.value })}
                placeholder="اكتب ملاحظة مفصلة عن الدرس الخاص..."
                required
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" isLoading={submitting}>
                إضافة الملاحظة
              </Button>
              <Button type="button" variant="secondary" onClick={resetForm}>
                إلغاء
              </Button>
            </div>
          </form>
        </Card>
      )}

      {isAdmin && (
        <Card className="mb-6">
          <div className="flex gap-4 items-end flex-wrap">
            <div className="w-64">
              <Input
                placeholder="ابحث..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
            <div className="w-48">
              <Select
                value={filters.is_read}
                onChange={(e) => setFilters({ ...filters, is_read: e.target.value })}
                options={[
                  { value: 'all', label: 'كل الحالات' },
                  { value: 'unread', label: 'غير مقروء' },
                  { value: 'read', label: 'مقروء' },
                ]}
              />
            </div>
            <div className="w-40">
              <Input
                label="من تاريخ"
                type="date"
                value={filters.date_from}
                onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
              />
            </div>
            <div className="w-40">
              <Input
                label="إلى تاريخ"
                type="date"
                value={filters.date_to}
                onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
              />
            </div>
          </div>
        </Card>
      )}

      <Card title={isAdmin ? 'جميع ملاحظات الدروس الخاصة' : 'ملاحظاتي'}>
        {filteredNotes.length === 0 ? (
          <p className="text-gray-500">لا توجد ملاحظات لعرضها</p>
        ) : (
          <Table columns={columns} data={filteredNotes} />
        )}
      </Card>

      {isAdmin && selectedNote && (
        <Modal
          open={adminNoteModalOpen}
          onClose={() => {
            setAdminNoteModalOpen(false);
            setSelectedNote(null);
            setAdminNote('');
          }}
          ariaLabel="ملاحظة إدارية"
        >
          <Card title="إضافة/تعديل ملاحظة إدارية">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الملاحظة الإدارية
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                  rows={4}
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="اكتب ملاحظة إدارية..."
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="secondary" onClick={() => setAdminNoteModalOpen(false)}>
                  إلغاء
                </Button>
                <Button onClick={handleSaveAdminNote}>حفظ</Button>
              </div>
            </div>
          </Card>
        </Modal>
      )}
    </div>
  );
}

