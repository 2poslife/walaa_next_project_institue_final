import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/utils/get-user-from-request';
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  notFoundResponse,
} from '@/lib/utils/api-response';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return unauthorizedResponse();
    }

    if (user.role !== 'admin' && user.role !== 'subAdmin') {
      return unauthorizedResponse('Admin access required');
    }

    const lessonId = parseInt(params.id, 10);

    const { data: lesson, error: lessonError } = await supabaseAdmin
      .from('remedial_lessons')
      .select('id, approved, deleted_at, student_id')
      .eq('id', lessonId)
      .single();

    if (lessonError || !lesson) {
      return notFoundResponse('Remedial lesson not found');
    }

    if (lesson.deleted_at) {
      return errorResponse('Cannot unapprove deleted lesson');
    }

    if (!lesson.approved) {
      return successResponse({}, 'Remedial lesson is already not approved');
    }

    // Unapprove lesson and unlock the price to allow recalculation
    const { error: updateError } = await supabaseAdmin
      .from('remedial_lessons')
      .update({ 
        approved: false,
        price_locked: false  // Unlock price when unapproved to allow recalculation
      })
      .eq('id', lessonId);

    if (updateError) {
      return errorResponse('Failed to unapprove remedial lesson');
    }

    // After unapproving, we need to recalculate costs for future lessons of this student
    // because the count of approved lessons has changed
    if (lesson.student_id) {
      // Trigger recalculation for pending lessons of this student
      const { data: pendingLessons } = await supabaseAdmin
        .from('remedial_lessons')
        .select('id, hours')
        .eq('student_id', lesson.student_id)
        .eq('approved', false)
        .eq('price_locked', false);
      
      // Re-trigger by updating hours (this will trigger the cost calculation)
      if (pendingLessons && pendingLessons.length > 0) {
        for (const pendingLesson of pendingLessons) {
          await supabaseAdmin
            .from('remedial_lessons')
            .update({ hours: pendingLesson.hours })
            .eq('id', pendingLesson.id);
        }
      }
    }

    return successResponse({}, 'Remedial lesson unapproved successfully');
  } catch (error) {
    console.error('Unapprove remedial lesson error:', error);
    return errorResponse('An error occurred while unapproving lesson');
  }
}














