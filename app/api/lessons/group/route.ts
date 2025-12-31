import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/utils/get-user-from-request';
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
} from '@/lib/utils/api-response';
import { LessonFilters } from '@/types';

async function getTeacherIdForUser(userId: number) {
  const { data: teacher } = await supabaseAdmin
    .from('teachers')
    .select('id')
    .eq('user_id', userId)
    .single();
  return teacher?.id;
}

function normalizeGroupLesson(lesson: any) {
  return {
    ...lesson,
    students: (lesson.students || [])
      .map((entry: any) => entry.student)
      .filter(Boolean),
  };
}

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const filters: LessonFilters = {
      date_from: searchParams.get('date_from') || undefined,
      date_to: searchParams.get('date_to') || undefined,
      teacher_id: searchParams.get('teacher_id')
        ? parseInt(searchParams.get('teacher_id')!)
        : undefined,
      education_level_id: searchParams.get('education_level_id')
        ? parseInt(searchParams.get('education_level_id')!)
        : undefined,
      approved:
        searchParams.get('approved') === 'true'
          ? true
          : searchParams.get('approved') === 'false'
          ? false
          : undefined,
    };

    let query = supabaseAdmin
      .from('group_lessons')
      .select(
        `
        *,
        teacher:teachers(id, full_name),
        education_level:education_levels(id, name_ar, name_en),
        students:group_lesson_students(
          student:students(id, full_name, parent_contact)
        )
      `
      );

    if (filters.date_from) query = query.gte('date', filters.date_from);
    if (filters.date_to) query = query.lte('date', filters.date_to);
    if (filters.teacher_id) query = query.eq('teacher_id', filters.teacher_id);
    if (filters.education_level_id)
      query = query.eq('education_level_id', filters.education_level_id);
    if (filters.approved !== undefined)
      query = query.eq('approved', filters.approved);

    // Handle deleted filter - if not explicitly requesting deleted, exclude them
    const showDeleted = searchParams.get('show_deleted') === 'true';
    if (!showDeleted) {
      query = query.is('deleted_at', null);
    } else {
      query = query.not('deleted_at', 'is', null);
    }

    if (user.role === 'teacher') {
      const teacherId = await getTeacherIdForUser(user.userId);
      if (teacherId) {
        query = query.eq('teacher_id', teacherId);
      }
    }

    const { data: lessons, error } = await query.order('date', {
      ascending: false,
    });

    if (error) {
      return errorResponse('Failed to fetch group lessons');
    }

    return successResponse((lessons || []).map(normalizeGroupLesson));
  } catch (error) {
    console.error('Get group lessons error:', error);
    return errorResponse('An error occurred while fetching group lessons');
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const { teacher_id, education_level_id, date, start_time, hours, student_ids } = body;

    if (
      !teacher_id ||
      !education_level_id ||
      !date ||
      !start_time ||
      !hours ||
      !Array.isArray(student_ids)
    ) {
      return errorResponse('All fields are required');
    }

    const uniqueStudentIds = Array.from(new Set(student_ids.map(Number))).filter(
      Boolean
    );

    if (uniqueStudentIds.length < 2) {
      return errorResponse('Group lessons require at least two students');
    }

    if (user.role === 'teacher') {
      const teacherId = await getTeacherIdForUser(user.userId);
      if (!teacherId || teacherId !== teacher_id) {
        return unauthorizedResponse('You can only create lessons for yourself');
      }
    }

    const { data: pricing } = await supabaseAdmin
      .from('pricing')
      .select('price_per_hour')
      .eq('education_level_id', education_level_id)
      .eq('lesson_type', 'group')
      .single();

    const total_cost = pricing
      ? parseFloat((pricing.price_per_hour * hours).toFixed(2))
      : null;

    const { data: lesson, error: lessonError } = await supabaseAdmin
      .from('group_lessons')
      .insert({
        teacher_id,
        education_level_id,
        date,
        start_time: start_time || null,
        hours,
        approved: false,
        total_cost,
      })
      .select()
      .single();

    if (lessonError || !lesson) {
      return errorResponse('Failed to create group lesson');
    }

    const attendance = uniqueStudentIds.map((studentId) => ({
      group_lesson_id: lesson.id,
      student_id: studentId,
    }));

    const { error: attendanceError } = await supabaseAdmin
      .from('group_lesson_students')
      .insert(attendance);

    if (attendanceError) {
      return errorResponse('Failed to register students for lesson');
    }

    const { data: fullLesson } = await supabaseAdmin
      .from('group_lessons')
      .select(
        `
        *,
        teacher:teachers(id, full_name),
        education_level:education_levels(id, name_ar, name_en),
        students:group_lesson_students(
          student:students(id, full_name, parent_contact)
        )
      `
      )
      .eq('id', lesson.id)
      .single();

    return successResponse(
      normalizeGroupLesson(fullLesson),
      'Group lesson created successfully'
    );
  } catch (error) {
    console.error('Create group lesson error:', error);
    return errorResponse('An error occurred while creating group lesson');
  }
}


