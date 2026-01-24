/**
 * PUT /api/special-lesson-notes/[id] - Update special lesson note (admin note)
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
      return unauthorizedResponse('Only admins can update special lesson notes');
    }

    const noteId = parseInt(params.id, 10);
    const body = await request.json();
    const { admin_note } = body;

    // Check if note exists
    const { data: existingNote, error: fetchError } = await supabaseAdmin
      .from('special_lesson_notes')
      .select('*')
      .eq('id', noteId)
      .single();

    if (fetchError || !existingNote) {
      return notFoundResponse('Special lesson note not found');
    }

    // Update admin note
    const { data: updatedNote, error: updateError } = await supabaseAdmin
      .from('special_lesson_notes')
      .update({
        admin_note: admin_note ? admin_note.trim() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', noteId)
      .select(`
        *,
        teacher:teachers(id, full_name, phone),
        education_level:education_levels(id, name_ar, name_en)
      `)
      .single();

    if (updateError || !updatedNote) {
      console.error('Error updating special lesson note:', updateError);
      return errorResponse('Failed to update special lesson note');
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

    const result = {
      ...updatedNote,
      students,
    };

    return successResponse(result, 'تم تحديث الملاحظة بنجاح');
  } catch (error) {
    console.error('Update special lesson note error:', error);
    return errorResponse('An error occurred while updating special lesson note');
  }
}






