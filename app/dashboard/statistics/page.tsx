'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Table, TableColumn } from '@/components/ui/Table';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { api } from '@/lib/api-client';
import { IndividualLesson, GroupLesson, RemedialLesson, EducationLevel, Teacher } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { downloadCSV, downloadCSVWithSummary, formatDateForFilename, LessonExportRow, StudentSummaryRow } from '@/lib/utils/export';
import { formatLocalDate, getFirstDayOfMonth, getLastDayOfMonth } from '@/lib/utils/date';
import { withBustanFallback } from '@/lib/utils/education-levels';

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
  educationLevel?: string | null;
  class?: string | null;
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
  const [educationLevels, setEducationLevels] = useState<EducationLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const statsYears = [2024, 2025, 2026];
  const statsMonths = [
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
  const currentYear = new Date().getFullYear();
  const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
  const [statsYear, setStatsYear] = useState(
    statsYears.includes(currentYear) ? currentYear : statsYears[0]
  );
  const [statsMonth, setStatsMonth] = useState(currentMonth);
  const [adminSearch, setAdminSearch] = useState('');
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [teacherExportModalOpen, setTeacherExportModalOpen] = useState(false);
  const [selectedTeacherForExport, setSelectedTeacherForExport] = useState<number | null>(null);
  const [exportTeacherYear, setExportTeacherYear] = useState(new Date().getFullYear());
  const [exportTeacherMonth, setExportTeacherMonth] = useState(String(new Date().getMonth() + 1).padStart(2, '0'));
  const [exportingTeacherCSV, setExportingTeacherCSV] = useState(false);
  const [exportingCSV, setExportingCSV] = useState(false);
  const [exportingAllLessonsCSV, setExportingAllLessonsCSV] = useState(false);
  const [exportingFilteredLessonsCSV, setExportingFilteredLessonsCSV] = useState(false);

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
    // "all" = entire year (all months)
    if (month === 'all') {
      return {
        date_from: `${year}-01-01`,
        date_to: `${year}-12-31`,
      };
    }
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
      const approvedFilters = { ...dateFilters, approved: true };
      const promises: Promise<any>[] = [
        api.getIndividualLessons(approvedFilters),
        api.getGroupLessons(approvedFilters),
        api.getRemedialLessons(approvedFilters),
        api.getEducationLevels(),
      ];
      if (isAdmin) {
        promises.push(api.getTeachers());
      }
      const results = await Promise.all(promises);
      const [individualRes, groupRes, remedialRes, levelsRes, ...rest] = results;
      const teachersRes = isAdmin ? rest[0] : null;

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
      if (levelsRes.success && Array.isArray(levelsRes.data)) {
        setEducationLevels(withBustanFallback(levelsRes.data as EducationLevel[]));
      }
      if (teachersRes && teachersRes.success && Array.isArray(teachersRes.data)) {
        setTeachers(teachersRes.data as Teacher[]);
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

    // Start with all education levels from the database
    const allLevelNames = educationLevels.map((level) => level.name_ar).filter(Boolean);
    console.log('Education levels in adminTeacherStats:', allLevelNames);
    const levelSet = new Set<string>(allLevelNames);
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
        // Skip group lessons for "جامعي" level (not available for group lessons)
        const levelName = lesson.education_level?.name_ar;
        if (levelName !== 'جامعي') {
          addLesson(lesson, 'group');
        }
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
  }, [individualLessons, groupLessons, remedialLessons, showAdminView, educationLevels]);

  const adminStudentStats = useMemo<StudentStat[]>(() => {
    if (!showAdminView) return [];
    const map = new Map<number, StudentStat>();

    const ensureEntry = (student: { id: number; full_name?: string | null; education_level?: { name_ar?: string | null } | null; class?: string | null }) => {
      const existing = map.get(student.id);
      if (existing) return existing;
      const entry: StudentStat = {
        studentId: student.id,
        studentName: student.full_name || `طالب ${student.id}`,
        educationLevel: student.education_level?.name_ar || null,
        class: student.class || null,
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
      // Only add group column if the level is not "جامعي" (university level doesn't have group lessons)
      if (level !== 'جامعي') {
        columns.push({
          key: `${level}-group`,
          header: `${level} جماعي`,
          render: (row) => row[`${level}-group`] as string,
        });
      }
    });
    // Add remedial column (it doesn't have education level)
    columns.push({
      key: 'remedial',
      header: 'הוראה מתקנת',
      render: (row) => row['remedial'] as string,
    });
    // Add export column
    columns.push({
      key: 'export',
      header: 'تصدير',
      render: (row) => (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => handleOpenTeacherExportModal(row.teacherId)}
          title="تصدير دروس المعلم"
        >
          📥 CSV
        </Button>
      ),
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

  const handleExportCSV = async () => {
    if (!teacher?.id) return;
    setExportingCSV(true);
    try {
      const dateFilters = getDateFilters(statsYear, statsMonth);
      const base = { ...dateFilters, teacher_id: teacher.id };
      const [indRes, indDelRes, grpRes, grpDelRes, remRes, remDelRes] = await Promise.all([
        api.getIndividualLessons(base),
        api.getIndividualLessons({ ...base, show_deleted: 'true' }),
        api.getGroupLessons(base),
        api.getGroupLessons({ ...base, show_deleted: 'true' }),
        api.getRemedialLessons(base),
        api.getRemedialLessons({ ...base, show_deleted: 'true' }),
      ]);
      const ind = [
        ...(indRes.success && Array.isArray(indRes.data) ? indRes.data : []),
        ...(indDelRes.success && Array.isArray(indDelRes.data) ? indDelRes.data : []),
      ] as IndividualLesson[];
      const grp = [
        ...(grpRes.success && Array.isArray(grpRes.data) ? grpRes.data : []),
        ...(grpDelRes.success && Array.isArray(grpDelRes.data) ? grpDelRes.data : []),
      ] as GroupLesson[];
      const rem = [
        ...(remRes.success && Array.isArray(remRes.data) ? remRes.data : []),
        ...(remDelRes.success && Array.isArray(remDelRes.data) ? remDelRes.data : []),
      ] as RemedialLesson[];
      const seenI = new Set<number>();
      const seenG = new Set<number>();
      const seenR = new Set<number>();
      const individualList = ind.filter((l) => (seenI.has(l.id) ? false : (seenI.add(l.id), true)));
      const groupList = grp.filter((l) => (seenG.has(l.id) ? false : (seenG.add(l.id), true)));
      const remedialList = rem.filter((l) => (seenR.has(l.id) ? false : (seenR.add(l.id), true)));

      const exportData: LessonExportRow[] = [];
      individualList.forEach((l) => {
        exportData.push({
          type: 'درس فردي',
          date: l.date,
          student: l.student?.full_name || 'غير محدد',
          education_level: l.education_level?.name_ar || '',
          hours: Number(l.hours) || 0,
          approved: l.approved ? 'نعم' : 'لا',
          total_cost: l.total_cost ?? undefined,
          deleted: l.deleted_at ? 'نعم' : 'لا',
          deletion_note: l.deletion_note || '',
        });
      });
      groupList.forEach((l) => {
        exportData.push({
          type: 'درس جماعي',
          date: l.date,
          student: l.students?.map((s) => s.full_name).join('، ') || 'غير محدد',
          education_level: l.education_level?.name_ar || '',
          hours: Number(l.hours) || 0,
          approved: l.approved ? 'نعم' : 'لا',
          total_cost: l.total_cost ?? undefined,
          deleted: l.deleted_at ? 'نعم' : 'لا',
          deletion_note: l.deletion_note || '',
        });
      });
      remedialList.forEach((l) => {
        exportData.push({
          type: 'הוראה מתקנת',
          date: l.date,
          student: l.student?.full_name || 'غير محدد',
          education_level: '',
          hours: Number(l.hours) || 0,
          approved: l.approved ? 'نعم' : 'لا',
          total_cost: l.total_cost ?? undefined,
          deleted: l.deleted_at ? 'نعم' : 'لا',
          deletion_note: l.deletion_note || '',
        });
      });
      exportData.sort((a, b) => b.date.localeCompare(a.date));

      if (exportData.length === 0) {
        alert('لا توجد دروس في الفترة المحددة');
        return;
      }
      const teacherName = teacher.full_name?.replace(/\s+/g, '_') || 'teacher';
      const dateStr = formatDateForFilename(new Date());
      const filename = `${teacherName}_lessons_${statsYear}_${statsMonth}_${dateStr}.csv`;
      downloadCSV(exportData, filename);
    } catch (err: any) {
      console.error('Export CSV error:', err);
      alert('حدث خطأ أثناء التصدير: ' + (err.message || 'خطأ غير معروف'));
    } finally {
      setExportingCSV(false);
    }
  };

  const buildSummaryFromLessonLists = (
    individualList: IndividualLesson[],
    groupList: GroupLesson[],
    remedialList: RemedialLesson[]
  ): StudentSummaryRow[] => {
    const map = new Map<number, StudentSummaryRow>();
    const ensure = (id: number, name: string) => {
      let row = map.get(id);
      if (!row) {
        row = {
          studentName: name || `طالب ${id}`,
          individualLessons: 0,
          individualHours: 0,
          groupLessons: 0,
          groupHours: 0,
          remedialLessons: 0,
          remedialHours: 0,
        };
        map.set(id, row);
      }
      return row;
    };
    individualList.forEach((l) => {
      const id = l.student?.id ?? l.student_id;
      const name = l.student?.full_name;
      if (id == null || !name) return;
      const r = ensure(id, name);
      r.individualLessons += 1;
      r.individualHours += Number(l.hours) || 0;
    });
    groupList.forEach((l) => {
      const hours = Number(l.hours) || 0;
      l.students?.forEach((s) => {
        const r = ensure(s.id, s.full_name);
        r.groupLessons += 1;
        r.groupHours += hours;
      });
    });
    remedialList.forEach((l) => {
      const id = l.student?.id ?? l.student_id;
      const name = l.student?.full_name;
      if (id == null || !name) return;
      const r = ensure(id, name);
      r.remedialLessons += 1;
      r.remedialHours += Number(l.hours) || 0;
    });
    return Array.from(map.values()).sort((a, b) => a.studentName.localeCompare(b.studentName, 'ar'));
  };

  const buildLessonsExportRows = (
    individualList: IndividualLesson[],
    groupList: GroupLesson[],
    remedialList: RemedialLesson[],
    searchFilter?: string
  ): LessonExportRow[] => {
    const match = (name: string | undefined) =>
      !searchFilter || (name || '').toLowerCase().includes(searchFilter.toLowerCase());
    const rows: LessonExportRow[] = [];
    individualList.forEach((l) => {
      rows.push({
        type: 'درس فردي',
        date: l.date,
        student: l.student?.full_name || 'غير محدد',
        education_level: l.education_level?.name_ar || '',
        hours: Number(l.hours) || 0,
        approved: l.approved ? 'نعم' : 'لا',
        total_cost: l.total_cost ?? undefined,
        deleted: l.deleted_at ? 'نعم' : 'لا',
        deletion_note: l.deletion_note || '',
      });
    });
    groupList.forEach((l) => {
      const studentNames = searchFilter
        ? l.students?.filter((s) => match(s.full_name)).map((s) => s.full_name).join('، ') || 'غير محدد'
        : l.students?.map((s) => s.full_name).join('، ') || 'غير محدد';
      rows.push({
        type: 'درس جماعي',
        date: l.date,
        student: studentNames,
        education_level: l.education_level?.name_ar || '',
        hours: Number(l.hours) || 0,
        approved: l.approved ? 'نعم' : 'لا',
        total_cost: l.total_cost ?? undefined,
        deleted: l.deleted_at ? 'نعم' : 'لا',
        deletion_note: l.deletion_note || '',
      });
    });
    remedialList.forEach((l) => {
      rows.push({
        type: 'הוראה מתקנת',
        date: l.date,
        student: l.student?.full_name || 'غير محدد',
        education_level: '',
        hours: Number(l.hours) || 0,
        approved: l.approved ? 'نعم' : 'لا',
        total_cost: l.total_cost ?? undefined,
        deleted: l.deleted_at ? 'نعم' : 'لا',
        deletion_note: l.deletion_note || '',
      });
    });
    return rows.sort((a, b) => b.date.localeCompare(a.date));
  };

  const fetchAllLessonsForPeriod = async () => {
    const dateFilters = getDateFilters(statsYear, statsMonth);
    const base = { ...dateFilters };
    const [indRes, indDelRes, grpRes, grpDelRes, remRes, remDelRes] = await Promise.all([
      api.getIndividualLessons(base),
      api.getIndividualLessons({ ...base, show_deleted: 'true' }),
      api.getGroupLessons(base),
      api.getGroupLessons({ ...base, show_deleted: 'true' }),
      api.getRemedialLessons(base),
      api.getRemedialLessons({ ...base, show_deleted: 'true' }),
    ]);
    const ind = [
      ...(indRes.success && Array.isArray(indRes.data) ? indRes.data : []),
      ...(indDelRes.success && Array.isArray(indDelRes.data) ? indDelRes.data : []),
    ] as IndividualLesson[];
    const grp = [
      ...(grpRes.success && Array.isArray(grpRes.data) ? grpRes.data : []),
      ...(grpDelRes.success && Array.isArray(grpDelRes.data) ? grpDelRes.data : []),
    ] as GroupLesson[];
    const rem = [
      ...(remRes.success && Array.isArray(remRes.data) ? remRes.data : []),
      ...(remDelRes.success && Array.isArray(remDelRes.data) ? remDelRes.data : []),
    ] as RemedialLesson[];
    const seenI = new Set<number>();
    const seenG = new Set<number>();
    const seenR = new Set<number>();
    return {
      individualList: ind.filter((l) => (seenI.has(l.id) ? false : (seenI.add(l.id), true))),
      groupList: grp.filter((l) => (seenG.has(l.id) ? false : (seenG.add(l.id), true))),
      remedialList: rem.filter((l) => (seenR.has(l.id) ? false : (seenR.add(l.id), true))),
    };
  };

  const handleExportAllLessonsCSV = async () => {
    setExportingAllLessonsCSV(true);
    try {
      const { individualList, groupList, remedialList } = await fetchAllLessonsForPeriod();
      const exportData = buildLessonsExportRows(individualList, groupList, remedialList);
      if (exportData.length === 0) {
        alert('لا توجد دروس في الفترة المحددة');
        return;
      }
      const summaryRows = buildSummaryFromLessonLists(individualList, groupList, remedialList);
      const monthName = statsMonths.find((m) => m.value === statsMonth)?.label || statsMonth;
      downloadCSVWithSummary(exportData, summaryRows, `دروس_كل_الفترة_${statsYear}_${monthName}.csv`, formatHours);
    } catch (err: any) {
      console.error('Export all lessons CSV error:', err);
      alert('حدث خطأ أثناء التصدير: ' + (err.message || 'خطأ غير معروف'));
    } finally {
      setExportingAllLessonsCSV(false);
    }
  };

  const handleExportFilteredLessonsCSV = async () => {
    const search = adminSearch.trim().toLowerCase();
    if (!search) {
      alert('أدخل نص البحث (معلم أو طالب) ثم اضغط التصدير');
      return;
    }
    setExportingFilteredLessonsCSV(true);
    try {
      const { individualList, groupList, remedialList } = await fetchAllLessonsForPeriod();
      const match = (name: string | undefined) => (name || '').toLowerCase().includes(search);
      const filteredInd = individualList.filter(
        (l) => match(l.teacher?.full_name) || match(l.student?.full_name)
      );
      const filteredGrp = groupList.filter(
        (l) =>
          match(l.teacher?.full_name) ||
          l.students?.some((s) => match(s.full_name))
      );
      const filteredRem = remedialList.filter(
        (l) => match(l.teacher?.full_name) || match(l.student?.full_name)
      );
      const exportData = buildLessonsExportRows(filteredInd, filteredGrp, filteredRem, search);
      if (exportData.length === 0) {
        alert('لا توجد دروس مطابقة للبحث في الفترة المحددة');
        return;
      }
      const allSummaryRows = buildSummaryFromLessonLists(filteredInd, filteredGrp, filteredRem);
      const summaryRows = allSummaryRows.filter((r) => r.studentName.toLowerCase().includes(search));
      const monthName = statsMonths.find((m) => m.value === statsMonth)?.label || statsMonth;
      const safeSearch = search.replace(/[^\w\u0600-\u06FF]/g, '_').slice(0, 30);
      downloadCSVWithSummary(exportData, summaryRows, `دروس_حسب_البحث_${statsYear}_${monthName}_${safeSearch}.csv`, formatHours);
    } catch (err: any) {
      console.error('Export filtered lessons CSV error:', err);
      alert('حدث خطأ أثناء التصدير: ' + (err.message || 'خطأ غير معروف'));
    } finally {
      setExportingFilteredLessonsCSV(false);
    }
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

  const handleOpenTeacherExportModal = (teacherId: number | null) => {
    setSelectedTeacherForExport(teacherId);
    setExportTeacherYear(new Date().getFullYear());
    setExportTeacherMonth(String(new Date().getMonth() + 1).padStart(2, '0'));
    setTeacherExportModalOpen(true);
  };

  const handleExportTeacherLessonsCSV = async () => {
    if (!selectedTeacherForExport) {
      alert('يرجى اختيار معلم');
      return;
    }

    setExportingTeacherCSV(true);
    try {
      const monthStart = getFirstDayOfMonth(exportTeacherYear, parseInt(exportTeacherMonth));
      const monthEnd = getLastDayOfMonth(exportTeacherYear, parseInt(exportTeacherMonth));

      // Fetch all lessons for this teacher in the selected month
      // Include both approved/not approved and deleted/non-deleted
      const [individualRes, individualDeletedRes, groupRes, groupDeletedRes, remedialRes, remedialDeletedRes] = await Promise.all([
        // Non-deleted lessons (approved + not approved)
        api.getIndividualLessons({
          teacher_id: selectedTeacherForExport,
          date_from: monthStart,
          date_to: monthEnd,
        }),
        // Deleted lessons (approved + not approved)
        api.getIndividualLessons({
          teacher_id: selectedTeacherForExport,
          date_from: monthStart,
          date_to: monthEnd,
          show_deleted: 'true',
        }),
        // Non-deleted group lessons
        api.getGroupLessons({
          teacher_id: selectedTeacherForExport,
          date_from: monthStart,
          date_to: monthEnd,
        }),
        // Deleted group lessons
        api.getGroupLessons({
          teacher_id: selectedTeacherForExport,
          date_from: monthStart,
          date_to: monthEnd,
          show_deleted: 'true',
        }),
        // Non-deleted remedial lessons
        api.getRemedialLessons({
          teacher_id: selectedTeacherForExport,
          date_from: monthStart,
          date_to: monthEnd,
        }),
        // Deleted remedial lessons
        api.getRemedialLessons({
          teacher_id: selectedTeacherForExport,
          date_from: monthStart,
          date_to: monthEnd,
          show_deleted: 'true',
        }),
      ]);

      // Combine all lessons
      const allIndividualLessons = [
        ...(individualRes.success && Array.isArray(individualRes.data) ? individualRes.data : []),
        ...(individualDeletedRes.success && Array.isArray(individualDeletedRes.data) ? individualDeletedRes.data : []),
      ] as IndividualLesson[];

      const allGroupLessons = [
        ...(groupRes.success && Array.isArray(groupRes.data) ? groupRes.data : []),
        ...(groupDeletedRes.success && Array.isArray(groupDeletedRes.data) ? groupDeletedRes.data : []),
      ] as GroupLesson[];

      const allRemedialLessons = [
        ...(remedialRes.success && Array.isArray(remedialRes.data) ? remedialRes.data : []),
        ...(remedialDeletedRes.success && Array.isArray(remedialDeletedRes.data) ? remedialDeletedRes.data : []),
      ] as RemedialLesson[];

      // Prepare export data
      const exportData: any[] = [];

      // Individual lessons
      allIndividualLessons.forEach((lesson) => {
        exportData.push({
          type: 'درس فردي',
          date: lesson.date,
          start_time: lesson.start_time || '',
          student: lesson.student?.full_name || 'غير محدد',
          education_level: lesson.education_level?.name_ar || '',
          hours: Number(lesson.hours) || 0,
          approved: lesson.approved ? 'نعم' : 'لا',
          deleted: lesson.deleted_at ? 'نعم' : 'لا',
          deletion_note: lesson.deletion_note || '',
        });
      });

      // Group lessons
      allGroupLessons.forEach((lesson) => {
        const students = lesson.students?.map((s) => s.full_name).join('، ') || 'غير محدد';
        exportData.push({
          type: 'درس جماعي',
          date: lesson.date,
          start_time: lesson.start_time || '',
          student: students,
          education_level: lesson.education_level?.name_ar || '',
          hours: Number(lesson.hours) || 0,
          approved: lesson.approved ? 'نعم' : 'لا',
          deleted: lesson.deleted_at ? 'نعم' : 'لا',
          deletion_note: lesson.deletion_note || '',
        });
      });

      // Remedial lessons
      allRemedialLessons.forEach((lesson) => {
        exportData.push({
          type: 'הוראה מתקנת',
          date: lesson.date,
          start_time: lesson.start_time || '',
          student: lesson.student?.full_name || 'غير محدد',
          education_level: '',
          hours: Number(lesson.hours) || 0,
          approved: lesson.approved ? 'نعم' : 'لا',
          deleted: lesson.deleted_at ? 'نعم' : 'لا',
          deletion_note: lesson.deletion_note || '',
        });
      });

      if (exportData.length === 0) {
        alert('لا توجد دروس لهذا المعلم في هذا الشهر');
        setExportingTeacherCSV(false);
        return;
      }

      // Sort by date descending
      exportData.sort((a, b) => b.date.localeCompare(a.date));

      // Create CSV with headers
      const headers = ['النوع', 'التاريخ', 'وقت البدء', 'الطالب/الطلاب', 'المستوى التعليمي', 'الساعات', 'معتمد', 'محذوف', 'ملاحظة الحذف'];
      const rows = exportData.map((row) => [
        row.type,
        row.date,
        row.start_time,
        row.student,
        row.education_level,
        row.hours.toString(),
        row.approved,
        row.deleted,
        row.deletion_note,
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

      const teacher = teachers.find((t) => t.id === selectedTeacherForExport);
      const teacherName = teacher?.full_name?.replace(/\s+/g, '_').replace(/[^\w\u0600-\u06FF]/g, '') || 'teacher';
      const monthName = statsMonths.find((m) => m.value === exportTeacherMonth)?.label || exportTeacherMonth;
      const filename = `${teacherName}_lessons_${exportTeacherYear}_${exportTeacherMonth}_${monthName}.csv`;
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setTeacherExportModalOpen(false);
      alert(`تم تصدير ${exportData.length} درس بنجاح`);
    } catch (err: any) {
      console.error('Error exporting teacher lessons:', err);
      alert('حدث خطأ أثناء تصدير الدروس: ' + (err.message || 'خطأ غير معروف'));
    } finally {
      setExportingTeacherCSV(false);
    }
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
        key: 'educationLevelAndClass',
        header: 'المستوى/الصف',
        render: (row) => {
          const level = row.educationLevel || '';
          const class_ = row.class || '';
          if (level && class_) {
            return `${level} - ${class_}`;
          } else if (level) {
            return level;
          } else if (class_) {
            return class_;
          }
          return '-';
        },
      },
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
              متابعة أداء المعلمين والطلاب للفترة المحددة. <strong>الدروس المعتمدة فقط.</strong>
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
            <Button
              onClick={handleExportAllLessonsCSV}
              variant="secondary"
              disabled={exportingAllLessonsCSV}
              isLoading={exportingAllLessonsCSV}
            >
              {exportingAllLessonsCSV ? 'جاري التصدير...' : 'كل الدروس (الفترة)'}
            </Button>
            <Button
              onClick={handleExportFilteredLessonsCSV}
              variant="secondary"
              disabled={exportingFilteredLessonsCSV || !adminSearch.trim()}
              isLoading={exportingFilteredLessonsCSV}
            >
              {exportingFilteredLessonsCSV ? 'جاري التصدير...' : 'دروس البحث فقط'}
            </Button>
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
              title="تصدير ملخص الطلاب (CSV)"
              aria-label="تصدير ملخص الطلاب"
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

        <Modal
          open={teacherExportModalOpen}
          onClose={() => setTeacherExportModalOpen(false)}
          ariaLabel="تصدير دروس المعلم"
        >
          <Card title={`تصدير دروس ${selectedTeacherForExport ? teachers.find(t => t.id === selectedTeacherForExport)?.full_name || 'المعلم' : 'المعلم'}`}>
            <div className="space-y-4">
              {selectedTeacherForExport && (
                <div className="p-3 bg-gray-50 rounded border">
                  <p className="text-sm text-gray-600">المعلم المحدد:</p>
                  <p className="font-semibold text-gray-900">{teachers.find(t => t.id === selectedTeacherForExport)?.full_name || 'غير محدد'}</p>
                </div>
              )}
              {!selectedTeacherForExport && (
                <Select
                  label="اختر المعلم"
                  value={selectedTeacherForExport?.toString() || ''}
                  onChange={(e) => setSelectedTeacherForExport(e.target.value ? parseInt(e.target.value, 10) : null)}
                  options={[
                    { value: '', label: 'اختر معلم' },
                    ...teachers.map((t) => ({
                      value: t.id.toString(),
                      label: t.full_name,
                    })),
                  ]}
                  required
                />
              )}
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="السنة"
                  value={exportTeacherYear.toString()}
                  onChange={(e) => setExportTeacherYear(Number(e.target.value))}
                  options={[2024, 2025, 2026, 2027, 2028].map((year) => ({
                    value: year.toString(),
                    label: year.toString(),
                  }))}
                />
                <Select
                  label="الشهر"
                  value={exportTeacherMonth}
                  onChange={(e) => setExportTeacherMonth(e.target.value)}
                  options={statsMonths}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setTeacherExportModalOpen(false);
                    setSelectedTeacherForExport(null);
                  }}
                  disabled={exportingTeacherCSV}
                >
                  إلغاء
                </Button>
                <Button
                  onClick={handleExportTeacherLessonsCSV}
                  disabled={!selectedTeacherForExport || exportingTeacherCSV}
                  isLoading={exportingTeacherCSV}
                >
                  {exportingTeacherCSV ? 'جاري التصدير...' : 'تحميل CSV'}
                </Button>
              </div>
            </div>
          </Card>
        </Modal>
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
              مرحبًا {teacher.full_name}، إليك ملخص أدائك خلال الفترة المحددة. <strong>الدروس المعتمدة فقط.</strong>
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
            disabled={exportingCSV}
            isLoading={exportingCSV}
          >
            {exportingCSV ? 'جاري التصدير...' : 'تصدير CSV (جميع الدروس)'}
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
