import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/utils/get-user-from-request';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/lib/utils/api-response';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return unauthorizedResponse('Authentication required');
    if (user.role !== 'admin' && user.role !== 'subAdmin') {
      return forbiddenResponse('Admin access required');
    }

    const id = parseInt(params.id, 10);
    const { error } = await supabaseAdmin
      .from('group_pricing_tiers')
      .delete()
      .eq('id', id);

    if (error) return errorResponse('Failed to delete tier');
    return successResponse({}, 'Tier deleted');
  } catch (e) {
    console.error('Delete tier error:', e);
    return errorResponse('An error occurred while deleting tier');
  }
}


