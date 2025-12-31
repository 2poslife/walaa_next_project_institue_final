import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/utils/get-user-from-request';
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  notFoundResponse,
} from '@/lib/utils/api-response';

async function getTeacherIdForUser(userId: number) {
  const { data: teacher } = await supabaseAdmin
    .from('teachers')
    .select('id')
    .eq('user_id', userId)
    .single();
  return teacher?.id;
}

function normalizeLesson(lesson: any) {
  return {
    ...lesson,
    students: (lesson.students || [])
      .map((entry: any) => entry.student)
      .filter(Boolean),
  };
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const lessonId = parseInt(params.id, 10);
    const body = await request.json();
    const { education_level_id, date, start_time, hours, student_ids } = body;

    const { data: lesson, error: lessonError } = await supabaseAdmin
      .from('group_lessons')
      .select('*')
      .eq('id', lessonId)
      .single();

    if (lessonError || !lesson) {
      return notFoundResponse('Lesson not found');
    }

    // Cannot update deleted lessons
    if (lesson.deleted_at) {
      return errorResponse('Cannot update deleted lessons');
    }

    if (lesson.approved) {
      return errorResponse('Cannot update approved lessons');
    }

    if (user.role === 'teacher') {
      const teacherId = await getTeacherIdForUser(user.userId);
      if (!teacherId || teacherId !== lesson.teacher_id) {
        return unauthorizedResponse('You can only update your own lessons');
      }
    }

    const uniqueStudentIds = Array.isArray(student_ids)
      ? Array.from(new Set(student_ids.map(Number))).filter(Boolean)
      : [];

    if (uniqueStudentIds.length < 2) {
      return errorResponse('Group lessons require at least two students');
    }

    // Check if price is locked - if so, don't recalculate cost
    const isPriceLocked = lesson.price_locked === true;
    const lessonHours = hours || lesson.hours;
    
    // Only recalculate cost if price is NOT locked
    let total_cost = lesson.total_cost; // Keep existing cost if locked
    if (!isPriceLocked) {
      const { data: pricing } = await supabaseAdmin
        .from('pricing')
        .select('price_per_hour')
        .eq(
          'education_level_id',
          education_level_id || lesson.education_level_id
        )
        .eq('lesson_type', 'group')
        .single();

      total_cost = pricing
        ? parseFloat((pricing.price_per_hour * lessonHours).toFixed(2))
        : null;
    }

    const { error: updateError } = await supabaseAdmin
      .from('group_lessons')
      .update({
        education_level_id: education_level_id || lesson.education_level_id,
        date: date || lesson.date,
        start_time: start_time !== undefined ? (start_time || null) : lesson.start_time,
        hours: lessonHours,
        total_cost,
        // Don't update price_locked here - it should only be set when approving or manually
      })
      .eq('id', lessonId);

    if (updateError) {
      return errorResponse('Failed to update group lesson');
    }

    await supabaseAdmin
      .from('group_lesson_students')
      .delete()
      .eq('group_lesson_id', lessonId);

    const attendance = uniqueStudentIds.map((studentId) => ({
      group_lesson_id: lessonId,
      student_id: studentId,
    }));

    const { error: attendanceError } = await supabaseAdmin
      .from('group_lesson_students')
      .insert(attendance);

    if (attendanceError) {
      return errorResponse('Failed to update students list');
    }

    const { data: updated } = await supabaseAdmin
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
      .eq('id', lessonId)
      .single();

    return successResponse(
      normalizeLesson(updated),
      'Group lesson updated successfully'
    );
  } catch (error) {
    console.error('Update group lesson error:', error);
    return errorResponse('An error occurred while updating group lesson');
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const lessonId = parseInt(params.id, 10);
    const body = await request.json().catch(() => ({}));
    const { deletion_note } = body;

    const { data: lesson, error: lessonError } = await supabaseAdmin
      .from('group_lessons')
      .select('id, teacher_id, approved, deleted_at')
      .eq('id', lessonId)
      .single();

    if (lessonError || !lesson) {
      return notFoundResponse('Lesson not found');
    }

    // Check if already deleted
    if (lesson.deleted_at) {
      return errorResponse('Lesson is already deleted');
    }

    if (lesson.approved) {
      return errorResponse('Cannot delete approved lessons');
    }

    if (user.role === 'teacher') {
      const teacherId = await getTeacherIdForUser(user.userId);
      if (!teacherId || teacherId !== lesson.teacher_id) {
        return unauthorizedResponse('You can only delete your own lessons');
      }
    }

    // Soft delete: set deleted_at timestamp and optional deletion note
    const updateData: { deleted_at: string; deletion_note?: string | null } = {
      deleted_at: new Date().toISOString(),
    };
    
    // Only admins can add deletion notes
    if ((user.role === 'admin' || user.role === 'subAdmin') && deletion_note) {
      updateData.deletion_note = deletion_note;
    }

    const { error: deleteError } = await supabaseAdmin
      .from('group_lessons')
      .update(updateData)
      .eq('id', lessonId);

    if (deleteError) {
      return errorResponse('Failed to delete group lesson');
    }

    return successResponse({}, 'Group lesson deleted successfully');
  } catch (error) {
    console.error('Delete group lesson error:', error);
    return errorResponse('An error occurred while deleting group lesson');
  }
}


