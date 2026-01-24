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
      .from('group_lessons')
      .select('id, approved, deleted_at')
      .eq('id', lessonId)
      .single();

    if (lessonError || !lesson) {
      return notFoundResponse('Lesson not found');
    }

    if (lesson.deleted_at) {
      return errorResponse('Cannot unapprove deleted lesson');
    }

    if (!lesson.approved) {
      return successResponse({}, 'Lesson is already not approved');
    }

    // Unapprove lesson and unlock the price to allow recalculation
    const { error: updateError } = await supabaseAdmin
      .from('group_lessons')
      .update({ 
        approved: false,
        price_locked: false  // Unlock price when unapproved to allow recalculation
      })
      .eq('id', lessonId);

    if (updateError) {
      return errorResponse('Failed to unapprove lesson');
    }

    return successResponse({}, 'Lesson unapproved successfully');
  } catch (error) {
    console.error('Unapprove group lesson error:', error);
    return errorResponse('An error occurred while unapproving lesson');
  }
}















