import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/utils/get-user-from-request';
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
} from '@/lib/utils/api-response';

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return unauthorizedResponse();
    }

    if (user.role !== 'admin' && user.role !== 'subAdmin') {
      return unauthorizedResponse('Admin access required');
    }

    // Approve all pending lessons and lock their prices
    const { error: updateError } = await supabaseAdmin
      .from('group_lessons')
      .update({ 
        approved: true,
        price_locked: true  // Lock prices when bulk approving
      })
      .eq('approved', false);

    if (updateError) {
      return errorResponse('Failed to approve lessons');
    }

    return successResponse({}, 'All pending group lessons approved');
  } catch (error) {
    console.error('Bulk approve group lessons error:', error);
    return errorResponse('An error occurred while approving lessons');
  }
}


