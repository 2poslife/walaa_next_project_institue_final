/**
 * POST /api/auth/logout
 * Logout endpoint (client should remove tokens)
 */

import { successResponse } from '@/lib/utils/api-response';

export async function POST() {
  // In a stateless JWT system, logout is handled client-side
  // by removing tokens from storage
  // You could implement token blacklisting here if needed
  return successResponse({ message: 'Logged out successfully' }, 'Logout successful');
}

