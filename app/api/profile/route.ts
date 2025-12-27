export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/utils/get-user-from-request';
import { hashPassword } from '@/lib/auth';
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
} from '@/lib/utils/api-response';

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return unauthorizedResponse('Authentication required');
    }

    const { data: dbUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, username, role, is_active')
      .eq('id', user.userId)
      .single();

    if (userError || !dbUser) {
      return errorResponse('Failed to load profile');
    }

    let teacher = null;
    if (dbUser.role === 'teacher') {
      const { data: teacherData } = await supabaseAdmin
        .from('teachers')
        .select('id, full_name, phone')
        .eq('user_id', dbUser.id)
        .single();
      teacher = teacherData;
    }

    return successResponse({ user: dbUser, ...(teacher && { teacher }) });
  } catch (error) {
    console.error('Profile GET error:', error);
    return errorResponse('Failed to load profile data');
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authUser = getUserFromRequest(request);
    if (!authUser) {
      return unauthorizedResponse('Authentication required');
    }

    const body = await request.json();
    const { username, password, full_name, phone } = body;

    const userUpdates: Record<string, any> = {};

    if (typeof username === 'string') {
      const trimmed = username.trim();
      if (!trimmed) {
        return errorResponse('اسم المستخدم مطلوب');
      }

      const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('username', trimmed)
        .maybeSingle();

      if (existingUser && existingUser.id !== authUser.userId) {
        return errorResponse('اسم المستخدم مستخدم بالفعل');
      }

      userUpdates.username = trimmed;
    }

    if (typeof password === 'string' && password.trim()) {
      if (password.length < 6) {
        return errorResponse('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      }
      userUpdates.password_hash = await hashPassword(password);
    }

    if (Object.keys(userUpdates).length > 0) {
      const { error: updateUserError } = await supabaseAdmin
        .from('users')
        .update(userUpdates)
        .eq('id', authUser.userId);
      if (updateUserError) {
        return errorResponse('Failed to update user profile');
      }
    }

    let updatedTeacher = null;
    if (authUser.role === 'teacher') {
      const teacherUpdates: Record<string, any> = {};
      if (typeof full_name === 'string' && full_name.trim()) {
        teacherUpdates.full_name = full_name.trim();
      }
      if (typeof phone === 'string') {
        const trimmedPhone = phone.trim();
        if (trimmedPhone) {
          const phoneRegex = /^05\d{8}$/;
          if (!phoneRegex.test(trimmedPhone)) {
            return errorResponse('رقم الهاتف يجب أن يبدأ بـ 05 ويتكون من 10 أرقام');
          }
          teacherUpdates.phone = trimmedPhone;
        } else {
          teacherUpdates.phone = null;
        }
      }

      if (Object.keys(teacherUpdates).length > 0) {
        const { error: teacherUpdateError } = await supabaseAdmin
          .from('teachers')
          .update(teacherUpdates)
          .eq('user_id', authUser.userId);
        if (teacherUpdateError) {
          return errorResponse('Failed to update teacher profile');
        }
      }

      const { data: teacherData } = await supabaseAdmin
        .from('teachers')
        .select('id, full_name, phone')
        .eq('user_id', authUser.userId)
        .single();
      updatedTeacher = teacherData;
    }

    const { data: updatedUser } = await supabaseAdmin
      .from('users')
      .select('id, username, role, is_active')
      .eq('id', authUser.userId)
      .single();

    return successResponse({
      user: updatedUser,
      ...(updatedTeacher && { teacher: updatedTeacher }),
    }, 'Profile updated successfully');
  } catch (error) {
    console.error('Profile PUT error:', error);
    return errorResponse('Failed to update profile');
  }
}


