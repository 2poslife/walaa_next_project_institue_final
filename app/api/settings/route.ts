import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/utils/get-user-from-request';
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
} from '@/lib/utils/api-response';

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const isAdmin = user.role === 'admin' || user.role === 'subAdmin';

    // Admins can see all settings; teachers get a limited subset (currently only teachers_can_add_students)
    if (isAdmin) {
      const { data: settings, error } = await supabaseAdmin
        .from('app_settings')
        .select('key, value, description')
        .order('key');

      if (error) {
        return errorResponse('Failed to fetch settings');
      }

      // Convert array to object for easier access
      const settingsObj: Record<string, any> = {};
      settings?.forEach((setting) => {
        // Parse boolean values
        if (setting.value === 'true' || setting.value === 'false') {
          settingsObj[setting.key] = setting.value === 'true';
        } else {
          settingsObj[setting.key] = setting.value;
        }
      });

      return successResponse(settingsObj, 'Settings fetched successfully');
    }

    // Teacher (or other roles): return safe settings (read-only for them)
    const { data: teacherSettings, error: teacherSettingError } = await supabaseAdmin
      .from('app_settings')
      .select('key, value')
      .in('key', ['teachers_can_add_students', 'lesson_submission_deadline_day', 'lesson_submission_deadline_inclusive']);

    if (teacherSettingError) {
      return errorResponse('Failed to fetch settings');
    }

    const teachersCanAddStudents =
      teacherSettings?.find((s) => s.key === 'teachers_can_add_students')?.value !== 'false';
    const deadlineDay = teacherSettings?.find((s) => s.key === 'lesson_submission_deadline_day')?.value ?? '2';
    const deadlineInclusive = teacherSettings?.find((s) => s.key === 'lesson_submission_deadline_inclusive')?.value !== 'false';

    return successResponse(
      {
        teachers_can_add_students: teachersCanAddStudents,
        lesson_submission_deadline_day: deadlineDay,
        lesson_submission_deadline_inclusive: deadlineInclusive,
      },
      'Settings fetched successfully'
    );
  } catch (error) {
    console.error('Get settings error:', error);
    return errorResponse('An error occurred while fetching settings');
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return unauthorizedResponse();
    }

    // Only admins can update settings
    if (user.role !== 'admin' && user.role !== 'subAdmin') {
      return unauthorizedResponse('Admin access required');
    }

    const body = await request.json();
    const { key, value } = body;

    if (!key) {
      return errorResponse('Setting key is required');
    }

    // Convert boolean to string for storage
    const stringValue = typeof value === 'boolean' ? String(value) : String(value);

    const { error } = await supabaseAdmin
      .from('app_settings')
      .update({
        value: stringValue,
        updated_at: new Date().toISOString(),
        updated_by: user.userId,
      })
      .eq('key', key);

    if (error) {
      return errorResponse('Failed to update setting');
    }

    return successResponse({ key, value }, 'Setting updated successfully');
  } catch (error) {
    console.error('Update settings error:', error);
    return errorResponse('An error occurred while updating settings');
  }
}

