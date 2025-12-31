/**
 * GET /api/students/[id] - Get student by ID
 * PUT /api/students/[id] - Update student
 * DELETE /api/students/[id] - Delete/deactivate student
 */

import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/utils/get-user-from-request';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/lib/utils/api-response';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getUserFromRequest(request);
    if (!user || (user.role !== 'admin' && user.role !== 'subAdmin')) {
      return unauthorizedResponse('Admin access required');
    }

    const studentId = parseInt(params.id, 10);

    const { data: student, error } = await supabaseAdmin
      .from('students')
      .select(`
        *,
        education_level:education_levels(id, name_ar, name_en),
        created_by_teacher:teachers!created_by_teacher_id(id, full_name)
      `)
      .eq('id', studentId)
      .single();

    if (error || !student) {
      return notFoundResponse('Student not found');
    }

    return successResponse(student);
  } catch (error) {
    console.error('Get student error:', error);
    return errorResponse('An error occurred while fetching student');
  }
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

    const studentId = parseInt(params.id, 10);
    const body = await request.json();

    // Check if student exists and get current education level
    const { data: existingStudent, error: fetchError } = await supabaseAdmin
      .from('students')
      .select('id, full_name, education_level_id')
      .eq('id', studentId)
      .single();

    if (fetchError || !existingStudent) {
      return notFoundResponse('Student not found');
    }

    // If full_name is being updated, check for duplicates (excluding current student)
    if (body.full_name && body.full_name.trim() !== existingStudent.full_name) {
      const { data: duplicateStudent, error: duplicateError } = await supabaseAdmin
        .from('students')
        .select('id')
        .eq('full_name', body.full_name.trim())
        .neq('id', studentId)
        .single();

      if (duplicateError && duplicateError.code !== 'PGRST116') {
        // PGRST116 means no rows found, which is what we want
        console.error('Error checking for duplicate:', duplicateError);
        return errorResponse('حدث خطأ أثناء التحقق من الاسم');
      }

      if (duplicateStudent) {
        return errorResponse('الطالب موجود مسبقًا بهذا الاسم');
      }
    }

    const updateData: any = {};
    if (body.full_name) updateData.full_name = body.full_name.trim();
    if (body.parent_contact !== undefined) updateData.parent_contact = body.parent_contact;
    if (body.education_level_id !== undefined) updateData.education_level_id = body.education_level_id || null;
    if (body.class !== undefined) updateData.class = body.class?.trim() || null;

    const { data: student, error } = await supabaseAdmin
      .from('students')
      .update(updateData)
      .eq('id', studentId)
      .select(`
        *,
        education_level:education_levels(id, name_ar, name_en),
        created_by_teacher:teachers!created_by_teacher_id(id, full_name)
      `)
      .single();

    if (error || !student) {
      if (error?.code === '23505') {
        // Unique constraint violation
        return errorResponse('الطالب موجود مسبقًا بهذا الاسم');
      }
      return errorResponse('Failed to update student');
    }

    // If education level was changed, update all individual lessons for this student
    if (body.education_level_id !== undefined && 
        existingStudent.education_level_id !== body.education_level_id) {
      const newEducationLevelId = body.education_level_id || null;
      
      // Update individual lessons (only non-deleted ones)
      await supabaseAdmin
        .from('individual_lessons')
        .update({ education_level_id: newEducationLevelId })
        .eq('student_id', studentId)
        .is('deleted_at', null);
    }

    return successResponse(student, 'Student updated successfully');
  } catch (error) {
    console.error('Update student error:', error);
    return errorResponse('An error occurred while updating student');
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getUserFromRequest(request);
    if (!user || (user.role !== 'admin' && user.role !== 'subAdmin')) {
      return unauthorizedResponse('Admin access required');
    }

    const studentId = parseInt(params.id, 10);
    const body = await request.json().catch(() => ({}));
    const { deletion_note } = body;

    // Check if student exists
    const { data: student, error: studentError } = await supabaseAdmin
      .from('students')
      .select('id, deleted_at')
      .eq('id', studentId)
      .single();

    if (studentError || !student) {
      return notFoundResponse('Student not found');
    }

    // Check if already deleted
    if (student.deleted_at) {
      return errorResponse('Student is already deleted');
    }

    const now = new Date().toISOString();

    // Soft delete the student
    const { error: deleteError } = await supabaseAdmin
      .from('students')
      .update({
        deleted_at: now,
        deletion_note: deletion_note || null,
      })
      .eq('id', studentId);

    if (deleteError) {
      return errorResponse('Failed to delete student');
    }

    // Soft delete all lessons for this student
    // Individual lessons
    const { data: individualUpdateData, error: individualError } = await supabaseAdmin
      .from('individual_lessons')
      .update({
        deleted_at: now,
        deletion_note: deletion_note ? `تم الحذف بسبب حذف الطالب: ${deletion_note}` : 'تم الحذف بسبب حذف الطالب',
      })
      .eq('student_id', studentId)
      .is('deleted_at', null)
      .select('id');

    if (individualError) {
      console.error('Error soft deleting individual lessons:', individualError);
      // Continue anyway - we don't want to fail the student deletion if lesson deletion fails
    } else {
      console.log(`Soft deleted ${individualUpdateData?.length || 0} individual lessons for student ${studentId}`);
    }

    // Group lessons - find all group lessons where this student participates
    const { data: groupLessonStudents } = await supabaseAdmin
      .from('group_lesson_students')
      .select('group_lesson_id')
      .eq('student_id', studentId);

    if (groupLessonStudents && groupLessonStudents.length > 0) {
      const groupLessonIds = groupLessonStudents.map((g) => g.group_lesson_id);
      
      // For each group lesson, check if this student is the only participant
      for (const groupLessonId of groupLessonIds) {
        const { data: participants } = await supabaseAdmin
          .from('group_lesson_students')
          .select('student_id')
          .eq('group_lesson_id', groupLessonId);
        
        // If only one participant (this student), soft delete the lesson
        if (participants && participants.length === 1) {
          const { data: groupUpdateData, error: groupError } = await supabaseAdmin
            .from('group_lessons')
            .update({
              deleted_at: now,
              deletion_note: deletion_note ? `تم الحذف بسبب حذف الطالب: ${deletion_note}` : 'تم الحذف بسبب حذف الطالب',
            })
            .eq('id', groupLessonId)
            .is('deleted_at', null)
            .select('id');
          
          if (groupError) {
            console.error(`Error soft deleting group lesson ${groupLessonId}:`, groupError);
          } else {
            console.log(`Soft deleted group lesson ${groupLessonId} for student ${studentId}`);
          }
        }
        
        // Remove this student from the group_lesson_students junction table
        const { error: junctionError } = await supabaseAdmin
          .from('group_lesson_students')
          .delete()
          .eq('group_lesson_id', groupLessonId)
          .eq('student_id', studentId);
        
        if (junctionError) {
          console.error(`Error removing student from group lesson ${groupLessonId}:`, junctionError);
        }
      }
    }

    // Remedial lessons
    const { data: remedialUpdateData, error: remedialError } = await supabaseAdmin
      .from('remedial_lessons')
      .update({
        deleted_at: now,
        deletion_note: deletion_note ? `تم الحذف بسبب حذف الطالب: ${deletion_note}` : 'تم الحذف بسبب حذف الطالب',
      })
      .eq('student_id', studentId)
      .is('deleted_at', null)
      .select('id');

    if (remedialError) {
      console.error('Error soft deleting remedial lessons:', remedialError);
      // Continue anyway - we don't want to fail the student deletion if lesson deletion fails
    } else {
      console.log(`Soft deleted ${remedialUpdateData?.length || 0} remedial lessons for student ${studentId}`);
    }

    return successResponse({}, 'Student and all related lessons deleted successfully');
  } catch (error) {
    console.error('Delete student error:', error);
    return errorResponse('An error occurred while deleting student');
  }
}

