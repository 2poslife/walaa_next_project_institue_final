/**
 * GET /api/pricing - Get all pricing rules
 * POST /api/pricing - Add/update pricing (Admin only)
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

    const { data: pricing, error } = await supabaseAdmin
      .from('pricing')
      .select(`
        *,
        education_level:education_levels(id, name_ar, name_en)
      `)
      .order('education_level_id', { ascending: true });

    if (error) {
      return errorResponse('Failed to fetch pricing');
    }

    return successResponse(pricing);
  } catch (error) {
    console.error('Get pricing error:', error);
    return errorResponse('An error occurred while fetching pricing');
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user || (user.role !== 'admin' && user.role !== 'subAdmin')) {
      return unauthorizedResponse('Admin access required');
    }

    const body = await request.json();
    const { education_level_id, lesson_type, price_per_hour } = body;

    if (!education_level_id || !lesson_type || !price_per_hour) {
      return errorResponse('All fields are required');
    }

    // Check if pricing already exists
    const { data: existing } = await supabaseAdmin
      .from('pricing')
      .select('id')
      .eq('education_level_id', education_level_id)
      .eq('lesson_type', lesson_type)
      .single();

    let result;
    if (existing) {
      // Update existing
      const { data, error } = await supabaseAdmin
        .from('pricing')
        .update({ price_per_hour: parseFloat(price_per_hour) })
        .eq('id', existing.id)
        .select()
        .single();
      result = { data, error };
    } else {
      // Create new
      const { data, error } = await supabaseAdmin
        .from('pricing')
        .insert({
          education_level_id,
          lesson_type,
          price_per_hour: parseFloat(price_per_hour),
        })
        .select()
        .single();
      result = { data, error };
    }

    if (result.error || !result.data) {
      return errorResponse('Failed to save pricing');
    }

    return successResponse(result.data, 'Pricing saved successfully');
  } catch (error) {
    console.error('Save pricing error:', error);
    return errorResponse('An error occurred while saving pricing');
  }
}

