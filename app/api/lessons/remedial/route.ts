/**
 * GET /api/lessons/remedial - Get all remedial lessons
 * POST /api/lessons/remedial - Create new remedial lesson
 */

import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/utils/get-user-from-request';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/utils/api-response';
import {
  isLessonDateWithinSubmissionWindow,
  getLessonSubmissionDeadlineMessage,
  getLessonDeadlineConfigFromSettings,
} from '@/lib/utils/lesson-submission-deadline';
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
        student:students(id, full_name, parent_contact, class, education_level:education_levels(id, name_ar, name_en))
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

    const limitParam = searchParams.get('limit');
    const requestedLimit = limitParam
      ? Math.min(20000, Math.max(1, parseInt(limitParam, 10)))
      : null;
    const pageSize = 1000;

    const ordered = query.order('date', { ascending: false }).order('start_time', { ascending: false });
    const all: any[] = [];
    let from = 0;
    let hasMore = true;
    while (hasMore) {
      const take =
        requestedLimit !== null && !Number.isNaN(requestedLimit)
          ? Math.min(pageSize, requestedLimit - all.length)
          : pageSize;
      if (take <= 0) break;
      const { data: chunk, error } = await ordered.range(from, from + take - 1);
      if (error) {
        return errorResponse('Failed to fetch remedial lessons');
      }
      const rows = chunk || [];
      all.push(...rows);
      hasMore = rows.length === pageSize && (requestedLimit === null || all.length < requestedLimit);
      from += take;
    }

    return successResponse(all);
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
      const { data: deadlineRows } = await supabaseAdmin
        .from('app_settings')
        .select('key, value')
        .in('key', ['lesson_submission_deadline_day', 'lesson_submission_deadline_inclusive']);
      const deadlineConfig = getLessonDeadlineConfigFromSettings(deadlineRows ?? []);
      if (!isLessonDateWithinSubmissionWindow(date, new Date(), deadlineConfig)) {
        return errorResponse(getLessonSubmissionDeadlineMessage(deadlineConfig));
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

