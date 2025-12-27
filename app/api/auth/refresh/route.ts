/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */

import { NextRequest } from 'next/server';
import { verifyRefreshToken, generateAccessToken } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/utils/api-response';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return errorResponse('Refresh token is required');
    }

    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken);

    // Generate new access token
    const accessToken = generateAccessToken(payload);

    return successResponse(
      { accessToken },
      'Token refreshed successfully'
    );
  } catch (error) {
    return unauthorizedResponse('Invalid or expired refresh token');
  }
}

