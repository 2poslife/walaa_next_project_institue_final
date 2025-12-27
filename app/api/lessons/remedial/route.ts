/**
 * GET /api/lessons/remedial - Get all remedial lessons
 * POST /api/lessons/remedial - Create new remedial lesson
 */

import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/utils/get-user-from-request';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/utils/api-response';
import { LessonFilters } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const filters: LessonFilters = {
      date_from: searchParams.get('date_from') || undefined,
      date_to: searchParams.get('date_to') || undefined,
      teacher_id: searchParams.get('teacher_id') ? parseInt(searchParams.get('teacher_id')!) : undefined,
      student_id: searchParams.get('student_id') ? parseInt(searchParams.get('student_id')!) : undefined,
      approved: searchParams.get('approved') === 'true' ? true : searchParams.get('approved') === 'false' ? false : undefined,
    };

    let query = supabaseAdmin
      .from('remedial_lessons')
      .select(`
        *,
        teacher:teachers(id, full_name, phone),
        student:students(id, full_name, parent_contact)
      `);

    // Apply filters
    if (filters.date_from) {
      query = query.gte('date', filters.date_from);
    }
    if (filters.date_to) {
      query = query.lte('date', filters.date_to);
    }
    if (filters.teacher_id) {
      query = query.eq('teacher_id', filters.teacher_id);
    }
    if (filters.student_id) {
      query = query.eq('student_id', filters.student_id);
    }
    if (filters.approved !== undefined) {
      query = query.eq('approved', filters.approved);
    }

    // Teachers can only see their own lessons
    if (user.role === 'teacher') {
      const { data: teacher } = await supabaseAdmin
        .from('teachers')
        .select('id')
        .eq('user_id', user.userId)
        .single();
      if (teacher) {
        query = query.eq('teacher_id', teacher.id);
      }
    }

    const { data: lessons, error } = await query.order('date', { ascending: false }).order('start_time', { ascending: false });

    if (error) {
      return errorResponse('Failed to fetch remedial lessons');
    }

    return successResponse(lessons);
  } catch (error) {
    console.error('Get remedial lessons error:', error);
    return errorResponse('An error occurred while fetching lessons');
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const { teacher_id, student_id, date, start_time, hours } = body;

    if (!teacher_id || !student_id || !date || !start_time || !hours) {
      return errorResponse('All fields are required');
    }

    // Teachers can only create lessons for themselves
    if (user.role === 'teacher') {
      const { data: teacher } = await supabaseAdmin
        .from('teachers')
        .select('id')
        .eq('user_id', user.userId)
        .single();
      if (!teacher || teacher.id !== teacher_id) {
        return unauthorizedResponse('You can only create lessons for yourself');
      }
    }

    // Cost will be calculated by trigger (135 or 120 based on student's lesson count)
    const { data: lesson, error } = await supabaseAdmin
      .from('remedial_lessons')
      .insert({
        teacher_id,
        student_id,
        date,
        start_time: start_time || null,
        hours,
        approved: false, // Default to pending
      })
      .select()
      .single();

    if (error || !lesson) {
      return errorResponse('Failed to create remedial lesson');
    }

    return successResponse(lesson, 'Remedial lesson created successfully');
  } catch (error) {
    console.error('Create remedial lesson error:', error);
    return errorResponse('An error occurred while creating lesson');
  }
}

