/**
 * PUT /api/special-lesson-notes/[id]/read - Mark special lesson note as read/unread
 */

import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/utils/get-user-from-request';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/lib/utils/api-response';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getUserFromRequest(request);
    if (!user || user.role !== 'admin') {
      return unauthorizedResponse('Only admins can mark notes as read');
    }

    const noteId = parseInt(params.id, 10);
    const body = await request.json();
    const { is_read } = body;

    if (typeof is_read !== 'boolean') {
      return errorResponse('is_read must be a boolean value');
    }

    // Check if note exists
    const { data: existingNote, error: fetchError } = await supabaseAdmin
      .from('special_lesson_notes')
      .select('*')
      .eq('id', noteId)
      .single();

    if (fetchError || !existingNote) {
      return notFoundResponse('Special lesson note not found');
    }

    // Update read status
    const updateData: any = {
      is_read,
      updated_at: new Date().toISOString(),
    };

    if (is_read) {
      updateData.read_at = new Date().toISOString();
      updateData.read_by = user.userId;
    } else {
      updateData.read_at = null;
      updateData.read_by = null;
    }

    const { data: updatedNote, error: updateError } = await supabaseAdmin
      .from('special_lesson_notes')
      .update(updateData)
      .eq('id', noteId)
      .select(`
        *,
        teacher:teachers(id, full_name, phone),
        education_level:education_levels(id, name_ar, name_en)
      `)
      .single();

    if (updateError || !updatedNote) {
      console.error('Error updating read status:', updateError);
      return errorResponse('Failed to update read status');
    }

    // Fetch students
    const studentIds = updatedNote.student_ids || [];
    let students: any[] = [];
    if (studentIds.length > 0) {
      const { data: studentsData } = await supabaseAdmin
        .from('students')
        .select('id, full_name, class, education_level_id')
        .in('id', studentIds);
      students = studentsData || [];
    }

    // Fetch read_by user if exists
    let readByUser = null;
    if (updatedNote.read_by) {
      const { data: userData } = await supabaseAdmin
        .from('users')
        .select('id, username')
        .eq('id', updatedNote.read_by)
        .single();
      readByUser = userData;
    }

    const result = {
      ...updatedNote,
      students,
      read_by_user: readByUser,
    };

    return successResponse(result, is_read ? 'تم وضع علامة مقروء بنجاح' : 'تم إزالة علامة المقروء بنجاح');
  } catch (error) {
    console.error('Mark read status error:', error);
    return errorResponse('An error occurred while updating read status');
  }
}

