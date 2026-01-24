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
      .from('individual_lessons')
      .select('id, deleted_at')
      .eq('id', lessonId)
      .single();

    if (lessonError || !lesson) {
      return notFoundResponse('Lesson not found');
    }

    if (!lesson.deleted_at) {
      return successResponse({}, 'Lesson is already not deleted');
    }

    // Restore lesson: clear deleted_at and deletion_note
    const { error: updateError } = await supabaseAdmin
      .from('individual_lessons')
      .update({ 
        deleted_at: null,
        deletion_note: null
      })
      .eq('id', lessonId);

    if (updateError) {
      return errorResponse('Failed to restore lesson');
    }

    return successResponse({}, 'Lesson restored successfully');
  } catch (error) {
    console.error('Restore individual lesson error:', error);
    return errorResponse('An error occurred while restoring lesson');
  }
}















