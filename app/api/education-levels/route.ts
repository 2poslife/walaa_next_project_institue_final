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

    console.log('[EducationLevels API] Returning levels:', {
      count: levels?.length ?? 0,
      names: (levels || []).map((level) => level?.name_ar || level?.name_en || `id:${level?.id}`),
    });

    const response = successResponse(levels);
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    response.headers.set('Surrogate-Control', 'no-store');
    return response;
  } catch (error) {
    console.error('Get education levels error:', error);
    return errorResponse('An error occurred while fetching education levels');
  }
}

