/**
 * GET /api/payments - Get all payments
 * POST /api/payments - Add new payment
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

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('student_id');

    let query = supabaseAdmin
      .from('payments')
      .select(`
        *,
        student:students(id, full_name, parent_contact)
      `)
      .order('payment_date', { ascending: false });

    if (studentId) {
      query = query.eq('student_id', parseInt(studentId, 10));
    }

    const { data: payments, error } = await query;

    if (error) {
      return errorResponse('Failed to fetch payments');
    }

    return successResponse(payments);
  } catch (error) {
    console.error('Get payments error:', error);
    return errorResponse('An error occurred while fetching payments');
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user || (user.role !== 'admin' && user.role !== 'subAdmin')) {
      return unauthorizedResponse('Admin access required');
    }

    const body = await request.json();
    const { student_id, amount, payment_date, note } = body;

    if (!student_id || !amount) {
      return errorResponse('Student ID and amount are required');
    }

    const { data: payment, error } = await supabaseAdmin
      .from('payments')
      .insert({
        student_id,
        amount: parseFloat(amount),
        payment_date: payment_date || new Date().toISOString().split('T')[0],
        note: note || null,
      })
      .select()
      .single();

    if (error || !payment) {
      return errorResponse('Failed to create payment');
    }

    return successResponse(payment, 'Payment created successfully');
  } catch (error) {
    console.error('Create payment error:', error);
    return errorResponse('An error occurred while creating payment');
  }
}

