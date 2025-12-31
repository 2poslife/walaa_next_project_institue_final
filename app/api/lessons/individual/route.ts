/**
 * GET /api/lessons/individual - Get all individual lessons
 * POST /api/lessons/individual - Create new individual lesson
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
      education_level_id: searchParams.get('education_level_id') ? parseInt(searchParams.get('education_level_id')!) : undefined,
      approved: searchParams.get('approved') === 'true' ? true : searchParams.get('approved') === 'false' ? false : undefined,
    };

    let query = supabaseAdmin
      .from('individual_lessons')
      .select(`
        *,
        teacher:teachers(id, full_name, phone),
        student:students(id, full_name, parent_contact, education_level_id),
        education_level:education_levels(id, name_ar, name_en)
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
    if (filters.education_level_id) {
      query = query.eq('education_level_id', filters.education_level_id);
    }
    if (filters.approved !== undefined) {
      query = query.eq('approved', filters.approved);
    }

    // Handle deleted filter - if not explicitly requesting deleted, exclude them
    const showDeleted = searchParams.get('show_deleted') === 'true';
    if (!showDeleted) {
      query = query.is('deleted_at', null);
    } else {
      query = query.not('deleted_at', 'is', null);
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

    const { data: lessons, error } = await query.order('date', { ascending: false });

    if (error) {
      return errorResponse('Failed to fetch lessons');
    }

    return successResponse(lessons);
  } catch (error) {
    console.error('Get individual lessons error:', error);
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
    const { teacher_id, student_id, education_level_id, date, start_time, hours } = body;

    if (!teacher_id || !student_id || !education_level_id || !date || !start_time || !hours) {
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

    // Calculate cost from pricing table
    const { data: pricing } = await supabaseAdmin
      .from('pricing')
      .select('price_per_hour')
      .eq('education_level_id', education_level_id)
      .eq('lesson_type', 'individual')
      .single();

    const total_cost = pricing ? parseFloat((pricing.price_per_hour * hours).toFixed(2)) : null;

    const { data: lesson, error } = await supabaseAdmin
      .from('individual_lessons')
      .insert({
        teacher_id,
        student_id,
        education_level_id,
        date,
        start_time: start_time || null,
        hours,
        approved: false, // Default to pending
        total_cost,
      })
      .select()
      .single();

    if (error || !lesson) {
      return errorResponse('Failed to create lesson');
    }

    return successResponse(lesson, 'Lesson created successfully');
  } catch (error) {
    console.error('Create individual lesson error:', error);
    return errorResponse('An error occurred while creating lesson');
  }
}

