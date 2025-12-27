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

    const { data: lesson, error: lessonError } = await supabaseAdmin
      .from('remedial_lessons')
      .select('*')
      .eq('id', lessonId)
      .single();

    if (lessonError || !lesson) {
      return notFoundResponse('Remedial lesson not found');
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

    const { student_id, date, start_time, hours } = body;

    if (!student_id || !date || !start_time || !hours) {
      return errorResponse('All fields are required');
    }

    // Cost will be recalculated by trigger if price is not locked
    const { data: updatedLesson, error: updateError } = await supabaseAdmin
      .from('remedial_lessons')
      .update({
        student_id,
        date,
        start_time: start_time || null,
        hours,
      })
      .eq('id', lessonId)
      .select()
      .single();

    if (updateError || !updatedLesson) {
      return errorResponse('Failed to update remedial lesson');
    }

    return successResponse(updatedLesson, 'Remedial lesson updated successfully');
  } catch (error) {
    console.error('Update remedial lesson error:', error);
    return errorResponse('An error occurred while updating lesson');
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

    const { data: lesson, error: lessonError } = await supabaseAdmin
      .from('remedial_lessons')
      .select('id, teacher_id, approved')
      .eq('id', lessonId)
      .single();

    if (lessonError || !lesson) {
      return notFoundResponse('Remedial lesson not found');
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

    const { error: deleteError } = await supabaseAdmin
      .from('remedial_lessons')
      .delete()
      .eq('id', lessonId);

    if (deleteError) {
      return errorResponse('Failed to delete remedial lesson');
    }

    return successResponse({}, 'Remedial lesson deleted successfully');
  } catch (error) {
    console.error('Delete remedial lesson error:', error);
    return errorResponse('An error occurred while deleting lesson');
  }
}

