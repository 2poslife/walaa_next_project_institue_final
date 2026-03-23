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

    // Approve lesson (price remains fixed for remedial lessons)
    const { error: updateError } = await supabaseAdmin
      .from('remedial_lessons')
      .update({ 
        approved: true,
        price_locked: true,
      })
      .eq('id', lessonId);

    if (updateError) {
      return errorResponse('Failed to approve remedial lesson');
    }

    return successResponse({}, 'Remedial lesson approved successfully');
  } catch (error) {
    console.error('Approve remedial lesson error:', error);
    return errorResponse('An error occurred while approving lesson');
  }
}

