/**
 * PUT /api/special-lesson-notes/[id] - Update special lesson note (admin note)
 */

import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/utils/get-user-from-request';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/lib/utils/api-response';
import {
  isLessonDateWithinSubmissionWindow,
  getLessonSubmissionDeadlineMessage,
  getLessonDeadlineConfigFromSettings,
} from '@/lib/utils/lesson-submission-deadline';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const noteId = parseInt(params.id, 10);
    const body = await request.json();
    const isAdmin = user.role === 'admin' || user.role === 'subAdmin';

    if (isAdmin) {
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
    }

    if (user.role !== 'teacher') {
      return unauthorizedResponse('Only admins or teachers can update special lesson notes');
    }

    const { data: teacher } = await supabaseAdmin
      .from('teachers')
      .select('id')
      .eq('user_id', user.userId)
      .single();

    if (!teacher) {
      return errorResponse('Teacher not found');
    }

    // Check if note exists and belongs to this teacher
    const { data: existingNote, error: fetchError } = await supabaseAdmin
      .from('special_lesson_notes')
      .select('*')
      .eq('id', noteId)
      .single();

    if (fetchError || !existingNote) {
      return notFoundResponse('Special lesson note not found');
    }

    if (existingNote.teacher_id !== teacher.id) {
      return unauthorizedResponse('You can only update your own notes');
    }

    const { date, start_time, hours, student_ids, teacher_note } = body;

    // Validate required fields
    if (!date || !student_ids || !Array.isArray(student_ids) || student_ids.length === 0 || !teacher_note) {
      return errorResponse('جميع الحقول إلزامية: التاريخ، الطلاب، والملاحظة');
    }

    // Same deadline as lessons: teachers cannot set note date outside the submission window
    const { data: deadlineRows } = await supabaseAdmin
      .from('app_settings')
      .select('key, value')
      .in('key', ['lesson_submission_deadline_day', 'lesson_submission_deadline_inclusive']);
    const deadlineConfig = getLessonDeadlineConfigFromSettings(deadlineRows ?? []);
    if (!isLessonDateWithinSubmissionWindow(date, new Date(), deadlineConfig)) {
      return errorResponse(getLessonSubmissionDeadlineMessage(deadlineConfig));
    }

    // Validate student_ids are numbers
    if (!student_ids.every((id: any) => typeof id === 'number' && id > 0)) {
      return errorResponse('معرفات الطلاب غير صحيحة');
    }

    const { data: updatedNote, error: updateError } = await supabaseAdmin
      .from('special_lesson_notes')
      .update({
        date,
        start_time: start_time || null,
        hours: hours || null,
        student_ids,
        teacher_note: teacher_note.trim(),
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







