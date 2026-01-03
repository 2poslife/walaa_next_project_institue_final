'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table, TableColumn } from '@/components/ui/Table';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ComboBox } from '@/components/ui/ComboBox';
import { TimePicker } from '@/components/ui/TimePicker';
import { Modal } from '@/components/ui/Modal';
import {
  IndividualLesson,
  GroupLesson,
  RemedialLesson,
  Student,
  EducationLevel,
  Teacher,
} from '@/types';
import { useAuth } from '@/contexts/AuthContext';

type LessonTab = 'individual' | 'group' | 'remedial';

const statusOptions = [
  { value: 'all', label: 'كل الحالات' },
  { value: 'pending', label: 'قيد الانتظار' },
  { value: 'approved', label: 'معتمد' },
  { value: 'deleted', label: 'محذوف' },
];


export default function LessonsPage() {
  const router = useRouter();
  const { isTeacher, isAdmin, teacher } = useAuth();
  const canCreateLessons = isTeacher;
  const canApproveLessons = isAdmin;

  const today = useMemo(() => {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }, []);

  const [activeTab, setActiveTab] = useState<LessonTab>('individual');
  const [loading, setLoading] = useState(true);
  const [lessonsError, setLessonsError] = useState('');

  const [individualLessons, setIndividualLessons] = useState<
    IndividualLesson[]
  >([]);
  const [groupLessons, setGroupLessons] = useState<GroupLesson[]>([]);
  const [remedialLessons, setRemedialLessons] = useState<RemedialLesson[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [educationLevels, setEducationLevels] = useState<EducationLevel[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);

  const [individualFilters, setIndividualFilters] = useState({
    search: '',
    status: 'all',
  });
  const [groupFilters, setGroupFilters] = useState({
    search: '',
    status: 'all',
  });
  const [remedialFilters, setRemedialFilters] = useState({
    search: '',
    status: 'all',
  });
  const [individualFormOpen, setIndividualFormOpen] = useState(false);
  const [groupFormOpen, setGroupFormOpen] = useState(false);
  const [remedialFormOpen, setRemedialFormOpen] = useState(false);
  const [individualEditing, setIndividualEditing] =
    useState<IndividualLesson | null>(null);
  const [groupEditing, setGroupEditing] = useState<GroupLesson | null>(null);
  const [remedialEditing, setRemedialEditing] = useState<RemedialLesson | null>(null);

  const [individualFormError, setIndividualFormError] = useState('');
  const [groupFormError, setGroupFormError] = useState('');
  const [remedialFormError, setRemedialFormError] = useState('');
  const [individualSubmitting, setIndividualSubmitting] = useState(false);
  const [groupSubmitting, setGroupSubmitting] = useState(false);
  const [remedialSubmitting, setRemedialSubmitting] = useState(false);
  const [bulkApprovingIndividual, setBulkApprovingIndividual] = useState(false);
  const [bulkApprovingGroup, setBulkApprovingGroup] = useState(false);
  const [bulkApprovingRemedial, setBulkApprovingRemedial] = useState(false);

  // Student modal state
  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [studentFormData, setStudentFormData] = useState({
    full_name: '',
    parent_contact: '',
    education_level_id: '',
    class: '',
  });
  const [studentFormError, setStudentFormError] = useState('');
  const [studentFieldErrors, setStudentFieldErrors] = useState<{
    full_name?: string;
    parent_contact?: string;
    education_level_id?: string;
  }>({});
  const [studentSubmitting, setStudentSubmitting] = useState(false);

  // Delete confirmation modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [lessonToDelete, setLessonToDelete] = useState<{
    type: 'individual' | 'group' | 'remedial';
    lesson: IndividualLesson | GroupLesson | RemedialLesson;
  } | null>(null);
  const [deletionNote, setDeletionNote] = useState('');
  const [deleting, setDeleting] = useState(false);

  const ITEMS_PER_PAGE = 15;
  const [individualPage, setIndividualPage] = useState(1);
  const [groupPage, setGroupPage] = useState(1);
  const [remedialPage, setRemedialPage] = useState(1);

  const [individualForm, setIndividualForm] = useState({
    teacher_id: teacher?.id ? teacher.id.toString() : '',
    student_id: '',
    education_level_id: '',
    date: today,
    start_time: '',
    hours: '1',
  });

  const [groupForm, setGroupForm] = useState({
    teacher_id: teacher?.id ? teacher.id.toString() : '',
    education_level_id: '',
    date: today,
    start_time: '',
    hours: '1',
    studentIds: [] as number[],
    search: '',
  });

  const [remedialForm, setRemedialForm] = useState({
    teacher_id: teacher?.id ? teacher.id.toString() : '',
    student_id: '',
    date: today,
    start_time: '',
    hours: '1',
  });

  const lessonYears = [2025, 2026];
  const lessonMonths = [
    { value: 'all', label: 'جميع الأشهر' },
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
  const currentYear = new Date().getFullYear();
  const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
  const [selectedYear, setSelectedYear] = useState(
    lessonYears.includes(currentYear) ? currentYear : lessonYears[0]
  );
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  const getDateFilters = (year: number, month: string) => {
    if (month === 'all') {
      return undefined;
    }
    const monthNum = Number(month);
    // Format dates as YYYY-MM-DD without timezone conversion
    const startDate = `${year}-${String(monthNum).padStart(2, '0')}-01`;
    
    // Get last day of month
    const lastDay = new Date(year, monthNum, 0).getDate();
    const endDate = `${year}-${String(monthNum).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    
    return {
      date_from: startDate,
      date_to: endDate,
    };
  };

  useEffect(() => {
    if (teacher) {
          setIndividualForm((prev) => ({
            ...prev,
            teacher_id: teacher.id.toString(),
          }));
          setGroupForm((prev) => ({
            ...prev,
            teacher_id: teacher.id.toString(),
          }));
    }
  }, [teacher]);

  useEffect(() => {
    if (!isTeacher && teachers.length > 0) {
      setIndividualForm((prev) => ({
        ...prev,
        teacher_id: prev.teacher_id || teachers[0].id.toString(),
      }));
      setGroupForm((prev) => ({
        ...prev,
        teacher_id: prev.teacher_id || teachers[0].id.toString(),
      }));
    }
  }, [teachers, isTeacher]);

  const loadInitialData = useCallback(async () => {
    setLoading(true);
    setLessonsError('');
    try {
      const dateFilters = getDateFilters(selectedYear, selectedMonth);
      
      // Add show_deleted parameter based on filter status
      const individualParams = {
        ...dateFilters,
        ...(individualFilters.status === 'deleted' && { show_deleted: 'true' }),
      };
      const groupParams = {
        ...dateFilters,
        ...(groupFilters.status === 'deleted' && { show_deleted: 'true' }),
      };
      const remedialParams = {
        ...dateFilters,
        ...(remedialFilters.status === 'deleted' && { show_deleted: 'true' }),
      };
      
      const [individualRes, groupRes, remedialRes, studentsRes, levelsRes] =
        await Promise.all([
          api.getIndividualLessons(individualParams),
          api.getGroupLessons(groupParams),
          api.getRemedialLessons(remedialParams),
          api.getStudents(),
          api.getEducationLevels(),
        ]);

      if (individualRes.success && Array.isArray(individualRes.data)) {
        setIndividualLessons(individualRes.data as IndividualLesson[]);
      } else {
        setLessonsError(
          individualRes.error || 'فشل تحميل الدروس الفردية'
        );
      }

      if (groupRes.success && Array.isArray(groupRes.data)) {
        setGroupLessons(groupRes.data as GroupLesson[]);
      } else {
        setLessonsError(groupRes.error || 'فشل تحميل الدروس الجماعية');
      }

      if (remedialRes.success && Array.isArray(remedialRes.data)) {
        setRemedialLessons(remedialRes.data as RemedialLesson[]);
      } else {
        setLessonsError(remedialRes.error || 'فشل تحميل الدروس العلاجية');
      }

      if (studentsRes.success && Array.isArray(studentsRes.data)) {
        setStudents(studentsRes.data as Student[]);
      }

      if (levelsRes.success && Array.isArray(levelsRes.data)) {
        setEducationLevels(levelsRes.data as EducationLevel[]);
      }

      if (isAdmin) {
        const teachersRes = await api.getTeachers();
        if (teachersRes.success && Array.isArray(teachersRes.data)) {
          setTeachers(teachersRes.data as Teacher[]);
        } else {
          setTeachers([]);
        }
      } else if (teacher) {
        setTeachers([teacher]);
      }
    } catch (error: any) {
      setLessonsError(error.message || 'حدث خطأ أثناء تحميل البيانات');
    } finally {
      setLoading(false);
    }
  }, [isAdmin, teacher, selectedYear, selectedMonth, individualFilters.status, groupFilters.status, remedialFilters.status]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Reload education levels when individual form opens to ensure fresh data
  useEffect(() => {
    if (individualFormOpen && educationLevels.length > 0) {
      const refreshLevels = async () => {
        try {
          const levelsRes = await api.getEducationLevels();
          if (levelsRes.success && Array.isArray(levelsRes.data)) {
            setEducationLevels(levelsRes.data as EducationLevel[]);
          }
        } catch (error) {
          console.error('Error refreshing education levels:', error);
        }
      };
      refreshLevels();
    }
  }, [individualFormOpen]);

  const refreshStudents = async () => {
    try {
      const studentsRes = await api.getStudents();
      if (studentsRes.success && Array.isArray(studentsRes.data)) {
        setStudents(studentsRes.data as Student[]);
      }
    } catch (error) {
      console.error('Error refreshing students:', error);
    }
  };

  const refreshLessons = async () => {
    try {
      const dateFilters = getDateFilters(selectedYear, selectedMonth);
      
      // Add show_deleted parameter based on filter status
      const individualParams = {
        ...dateFilters,
        ...(individualFilters.status === 'deleted' && { show_deleted: 'true' }),
      };
      const groupParams = {
        ...dateFilters,
        ...(groupFilters.status === 'deleted' && { show_deleted: 'true' }),
      };
      const remedialParams = {
        ...dateFilters,
        ...(remedialFilters.status === 'deleted' && { show_deleted: 'true' }),
      };
      
      const [individualRes, groupRes, remedialRes] = await Promise.all([
        api.getIndividualLessons(individualParams),
        api.getGroupLessons(groupParams),
        api.getRemedialLessons(remedialParams),
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
    } catch (error) {
      console.error('Refresh lessons error:', error);
    }
  };

  const resetStudentForm = () => {
    setStudentFormData({ full_name: '', parent_contact: '', education_level_id: '', class: '' });
    setStudentFormError('');
    setStudentFieldErrors({});
  };

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStudentFormError('');
    setStudentFieldErrors({});
    setStudentSubmitting(true);

    if (!studentFormData.full_name?.trim()) {
      setStudentFieldErrors({ full_name: 'يرجى إدخال اسم الطالب' });
      setStudentSubmitting(false);
      return;
    }

    if (!studentFormData.education_level_id) {
      setStudentFieldErrors({ education_level_id: 'يرجى اختيار المستوى التعليمي' });
      setStudentSubmitting(false);
      return;
    }

    try {
      const submitData = {
        full_name: studentFormData.full_name,
        parent_contact: studentFormData.parent_contact || null,
        education_level_id: studentFormData.education_level_id ? parseInt(studentFormData.education_level_id) : null,
        class: studentFormData.class?.trim() || null,
      };

      const response = await api.createStudent(submitData);
      if (response.success) {
        await refreshStudents();
        resetStudentForm();
        setStudentModalOpen(false);
      } else {
        if (response.error?.includes('الطالب موجود')) {
          setStudentFieldErrors({ full_name: 'الطالب موجود مسبقًا' });
        } else if (response.error?.includes('المستوى')) {
          setStudentFieldErrors({ education_level_id: response.error });
        } else if (response.error?.includes('الهاتف')) {
          setStudentFieldErrors({ parent_contact: response.error });
        } else {
          setStudentFormError(response.error || 'فشل إضافة الطالب');
        }
      }
    } catch (err: any) {
      setStudentFormError(err.message || 'حدث خطأ');
    } finally {
      setStudentSubmitting(false);
    }
  };

  const filteredIndividualLessons = useMemo(() => {
    return individualLessons.filter((lesson) => {
      const searchLower = individualFilters.search.toLowerCase();
      const matchesSearch = individualFilters.search
        ? lesson.student?.full_name
            ?.toLowerCase()
            .includes(searchLower) ||
          lesson.teacher?.full_name
            ?.toLowerCase()
            .includes(searchLower) ||
          lesson.education_level?.name_ar
            ?.toLowerCase()
            .includes(searchLower) ||
          lesson.date.includes(individualFilters.search)
        : true;
      const matchesStatus =
        individualFilters.status === 'all' ||
        (individualFilters.status === 'pending' && !lesson.approved && !lesson.deleted_at) ||
        (individualFilters.status === 'approved' && lesson.approved && !lesson.deleted_at) ||
        (individualFilters.status === 'deleted' && !!lesson.deleted_at);
      return matchesSearch && matchesStatus;
    });
  }, [individualLessons, individualFilters]);

  const filteredGroupLessons = useMemo(() => {
    return groupLessons.filter((lesson) => {
      const search = groupFilters.search.toLowerCase();
      const matchesSearch = groupFilters.search
        ? lesson.students?.some((student) =>
            student.full_name.toLowerCase().includes(search)
          ) ||
          lesson.teacher?.full_name
            ?.toLowerCase()
            .includes(search) ||
          lesson.education_level?.name_ar
            ?.toLowerCase()
            .includes(search) ||
          lesson.date.includes(groupFilters.search)
        : true;
      const matchesStatus =
        groupFilters.status === 'all' ||
        (groupFilters.status === 'pending' && !lesson.approved && !lesson.deleted_at) ||
        (groupFilters.status === 'approved' && lesson.approved && !lesson.deleted_at) ||
        (groupFilters.status === 'deleted' && !!lesson.deleted_at);
      return matchesSearch && matchesStatus;
    });
  }, [groupLessons, groupFilters]);

  // Filtered pending lessons - only the ones currently visible/filtered
  const filteredPendingIndividualLessons = useMemo(
    () => filteredIndividualLessons.filter((lesson) => !lesson.approved),
    [filteredIndividualLessons]
  );

  const filteredPendingGroupLessons = useMemo(
    () => filteredGroupLessons.filter((lesson) => !lesson.approved),
    [filteredGroupLessons]
  );

  const filteredRemedialLessons = useMemo(() => {
    return remedialLessons.filter((lesson) => {
      const searchLower = remedialFilters.search.toLowerCase();
      const matchesSearch = remedialFilters.search
        ? lesson.student?.full_name
            ?.toLowerCase()
            .includes(searchLower) ||
          lesson.teacher?.full_name
            ?.toLowerCase()
            .includes(searchLower) ||
          lesson.date.includes(remedialFilters.search)
        : true;
      const matchesStatus =
        remedialFilters.status === 'all' ||
        (remedialFilters.status === 'pending' && !lesson.approved && !lesson.deleted_at) ||
        (remedialFilters.status === 'approved' && lesson.approved && !lesson.deleted_at) ||
        (remedialFilters.status === 'deleted' && !!lesson.deleted_at);
      return matchesSearch && matchesStatus;
    });
  }, [remedialLessons, remedialFilters]);

  const filteredPendingRemedialLessons = useMemo(
    () => filteredRemedialLessons.filter((lesson) => !lesson.approved && !lesson.deleted_at),
    [filteredRemedialLessons]
  );

  const handleOpenIndividualForm = (lesson?: IndividualLesson) => {
    if (!canCreateLessons) return;
    if (lesson) {
      // Prevent editing deleted lessons
      if (lesson.deleted_at) {
        alert('لا يمكن تعديل درس محذوف');
        return;
      }
      setIndividualEditing(lesson);
      setIndividualForm({
        teacher_id:
          lesson.teacher_id?.toString() || teacher?.id?.toString() || '',
        student_id: lesson.student_id.toString(),
        education_level_id: lesson.education_level_id.toString(),
        date: lesson.date,
        start_time: lesson.start_time || '',
        hours: lesson.hours.toString(),
      });
    } else {
      setIndividualEditing(null);
      setIndividualForm({
        teacher_id: teacher?.id ? teacher.id.toString() : '',
        student_id: '',
        education_level_id: '',
        date: today,
        start_time: '',
        hours: '1',
      });
    }
    setIndividualFormError('');
    setIndividualFormOpen(true);
    setActiveTab('individual');
  };

  const handleOpenRemedialForm = (lesson?: RemedialLesson) => {
    if (!canCreateLessons) return;
    if (lesson) {
      // Prevent editing deleted lessons
      if (lesson.deleted_at) {
        alert('لا يمكن تعديل درس محذوف');
        return;
      }
      setRemedialEditing(lesson);
      setRemedialForm({
        teacher_id:
          lesson.teacher_id?.toString() || teacher?.id?.toString() || '',
        student_id: lesson.student_id.toString(),
        date: lesson.date,
        start_time: lesson.start_time || '',
        hours: lesson.hours.toString(),
      });
    } else {
      setRemedialEditing(null);
      setRemedialForm({
        teacher_id: teacher?.id ? teacher.id.toString() : '',
        student_id: '',
        date: today,
        start_time: '',
        hours: '1',
      });
    }
    setRemedialFormError('');
    setRemedialFormOpen(true);
    setActiveTab('remedial');
  };

  const handleRemedialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreateLessons) return;

    setRemedialFormError('');

    if (!teacher && !remedialForm.teacher_id) {
      setRemedialFormError('يرجى اختيار المعلم');
      return;
    }

    if (!remedialForm.student_id) {
      setRemedialFormError('يرجى اختيار الطالب');
      return;
    }

    if (!remedialForm.date) {
      setRemedialFormError('يرجى اختيار تاريخ الدرس');
      return;
    }

    if (!remedialForm.start_time || !remedialForm.start_time.trim()) {
      setRemedialFormError('يرجى اختيار وقت بداية الدرس');
      return;
    }

    if (!remedialForm.hours) {
      setRemedialFormError('يرجى تحديد عدد الساعات');
      return;
    }

    const teacherId = teacher
      ? teacher.id
      : remedialForm.teacher_id
      ? parseInt(remedialForm.teacher_id, 10)
      : null;

    if (!teacherId) {
      setRemedialFormError('يرجى اختيار المعلم');
      return;
    }

    setRemedialSubmitting(true);

    const payload = {
      teacher_id: teacherId,
      student_id: parseInt(remedialForm.student_id, 10),
      date: remedialForm.date,
      start_time: remedialForm.start_time,
      hours: parseFloat(remedialForm.hours),
    };

    try {
      let response;
      if (remedialEditing) {
        response = await api.updateRemedialLesson(remedialEditing.id, payload);
      } else {
        response = await api.createRemedialLesson(payload);
      }

      if (!response.success) {
        setRemedialFormError(response.error || 'فشل حفظ الدرس');
        return;
      }

      await refreshLessons();
      setRemedialFormOpen(false);
      setRemedialEditing(null);
    } catch (error: any) {
      setRemedialFormError(error.message || 'حدث خطأ أثناء حفظ الدرس');
    } finally {
      setRemedialSubmitting(false);
    }
  };

  const handleOpenGroupForm = (lesson?: GroupLesson) => {
    if (!canCreateLessons) return;
    if (lesson) {
      // Prevent editing deleted lessons
      if (lesson.deleted_at) {
        alert('لا يمكن تعديل درس محذوف');
        return;
      }
      setGroupEditing(lesson);
      setGroupForm({
        teacher_id:
          lesson.teacher_id?.toString() || teacher?.id?.toString() || '',
        education_level_id: lesson.education_level_id.toString(),
        date: lesson.date,
        start_time: lesson.start_time || '',
        hours: lesson.hours.toString(),
        studentIds: lesson.students?.map((s) => s.id) || [],
        search: '',
      });
    } else {
      setGroupEditing(null);
      setGroupForm({
        teacher_id: teacher?.id ? teacher.id.toString() : '',
        education_level_id: '',
        date: today,
        start_time: '',
        hours: '1',
        studentIds: [],
        search: '',
      });
    }
    setGroupFormError('');
    setGroupFormOpen(true);
    setActiveTab('group');
  };

  const handleIndividualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreateLessons) return;

    setIndividualFormError('');

    if (!teacher && !individualForm.teacher_id) {
      setIndividualFormError('يرجى اختيار المعلم');
      return;
    }

    if (!individualForm.student_id) {
      setIndividualFormError('يرجى اختيار الطالب');
      return;
    }

    if (!individualForm.education_level_id) {
      setIndividualFormError('يرجى اختيار المستوى التعليمي');
      return;
    }

    if (!individualForm.date) {
      setIndividualFormError('يرجى اختيار تاريخ الدرس');
      return;
    }

    if (!individualForm.start_time || !individualForm.start_time.trim()) {
      setIndividualFormError('يرجى اختيار وقت بداية الدرس');
      return;
    }

    if (!individualForm.hours) {
      setIndividualFormError('يرجى تحديد عدد الساعات');
      return;
    }

    const teacherId = teacher
      ? teacher.id
      : individualForm.teacher_id
      ? parseInt(individualForm.teacher_id, 10)
      : null;

    if (!teacherId) {
      setIndividualFormError('يرجى اختيار المعلم');
      return;
    }

    setIndividualSubmitting(true);

      const payload = {
        teacher_id: teacherId,
        student_id: parseInt(individualForm.student_id, 10),
        education_level_id: parseInt(individualForm.education_level_id, 10),
        date: individualForm.date,
        start_time: individualForm.start_time,
        hours: parseFloat(individualForm.hours),
      };

    try {
      let response;
      if (individualEditing) {
        response = await api.updateIndividualLesson(
          individualEditing.id,
          payload
        );
      } else {
        response = await api.createIndividualLesson(payload);
      }

      if (!response.success) {
        setIndividualFormError(response.error || 'فشل حفظ الدرس');
        return;
      }

      await refreshLessons();
      setIndividualFormOpen(false);
      setIndividualEditing(null);
    } catch (error: any) {
      setIndividualFormError(error.message || 'حدث خطأ أثناء حفظ الدرس');
    } finally {
      setIndividualSubmitting(false);
    }
  };

  const handleGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreateLessons) return;

    setGroupFormError('');

    if (!teacher && !groupForm.teacher_id) {
      setGroupFormError('يرجى اختيار المعلم');
      return;
    }

    if (!groupForm.education_level_id) {
      setGroupFormError('يرجى اختيار المستوى التعليمي');
      return;
    }

    if (!groupForm.date) {
      setGroupFormError('يرجى اختيار تاريخ الدرس');
      return;
    }

    if (!groupForm.start_time || !groupForm.start_time.trim()) {
      setGroupFormError('يرجى اختيار وقت بداية الدرس');
      return;
    }

    if (!groupForm.hours) {
      setGroupFormError('يرجى تحديد عدد الساعات');
      return;
    }

    if (groupForm.studentIds.length < 2) {
      setGroupFormError('يجب اختيار طالبين على الأقل');
      return;
    }

    const teacherId = teacher
      ? teacher.id
      : groupForm.teacher_id
      ? parseInt(groupForm.teacher_id, 10)
      : null;

    if (!teacherId) {
      setGroupFormError('يرجى اختيار المعلم');
      return;
    }

    setGroupSubmitting(true);

    const payload = {
      teacher_id: teacherId,
      education_level_id: parseInt(groupForm.education_level_id, 10),
      date: groupForm.date,
      start_time: groupForm.start_time,
      hours: parseFloat(groupForm.hours),
      student_ids: groupForm.studentIds,
    };

    try {
      let response;
      if (groupEditing) {
        response = await api.updateGroupLesson(groupEditing.id, payload);
      } else {
        response = await api.createGroupLesson(payload);
      }

      if (!response.success) {
        setGroupFormError(response.error || 'فشل حفظ الدرس');
        return;
      }

      await refreshLessons();
      setGroupFormOpen(false);
      setGroupEditing(null);
    } catch (error: any) {
      setGroupFormError(error.message || 'حدث خطأ أثناء حفظ الدرس');
    } finally {
      setGroupSubmitting(false);
    }
  };

  const handleDeleteIndividual = (lesson: IndividualLesson) => {
    if (!isTeacher && !isAdmin) return;
    if (lesson.approved && !isAdmin) return;
    setLessonToDelete({ type: 'individual', lesson });
    setDeletionNote('');
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!lessonToDelete) return;
    
    setDeleting(true);
    try {
      const note = isAdmin ? (deletionNote.trim() || undefined) : undefined;
      let response;
      
      if (lessonToDelete.type === 'individual') {
        response = await api.deleteIndividualLesson((lessonToDelete.lesson as IndividualLesson).id, note);
      } else if (lessonToDelete.type === 'group') {
        response = await api.deleteGroupLesson((lessonToDelete.lesson as GroupLesson).id, note);
      } else {
        response = await api.deleteRemedialLesson((lessonToDelete.lesson as RemedialLesson).id, note);
      }
      
      if (!response.success) {
        alert(response.error || 'فشل حذف الدرس');
        return;
      }
      
      alert('تم حذف الدرس بنجاح');
      setDeleteModalOpen(false);
      setLessonToDelete(null);
      setDeletionNote('');
      await refreshLessons();
    } catch (error: any) {
      alert(error.message || 'حدث خطأ أثناء حذف الدرس');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteGroup = (lesson: GroupLesson) => {
    if (!isTeacher && !isAdmin) return;
    if (lesson.approved && !isAdmin) return;
    setLessonToDelete({ type: 'group', lesson });
    setDeletionNote('');
    setDeleteModalOpen(true);
  };

  const handleDeleteRemedial = (lesson: RemedialLesson) => {
    if (!isTeacher && !isAdmin) return;
    if (lesson.approved && !isAdmin) return;
    setLessonToDelete({ type: 'remedial', lesson });
    setDeletionNote('');
    setDeleteModalOpen(true);
  };

  const handleApproveIndividual = async (lesson: IndividualLesson) => {
    if (!isAdmin || lesson.approved || lesson.deleted_at) return;
    try {
      const response = await api.approveIndividualLesson(lesson.id);
      if (!response.success) {
        alert(response.error || 'فشل اعتماد الدرس');
        return;
      }
      await refreshLessons();
    } catch (error: any) {
      alert(error.message || 'حدث خطأ أثناء اعتماد الدرس');
    }
  };

  const handleApproveGroup = async (lesson: GroupLesson) => {
    if (!isAdmin || lesson.approved || lesson.deleted_at) return;
    try {
      const response = await api.approveGroupLesson(lesson.id);
      if (!response.success) {
        alert(response.error || 'فشل اعتماد الدرس');
        return;
      }
      await refreshLessons();
    } catch (error: any) {
      alert(error.message || 'حدث خطأ أثناء اعتماد الدرس');
    }
  };

  const handleApproveRemedial = async (lesson: RemedialLesson) => {
    if (!isAdmin || lesson.approved || lesson.deleted_at) return;
    try {
      const response = await api.approveRemedialLesson(lesson.id);
      if (!response.success) {
        alert(response.error || 'فشل اعتماد الدرس');
        return;
      }
      await refreshLessons();
    } catch (error: any) {
      alert(error.message || 'حدث خطأ أثناء اعتماد الدرس');
    }
  };

  const handleBulkApproveIndividual = async () => {
    if (!isAdmin) return;
    
    // Get only the filtered pending lessons
    const lessonsToApprove = filteredPendingIndividualLessons;
    
    if (lessonsToApprove.length === 0) {
      alert('لا توجد دروس للاعتماد في الفلترة الحالية');
      return;
    }
    
    setBulkApprovingIndividual(true);
    try {
      // Approve all filtered pending lessons
      const approvePromises = lessonsToApprove.map((lesson) =>
        api.approveIndividualLesson(lesson.id)
      );
      
      const results = await Promise.all(approvePromises);
      const failed = results.filter((r) => !r.success);
      
      if (failed.length > 0) {
        alert(`فشل اعتماد ${failed.length} من ${lessonsToApprove.length} درس`);
      } else {
        alert(`تم اعتماد ${lessonsToApprove.length} درس بنجاح`);
      }
      
      await refreshLessons();
    } catch (error: any) {
      alert(error.message || 'حدث خطأ أثناء اعتماد الدروس');
    } finally {
      setBulkApprovingIndividual(false);
    }
  };

  const handleBulkApproveGroup = async () => {
    if (!isAdmin) return;
    
    // Get only the filtered pending lessons
    const lessonsToApprove = filteredPendingGroupLessons;
    
    if (lessonsToApprove.length === 0) {
      alert('لا توجد دروس للاعتماد في الفلترة الحالية');
      return;
    }
    
    setBulkApprovingGroup(true);
    try {
      // Approve all filtered pending lessons
      const approvePromises = lessonsToApprove.map((lesson) =>
        api.approveGroupLesson(lesson.id)
      );
      
      const results = await Promise.all(approvePromises);
      const failed = results.filter((r) => !r.success);
      
      if (failed.length > 0) {
        alert(`فشل اعتماد ${failed.length} من ${lessonsToApprove.length} درس`);
      } else {
        alert(`تم اعتماد ${lessonsToApprove.length} درس بنجاح`);
      }
      
      await refreshLessons();
    } catch (error: any) {
      alert(error.message || 'حدث خطأ أثناء اعتماد الدروس');
    } finally {
      setBulkApprovingGroup(false);
    }
  };

  const handleBulkApproveRemedial = async () => {
    if (!isAdmin) return;
    
    // Get only the filtered pending lessons
    const lessonsToApprove = filteredPendingRemedialLessons;
    
    if (lessonsToApprove.length === 0) {
      alert('لا توجد دروس للاعتماد في الفلترة الحالية');
      return;
    }
    
    setBulkApprovingRemedial(true);
    try {
      // Approve all filtered pending lessons
      const approvePromises = lessonsToApprove.map((lesson) =>
        api.approveRemedialLesson(lesson.id)
      );
      
      const results = await Promise.all(approvePromises);
      const failed = results.filter((r) => !r.success);
      
      if (failed.length > 0) {
        alert(`فشل اعتماد ${failed.length} من ${lessonsToApprove.length} درس`);
      } else {
        alert(`تم اعتماد ${lessonsToApprove.length} درس بنجاح`);
      }
      
      await refreshLessons();
    } catch (error: any) {
      alert(error.message || 'حدث خطأ أثناء اعتماد الدروس');
    } finally {
      setBulkApprovingRemedial(false);
    }
  };

  const sortedStudents = useMemo(
    () =>
      [...students].sort((a, b) =>
        a.full_name.localeCompare(b.full_name, 'ar')
      ),
    [students]
  );

  const studentsById = useMemo(() => {
    const map = new Map<number, Student>();
    sortedStudents.forEach((student) => {
      map.set(student.id, student);
    });
    return map;
  }, [sortedStudents]);

  const individualStudentOptions = sortedStudents
    .filter((student) => {
      if (individualForm.education_level_id) {
        return (
          student.education_level_id?.toString() ===
          individualForm.education_level_id
        );
      }
      return true;
    })
    .map((student) => ({
      value: student.id,
      label: student.full_name,
    }));

  const availableGroupStudentOptions = sortedStudents
    .filter((student) => {
      if (groupForm.education_level_id) {
        if (
          student.education_level_id?.toString() !== groupForm.education_level_id
        ) {
          return false;
        }
      }
      if (groupForm.studentIds.includes(student.id)) {
        return false;
      }
      return true;
    })
    .map((student) => ({
      value: student.id,
      label: student.full_name,
    }));

  const selectedGroupStudents = groupForm.studentIds
    .map((id) => students.find((student) => student.id === id))
    .filter(Boolean) as Student[];

  const teacherSelectOptions = useMemo(
    () => [
      { value: '', label: 'اختر المعلم' },
      ...teachers.map((t) => ({
        value: t.id.toString(),
        label: t.full_name,
      })),
    ],
    [teachers]
  );

  const pendingIndividualLessons = useMemo(
    () => individualLessons.filter((lesson) => !lesson.approved),
    [individualLessons]
  );

  const pendingGroupLessons = useMemo(
    () => groupLessons.filter((lesson) => !lesson.approved),
    [groupLessons]
  );

  const lessonTabs: { label: string; value: LessonTab }[] = [
    { label: 'הוראה מתקנת', value: 'remedial' },
    { label: 'الدروس الفردية', value: 'individual' },
    { label: 'الدروس الجماعية', value: 'group' },
  ];

  const individualRowOffset = useMemo(
    () => (individualPage - 1) * ITEMS_PER_PAGE,
    [individualPage]
  );
  const groupRowOffset = useMemo(
    () => (groupPage - 1) * ITEMS_PER_PAGE,
    [groupPage]
  );

  const paginatedIndividualLessons = useMemo(() => {
    const start = individualRowOffset;
    return filteredIndividualLessons.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredIndividualLessons, individualRowOffset]);

  const paginatedGroupLessons = useMemo(() => {
    const start = groupRowOffset;
    return filteredGroupLessons.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredGroupLessons, groupRowOffset]);

  useEffect(() => {
    setIndividualPage(1);
  }, [individualFilters, selectedYear, selectedMonth]);

  useEffect(() => {
    setGroupPage(1);
  }, [groupFilters, selectedYear, selectedMonth]);

  useEffect(() => {
    setRemedialPage(1);
  }, [remedialFilters, selectedYear, selectedMonth]);

  const individualColumns: TableColumn<IndividualLesson>[] = [
    {
      key: 'index',
      header: 'الرقم',
      render: (_lesson, index = 0) => individualRowOffset + index + 1,
    },
    {
      key: 'date',
      header: 'التاريخ',
      render: (lesson: IndividualLesson) => lesson.date,
    },
    {
      key: 'start_time',
      header: 'وقت البدء',
      render: (lesson: IndividualLesson) => lesson.start_time || '-',
    },
    ...(isAdmin
      ? [
          {
            key: 'teacher',
            header: 'المعلم',
            render: (lesson: IndividualLesson) =>
              lesson.teacher?.full_name || '-',
          },
        ]
      : []),
    {
      key: 'student',
      header: 'الطالب',
      render: (lesson: IndividualLesson) =>
        lesson.student?.full_name || '-',
    },
    {
      key: 'education_level',
      header: 'المستوى',
      render: (lesson: IndividualLesson) =>
        lesson.education_level?.name_ar || '-',
    },
    { key: 'hours', header: 'الساعات' },
    {
      key: 'approved',
      header: 'الحالة',
      render: (lesson: IndividualLesson) => {
        if (lesson.deleted_at) {
          return (
            <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-700">
              محذوف
            </span>
          );
        }
        return (
          <span
            className={`px-2 py-1 rounded-full text-xs ${
              lesson.approved
                ? 'bg-green-100 text-green-700'
                : 'bg-yellow-100 text-yellow-700'
            }`}
          >
            {lesson.approved ? 'معتمد' : 'قيد الانتظار'}
          </span>
        );
      },
    },
    {
      key: 'deletion_note',
      header: 'سبب الحذف',
      render: (lesson: IndividualLesson) =>
        lesson.deleted_at && lesson.deletion_note ? (
          <span className="text-sm text-gray-600" title={lesson.deletion_note}>
            {lesson.deletion_note}
          </span>
        ) : (
          '-'
        ),
    },
    ...((isTeacher || isAdmin)
      ? [
          {
            key: 'actions',
            header: 'الإجراءات',
            render: (lesson: IndividualLesson) => {
              const isDeleted = !!lesson.deleted_at;
              const disableForTeacher = (lesson.approved && !isAdmin) || isDeleted;
              return (
                <div className="flex gap-2 flex-wrap">
                  {isAdmin && !lesson.approved && !isDeleted && (
                    <Button
                      size="sm"
                      onClick={() => handleApproveIndividual(lesson)}
                    >
                      اعتماد
                    </Button>
                  )}
                  {isTeacher && (
                    <>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleOpenIndividualForm(lesson)}
                        disabled={disableForTeacher}
                      >
                        تعديل
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDeleteIndividual(lesson)}
                        disabled={disableForTeacher}
                      >
                        حذف
                      </Button>
                    </>
                  )}
                  {isAdmin && !isDeleted && (
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDeleteIndividual(lesson)}
                      disabled={lesson.approved}
                    >
                      رفض
                    </Button>
                  )}
                </div>
              );
            },
          },
        ]
      : []),
  ];

  const groupColumns: TableColumn<GroupLesson>[] = [
    {
      key: 'index',
      header: 'الرقم',
      render: (_lesson, index = 0) => groupRowOffset + index + 1,
    },
    {
      key: 'date',
      header: 'التاريخ',
      render: (lesson: GroupLesson) => lesson.date,
    },
    {
      key: 'start_time',
      header: 'وقت البدء',
      render: (lesson: GroupLesson) => lesson.start_time || '-',
    },
    ...(isAdmin
      ? [
          {
            key: 'teacher',
            header: 'المعلم',
            render: (lesson: GroupLesson) =>
              lesson.teacher?.full_name || '-',
          },
        ]
      : []),
    {
      key: 'education_level',
      header: 'المستوى',
      render: (lesson: GroupLesson) =>
        lesson.education_level?.name_ar || '-',
    },
    { key: 'hours', header: 'الساعات' },
    {
      key: 'students',
      header: 'الطلاب المشاركون',
      render: (lesson: GroupLesson) =>
        lesson.students?.map((s) => s.full_name).join(', ') || '-',
    },
    {
      key: 'approved',
      header: 'الحالة',
      render: (lesson: GroupLesson) => {
        if (lesson.deleted_at) {
          return (
            <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-700">
              محذوف
            </span>
          );
        }
        return (
          <span
            className={`px-2 py-1 rounded-full text-xs ${
              lesson.approved
                ? 'bg-green-100 text-green-700'
                : 'bg-yellow-100 text-yellow-700'
            }`}
          >
            {lesson.approved ? 'معتمد' : 'قيد الانتظار'}
          </span>
        );
      },
    },
    {
      key: 'deletion_note',
      header: 'سبب الحذف',
      render: (lesson: GroupLesson) =>
        lesson.deleted_at && lesson.deletion_note ? (
          <span className="text-sm text-gray-600" title={lesson.deletion_note}>
            {lesson.deletion_note}
          </span>
        ) : (
          '-'
        ),
    },
    ...((isTeacher || isAdmin)
      ? [
          {
            key: 'actions',
            header: 'الإجراءات',
            render: (lesson: GroupLesson) => {
              const isDeleted = !!lesson.deleted_at;
              const disableForTeacher = (lesson.approved && !isAdmin) || isDeleted;
              return (
                <div className="flex gap-2 flex-wrap">
                  {isAdmin && !lesson.approved && !isDeleted && (
                    <Button
                      size="sm"
                      onClick={() => handleApproveGroup(lesson)}
                    >
                      اعتماد
                    </Button>
                  )}
                  {isTeacher && (
                    <>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleOpenGroupForm(lesson)}
                        disabled={disableForTeacher}
                      >
                        تعديل
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDeleteGroup(lesson)}
                        disabled={disableForTeacher}
                      >
                        حذف
                      </Button>
                    </>
                  )}
                  {isAdmin && !isDeleted && (
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDeleteGroup(lesson)}
                      disabled={lesson.approved}
                    >
                      رفض
                    </Button>
                  )}
                </div>
              );
            },
          },
        ]
      : []),
  ];

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-900" dir="rtl">
        جاري التحميل...
      </div>
    );
  }

  return (
    <div dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">الدروس</h1>
          <p className="text-gray-600 mt-1">
            إدارة الدروس الفردية والجماعية ومتابعة حالتها
          </p>
        </div>
        {canCreateLessons && (
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={activeTab === 'individual' ? 'primary' : 'outline'}
              onClick={() => handleOpenIndividualForm()}
            >
              إضافة درس فردي
            </Button>
            <Button
              variant={activeTab === 'group' ? 'primary' : 'outline'}
              onClick={() => handleOpenGroupForm()}
            >
              إضافة درس جماعي
            </Button>
            <Button
              variant={activeTab === 'remedial' ? 'primary' : 'outline'}
              onClick={() => handleOpenRemedialForm()}
            >
              הוראה מתקנת
            </Button>
          </div>
        )}
      </div>

      {lessonsError && (
        <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded mb-6">
          {lessonsError}
        </div>
      )}

      <div className="flex gap-2 mb-6">
        {lessonTabs.map((tab) => (
          <button
            key={tab.value}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              activeTab === tab.value
                ? 'bg-brand-orange text-white'
                : 'bg-white text-gray-700 border'
            }`}
            onClick={() => setActiveTab(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'individual' && (
        <>
          <Card title="تصفية الدروس الفردية" className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input
                label="بحث"
                placeholder="أدخل اسم الطالب، المعلم، المستوى أو التاريخ"
                value={individualFilters.search}
                onChange={(e) =>
                  setIndividualFilters((prev) => ({
                    ...prev,
                    search: e.target.value,
                  }))
                }
              />
              <Select
                label="الحالة"
                value={individualFilters.status}
                onChange={(e) =>
                  setIndividualFilters((prev) => ({
                    ...prev,
                    status: e.target.value,
                  }))
                }
                options={statusOptions}
              />
              <Select
                label="السنة"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                options={lessonYears.map((year) => ({
                  value: year,
                  label: `${year}`,
                }))}
              />
              <Select
                label="الشهر"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                options={lessonMonths}
              />
            </div>
          </Card>

          {isAdmin && filteredPendingIndividualLessons.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <p className="text-sm text-gray-600">
                يوجد {filteredPendingIndividualLessons.length} درس فردي بانتظار الاعتماد
                {filteredPendingIndividualLessons.length !== pendingIndividualLessons.length && 
                  ` (من أصل ${pendingIndividualLessons.length})`
                }
              </p>
              <Button
                onClick={handleBulkApproveIndividual}
                isLoading={bulkApprovingIndividual}
              >
                اعتماد جميع الدروس الفردية المفلترة
              </Button>
            </div>
          )}

          {individualFormOpen && canCreateLessons && (
            <Card
              title={
                individualEditing ? 'تعديل درس فردي' : 'إضافة درس فردي جديد'
              }
              className="mb-6"
            >
              <form onSubmit={handleIndividualSubmit} className="space-y-4">
                {individualFormError && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {individualFormError}
                  </div>
                )}

                {!isTeacher && (
                  <Select
                    label="المعلم"
                    value={individualForm.teacher_id}
                    onChange={(e) =>
                      setIndividualForm((prev) => ({
                        ...prev,
                        teacher_id: e.target.value,
                      }))
                    }
                    options={teacherSelectOptions}
                    required
                  />
                )}

                <ComboBox
                  label="الطالب"
                  value={individualForm.student_id}
                  onChange={(value) => {
                    const student = studentsById.get(Number(value));
                    setIndividualForm((prev) => ({
                      ...prev,
                      student_id: value,
                      education_level_id:
                        student?.education_level_id?.toString() ||
                        prev.education_level_id,
                    }));
                  }}
                  options={individualStudentOptions}
                  placeholder="اختر الطالب"
                  required
                />
                <div className="text-sm">
                  <button
                    type="button"
                    onClick={() => setStudentModalOpen(true)}
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    إضافة طالب جديد
                  </button>
                </div>

                <Select
                  label="المستوى التعليمي"
                  value={individualForm.education_level_id}
                  onChange={(e) =>
                    setIndividualForm((prev) => ({
                      ...prev,
                      education_level_id: e.target.value,
                      student_id:
                        studentsById.get(Number(prev.student_id))
                          ?.education_level_id?.toString() === e.target.value
                          ? prev.student_id
                          : '',
                    }))
                  }
                  options={[
                    { value: '', label: 'اختر المستوى التعليمي' },
                    ...educationLevels.map((level) => ({
                      value: level.id,
                      label: level.name_ar,
                    })),
                  ]}
                  required
                />

                <Input
                  label="تاريخ الدرس"
                  type="date"
                  className="text-right"
                  value={individualForm.date}
                  onChange={(e) =>
                    setIndividualForm((prev) => ({
                      ...prev,
                      date: e.target.value,
                    }))
                  }
                  required
                />

                <TimePicker
                  label="وقت بداية الدرس"
                  value={individualForm.start_time}
                  onChange={(value) =>
                    setIndividualForm((prev) => ({
                      ...prev,
                      start_time: value,
                    }))
                  }
                  required
                />

                <Select
                  label="عدد الساعات"
                  value={individualForm.hours}
                  onChange={(e) =>
                    setIndividualForm((prev) => ({
                      ...prev,
                      hours: e.target.value,
                    }))
                  }
                  options={[
                    { value: '0.5', label: '30 دقيقة' },
                    { value: '0.75', label: '45 دقيقة' },
                    { value: '1', label: 'ساعة' },
                    { value: '1.25', label: 'ساعة وربع' },
                    { value: '1.5', label: 'ساعة ونصف' },
                    { value: '1.75', label: 'ساعة و45 دقيقة' },
                    { value: '2', label: 'ساعتان' },
                    { value: '2.25', label: 'ساعتان وربع' },
                    { value: '2.5', label: 'ساعتان ونصف' },
                    { value: '2.75', label: 'ساعتان و45 دقيقة' },
                    { value: '3', label: '3 ساعات' },
                  ]}
                  required
                />

                <div className="flex gap-2">
                  <Button type="submit" isLoading={individualSubmitting}>
                    {individualEditing ? 'حفظ التغييرات' : 'إضافة'}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setIndividualFormOpen(false);
                      setIndividualEditing(null);
                    }}
                  >
                    إلغاء
                  </Button>
                </div>
              </form>
            </Card>
          )}

          <Card>
            <Table
              columns={individualColumns}
              data={paginatedIndividualLessons}
              emptyMessage="لا توجد دروس فردية"
            />
          </Card>

        {filteredIndividualLessons.length > ITEMS_PER_PAGE && (
          <div className="flex items-center justify-center gap-4 mt-4">
            <Button
              variant="outline"
              disabled={individualPage === 1}
              onClick={() => setIndividualPage((p) => Math.max(1, p - 1))}
            >
              السابق
            </Button>
            <span className="text-sm text-gray-600">
              صفحة {individualPage} من{' '}
              {Math.ceil(filteredIndividualLessons.length / ITEMS_PER_PAGE)}
            </span>
            <Button
              variant="outline"
              disabled={
                individualPage ===
                Math.ceil(filteredIndividualLessons.length / ITEMS_PER_PAGE)
              }
              onClick={() =>
                setIndividualPage((p) =>
                  Math.min(
                    Math.ceil(filteredIndividualLessons.length / ITEMS_PER_PAGE),
                    p + 1
                  )
                )
              }
            >
              التالي
            </Button>
          </div>
        )}
        </>
      )}

      {activeTab === 'group' && (
        <>
          <Card title="تصفية الدروس الجماعية" className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input
                label="بحث"
                placeholder="أدخل اسم الطالب، المعلم، المستوى أو التاريخ"
                value={groupFilters.search}
                onChange={(e) =>
                  setGroupFilters((prev) => ({
                    ...prev,
                    search: e.target.value,
                  }))
                }
              />
              <Select
                label="الحالة"
                value={groupFilters.status}
                onChange={(e) =>
                  setGroupFilters((prev) => ({
                    ...prev,
                    status: e.target.value,
                  }))
                }
                options={statusOptions}
              />
              <Select
                label="السنة"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                options={lessonYears.map((year) => ({
                  value: year,
                  label: `${year}`,
                }))}
              />
              <Select
                label="الشهر"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                options={lessonMonths}
              />
            </div>
          </Card>

          {isAdmin && filteredPendingGroupLessons.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <p className="text-sm text-gray-600">
                يوجد {filteredPendingGroupLessons.length} درس جماعي بانتظار الاعتماد
                {filteredPendingGroupLessons.length !== pendingGroupLessons.length && 
                  ` (من أصل ${pendingGroupLessons.length})`
                }
              </p>
              <Button
                onClick={handleBulkApproveGroup}
                isLoading={bulkApprovingGroup}
              >
                اعتماد جميع الدروس الجماعية المفلترة
              </Button>
            </div>
          )}

          {groupFormOpen && canCreateLessons && (
            <Card
              title={
                groupEditing ? 'تعديل درس جماعي' : 'إضافة درس جماعي جديد'
              }
              className="mb-6"
            >
              <form onSubmit={handleGroupSubmit} className="space-y-4">
                {groupFormError && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {groupFormError}
                  </div>
                )}

                {!isTeacher && (
                  <Select
                    label="المعلم"
                    value={groupForm.teacher_id}
                    onChange={(e) =>
                      setGroupForm((prev) => ({
                        ...prev,
                        teacher_id: e.target.value,
                      }))
                    }
                    options={teacherSelectOptions}
                    required
                  />
                )}

                <Select
                  label="المستوى التعليمي"
                  value={groupForm.education_level_id}
                  onChange={(e) => {
                    const value = e.target.value;
                    setGroupForm((prev) => ({
                      ...prev,
                      education_level_id: value,
                      studentIds: value
                        ? prev.studentIds.filter((id) => {
                            const student = studentsById.get(id);
                            return (
                              student?.education_level_id?.toString() === value
                            );
                          })
                        : prev.studentIds,
                      search: prev.search,
                    }));
                  }}
                  options={[
                    { value: '', label: 'اختر المستوى التعليمي' },
                    ...educationLevels
                      .filter((level) => level.name_ar !== 'جامعي') // Exclude جامعي from group lessons
                      .map((level) => ({
                        value: level.id,
                        label: level.name_ar,
                      })),
                  ]}
                  required
                />

                <Input
                  label="تاريخ الدرس"
                  type="date"
                  className="text-right"
                  value={groupForm.date}
                  onChange={(e) =>
                    setGroupForm((prev) => ({
                      ...prev,
                      date: e.target.value,
                    }))
                  }
                  required
                />

                <TimePicker
                  label="وقت بداية الدرس"
                  value={groupForm.start_time}
                  onChange={(value) =>
                    setGroupForm((prev) => ({
                      ...prev,
                      start_time: value,
                    }))
                  }
                  required
                />

                <Select
                  label="عدد الساعات"
                  value={groupForm.hours}
                  onChange={(e) =>
                    setGroupForm((prev) => ({
                      ...prev,
                      hours: e.target.value,
                    }))
                  }
                  options={[
                    { value: '0.5', label: '30 دقيقة' },
                    { value: '0.75', label: '45 دقيقة' },
                    { value: '1', label: 'ساعة' },
                    { value: '1.25', label: 'ساعة وربع' },
                    { value: '1.5', label: 'ساعة ونصف' },
                    { value: '1.75', label: 'ساعة و45 دقيقة' },
                    { value: '2', label: 'ساعتان' },
                    { value: '2.25', label: 'ساعتان وربع' },
                    { value: '2.5', label: 'ساعتان ونصف' },
                    { value: '2.75', label: 'ساعتان و45 دقيقة' },
                    { value: '3', label: '3 ساعات' },
                  ]}
                  required
                />

                <Card title="إضافة الطلاب إلى الدرس">
                  <div className="space-y-4">
                    <Card>
                      <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-4 items-end">
                        <ComboBox
                          label="ابحث عن الطالب بالاسم"
                          value=""
                          onChange={(value) => {
                            const selectedId = Number(value);
                            if (!selectedId) return;
                            const selectedStudent = studentsById.get(selectedId);
                            setGroupForm((prev) => ({
                              ...prev,
                              studentIds: [...prev.studentIds, selectedId],
                              education_level_id:
                                prev.education_level_id ||
                                selectedStudent?.education_level_id?.toString() ||
                                '',
                            }));
                          }}
                          options={availableGroupStudentOptions}
                          placeholder="اكتب اسم الطالب للبحث"
                          disabled={availableGroupStudentOptions.length === 0}
                        />
                        <Button
                          type="button"
                          onClick={() => setStudentModalOpen(true)}
                          variant="secondary"
                        >
                          إضافة طالب جديد
                        </Button>
                      </div>
                      {availableGroupStudentOptions.length === 0 && (
                        <p className="text-sm text-gray-600 mt-2">
                          لا يوجد طلاب مطابقون للبحث الحالي أو تم اختيارهم بالفعل.
                        </p>
                      )}
                    </Card>

                    <div className="flex flex-wrap gap-2">
                      {selectedGroupStudents.map((student) => (
                        <span
                          key={student.id}
                          className="flex items-center gap-2 bg-gray-200 text-gray-900 px-3 py-1 rounded-full text-sm"
                        >
                          {student.full_name}
                          <button
                            type="button"
                            className="text-red-600"
                            onClick={() =>
                              setGroupForm((prev) => ({
                                ...prev,
                                studentIds: prev.studentIds.filter(
                                  (id) => id !== student.id
                                ),
                              }))
                            }
                          >
                            ×
                          </button>
                        </span>
                      ))}
                      {selectedGroupStudents.length === 0 && (
                        <p className="text-sm text-gray-600">
                          يجب اختيار طالبين على الأقل
                        </p>
                      )}
                    </div>
                  </div>
                </Card>

                <div className="flex gap-2">
                  <Button type="submit" isLoading={groupSubmitting}>
                    {groupEditing ? 'حفظ التغييرات' : 'إضافة'}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setGroupFormOpen(false);
                      setGroupEditing(null);
                    }}
                  >
                    إلغاء
                  </Button>
                </div>
              </form>
        </Card>
      )}

          <Card>
            <Table
              columns={groupColumns}
              data={paginatedGroupLessons}
              emptyMessage="لا توجد دروس جماعية"
            />
          </Card>

        {filteredGroupLessons.length > ITEMS_PER_PAGE && (
          <div className="flex items-center justify-center gap-4 mt-4">
            <Button
              variant="outline"
              disabled={groupPage === 1}
              onClick={() => setGroupPage((p) => Math.max(1, p - 1))}
            >
              السابق
            </Button>
            <span className="text-sm text-gray-600">
              صفحة {groupPage} من{' '}
              {Math.ceil(filteredGroupLessons.length / ITEMS_PER_PAGE)}
            </span>
            <Button
              variant="outline"
              disabled={
                groupPage ===
                Math.ceil(filteredGroupLessons.length / ITEMS_PER_PAGE)
              }
              onClick={() =>
                setGroupPage((p) =>
                  Math.min(
                    Math.ceil(filteredGroupLessons.length / ITEMS_PER_PAGE),
                    p + 1
                  )
                )
              }
            >
              التالي
            </Button>
          </div>
        )}
        </>
      )}

      {activeTab === 'remedial' && (
        <>
          <Card title="تصفية הוראה מתקנת" className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input
                label="بحث"
                placeholder="أدخل اسم الطالب، المعلم أو التاريخ"
                value={remedialFilters.search}
                onChange={(e) =>
                  setRemedialFilters((prev) => ({
                    ...prev,
                    search: e.target.value,
                  }))
                }
              />
              <Select
                label="الحالة"
                value={remedialFilters.status}
                onChange={(e) =>
                  setRemedialFilters((prev) => ({
                    ...prev,
                    status: e.target.value,
                  }))
                }
                options={statusOptions}
              />
              <Select
                label="السنة"
                value={selectedYear}
                onChange={(e) => {
                  const year = parseInt(e.target.value, 10);
                  setSelectedYear(year);
                  setRemedialPage(1);
                }}
                options={lessonYears.map((year) => ({
                  value: year,
                  label: `${year}`,
                }))}
              />
              <Select
                label="الشهر"
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                  setRemedialPage(1);
                }}
                options={lessonMonths}
              />
            </div>
          </Card>

          {isAdmin && filteredPendingRemedialLessons.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <p className="text-sm text-gray-600">
                يوجد {filteredPendingRemedialLessons.length} درس علاجي بانتظار الاعتماد
              </p>
              <Button
                onClick={handleBulkApproveRemedial}
                isLoading={bulkApprovingRemedial}
              >
                اعتماد جميع الدروس العلاجية المفلترة
              </Button>
            </div>
          )}

          {canCreateLessons && (
            <div className="mb-6">
              <Button onClick={() => handleOpenRemedialForm()}>
                إضافة درس علاجي
              </Button>
            </div>
          )}

          <Table
            data={filteredRemedialLessons.slice(
              (remedialPage - 1) * ITEMS_PER_PAGE,
              remedialPage * ITEMS_PER_PAGE
            )}
            columns={[
              { key: 'id', header: 'الرقم' },
              { key: 'date', header: 'التاريخ' },
              { key: 'start_time', header: 'وقت البدء' },
              ...(isAdmin
                ? [
                    {
                      key: 'teacher',
                      header: 'المعلم',
                      render: (lesson: RemedialLesson) =>
                        lesson.teacher?.full_name || '-',
                    },
                  ]
                : []),
              {
                key: 'student',
                header: 'الطالب',
                render: (lesson: RemedialLesson) =>
                  lesson.student?.full_name || '-',
              },
              { key: 'hours', header: 'الساعات' },
              {
                key: 'total_cost',
                header: 'التكلفة (₪)',
                render: (lesson: RemedialLesson) =>
                  lesson.total_cost ? `${lesson.total_cost.toFixed(2)}` : '-',
              },
              {
                key: 'approved',
                header: 'الحالة',
                render: (lesson: RemedialLesson) => {
                  if (lesson.deleted_at) {
                    return (
                      <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-700">
                        محذوف
                      </span>
                    );
                  }
                  return lesson.approved ? (
                    <span className="text-green-600 font-semibold">معتمد</span>
                  ) : (
                    <span className="text-orange-600 font-semibold">
                      قيد الانتظار
                    </span>
                  );
                },
              },
              {
                key: 'deletion_note',
                header: 'سبب الحذف',
                render: (lesson: RemedialLesson) =>
                  lesson.deleted_at && lesson.deletion_note ? (
                    <span className="text-sm text-gray-600" title={lesson.deletion_note}>
                      {lesson.deletion_note}
                    </span>
                  ) : (
                    '-'
                  ),
              },
              {
                key: 'actions',
                header: 'الإجراءات',
                render: (lesson: RemedialLesson) => {
                  const isDeleted = !!lesson.deleted_at;
                  const disableForTeacher = (lesson.approved && !isAdmin) || isDeleted;
                  return (
                    <div className="flex gap-2 flex-wrap">
                      {isAdmin && !lesson.approved && !isDeleted && (
                        <Button
                          size="sm"
                          onClick={() => handleApproveRemedial(lesson)}
                        >
                          اعتماد
                        </Button>
                      )}
                      {isTeacher && (
                        <>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleOpenRemedialForm(lesson)}
                            disabled={disableForTeacher}
                          >
                            تعديل
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleDeleteRemedial(lesson)}
                            disabled={disableForTeacher}
                          >
                            حذف
                          </Button>
                        </>
                      )}
                    </div>
                  );
                },
              },
            ]}
          />

          {filteredRemedialLessons.length > ITEMS_PER_PAGE && (
            <div className="flex justify-between items-center mt-4">
              <Button
                variant="outline"
                onClick={() => setRemedialPage((p) => Math.max(1, p - 1))}
                disabled={remedialPage === 1}
              >
                السابق
              </Button>
              <span className="text-gray-700">
                صفحة {remedialPage} من{' '}
                {Math.ceil(filteredRemedialLessons.length / ITEMS_PER_PAGE)}
              </span>
              <Button
                variant="outline"
                onClick={() =>
                  setRemedialPage((p) =>
                    Math.min(
                      Math.ceil(filteredRemedialLessons.length / ITEMS_PER_PAGE),
                      p + 1
                    )
                  )
                }
                disabled={
                  remedialPage >=
                  Math.ceil(filteredRemedialLessons.length / ITEMS_PER_PAGE)
                }
              >
                التالي
              </Button>
            </div>
          )}

          {remedialFormOpen && (
            <Modal
              open={remedialFormOpen}
              onClose={() => {
                setRemedialFormOpen(false);
                setRemedialEditing(null);
                setRemedialFormError('');
              }}
            >
              <Card title={remedialEditing ? 'تعديل درس علاجي' : 'إضافة درس علاجي'}>
              <form onSubmit={handleRemedialSubmit}>
                {remedialFormError && (
                  <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded mb-4">
                    {remedialFormError}
                  </div>
                )}

                {!teacher && isAdmin && (
                  <Select
                    label="المعلم"
                    value={remedialForm.teacher_id}
                    onChange={(e) =>
                      setRemedialForm((prev) => ({
                        ...prev,
                        teacher_id: e.target.value,
                      }))
                    }
                    options={teachers.map((t) => ({
                      value: t.id.toString(),
                      label: t.full_name,
                    }))}
                  />
                )}

                <ComboBox
                  label="الطالب"
                  value={remedialForm.student_id}
                  onChange={(value) =>
                    setRemedialForm((prev) => ({
                      ...prev,
                      student_id: value,
                    }))
                  }
                  options={sortedStudents.map((s) => ({
                    value: s.id.toString(),
                    label: s.full_name,
                  }))}
                />
                <div className="text-sm">
                  <button
                    type="button"
                    onClick={() => setStudentModalOpen(true)}
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    إضافة طالب جديد
                  </button>
                </div>

                <Input
                  label="تاريخ الدرس"
                  type="date"
                  value={remedialForm.date}
                  onChange={(e) =>
                    setRemedialForm((prev) => ({
                      ...prev,
                      date: e.target.value,
                    }))
                  }
                />

                <TimePicker
                  label="وقت بداية الدرس"
                  value={remedialForm.start_time}
                  onChange={(value) =>
                    setRemedialForm((prev) => ({
                      ...prev,
                      start_time: value,
                    }))
                  }
                  required
                />

                <Select
                  label="عدد الساعات"
                  value={remedialForm.hours}
                  onChange={(e) =>
                    setRemedialForm((prev) => ({
                      ...prev,
                      hours: e.target.value,
                    }))
                  }
                  options={[
                    { value: '0.5', label: '30 دقيقة' },
                    { value: '0.75', label: '45 دقيقة' },
                    { value: '1', label: 'ساعة' },
                    { value: '1.25', label: 'ساعة وربع' },
                    { value: '1.5', label: 'ساعة ونصف' },
                    { value: '1.75', label: 'ساعة و45 دقيقة' },
                    { value: '2', label: 'ساعتان' },
                    { value: '2.25', label: 'ساعتان وربع' },
                    { value: '2.5', label: 'ساعتان ونصف' },
                    { value: '2.75', label: 'ساعتان و45 دقيقة' },
                    { value: '3', label: '3 ساعات' },
                  ]}
                />

                <div className="flex gap-2 mt-6">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={remedialSubmitting}
                  >
                    {remedialSubmitting
                      ? 'جاري الحفظ...'
                      : remedialEditing
                      ? 'تحديث'
                      : 'إضافة'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setRemedialFormOpen(false);
                      setRemedialEditing(null);
                      setRemedialFormError('');
                    }}
                  >
                    إلغاء
                  </Button>
                </div>
              </form>
              </Card>
            </Modal>
          )}
        </>
      )}

      {/* Student Modal */}
      <Modal
        open={studentModalOpen}
        onClose={() => {
          setStudentModalOpen(false);
          resetStudentForm();
        }}
      >
        <Card title="إضافة طالب جديد">
          <form onSubmit={handleStudentSubmit} className="space-y-4">
            {studentFormError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {studentFormError}
              </div>
            )}

            <Input
              label="الاسم الكامل"
              type="text"
              value={studentFormData.full_name}
              onChange={(e) => {
                setStudentFormData({ ...studentFormData, full_name: e.target.value });
                setStudentFieldErrors((prev) => ({ ...prev, full_name: undefined }));
              }}
              required
            />
            {studentFieldErrors.full_name && (
              <p className="text-sm text-red-600">{studentFieldErrors.full_name}</p>
            )}

            <Input
              label="جهة اتصال ولي الأمر"
              type="tel"
              value={studentFormData.parent_contact}
              onChange={(e) => {
                setStudentFormData({ ...studentFormData, parent_contact: e.target.value });
                setStudentFieldErrors((prev) => ({ ...prev, parent_contact: undefined }));
              }}
            />
            {studentFieldErrors.parent_contact && (
              <p className="text-sm text-red-600">{studentFieldErrors.parent_contact}</p>
            )}

            <Select
              label="المستوى التعليمي"
              value={studentFormData.education_level_id}
              onChange={(e) => {
                setStudentFormData({ ...studentFormData, education_level_id: e.target.value });
                setStudentFieldErrors((prev) => ({ ...prev, education_level_id: undefined }));
              }}
              options={[
                { value: '', label: 'اختر المستوى التعليمي' },
                ...educationLevels.map((level) => ({
                  value: level.id.toString(),
                  label: level.name_ar || level.name_en || `Level ${level.id}`,
                })),
              ]}
              required
            />
            {studentFieldErrors.education_level_id && (
              <p className="text-sm text-red-600">{studentFieldErrors.education_level_id}</p>
            )}

            <Input
              label="الصف"
              type="text"
              value={studentFormData.class}
              onChange={(e) => {
                setStudentFormData({ ...studentFormData, class: e.target.value });
              }}
              placeholder="مثال: أول، ثاني، ثالث..."
            />

            <div className="flex gap-2">
              <Button 
                type="submit" 
                isLoading={studentSubmitting}
                disabled={educationLevels.length === 0}
              >
                إضافة
              </Button>
              <Button 
                type="button" 
                variant="secondary" 
                onClick={() => {
                  setStudentModalOpen(false);
                  resetStudentForm();
                }}
              >
                إلغاء
              </Button>
            </div>
          </form>
        </Card>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setLessonToDelete(null);
          setDeletionNote('');
        }}
        ariaLabel="تأكيد الحذف"
      >
        <Card title="تأكيد الحذف">
          <div className="space-y-4">
            <p className="text-gray-700">
              هل أنت متأكد من حذف هذا الدرس؟ هذا الإجراء لا يمكن التراجع عنه.
            </p>
            
            {isAdmin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  سبب الحذف (اختياري)
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  value={deletionNote}
                  onChange={(e) => setDeletionNote(e.target.value)}
                  placeholder="اكتب سبب الحذف هنا..."
                />
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button
                variant="secondary"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setLessonToDelete(null);
                  setDeletionNote('');
                }}
                disabled={deleting}
              >
                إلغاء
              </Button>
              <Button
                variant="danger"
                onClick={confirmDelete}
                isLoading={deleting}
              >
                حذف
              </Button>
            </div>
          </div>
        </Card>
      </Modal>
    </div>
  );
}


