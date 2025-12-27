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

    // Check if student exists
    const { data: existingStudent, error: fetchError } = await supabaseAdmin
      .from('students')
      .select('id, full_name')
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
    if (!user) {
      return unauthorizedResponse();
    }

    const studentId = parseInt(params.id, 10);

    const { error } = await supabaseAdmin
      .from('students')
      .delete()
      .eq('id', studentId);

    if (error) {
      return errorResponse('Failed to delete student');
    }

    return successResponse({}, 'Student deleted successfully');
  } catch (error) {
    console.error('Delete student error:', error);
    return errorResponse('An error occurred while deleting student');
  }
}

