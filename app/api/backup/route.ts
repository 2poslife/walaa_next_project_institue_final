/**
 * GET /api/backup - Export full backup as CSV (admin only)
 * Optional: ?gzip=1 returns application/gzip (same data, smaller file).
 */

import { NextRequest, NextResponse } from 'next/server';
import { gzipSync } from 'zlib';
import { supabaseAdmin } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/utils/get-user-from-request';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/utils/api-response';

function escapeCsvCell(val: string | number | boolean | null | undefined): string {
  if (val === null || val === undefined) return '';
  const s = String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function csvRow(cells: (string | number | boolean | null | undefined)[]): string {
  return cells.map(escapeCsvCell).join(',');
}

function normalizeGroupLesson(lesson: any) {
  return {
    ...lesson,
    students: (lesson.students || []).map((entry: any) => entry.student).filter(Boolean),
  };
}

function levelName(edu: any): string {
  if (!edu) return '';
  return (edu.name_ar || edu.name_en || '') as string;
}

function backupDumpFilenameGz(now: Date = new Date()): string {
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yy = String(now.getFullYear()).slice(-2);
  return `dump${dd}${mm}${yy}.csv.gz`;
}

const PAGE_SIZE = 1000;

async function fetchAll<T>(
  table: string,
  select: string,
  orderBy: string,
  ascending: boolean
): Promise<{ data: T[]; error: any }> {
  const all: T[] = [];
  let from = 0;
  let hasMore = true;
  while (hasMore) {
    const to = from + PAGE_SIZE - 1;
    const q = supabaseAdmin
      .from(table)
      .select(select)
      .order(orderBy, { ascending })
      .range(from, to);
    const { data, error } = await q;
    if (error) return { data: [], error };
    const chunk = (data || []) as T[];
    all.push(...chunk);
    hasMore = chunk.length === PAGE_SIZE;
    from += PAGE_SIZE;
  }
  return { data: all, error: null };
}

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user || (user.role !== 'admin' && user.role !== 'subAdmin')) {
      return unauthorizedResponse('Admin access required');
    }

    const wantGzip = request.nextUrl.searchParams.get('gzip') === '1';

    const individualSelect = `
        *,
        teacher:teachers(id, full_name, phone),
        student:students(id, full_name, parent_contact, education_level_id, class, education_level:education_levels(id, name_ar, name_en)),
        education_level:education_levels(id, name_ar, name_en)
      `;
    const groupSelect = `
        *,
        teacher:teachers(id, full_name, phone),
        education_level:education_levels(id, name_ar, name_en),
        students:group_lesson_students(
          student:students(id, full_name, parent_contact, class, education_level:education_levels(id, name_ar, name_en))
        )
      `;
    const remedialSelect = `
        *,
        teacher:teachers(id, full_name, phone),
        student:students(id, full_name, parent_contact, class, education_level:education_levels(id, name_ar, name_en))
      `;
    const paymentSelect = `*, student:students(id, full_name, parent_contact)`;
    const notesSelect = `*, teacher:teachers(id, full_name, phone), education_level:education_levels(id, name_ar, name_en)`;

    const { data: individualLessons, error: errInd } = await fetchAll<any>(
      'individual_lessons',
      individualSelect,
      'created_at',
      true
    );
    if (errInd) {
      console.error('Backup individual_lessons error:', errInd);
      return errorResponse('Failed to export individual lessons');
    }

    const { data: groupLessonsRaw, error: errGrp } = await fetchAll<any>(
      'group_lessons',
      groupSelect,
      'created_at',
      true
    );
    if (errGrp) {
      console.error('Backup group_lessons error:', errGrp);
      return errorResponse('Failed to export group lessons');
    }
    const groupLessons = (groupLessonsRaw || []).map(normalizeGroupLesson);

    const { data: remedialLessons, error: errRem } = await fetchAll<any>(
      'remedial_lessons',
      remedialSelect,
      'created_at',
      true
    );
    if (errRem) {
      console.error('Backup remedial_lessons error:', errRem);
      return errorResponse('Failed to export remedial lessons');
    }

    const { data: payments, error: errPay } = await fetchAll<any>(
      'payments',
      paymentSelect,
      'created_at',
      true
    );
    if (errPay) {
      console.error('Backup payments error:', errPay);
      return errorResponse('Failed to export payments');
    }

    const { data: notes, error: errNotes } = await fetchAll<any>(
      'special_lesson_notes',
      notesSelect,
      'created_at',
      true
    );
    if (errNotes) {
      console.error('Backup special_lesson_notes error:', errNotes);
      return errorResponse('Failed to export special lesson notes');
    }

    const notesWithStudents = notes || [];
    if (notesWithStudents.length > 0) {
      const studentIds = new Set<number>();
      notesWithStudents.forEach((note: any) => {
        if (note.student_ids && Array.isArray(note.student_ids)) {
          note.student_ids.forEach((id: number) => studentIds.add(id));
        }
      });
      if (studentIds.size > 0) {
        const { data: students } = await supabaseAdmin
          .from('students')
          .select('id, full_name, class, education_level_id')
          .in('id', Array.from(studentIds));
        const studentsMap = new Map((students || []).map((s: any) => [s.id, s]));
        notesWithStudents.forEach((note: any) => {
          note.students = (note.student_ids || []).map((id: number) => studentsMap.get(id)).filter(Boolean);
        });
      }
    }

    const lessonHeaders = [
      'نوع الدرس',
      'التاريخ',
      'وقت البداية',
      'الساعات',
      'المعلم',
      'الطلاب',
      'المستوى التعليمي',
      'معتمد',
      'محذوف',
      'ملاحظة الحذف',
      'التكلفة',
      'تاريخ الإنشاء',
    ];
    const paymentHeaders = ['تاريخ الدفع', 'الطالب', 'المبلغ', 'ملاحظة', 'تاريخ الإنشاء'];
    const noteHeaders = ['التاريخ', 'المعلم', 'الطلاب', 'المستوى', 'ملاحظة المعلم', 'ملاحظة الإدارة', 'مقروء', 'تاريخ الإنشاء'];

    const lessonRows: string[] = [csvRow(lessonHeaders)];
    const toYesNo = (v: boolean | null | undefined) => (v ? 'نعم' : 'لا');

    (individualLessons || []).forEach((row: any) => {
      const teacherName = row.teacher?.full_name ?? '';
      const studentName = row.student?.full_name ?? '';
      const level = levelName(row.education_level);
      lessonRows.push(
        csvRow([
          'فردي',
          row.date ?? '',
          row.start_time ?? '',
          row.hours ?? '',
          teacherName,
          studentName,
          level,
          toYesNo(row.approved),
          row.deleted_at ? 'نعم' : 'لا',
          row.deletion_note ?? '',
          row.total_cost ?? '',
          row.created_at ?? '',
        ])
      );
    });

    groupLessons.forEach((row: any) => {
      const teacherName = row.teacher?.full_name ?? '';
      const studentNames = (row.students || []).map((s: any) => s?.full_name).filter(Boolean).join(', ');
      const level = levelName(row.education_level);
      lessonRows.push(
        csvRow([
          'جماعي',
          row.date ?? '',
          row.start_time ?? '',
          row.hours ?? '',
          teacherName,
          studentNames,
          level,
          toYesNo(row.approved),
          row.deleted_at ? 'نعم' : 'لا',
          row.deletion_note ?? '',
          row.total_cost ?? '',
          row.created_at ?? '',
        ])
      );
    });

    (remedialLessons || []).forEach((row: any) => {
      const teacherName = row.teacher?.full_name ?? '';
      const studentName = row.student?.full_name ?? '';
      const level = levelName(row.student?.education_level);
      lessonRows.push(
        csvRow([
          'علاجي',
          row.date ?? '',
          row.start_time ?? '',
          row.hours ?? '',
          teacherName,
          studentName,
          level,
          toYesNo(row.approved),
          row.deleted_at ? 'نعم' : 'لا',
          row.deletion_note ?? '',
          row.total_cost ?? '',
          row.created_at ?? '',
        ])
      );
    });

    const paymentRows: string[] = [csvRow(paymentHeaders)];
    (payments || []).forEach((row: any) => {
      const studentName = row.student?.full_name ?? '';
      paymentRows.push(
        csvRow([row.payment_date ?? '', studentName, row.amount ?? '', row.note ?? '', row.created_at ?? ''])
      );
    });

    const noteRows: string[] = [csvRow(noteHeaders)];
    notesWithStudents.forEach((row: any) => {
      const teacherName = row.teacher?.full_name ?? '';
      const studentNames = (row.students || []).map((s: any) => s?.full_name).filter(Boolean).join(', ');
      const level = levelName(row.education_level);
      noteRows.push(
        csvRow([
          row.date ?? '',
          teacherName,
          studentNames,
          level,
          row.teacher_note ?? '',
          row.admin_note ?? '',
          row.is_read ? 'نعم' : 'لا',
          row.created_at ?? '',
        ])
      );
    });

    const sections = [
      ['الدروس', lessonRows.join('\r\n')],
      ['المدفوعات', paymentRows.join('\r\n')],
      ['ملاحظات الدروس الخاصة', noteRows.join('\r\n')],
    ];
    const fullCsv = sections.map(([title, body]) => title + '\r\n' + body).join('\r\n\r\n');
    const withBom = '\uFEFF' + fullCsv;

    if (wantGzip) {
      const buf = gzipSync(Buffer.from(withBom, 'utf8'));
      const name = backupDumpFilenameGz();
      return new NextResponse(buf, {
        status: 200,
        headers: {
          'Content-Type': 'application/gzip',
          'Content-Disposition': `attachment; filename="${name}"`,
          'Cache-Control': 'no-store',
        },
      });
    }

    return successResponse({ csv: withBom });
  } catch (error) {
    console.error('Backup export error:', error);
    return errorResponse('An error occurred while creating the backup');
  }
}
