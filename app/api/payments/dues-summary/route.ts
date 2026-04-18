/**
 * GET /api/payments/dues-summary
 * Returns per-student dues calculated in the database (no need to fetch all lessons to the frontend).
 * Requires get_student_dues_summary() to be created in the DB (run database/migration_student_dues_summary.sql).
 */

import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/utils/get-user-from-request';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/utils/api-response';

export interface DuesSummaryRow {
  student_id: number;
  student_name: string;
  level_name: string;
  individual_due: number;
  group_due: number;
  remedial_due: number;
  total_due: number;
  total_paid: number;
  remaining: number;
}

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const { data, error } = await supabaseAdmin.rpc('get_student_dues_summary');

    if (error) {
      console.error('get_student_dues_summary error:', error);
      return errorResponse(
        error.code === '42883'
          ? 'Database function get_student_dues_summary not found. Run database/migration_student_dues_summary.sql in Supabase SQL Editor.'
          : 'Failed to fetch dues summary'
      );
    }

    const rows = (data || []) as DuesSummaryRow[];
    return successResponse(rows);
  } catch (err) {
    console.error('Dues summary API error:', err);
    return errorResponse('An error occurred while fetching dues summary');
  }
}
