/**
 * GET /api/students - Get all students
 * POST /api/students - Add new student
 */

import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/utils/get-user-from-request';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/utils/api-response';

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const { data: students, error } = await supabaseAdmin
      .from('students')
      .select(`
        *,
        education_level:education_levels(id, name_ar, name_en),
        created_by_teacher:teachers!created_by_teacher_id(id, full_name)
      `)
      .order('id', { ascending: true });

    if (error) {
      return errorResponse('Failed to fetch students');
    }

    return successResponse(students);
  } catch (error) {
    console.error('Get students error:', error);
    return errorResponse('An error occurred while fetching students');
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const {
      full_name,
      parent_contact,
      education_level_id,
      class: class_name,
    }: {
      full_name?: string;
      parent_contact?: string | null;
      education_level_id?: number | null;
      class?: string | null;
    } = body;

    if (!full_name || !full_name.trim()) {
      return errorResponse('اسم الطالب مطلوب');
    }

    if (!education_level_id) {
      return errorResponse('اختر المستوى التعليمي');
    }

    if (parent_contact) {
      const normalizedPhone = parent_contact.trim();
      const phoneRegex = /^05\d{8}$/; // starts with 05 followed by 8 digits
      if (!phoneRegex.test(normalizedPhone)) {
        return errorResponse('رقم الهاتف يجب أن يبدأ بـ 05 ويتكون من 10 أرقام');
      }
    }

    // Get teacher_id if the user is a teacher
    let created_by_teacher_id: number | null = null;
    if (user.role === 'teacher') {
      const { data: teacher, error: teacherError } = await supabaseAdmin
        .from('teachers')
        .select('id')
        .eq('user_id', user.userId)
        .single();

      if (teacherError || !teacher) {
        console.error('Error fetching teacher:', teacherError);
        // Continue without teacher_id if there's an error (shouldn't happen, but handle gracefully)
      } else {
        created_by_teacher_id = teacher.id;
      }
    }

    const { data: student, error } = await supabaseAdmin
      .from('students')
      .insert({
        full_name: full_name.trim(),
        parent_contact: parent_contact?.trim() || null,
        education_level_id,
        class: class_name?.trim() || null,
        created_by_teacher_id,
      })
      .select(`
        *,
        education_level:education_levels(id, name_ar, name_en),
        created_by_teacher:teachers!created_by_teacher_id(id, full_name)
      `)
      .single();

    if (error || !student) {
      if (error?.code === '23505') {
        return errorResponse('الطالب موجود مسبقًا');
      }
      return errorResponse('فشل إضافة الطالب');
    }

    return successResponse(student, 'تمت إضافة الطالب بنجاح');
  } catch (error) {
    console.error('Create student error:', error);
    return errorResponse('حدث خطأ أثناء إضافة الطالب');
  }
}

