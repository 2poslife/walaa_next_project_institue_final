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
      .from('individual_lessons')
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

    // Check if price is locked - if so, don't recalculate cost
    const isPriceLocked = lesson.price_locked === true;

    if (user.role === 'teacher') {
      const teacherId = await getTeacherIdForUser(user.userId);
      if (!teacherId || teacherId !== lesson.teacher_id) {
        return unauthorizedResponse('You can only update your own lessons');
      }
    }

    const { student_id, education_level_id, date, start_time, hours } = body;

    if (!student_id || !education_level_id || !date || !hours) {
      return errorResponse('All fields are required');
    }

    // Only recalculate cost if price is NOT locked
    let total_cost = lesson.total_cost; // Keep existing cost if locked
    if (!isPriceLocked) {
      const { data: pricing } = await supabaseAdmin
        .from('pricing')
        .select('price_per_hour')
        .eq('education_level_id', education_level_id)
        .eq('lesson_type', 'individual')
        .single();

      total_cost = pricing
        ? parseFloat((pricing.price_per_hour * hours).toFixed(2))
        : null;
    }

    const { data: updatedLesson, error: updateError } = await supabaseAdmin
      .from('individual_lessons')
      .update({
        student_id,
        education_level_id,
        date,
        start_time: start_time || null,
        hours,
        total_cost,
        // Don't update price_locked here - it should only be set when approving or manually
      })
      .eq('id', lessonId)
      .select()
      .single();

    if (updateError || !updatedLesson) {
      return errorResponse('Failed to update lesson');
    }

    return successResponse(updatedLesson, 'Lesson updated successfully');
  } catch (error) {
    console.error('Update lesson error:', error);
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
    const body = await request.json().catch(() => ({}));
    const { deletion_note } = body;

    const { data: lesson, error: lessonError } = await supabaseAdmin
      .from('individual_lessons')
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
      .from('individual_lessons')
      .update(updateData)
      .eq('id', lessonId);

    if (deleteError) {
      return errorResponse('Failed to delete lesson');
    }

    return successResponse({}, 'Lesson deleted successfully');
  } catch (error) {
    console.error('Delete lesson error:', error);
    return errorResponse('An error occurred while deleting lesson');
  }
}


