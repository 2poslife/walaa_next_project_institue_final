export const dynamic = 'force-dynamic';
/**
 * GET /api/education-levels - Get all education levels
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

    const { data: levels, error } = await supabaseAdmin
      .from('education_levels')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      return errorResponse('Failed to fetch education levels');
    }

    const res = successResponse(levels);
    res.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate');
    return res;
  } catch (error) {
    console.error('Get education levels error:', error);
    return errorResponse('An error occurred while fetching education levels');
  }
}
