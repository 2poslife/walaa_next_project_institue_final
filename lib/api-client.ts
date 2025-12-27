/**
 * Client-side API utilities
 */

import { API_ROUTES } from './constants';
import { ApiResponse } from '@/types';

// Use relative URLs in the browser to avoid hard-coding localhost/production domains.
// On the server (SSR or route handlers), fall back to NEXT_PUBLIC_APP_URL or localhost.
const API_BASE_URL =
  typeof window === 'undefined'
    ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
    : '';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Get auth token from localStorage
 * Checks both 'accessToken' and 'access_token' for compatibility
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  // Check both key names for compatibility
  return localStorage.getItem('accessToken') || localStorage.getItem('access_token');
}

/**
 * Get refresh token from localStorage
 */
export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('refreshToken');
}

/**
 * Set auth tokens in localStorage
 */
export function setAuthTokens(accessToken: string, refreshToken: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
}

/**
 * Remove auth tokens from localStorage
 * Clears both 'accessToken' and 'access_token' for compatibility
 * Preserves 'remembered_username' if it exists
 */
export function clearAuthTokens(): void {
  if (typeof window === 'undefined') return;
  const rememberedUsername = localStorage.getItem('remembered_username');
  localStorage.removeItem('accessToken');
  localStorage.removeItem('access_token'); // Also clear this if it exists
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  // Restore remembered username if it existed
  if (rememberedUsername) {
    localStorage.setItem('remembered_username', rememberedUsername);
  }
}

/**
 * Refresh access token
 */
async function refreshAccessToken(): Promise<string> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    console.log('[API Client] No refresh token available');
    throw new ApiError('No refresh token available', 401);
  }

  console.log('[API Client] Attempting to refresh token...');
  const response = await fetch(`${API_BASE_URL}${API_ROUTES.AUTH.REFRESH}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken }),
  });

  const data = await response.json();
  console.log('[API Client] Refresh response:', { status: response.status, success: data.success, error: data.error });

  if (!response.ok || !data.success) {
    // Don't clear tokens here - let the caller handle it
    // This prevents premature token clearing if refresh fails for network reasons
    console.error('[API Client] Token refresh failed:', data.error);
    throw new ApiError(data.error || 'Failed to refresh token', response.status);
  }

  // Update tokens with new access token, keep the same refresh token
  if (data.data && data.data.accessToken) {
    console.log('[API Client] Token refresh successful, updating tokens');
    setAuthTokens(data.data.accessToken, refreshToken);
    return data.data.accessToken;
  }
  
  // If no access token in response, throw error
  console.error('[API Client] Invalid refresh response - no access token');
  throw new ApiError('Invalid refresh response', 500);
}

/**
 * Make authenticated API request
 */
interface ApiRequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

async function apiRequest<T>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<ApiResponse<T>> {
  const { requiresAuth = true, ...fetchOptions } = options;
  let token = requiresAuth ? getAuthToken() : null;

  // If no token, don't make the request - return error immediately
  // This prevents unnecessary API calls that will fail
  if (requiresAuth && !token) {
    console.log('[API Client] No token available for request to', endpoint);
    return {
      success: false,
      error: 'Authentication required',
    } as ApiResponse<T>;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string> || {}),
  };

  if (requiresAuth && token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  console.log('[API Client] Making request to', endpoint, 'with token');
  let response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...fetchOptions,
    headers: headers as HeadersInit,
  });
  console.log('[API Client] Response status:', response.status, 'for', endpoint);

  // Handle 401 (Unauthorized) - try to refresh token
  if (response.status === 401 && requiresAuth && token) {
    console.log('[API Client] Received 401, attempting token refresh...');
    // Don't read the response body yet - we'll retry the request
    try {
      token = await refreshAccessToken();
      console.log('[API Client] Token refresh successful, retrying request...');
      headers['Authorization'] = `Bearer ${token}`;
      // Retry the request with the new token
      response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...fetchOptions,
        headers: headers as HeadersInit,
      });
      
      // If retry still fails with 401, the token refresh didn't help
      // This could mean the refresh token is also expired
      if (response.status === 401) {
        console.log('[API Client] Retry still returned 401, clearing tokens');
        clearAuthTokens();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('auth-token-cleared'));
        }
        // Return a generic error response instead of throwing
        // This allows the component to handle it gracefully
        return {
          success: false,
          error: 'Session expired',
        } as ApiResponse<T>;
      }
      // If retry fails with 403, it's a permission issue (not auth issue)
      // Don't clear tokens for 403, just throw the error
      if (response.status === 403) {
        try {
          const data = await response.json();
          throw new ApiError(data.error || 'Access forbidden', 403);
        } catch {
          throw new ApiError('Access forbidden', 403);
        }
      }
      console.log('[API Client] Retry successful with status:', response.status);
    } catch (error) {
      console.error('[API Client] Token refresh failed:', error);
      // If it's already an ApiError from refresh (e.g., "Invalid or expired refresh token")
      if (error instanceof ApiError) {
        // Only clear tokens if it's an authentication error (401, expired, etc.)
        // Don't clear tokens for network errors or other issues
        const isAuthError = error.status === 401 || 
                           error.message.includes('refresh token') || 
                           error.message.includes('expired') ||
                           error.message.includes('Invalid');
        
        if (isAuthError) {
          console.log('[API Client] Authentication error detected, clearing tokens');
          clearAuthTokens();
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('auth-token-cleared'));
          }
        }
        // Return error response instead of throwing to avoid displaying error message
        return {
          success: false,
          error: isAuthError ? 'Session expired' : error.message,
        } as ApiResponse<T>;
      }
      // For non-ApiError exceptions (network errors, etc.), don't clear tokens
      // Just return an error response
      console.error('[API Client] Non-auth error during refresh:', error);
      return {
        success: false,
        error: 'Network error. Please try again.',
      } as ApiResponse<T>;
    }
  } else if (response.status === 401 && requiresAuth && !token) {
    // No token at all, clear everything
    console.log('[API Client] No token provided for protected route');
    clearAuthTokens();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('auth-token-cleared'));
    }
    // Return error response instead of throwing
    return {
      success: false,
      error: 'Authentication required',
    } as ApiResponse<T>;
  }

  // Handle 403 (Forbidden) - permission issue, don't clear tokens
  if (response.status === 403) {
    try {
      const data = await response.json();
      throw new ApiError(data.error || 'Access forbidden', 403);
    } catch (parseError) {
      throw new ApiError('Access forbidden', 403);
    }
  }

  // Parse response body
  let data;
  try {
    const text = await response.text();
    data = text ? JSON.parse(text) : {};
  } catch (parseError) {
    // If parsing fails, create a basic error response
    console.error('[API Client] Failed to parse response:', parseError);
    throw new ApiError(
      `Request failed with status ${response.status}`,
      response.status
    );
  }

  if (!response.ok) {
    console.error('[API Client] Request failed:', response.status, data);
    throw new ApiError(
      data.error || 'Request failed',
      response.status,
      data
    );
  }

  return data;
}

/**
 * API client methods
 */
export const api = {
  // Auth
  async login(username: string, password: string) {
    const response = await apiRequest(API_ROUTES.AUTH.LOGIN, {
      method: 'POST',
      body: JSON.stringify({ username, password }),
      requiresAuth: false,
    });
    if (response.success && response.data) {
      const loginData = response.data as { accessToken: string; refreshToken: string; user: any };
      setAuthTokens(loginData.accessToken, loginData.refreshToken);
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(loginData.user));
      }
    }
    return response;
  },

  async logout() {
    await apiRequest(API_ROUTES.AUTH.LOGOUT, { method: 'POST' });
    clearAuthTokens();
  },

  async getProfile() {
    return apiRequest(API_ROUTES.AUTH.PROFILE);
  },

  async updateProfile(data: any) {
    return apiRequest(API_ROUTES.AUTH.PROFILE, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async changePassword(currentPassword: string, newPassword: string) {
    return apiRequest(API_ROUTES.AUTH.CHANGE_PASSWORD, {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  // Teachers
  async getTeachers() {
    return apiRequest(API_ROUTES.TEACHERS.BASE);
  },

  async getTeacher(id: number) {
    return apiRequest(API_ROUTES.TEACHERS.BY_ID(id));
  },

  async createTeacher(data: any) {
    return apiRequest(API_ROUTES.TEACHERS.BASE, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateTeacher(id: number, data: any) {
    return apiRequest(API_ROUTES.TEACHERS.BY_ID(id), {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteTeacher(id: number) {
    return apiRequest(API_ROUTES.TEACHERS.BY_ID(id), {
      method: 'DELETE',
    });
  },

  // Students
  async getStudents() {
    return apiRequest(API_ROUTES.STUDENTS.BASE);
  },

  async getStudent(id: number) {
    return apiRequest(API_ROUTES.STUDENTS.BY_ID(id));
  },

  async createStudent(data: any) {
    return apiRequest(API_ROUTES.STUDENTS.BASE, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateStudent(id: number, data: any) {
    return apiRequest(API_ROUTES.STUDENTS.BY_ID(id), {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteStudent(id: number) {
    return apiRequest(API_ROUTES.STUDENTS.BY_ID(id), {
      method: 'DELETE',
    });
  },

  // Lessons
  async getIndividualLessons(filters?: any) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    const query = params.toString();
    return apiRequest(`${API_ROUTES.LESSONS.INDIVIDUAL.BASE}${query ? `?${query}` : ''}`);
  },

  async createIndividualLesson(data: any) {
    return apiRequest(API_ROUTES.LESSONS.INDIVIDUAL.BASE, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateIndividualLesson(id: number, data: any) {
    return apiRequest(API_ROUTES.LESSONS.INDIVIDUAL.BY_ID(id), {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteIndividualLesson(id: number) {
    return apiRequest(API_ROUTES.LESSONS.INDIVIDUAL.BY_ID(id), {
      method: 'DELETE',
    });
  },

  async approveIndividualLesson(id: number) {
    return apiRequest(API_ROUTES.LESSONS.INDIVIDUAL.APPROVE(id), {
      method: 'POST',
    });
  },

  async approveAllIndividualLessons() {
    return apiRequest(API_ROUTES.LESSONS.INDIVIDUAL.BULK_APPROVE, {
      method: 'POST',
    });
  },

  async getGroupLessons(filters?: any) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    const query = params.toString();
    return apiRequest(`${API_ROUTES.LESSONS.GROUP.BASE}${query ? `?${query}` : ''}`);
  },

  async createGroupLesson(data: any) {
    return apiRequest(API_ROUTES.LESSONS.GROUP.BASE, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateGroupLesson(id: number, data: any) {
    return apiRequest(API_ROUTES.LESSONS.GROUP.BY_ID(id), {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteGroupLesson(id: number) {
    return apiRequest(API_ROUTES.LESSONS.GROUP.BY_ID(id), {
      method: 'DELETE',
    });
  },

  async approveGroupLesson(id: number) {
    return apiRequest(API_ROUTES.LESSONS.GROUP.APPROVE(id), {
      method: 'POST',
    });
  },

  async approveAllGroupLessons() {
    return apiRequest(API_ROUTES.LESSONS.GROUP.BULK_APPROVE, {
      method: 'POST',
    });
  },

  // Remedial Lessons
  async getRemedialLessons(filters?: any) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    const query = params.toString();
    return apiRequest(`${API_ROUTES.LESSONS.REMEDIAL.BASE}${query ? `?${query}` : ''}`);
  },

  async createRemedialLesson(data: any) {
    return apiRequest(API_ROUTES.LESSONS.REMEDIAL.BASE, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateRemedialLesson(id: number, data: any) {
    return apiRequest(API_ROUTES.LESSONS.REMEDIAL.BY_ID(id), {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteRemedialLesson(id: number) {
    return apiRequest(API_ROUTES.LESSONS.REMEDIAL.BY_ID(id), {
      method: 'DELETE',
    });
  },

  async approveRemedialLesson(id: number) {
    return apiRequest(API_ROUTES.LESSONS.REMEDIAL.APPROVE(id), {
      method: 'POST',
    });
  },

  // Payments
  async getPayments(studentId?: number) {
    const query = studentId ? `?student_id=${studentId}` : '';
    return apiRequest(`${API_ROUTES.PAYMENTS.BASE}${query}`);
  },

  async createPayment(data: any) {
    return apiRequest(API_ROUTES.PAYMENTS.BASE, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updatePayment(id: number, data: any) {
    return apiRequest(API_ROUTES.PAYMENTS.BY_ID(id), {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deletePayment(id: number) {
    return apiRequest(API_ROUTES.PAYMENTS.BY_ID(id), {
      method: 'DELETE',
    });
  },

  // Pricing
  async getPricing() {
    return apiRequest(API_ROUTES.PRICING.BASE);
  },

  async getGroupPricingTiers() {
    return apiRequest(API_ROUTES.GROUP_PRICING_TIERS.BASE);
  },

  async saveGroupPricingTier(data: any) {
    return apiRequest(API_ROUTES.GROUP_PRICING_TIERS.BASE, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async deleteGroupPricingTier(id: number) {
    return apiRequest(`${API_ROUTES.GROUP_PRICING_TIERS.BASE}/${id}`, {
      method: 'DELETE',
    });
  },

  async savePricing(data: any) {
    return apiRequest(API_ROUTES.PRICING.BASE, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Education Levels
  async getEducationLevels() {
    return apiRequest('/api/education-levels');
  },
};

