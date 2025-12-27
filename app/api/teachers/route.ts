/**
 * GET /api/teachers - Get all teachers (Admin only)
 * POST /api/teachers - Add new teacher (Admin only)
 */

import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/utils/get-user-from-request';
import { hashPassword } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/lib/utils/api-response';
import { Teacher } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return unauthorizedResponse('Authentication required');
    }
    if (user.role !== 'admin' && user.role !== 'subAdmin') {
      return forbiddenResponse('Admin access required');
    }

    const { data: teachers, error } = await supabaseAdmin
      .from('teachers')
      .select(`
        *,
        user:users(id, username, role, is_active)
      `)
      .eq('user.is_active', true)
      .order('id', { ascending: true });

    if (error) {
      return errorResponse('Failed to fetch teachers');
    }

    return successResponse(teachers);
  } catch (error) {
    console.error('Get teachers error:', error);
    return errorResponse('An error occurred while fetching teachers');
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return unauthorizedResponse('Authentication required');
    }
    if (user.role !== 'admin' && user.role !== 'subAdmin') {
      return forbiddenResponse('Admin access required');
    }

    const body = await request.json();
    const { username, password, full_name, phone } = body;

    if (!username || !password || !full_name) {
      return errorResponse('اسم المستخدم، كلمة المرور والاسم الكامل مطلوبة');
    }

    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      return errorResponse('اسم المستخدم مطلوب');
    }

    // Enforce phone format if provided
    if (phone) {
      const phoneRegex = /^05\d{8}$/;
      if (!phoneRegex.test(phone.trim())) {
        return errorResponse('رقم الهاتف يجب أن يبدأ بـ 05 ويتكون من 10 أرقام');
      }
    }

    // Ensure username uniqueness
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('username', trimmedUsername)
      .maybeSingle();

    if (existingUser) {
      return errorResponse('اسم المستخدم مستخدم بالفعل');
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user first
    const { data: newUser, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        username: trimmedUsername,
        password_hash: passwordHash,
        role: 'teacher',
        is_active: true,
      })
      .select()
      .single();

    if (userError || !newUser) {
      return errorResponse('Failed to create user');
    }

    // Create teacher
    const { data: teacher, error: teacherError } = await supabaseAdmin
      .from('teachers')
      .insert({
        user_id: newUser.id,
        full_name,
        phone: phone ? phone.trim() : null,
      })
      .select()
      .single();

    if (teacherError || !teacher) {
      // Rollback: delete user if teacher creation fails
      await supabaseAdmin.from('users').delete().eq('id', newUser.id);
      return errorResponse('Failed to create teacher');
    }

    return successResponse(teacher, 'Teacher created successfully');
  } catch (error) {
    console.error('Create teacher error:', error);
    return errorResponse('An error occurred while creating teacher');
  }
}

