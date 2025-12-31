'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Table, TableColumn } from '@/components/ui/Table';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api-client';
import { IndividualLesson, GroupLesson, RemedialLesson } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { downloadCSV, formatDateForFilename, LessonExportRow } from '@/lib/utils/export';
import { formatLocalDate } from '@/lib/utils/date';

interface PastLesson {
  id: string;
  type: 'individual' | 'group';
  date: string;
  hours: number;
  studentName?: string;
  levelName?: string;
  groupStudents?: string[];
}

function StatCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description?: string;
}) {
  return (
    <Card className="bg-white">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
      {description && <p className="text-sm text-gray-500 mt-2">{description}</p>}
    </Card>
  );
}

interface StudentStat {
  studentId: number;
  studentName: string;
  individualLessons: number;
  individualHours: number;
  groupLessons: number;
  groupHours: number;
  remedialLessons: number;
  remedialHours: number;
}

interface TeacherLevelRow {
  teacherId: number | null;
  teacherName: string;
  __search?: string;
  [key: string]: string | number | null | undefined;
}

const formatHours = (value: number) => {
  if (!Number.isFinite(value)) return '0';
  const normalized = Math.round((value + Number.EPSILON) * 100) / 100;
  const text = normalized.toString();
  return text.includes('.') ? text.replace(/\.?0+$/, '') : text;
};

export default function StatisticsPage() {
  const { isTeacher, isAdmin, loading: authLoading, teacher } = useAuth();
  const [individualLessons, setIndividualLessons] = useState<IndividualLesson[]>([]);
  const [groupLessons, setGroupLessons] = useState<GroupLesson[]>([]);
  const [remedialLessons, setRemedialLessons] = useState<RemedialLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const statsYears = [2025, 2026];
  const statsMonths = [
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
  const [statsYear, setStatsYear] = useState(
    statsYears.includes(currentYear) ? currentYear : statsYears[0]
  );
  const [statsMonth, setStatsMonth] = useState(currentMonth);
  const [adminSearch, setAdminSearch] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!isTeacher && !isAdmin) {
      setLoading(false);
      return;
    }
    loadStatistics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isTeacher, isAdmin, statsYear, statsMonth]);

  const getDateFilters = (year: number, month: string) => {
    // Use local date formatting to avoid timezone issues
    const start = new Date(year, Number(month) - 1, 1);
    const end = new Date(year, Number(month), 0);
    
    return {
      date_from: formatLocalDate(start),
      date_to: formatLocalDate(end),
    };
  };

  const loadStatistics = async () => {
    setLoading(true);
    setError('');
    try {
      const dateFilters = getDateFilters(statsYear, statsMonth);
      const [individualRes, groupRes, remedialRes] = await Promise.all([
        api.getIndividualLessons(dateFilters),
        api.getGroupLessons(dateFilters),
        api.getRemedialLessons(dateFilters),
      ]);

      if (individualRes.success && Array.isArray(individualRes.data)) {
        setIndividualLessons(individualRes.data as IndividualLesson[]);
      } else {
        setError(individualRes.error || 'فشل في تحميل الدروس الفردية');
      }

      if (groupRes.success && Array.isArray(groupRes.data)) {
        setGroupLessons(groupRes.data as GroupLesson[]);
      } else {
        setError((prev) => prev || groupRes.error || 'فشل في تحميل الدروس الجماعية');
      }

      if (remedialRes.success && Array.isArray(remedialRes.data)) {
        setRemedialLessons(remedialRes.data as RemedialLesson[]);
      } else {
        setError((prev) => prev || remedialRes.error || 'فشل في تحميل הוראה מתקנת');
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء تحميل الإحصائيات');
    } finally {
      setLoading(false);
    }
  };

  const totalApprovedIndividualHours = useMemo(
    () =>
      individualLessons
        .filter((lesson) => lesson.approved)
        .reduce((sum, lesson) => sum + (Number(lesson.hours) || 0), 0),
    [individualLessons]
  );

  const totalApprovedGroupHours = useMemo(
    () =>
      groupLessons
        .filter((lesson) => lesson.approved)
        .reduce((sum, lesson) => sum + (Number(lesson.hours) || 0), 0),
    [groupLessons]
  );

  const totalApprovedRemedialHours = useMemo(
    () =>
      remedialLessons
        .filter((lesson) => lesson.approved)
        .reduce((sum, lesson) => sum + (Number(lesson.hours) || 0), 0),
    [remedialLessons]
  );

  const totalApprovedHours = totalApprovedIndividualHours + totalApprovedGroupHours + totalApprovedRemedialHours;
  const totalApprovedIndividualLessons = useMemo(
    () => individualLessons.filter((lesson) => lesson.approved).length,
    [individualLessons]
  );
  const totalApprovedGroupLessons = useMemo(
    () => groupLessons.filter((lesson) => lesson.approved).length,
    [groupLessons]
  );
  const totalApprovedRemedialLessons = useMemo(
    () => remedialLessons.filter((lesson) => lesson.approved).length,
    [remedialLessons]
  );

  const pastLessons = useMemo<PastLesson[]>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const individual = individualLessons
      .filter((lesson) => lesson.approved)
      .map<PastLesson>((lesson) => ({
        id: `individual-${lesson.id}`,
        type: 'individual',
        date: lesson.date,
        hours: Number(lesson.hours) || 0,
        studentName: lesson.student?.full_name || 'بدون اسم',
        levelName: lesson.education_level?.name_ar,
      }));

    const group = groupLessons
      .filter((lesson) => lesson.approved)
      .map<PastLesson>((lesson) => ({
        id: `group-${lesson.id}`,
        type: 'group',
        date: lesson.date,
        hours: Number(lesson.hours) || 0,
        levelName: lesson.education_level?.name_ar,
        groupStudents: lesson.students?.map((student) => student.full_name) || [],
      }));

    return [...individual, ...group]
      .filter((lesson) => {
        const lessonDate = new Date(lesson.date);
        lessonDate.setHours(0, 0, 0, 0);
        return lessonDate <= today;
      })
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5);
  }, [individualLessons, groupLessons]);

  const lessonsByLevel = useMemo(() => {
    const levelMap = new Map<
      string,
      {
        label: string;
        individualHours: number;
        groupHours: number;
        totalHours: number;
        individualLessons: number;
        groupLessons: number;
      }
    >();

    const addLesson = (
      levelName: string | undefined | null,
      hours: number | undefined,
      type: 'individual' | 'group'
    ) => {
      const key = levelName || 'غير محدد';
      const entry =
        levelMap.get(key) || {
          label: key,
          individualHours: 0,
          groupHours: 0,
          totalHours: 0,
          individualLessons: 0,
          groupLessons: 0,
        };
      const value = hours || 0;
      entry.totalHours += value;
      if (type === 'individual') {
        entry.individualHours += value;
        entry.individualLessons += 1;
      } else {
        entry.groupHours += value;
        entry.groupLessons += 1;
      }
      levelMap.set(key, entry);
    };

    individualLessons.forEach((lesson) => {
      if (lesson.approved) {
        addLesson(lesson.education_level?.name_ar, Number(lesson.hours), 'individual');
      }
    });

    groupLessons.forEach((lesson) => {
      if (lesson.approved) {
        addLesson(lesson.education_level?.name_ar, Number(lesson.hours), 'group');
      }
    });

    return Array.from(levelMap.values()).sort((a, b) => b.totalHours - a.totalHours);
  }, [individualLessons, groupLessons]);

  const showTeacherView = isTeacher && !isAdmin;
  const showAdminView = isAdmin;

  const adminTeacherStats = useMemo(() => {
    if (!showAdminView) {
      return { rows: [] as TeacherLevelRow[], levels: [] as string[] };
    }

    const levelSet = new Set<string>();
    const teacherMap = new Map<
      number | null,
      {
        teacherId: number | null;
        teacherName: string;
        levels: Map<
          string,
          {
            individualLessons: number;
            individualHours: number;
            groupLessons: number;
            groupHours: number;
          }
        >;
        remedialLessons: number;
        remedialHours: number;
      }
    >();

    const ensureTeacher = (id: number | null, name: string) => {
      const existing = teacherMap.get(id);
      if (existing) return existing;
      const entry = {
        teacherId: id,
        teacherName: name,
        levels: new Map(),
        remedialLessons: 0,
        remedialHours: 0,
      };
      teacherMap.set(id, entry);
      return entry;
    };

    const addLesson = (
      lesson:
        | (IndividualLesson & { education_level?: { name_ar?: string | null } | null })
        | (GroupLesson & { education_level?: { name_ar?: string | null } | null }),
      type: 'individual' | 'group'
    ) => {
      if (!lesson.teacher_id) return;
      const teacherName = lesson.teacher?.full_name || `معلم ${lesson.teacher_id}`;
      const levelName = lesson.education_level?.name_ar || 'غير محدد';
      levelSet.add(levelName);
      const teacherEntry = ensureTeacher(lesson.teacher_id, teacherName);
      const levelEntry =
        teacherEntry.levels.get(levelName) || {
          individualLessons: 0,
          individualHours: 0,
          groupLessons: 0,
          groupHours: 0,
        };
      if (type === 'individual') {
        levelEntry.individualLessons += 1;
        levelEntry.individualHours += Number(lesson.hours) || 0;
      } else {
        levelEntry.groupLessons += 1;
        levelEntry.groupHours += Number(lesson.hours) || 0;
      }
      teacherEntry.levels.set(levelName, levelEntry);
    };

    individualLessons.forEach((lesson) => {
      if (lesson.approved) {
        addLesson(lesson, 'individual');
      }
    });

    groupLessons.forEach((lesson) => {
      if (lesson.approved) {
        addLesson(lesson, 'group');
      }
    });

    // Add remedial lessons (they don't have education_level, so add to each teacher's total)
    remedialLessons.forEach((lesson) => {
      if (!lesson.approved || !lesson.teacher_id) return;
      const teacherName = lesson.teacher?.full_name || `معلم ${lesson.teacher_id}`;
      const teacherEntry = ensureTeacher(lesson.teacher_id, teacherName);
      teacherEntry.remedialLessons += 1;
      teacherEntry.remedialHours += Number(lesson.hours) || 0;
    });

    const levels = Array.from(levelSet.values()).sort((a, b) =>
      a.localeCompare(b, 'ar')
    );

    const rows = Array.from(teacherMap.values())
      .map<TeacherLevelRow>((teacherEntry) => {
        const row: TeacherLevelRow = {
          teacherId: teacherEntry.teacherId,
          teacherName: teacherEntry.teacherName,
        };
        const searchParts = [teacherEntry.teacherName];
        levels.forEach((level) => {
          searchParts.push(level);
          const stats = teacherEntry.levels.get(level);
          const indivText = stats
            ? `${stats.individualLessons} درس (${formatHours(stats.individualHours)} ساعة)`
            : '0 درس (0 ساعة)';
          const groupText = stats
            ? `${stats.groupLessons} درس (${formatHours(stats.groupHours)} ساعة)`
            : '0 درس (0 ساعة)';
          row[`${level}-individual`] = indivText;
          row[`${level}-group`] = groupText;
        });
        // Add remedial stats as a separate column
        row['remedial'] = teacherEntry.remedialLessons > 0
          ? `${teacherEntry.remedialLessons} درس (${formatHours(teacherEntry.remedialHours)} ساعة)`
          : '0 درس (0 ساعة)';
        searchParts.push('הוראה מתקנת');
        row.__search = searchParts.join(' ').toLowerCase();
        return row;
      })
      .sort((a, b) => a.teacherName.localeCompare(b.teacherName, 'ar'));

    return { rows, levels };
  }, [individualLessons, groupLessons, remedialLessons, showAdminView]);

  const adminStudentStats = useMemo<StudentStat[]>(() => {
    if (!showAdminView) return [];
    const map = new Map<number, StudentStat>();

    const ensureEntry = (student: { id: number; full_name?: string | null }) => {
      const existing = map.get(student.id);
      if (existing) return existing;
      const entry: StudentStat = {
        studentId: student.id,
        studentName: student.full_name || `طالب ${student.id}`,
        individualLessons: 0,
        individualHours: 0,
        groupLessons: 0,
        groupHours: 0,
        remedialLessons: 0,
        remedialHours: 0,
      };
      map.set(student.id, entry);
      return entry;
    };

    individualLessons.forEach((lesson) => {
      if (!lesson.student || !lesson.approved) return;
      const entry = ensureEntry(lesson.student);
      entry.individualLessons += 1;
      entry.individualHours += Number(lesson.hours) || 0;
    });

    groupLessons.forEach((lesson) => {
      if (!lesson.approved) return;
      lesson.students?.forEach((student) => {
        const entry = ensureEntry(student);
        entry.groupLessons += 1;
        entry.groupHours += Number(lesson.hours) || 0;
      });
    });

    remedialLessons.forEach((lesson) => {
      if (!lesson.student || !lesson.approved) return;
      const entry = ensureEntry(lesson.student);
      entry.remedialLessons += 1;
      entry.remedialHours += Number(lesson.hours) || 0;
    });

    return Array.from(map.values()).sort((a, b) =>
      a.studentName.localeCompare(b.studentName, 'ar')
    );
  }, [individualLessons, groupLessons, remedialLessons, showAdminView]);

  const filteredTeacherStats = useMemo(() => {
    const { rows } = adminTeacherStats;
    if (!adminSearch) return rows;
    const search = adminSearch.toLowerCase();
    return rows.filter(
      (stat) =>
        stat.teacherName.toLowerCase().includes(search) ||
        stat.__search?.includes(search)
    );
  }, [adminTeacherStats, adminSearch]);

  const teacherColumns = useMemo<TableColumn<TeacherLevelRow>[]>(() => {
    const columns: TableColumn<TeacherLevelRow>[] = [
      { key: 'teacherName', header: 'المعلم' },
    ];
    adminTeacherStats.levels.forEach((level) => {
      columns.push({
        key: `${level}-individual`,
        header: `${level} فردي`,
        render: (row) => row[`${level}-individual`] as string,
      });
      columns.push({
        key: `${level}-group`,
        header: `${level} جماعي`,
        render: (row) => row[`${level}-group`] as string,
      });
    });
    // Add remedial column (it doesn't have education level)
    columns.push({
      key: 'remedial',
      header: 'הוראה מתקנת',
      render: (row) => row['remedial'] as string,
    });
    return columns;
  }, [adminTeacherStats.levels]);

  const filteredStudentStats = useMemo(() => {
    if (!adminSearch) return adminStudentStats;
    const search = adminSearch.toLowerCase();
    return adminStudentStats.filter((stat) =>
      stat.studentName.toLowerCase().includes(search)
    );
  }, [adminStudentStats, adminSearch]);

  // Prepare data for export (teacher view only)
  const prepareExportData = useMemo<LessonExportRow[]>(() => {
    if (!showTeacherView) return [];
    
    const exportData: LessonExportRow[] = [];

    // Individual lessons
    individualLessons.forEach((lesson) => {
      exportData.push({
        type: 'درس فردي',
        date: lesson.date,
        student: lesson.student?.full_name || 'غير محدد',
        education_level: lesson.education_level?.name_ar || '',
        hours: Number(lesson.hours) || 0,
        approved: lesson.approved ? 'نعم' : 'لا',
        total_cost: lesson.total_cost || undefined,
      });
    });

    // Group lessons - add each student as a separate row
    groupLessons.forEach((lesson) => {
      const students = lesson.students?.map((s) => s.full_name).join('، ') || 'غير محدد';
      exportData.push({
        type: 'درس جماعي',
        date: lesson.date,
        student: students,
        education_level: lesson.education_level?.name_ar || '',
        hours: Number(lesson.hours) || 0,
        approved: lesson.approved ? 'نعم' : 'لا',
        total_cost: lesson.total_cost || undefined,
      });
    });

    // Remedial lessons
    remedialLessons.forEach((lesson) => {
      exportData.push({
        type: 'הוראה מתקנת',
        date: lesson.date,
        student: lesson.student?.full_name || 'غير محدد',
        education_level: '', // Remedial doesn't have education level
        hours: Number(lesson.hours) || 0,
        approved: lesson.approved ? 'نعم' : 'لا',
        total_cost: lesson.total_cost || undefined,
      });
    });

    // Sort by date descending
    return exportData.sort((a, b) => b.date.localeCompare(a.date));
  }, [individualLessons, groupLessons, remedialLessons, showTeacherView]);

  const handleExportCSV = () => {
    if (prepareExportData.length === 0) {
      alert('لا توجد بيانات للتصدير');
      return;
    }
    const teacherName = teacher?.full_name?.replace(/\s+/g, '_') || 'teacher';
    const dateStr = formatDateForFilename(new Date());
    const filename = `${teacherName}_lessons_${statsYear}_${statsMonth}_${dateStr}.csv`;
    downloadCSV(prepareExportData, filename);
  };

  const handleExportStudentStatsCSV = () => {
    if (filteredStudentStats.length === 0) {
      alert('لا توجد بيانات للتصدير');
      return;
    }

    // Convert student stats to CSV format
    const headers = ['الطالب', 'دروس فردية', 'ساعات فردية', 'دروس جماعية', 'ساعات جماعية', 'הוראה מתקנת', 'ساعات הוראה מתקנת', 'إجمالي الساعات'];
    const rows = filteredStudentStats.map((stat) => [
      stat.studentName,
      stat.individualLessons.toString(),
      formatHours(stat.individualHours),
      stat.groupLessons.toString(),
      formatHours(stat.groupHours),
      stat.remedialLessons.toString(),
      formatHours(stat.remedialHours),
      formatHours(stat.individualHours + stat.groupHours + stat.remedialHours),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    // Add BOM for UTF-8 to ensure Excel displays Arabic correctly
    const csvWithBOM = '\uFEFF' + csvContent;
    const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    
    const monthName = statsMonths.find(m => m.value === statsMonth)?.label || statsMonth;
    const filename = `student_stats_${statsYear}_${monthName}.csv`;
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };


  if (authLoading || loading) {
    return (
      <div className="text-center py-12 text-gray-900" dir="rtl">
        جاري تحميل الإحصائيات...
      </div>
    );
  }

  if (!showTeacherView && !showAdminView) {
    return (
      <div dir="rtl" className="space-y-6">
        <Card title="الإحصائيات">
          <p className="text-gray-600">
            لا تمتلك الصلاحيات للاطلاع على الإحصائيات.
          </p>
        </Card>
      </div>
    );
  }

  if (showAdminView) {
    const studentColumns: TableColumn<StudentStat>[] = [
      { key: 'studentName', header: 'الطالب' },
      {
        key: 'individualLessons',
        header: 'دروس فردية',
        render: (row) =>
          `${row.individualLessons} درس (${formatHours(row.individualHours)} ساعة)`,
      },
      {
        key: 'groupLessons',
        header: 'دروس جماعية',
        render: (row) =>
          `${row.groupLessons} درس (${formatHours(row.groupHours)} ساعة)`,
      },
      {
        key: 'remedialLessons',
        header: 'הוראה מתקנת',
        render: (row) =>
          `${row.remedialLessons} درس (${formatHours(row.remedialHours)} ساعة)`,
      },
      {
        key: 'total',
        header: 'الإجمالي',
        render: (row) =>
          `${formatHours(row.individualHours + row.groupHours + row.remedialHours)} ساعة`,
      },
    ];

  return (
      <div dir="rtl" className="space-y-6">
        <div className="flex flex-col gap-4">
    <div>
            <h1 className="text-3xl font-bold text-gray-900">إحصائيات الإدارة</h1>
            <p className="text-gray-600 mt-1">
              متابعة أداء المعلمين والطلاب للفترة المحددة.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Select
              label="اختر السنة"
              value={statsYear}
              onChange={(e) => setStatsYear(Number(e.target.value))}
              options={statsYears.map((year) => ({ value: year, label: `${year}` }))}
              className="w-32"
            />
            <Select
              label="اختر الشهر"
              value={statsMonth}
              onChange={(e) => setStatsMonth(e.target.value)}
              options={statsMonths}
              className="w-40"
            />
            <Input
              label="بحث"
              placeholder="ابحث عن معلم أو طالب"
              value={adminSearch}
              onChange={(e) => setAdminSearch(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <Card title="إحصائيات المعلمين حسب المستوى">
          {filteredTeacherStats.length === 0 ? (
            <p className="text-gray-500">لا توجد بيانات مطابقة للتصفية الحالية</p>
          ) : (
            <Table columns={teacherColumns} data={filteredTeacherStats} />
          )}
        </Card>

        <Card 
          title="إحصائيات الطلاب"
          actions={
            <button
              onClick={handleExportStudentStatsCSV}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
              title="تصدير إلى CSV"
              aria-label="تصدير إلى CSV"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </button>
          }
        >
          {filteredStudentStats.length === 0 ? (
            <p className="text-gray-500">لا توجد بيانات مطابقة للتصفية الحالية</p>
          ) : (
            <Table columns={studentColumns} data={filteredStudentStats} />
          )}
        </Card>
      </div>
    );
  }

  // Teacher view (existing)
  return (
    <div dir="rtl" className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-gray-900">إحصائيات المدرس</h1>
          {teacher && (
            <p className="text-gray-600">
              مرحبًا {teacher.full_name}، إليك ملخص أدائك خلال الفترة المحددة.
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-4 items-end">
          <Select
            label="اختر السنة"
            value={statsYear}
            onChange={(e) => setStatsYear(Number(e.target.value))}
            options={statsYears.map((year) => ({ value: year, label: `${year}` }))}
            className="w-32"
          />
          <Select
            label="اختر الشهر"
            value={statsMonth}
            onChange={(e) => setStatsMonth(e.target.value)}
            options={statsMonths}
            className="w-40"
          />
          <Button
            onClick={handleExportCSV}
            variant="secondary"
            disabled={prepareExportData.length === 0}
          >
            تصدير CSV ({prepareExportData.length} درس)
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="إجمالي الساعات المعتمدة"
          value={`${totalApprovedHours} ساعة`}
          description="يشمل الدروس الفردية والجماعية והוראה מתקנת المعتمدة"
        />
        <StatCard
          title="ساعات الدروس الفردية"
          value={`${totalApprovedIndividualHours} ساعة`}
          description={`${totalApprovedIndividualLessons} درس فردي معتمد`}
        />
        <StatCard
          title="ساعات الدروس الجماعية"
          value={`${totalApprovedGroupHours} ساعة`}
          description={`${totalApprovedGroupLessons} درس جماعي معتمد`}
        />
        <StatCard
          title="ساعات הוראה מתקנת"
          value={`${totalApprovedRemedialHours} ساعة`}
          description={`${totalApprovedRemedialLessons} درس הוראה מתקנת معتمد`}
        />
      </div>

      <Card title="توزيع الساعات حسب المستوى">
        {lessonsByLevel.length === 0 ? (
          <p className="text-gray-500">لا توجد دروس معتمدة لعرضها</p>
        ) : (
          <Table
            columns={[
              { key: 'label', header: 'المستوى التعليمي' },
              {
                key: 'totalHours',
                header: 'إجمالي الساعات',
                render: (row) => `${row.totalHours} ساعة`,
              },
              {
                key: 'individualHours',
                header: 'ساعات فردية',
                render: (row) => `${row.individualHours} ساعة (${row.individualLessons} درس)`,
              },
              {
                key: 'groupHours',
                header: 'ساعات جماعية',
                render: (row) => `${row.groupHours} ساعة (${row.groupLessons} درس)`,
              },
            ]}
            data={lessonsByLevel}
          />
        )}
        </Card>

      <Card title="أحدث الدروس المعتمدة (آخر 5)">
        {pastLessons.length === 0 ? (
          <p className="text-gray-500">لا توجد دروس معتمدة حتى الآن</p>
        ) : (
          <ul className="space-y-3">
            {pastLessons.map((lesson) => (
              <li key={lesson.id} className="flex flex-col gap-1 rounded-lg border border-gray-100 p-3 bg-gray-50">
                <div className="flex items-center justify-between text-sm">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      lesson.type === 'individual'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-purple-100 text-purple-700'
                    }`}
                  >
                    {lesson.type === 'individual' ? 'درس فردي' : 'درس جماعي'}
                  </span>
                  <span className="text-gray-600">{lesson.date}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <p className="text-gray-900 font-semibold">
                      {lesson.type === 'individual'
                        ? lesson.studentName
                        : lesson.levelName || 'المستوى غير معروف'}
                    </p>
                    <span className="text-sm text-gray-500">
                      {lesson.hours} ساعة
                    </span>
                  </div>
                  {lesson.type === 'individual' && lesson.levelName && (
                    <p className="text-sm text-gray-500">{lesson.levelName}</p>
                  )}
                  {lesson.type === 'group' && lesson.groupStudents?.length ? (
                    <p className="text-sm text-gray-600">
                      {lesson.groupStudents.join('، ')}
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
        </Card>
    </div>
  );
}
