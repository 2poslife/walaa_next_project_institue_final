/**
 * GET /api/payments/[id] - Get payment by ID
 * PUT /api/payments/[id] - Update payment (Admin only)
 * DELETE /api/payments/[id] - Delete payment (Admin only)
 */

import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/utils/get-user-from-request';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse, forbiddenResponse } from '@/lib/utils/api-response';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const paymentId = parseInt(params.id, 10);

    const { data: payment, error } = await supabaseAdmin
      .from('payments')
      .select(`
        *,
        student:students(id, full_name, parent_contact)
      `)
      .eq('id', paymentId)
      .single();

    if (error || !payment) {
      return notFoundResponse('Payment not found');
    }

    return successResponse(payment);
  } catch (error) {
    console.error('Get payment error:', error);
    return errorResponse('An error occurred while fetching payment');
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return unauthorizedResponse('Authentication required');
    }
    if (user.role !== 'admin' && user.role !== 'subAdmin') {
      return forbiddenResponse('Admin access required');
    }

    const paymentId = parseInt(params.id, 10);
    const body = await request.json();

    const updateData: any = {};
    if (body.amount !== undefined) updateData.amount = parseFloat(body.amount);
    if (body.payment_date) updateData.payment_date = body.payment_date;
    if (body.note !== undefined) updateData.note = body.note;

    const { data: payment, error } = await supabaseAdmin
      .from('payments')
      .update(updateData)
      .eq('id', paymentId)
      .select(`
        *,
        student:students(id, full_name, parent_contact)
      `)
      .single();

    if (error || !payment) {
      return errorResponse('Failed to update payment');
    }

    return successResponse(payment, 'Payment updated successfully');
  } catch (error) {
    console.error('Update payment error:', error);
    return errorResponse('An error occurred while updating payment');
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return unauthorizedResponse('Authentication required');
    }
    if (user.role !== 'admin' && user.role !== 'subAdmin') {
      return forbiddenResponse('Admin access required');
    }

    const paymentId = parseInt(params.id, 10);

    const { error } = await supabaseAdmin
      .from('payments')
      .delete()
      .eq('id', paymentId);

    if (error) {
      return errorResponse('Failed to delete payment');
    }

    return successResponse({}, 'Payment deleted successfully');
  } catch (error) {
    console.error('Delete payment error:', error);
    return errorResponse('An error occurred while deleting payment');
  }
}

