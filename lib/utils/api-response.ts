/**
 * API Response Helpers
 */

import { NextResponse } from 'next/server';
import { HTTP_STATUS } from '@/lib/constants';
import { ApiResponse } from '@/types';

export function successResponse<T>(
  data: T,
  message?: string,
  status: number = HTTP_STATUS.OK
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(message && { message }),
    },
    { status }
  );
}

export function errorResponse(
  error: string,
  status: number = HTTP_STATUS.BAD_REQUEST
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error,
    },
    { status }
  );
}

export function unauthorizedResponse(
  error: string = 'Unauthorized'
): NextResponse<ApiResponse> {
  return errorResponse(error, HTTP_STATUS.UNAUTHORIZED);
}

export function forbiddenResponse(
  error: string = 'Forbidden'
): NextResponse<ApiResponse> {
  return errorResponse(error, HTTP_STATUS.FORBIDDEN);
}

export function notFoundResponse(
  error: string = 'Not found'
): NextResponse<ApiResponse> {
  return errorResponse(error, HTTP_STATUS.NOT_FOUND);
}

export function serverErrorResponse(
  error: string = 'Internal server error'
): NextResponse<ApiResponse> {
  return errorResponse(error, HTTP_STATUS.INTERNAL_SERVER_ERROR);
}

