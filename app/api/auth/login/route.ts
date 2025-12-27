/**
 * POST /api/auth/login
 * Login endpoint for admin and teachers
 */

import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { comparePassword, generateTokenPair } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/utils/api-response';
import { LoginResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return errorResponse('Username and password are required');
    }

    // Get user from database
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('is_active', true)
      .single();

    if (userError || !user) {
      return unauthorizedResponse('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      return unauthorizedResponse('Invalid credentials');
    }

    // Get teacher info if role is teacher
    let teacher = null;
    if (user.role === 'teacher') {
      const { data: teacherData } = await supabaseAdmin
        .from('teachers')
        .select('*')
        .eq('user_id', user.id)
        .single();
      teacher = teacherData;
    }

    // Generate tokens
    const tokens = generateTokenPair({
      userId: user.id,
      username: user.username,
      role: user.role,
    });

    const response: LoginResponse = {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        is_active: user.is_active,
      },
      ...(teacher && { teacher }),
    };

    return successResponse(response, 'Login successful');
  } catch (error) {
    console.error('Login error:', error);
    return errorResponse('An error occurred during login');
  }
}

