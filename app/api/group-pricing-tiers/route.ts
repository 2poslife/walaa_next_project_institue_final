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

    const { data, error } = await supabaseAdmin
      .from('group_pricing_tiers')
      .select(`
        *,
        education_level:education_levels(id, name_ar, name_en)
      `)
      .order('education_level_id', { ascending: true })
      .order('student_count', { ascending: true });

    if (error) {
      return errorResponse('Failed to fetch group pricing tiers');
    }

    return successResponse(data);
  } catch (e) {
    console.error('Get group pricing tiers error:', e);
    return errorResponse('An error occurred while fetching group pricing tiers');
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user || (user.role !== 'admin' && user.role !== 'subAdmin')) {
      return unauthorizedResponse('Admin access required');
    }

    const body = await request.json();
    const { id, education_level_id, student_count, total_price, price_per_student } = body || {};
    if (!education_level_id || !student_count || !total_price) {
      return errorResponse('education_level_id, student_count, and total_price are required');
    }

    // Guard against duplicate (education_level_id, student_count)
    const { data: dupRows, error: dupErr } = await supabaseAdmin
      .from('group_pricing_tiers')
      .select('id')
      .eq('education_level_id', education_level_id)
      .eq('student_count', student_count);
    if (!dupErr && dupRows && dupRows.length > 0) {
      // If creating new (no id) OR updating another row that isn't the same id -> reject
      const sameRow = id && dupRows.some((r) => r.id === id);
      if (!sameRow) {
        return errorResponse('Tier for this level and student count already exists');
      }
    }

    // If ID provided, update by ID
    if (id) {
      const { data, error } = await supabaseAdmin
        .from('group_pricing_tiers')
        .update({
          education_level_id,
          student_count,
          total_price: parseFloat(total_price),
          price_per_student: price_per_student !== undefined && price_per_student !== null
            ? parseFloat(price_per_student)
            : null,
        })
        .eq('id', id)
        .select(`
          *,
          education_level:education_levels(id, name_ar, name_en)
        `)
        .single();
      if (error || !data) return errorResponse('Failed to save group pricing tier');
      return successResponse(data, 'Tier saved');
    }

    // Else create new
    const { data, error } = await supabaseAdmin
      .from('group_pricing_tiers')
      .insert({
        education_level_id,
        student_count,
        total_price: parseFloat(total_price),
        price_per_student: price_per_student !== undefined && price_per_student !== null
          ? parseFloat(price_per_student)
          : null,
      })
      .select(`
        *,
        education_level:education_levels(id, name_ar, name_en)
      `)
      .single();
    if (error || !data) return errorResponse('Failed to create group pricing tier');
    return successResponse(data, 'Tier created');
  } catch (e) {
    console.error('Save group pricing tier error:', e);
    return errorResponse('An error occurred while saving group pricing tier');
  }
}


