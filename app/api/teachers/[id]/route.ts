/**
 * GET /api/teachers/[id] - Get teacher by ID
 * PUT /api/teachers/[id] - Update teacher (Admin or self)
 * DELETE /api/teachers/[id] - Delete/deactivate teacher (Admin only)
 */

import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/utils/get-user-from-request';
import { hashPassword } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/lib/utils/api-response';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const teacherId = parseInt(params.id, 10);

    // Teachers can only view their own profile
    if (user.role === 'teacher') {
      const { data: teacher } = await supabaseAdmin
        .from('teachers')
        .select('*')
        .eq('user_id', user.userId)
        .single();

      if (!teacher || teacher.id !== teacherId) {
        return unauthorizedResponse('You can only view your own profile');
      }
    }

    const { data: teacher, error } = await supabaseAdmin
      .from('teachers')
      .select(`
        *,
        user:users(id, username, role, is_active)
      `)
      .eq('id', teacherId)
      .single();

    if (error || !teacher) {
      return notFoundResponse('Teacher not found');
    }

    return successResponse(teacher);
  } catch (error) {
    console.error('Get teacher error:', error);
    return errorResponse('An error occurred while fetching teacher');
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

    const teacherId = parseInt(params.id, 10);
    const body = await request.json();

    // Check if user can edit this teacher
    if (user.role === 'teacher') {
      const { data: teacher } = await supabaseAdmin
        .from('teachers')
        .select('*')
        .eq('user_id', user.userId)
        .single();

      if (!teacher || teacher.id !== teacherId) {
        return unauthorizedResponse('You can only edit your own profile');
      }
    } else if (user.role !== 'admin' && user.role !== 'subAdmin') {
      return unauthorizedResponse('Admin access required');
    }

    const { data: teacherRecord, error: teacherFetchError } = await supabaseAdmin
      .from('teachers')
      .select('id, user_id')
      .eq('id', teacherId)
      .single();

    if (teacherFetchError || !teacherRecord) {
      return notFoundResponse('Teacher not found');
    }

    // Handle username/password updates (admin/subAdmin only)
    const userUpdates: Record<string, any> = {};

    if ((user.role === 'admin' || user.role === 'subAdmin')) {
      if (typeof body.username === 'string') {
        const newUsername = body.username.trim();
        if (!newUsername) {
          return errorResponse('اسم المستخدم مطلوب');
        }

        // Check for duplicates
        const { data: existingUser } = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('username', newUsername)
          .maybeSingle();

        if (existingUser && existingUser.id !== teacherRecord.user_id) {
          return errorResponse('اسم المستخدم مستخدم بالفعل');
        }

        userUpdates.username = newUsername;
      }

      if (typeof body.password === 'string' && body.password.trim()) {
        if (body.password.length < 6) {
          return errorResponse('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
        }
        userUpdates.password_hash = await hashPassword(body.password);
      }
    } else if (body.username || body.password) {
      return unauthorizedResponse('Admin access required for credential changes');
    }

    if (Object.keys(userUpdates).length > 0) {
      const { error: userUpdateError } = await supabaseAdmin
        .from('users')
        .update(userUpdates)
        .eq('id', teacherRecord.user_id);

      if (userUpdateError) {
        return errorResponse('Failed to update user credentials');
      }
    }

    const teacherUpdates: Record<string, any> = {};
    if (body.full_name) teacherUpdates.full_name = body.full_name;
    if (body.phone !== undefined) teacherUpdates.phone = body.phone;

    if (Object.keys(teacherUpdates).length > 0) {
      const { error: teacherUpdateError } = await supabaseAdmin
        .from('teachers')
        .update(teacherUpdates)
        .eq('id', teacherId);

      if (teacherUpdateError) {
        return errorResponse('Failed to update teacher');
      }
    }

    const { data: updatedTeacher } = await supabaseAdmin
      .from('teachers')
      .select(`
        *,
        user:users(id, username, role, is_active)
      `)
      .eq('id', teacherId)
      .single();

    return successResponse(updatedTeacher, 'Teacher updated successfully');
  } catch (error) {
    console.error('Update teacher error:', error);
    return errorResponse('An error occurred while updating teacher');
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

    const teacherId = parseInt(params.id, 10);

    const { data: teacher } = await supabaseAdmin
      .from('teachers')
      .select('user_id')
      .eq('id', teacherId)
      .single();

    if (!teacher) {
      return notFoundResponse('Teacher not found');
    }

    const { error } = await supabaseAdmin
      .from('users')
      .update({ is_active: false })
      .eq('id', teacher.user_id);

    if (error) {
      return errorResponse('Failed to deactivate teacher');
    }

    return successResponse({}, 'Teacher deactivated successfully');
  } catch (error) {
    console.error('Delete teacher error:', error);
    return errorResponse('An error occurred while deactivating teacher');
  }
}

