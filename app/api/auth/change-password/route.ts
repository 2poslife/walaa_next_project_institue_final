/**
 * POST /api/auth/change-password
 * Change password for authenticated user
 */

import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/utils/get-user-from-request';
import { comparePassword, hashPassword } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/utils/api-response';

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return errorResponse('Current password and new password are required');
    }

    if (newPassword.length < 6) {
      return errorResponse('New password must be at least 6 characters');
    }

    // Get current user from database
    const { data: currentUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', user.userId)
      .single();

    if (userError || !currentUser) {
      return errorResponse('User not found');
    }

    // Verify current password
    const isPasswordValid = await comparePassword(
      currentPassword,
      currentUser.password_hash
    );
    if (!isPasswordValid) {
      return errorResponse('Current password is incorrect');
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ password_hash: newPasswordHash })
      .eq('id', user.userId);

    if (updateError) {
      return errorResponse('Failed to update password');
    }

    return successResponse({}, 'Password changed successfully');
  } catch (error) {
    console.error('Change password error:', error);
    return errorResponse('An error occurred while changing password');
  }
}

