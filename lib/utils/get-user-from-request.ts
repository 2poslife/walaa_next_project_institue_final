/**
 * Extract user information from request headers (set by middleware)
 */

import { NextRequest } from 'next/server';
import { JWTPayload } from '@/lib/auth';

export function getUserFromRequest(request: NextRequest): JWTPayload | null {
  const userId = request.headers.get('x-user-id');
  const username = request.headers.get('x-username');
  const role = request.headers.get('x-role');

  if (!userId || !username || !role) {
    return null;
  }

  return {
    userId: parseInt(userId, 10),
    username,
    role: role as JWTPayload['role'],
  };
}

