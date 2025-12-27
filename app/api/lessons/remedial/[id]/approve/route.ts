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
      .select('id, approved')
      .eq('id', lessonId)
      .single();

    if (lessonError || !lesson) {
      return notFoundResponse('Remedial lesson not found');
    }

    if (lesson.approved) {
      return successResponse({}, 'Remedial lesson already approved');
    }

    // Approve lesson and lock the price to prevent recalculation
    const { error: updateError } = await supabaseAdmin
      .from('remedial_lessons')
      .update({ 
        approved: true,
        price_locked: true  // Lock price when approved to prevent future price changes
      })
      .eq('id', lessonId);

    if (updateError) {
      return errorResponse('Failed to approve remedial lesson');
    }

    // After approving, we need to recalculate costs for future lessons of this student
    // because the count of approved lessons has changed
    const { data: currentLesson } = await supabaseAdmin
      .from('remedial_lessons')
      .select('student_id')
      .eq('id', lessonId)
      .single();

    if (currentLesson) {
      // Trigger recalculation for pending lessons of this student
      // The trigger will automatically recalculate based on new approved count
      // We'll update a non-critical field to trigger the cost recalculation
      const { data: pendingLessons } = await supabaseAdmin
        .from('remedial_lessons')
        .select('id, hours')
        .eq('student_id', currentLesson.student_id)
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

    return successResponse({}, 'Remedial lesson approved successfully');
  } catch (error) {
    console.error('Approve remedial lesson error:', error);
    return errorResponse('An error occurred while approving lesson');
  }
}

