/**
 * GET /api/special-lesson-notes - Get all special lesson notes
 * POST /api/special-lesson-notes - Create new special lesson note
 */

import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/utils/get-user-from-request';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/utils/api-response';

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacher_id') ? parseInt(searchParams.get('teacher_id')!, 10) : undefined;
    const isRead = searchParams.get('is_read');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');

    let query = supabaseAdmin
      .from('special_lesson_notes')
      .select(`
        *,
        teacher:teachers(id, full_name, phone),
        education_level:education_levels(id, name_ar, name_en)
      `)
      .order('created_at', { ascending: false });

    // Teachers can only see their own notes
    if (user.role === 'teacher') {
      const { data: teacher } = await supabaseAdmin
        .from('teachers')
        .select('id')
        .eq('user_id', user.userId)
        .single();
      
      if (teacher) {
        query = query.eq('teacher_id', teacher.id);
      } else {
        return successResponse([]);
      }
    } else if (teacherId) {
      // Admin can filter by teacher
      query = query.eq('teacher_id', teacherId);
    }

    // Filter by read status (admin only)
    if (user.role === 'admin' && isRead !== null) {
      if (isRead === 'true') {
        query = query.eq('is_read', true);
      } else if (isRead === 'false') {
        query = query.eq('is_read', false);
      }
    }

    // Filter by date range
    if (dateFrom) {
      query = query.gte('date', dateFrom);
    }
    if (dateTo) {
      query = query.lte('date', dateTo);
    }

    const { data: notes, error } = await query;

    if (error) {
      console.error('Error fetching special lesson notes:', error);
      return errorResponse('Failed to fetch special lesson notes');
    }

    // Fetch students for each note
    if (notes && notes.length > 0) {
      const studentIds = new Set<number>();
      notes.forEach((note: any) => {
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

        // Attach students to each note
        notes.forEach((note: any) => {
          note.students = (note.student_ids || [])
            .map((id: number) => studentsMap.get(id))
            .filter(Boolean);
        });
      }
    }

    // Fetch read_by user info if exists
    const readByUserIds = new Set<number>();
    notes?.forEach((note: any) => {
      if (note.read_by) {
        readByUserIds.add(note.read_by);
      }
    });

    if (readByUserIds.size > 0) {
      const { data: users } = await supabaseAdmin
        .from('users')
        .select('id, username')
        .in('id', Array.from(readByUserIds));

      const usersMap = new Map((users || []).map((u: any) => [u.id, u]));

      notes?.forEach((note: any) => {
        if (note.read_by) {
          note.read_by_user = usersMap.get(note.read_by);
        }
      });
    }

    return successResponse(notes || []);
  } catch (error) {
    console.error('Get special lesson notes error:', error);
    return errorResponse('An error occurred while fetching special lesson notes');
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return unauthorizedResponse();
    }

    // Only teachers can create special lesson notes
    if (user.role !== 'teacher') {
      return unauthorizedResponse('Only teachers can create special lesson notes');
    }

    // Get teacher ID
    const { data: teacher } = await supabaseAdmin
      .from('teachers')
      .select('id')
      .eq('user_id', user.userId)
      .single();

    if (!teacher) {
      return errorResponse('Teacher not found');
    }

    const body = await request.json();
    const { date, start_time, hours, education_level_id, class: className, student_ids, teacher_note } = body;

    // Validate required fields
    if (!date || !student_ids || !Array.isArray(student_ids) || student_ids.length === 0 || !teacher_note) {
      return errorResponse('جميع الحقول إلزامية: التاريخ، الطلاب، والملاحظة');
    }

    // Validate student_ids are numbers
    if (!student_ids.every((id: any) => typeof id === 'number' && id > 0)) {
      return errorResponse('معرفات الطلاب غير صحيحة');
    }

    const { data: note, error } = await supabaseAdmin
      .from('special_lesson_notes')
      .insert({
        teacher_id: teacher.id,
        date,
        start_time: start_time || null,
        hours: hours || null,
        education_level_id: education_level_id || null,
        class: className || null,
        student_ids,
        teacher_note: teacher_note.trim(),
        is_read: false,
      })
      .select()
      .single();

    if (error || !note) {
      console.error('Error creating special lesson note:', error);
      return errorResponse('فشل إنشاء ملاحظة الدرس الخاص');
    }

    // Fetch related data
    const { data: noteWithRelations } = await supabaseAdmin
      .from('special_lesson_notes')
      .select(`
        *,
        teacher:teachers(id, full_name, phone),
        education_level:education_levels(id, name_ar, name_en)
      `)
      .eq('id', note.id)
      .single();

    // Fetch students
    const { data: students } = await supabaseAdmin
      .from('students')
      .select('id, full_name, class, education_level_id')
      .in('id', student_ids);

    const result = {
      ...noteWithRelations,
      students: students || [],
    };

    return successResponse(result, 'تم إنشاء ملاحظة الدرس الخاص بنجاح');
  } catch (error) {
    console.error('Create special lesson note error:', error);
    return errorResponse('حدث خطأ أثناء إنشاء ملاحظة الدرس الخاص');
  }
}

