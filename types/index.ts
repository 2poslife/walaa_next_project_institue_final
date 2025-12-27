/**
 * TypeScript Type Definitions
 */

import { USER_ROLES, LESSON_TYPES } from '@/lib/constants';

// User Types
export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];
export type LessonType = typeof LESSON_TYPES[keyof typeof LESSON_TYPES];

export interface User {
  id: number;
  username: string;
  role: UserRole;
  is_active: boolean;
  created_at?: string;
}

export interface Teacher {
  id: number;
  user_id: number;
  full_name: string;
  phone: string | null;
  user?: User;
}

export interface EducationLevel {
  id: number;
  name_ar: string;
  name_en: string;
}

export interface Student {
  id: number;
  full_name: string;
  parent_contact: string | null;
  education_level_id: number | null;
  class?: string | null; // Class/grade (e.g., 'أول', 'ثاني', 'ثالث', etc.)
  created_by_teacher_id?: number | null;
  education_level?: EducationLevel;
  created_by_teacher?: {
    id: number;
    full_name: string;
  } | null;
}

export interface Pricing {
  id: number;
  education_level_id: number;
  lesson_type: LessonType;
  price_per_hour: number;
  education_level?: EducationLevel;
}

export interface IndividualLesson {
  id: number;
  teacher_id: number;
  student_id: number;
  education_level_id: number;
  date: string;
  start_time?: string | null; // Lesson start time (HH:MM format)
  hours: number;
  approved: boolean;
  total_cost: number | null;
  price_locked?: boolean;
  created_at: string;
  teacher?: Teacher;
  student?: Student;
  education_level?: EducationLevel;
}

export interface GroupLesson {
  id: number;
  teacher_id: number;
  education_level_id: number;
  date: string;
  start_time?: string | null; // Lesson start time (HH:MM format)
  hours: number;
  approved: boolean;
  total_cost: number | null;
  price_locked?: boolean;
  created_at: string;
  teacher?: Teacher;
  education_level?: EducationLevel;
  students?: Student[];
}

export interface RemedialLesson {
  id: number;
  teacher_id: number;
  student_id: number;
  date: string;
  start_time?: string | null; // Lesson start time (HH:MM format)
  hours: number;
  approved: boolean;
  total_cost: number | null;
  price_locked?: boolean;
  created_at: string;
  teacher?: Teacher;
  student?: Student;
}

export interface GroupPricingTier {
  id: number;
  education_level_id: number;
  student_count: number;
  total_price: number;
  price_per_student: number | null;
  education_level?: EducationLevel;
}

export interface Payment {
  id: number;
  student_id: number;
  amount: number;
  payment_date: string;
  note: string | null;
  created_at: string;
  student?: Student;
}

// API Request/Response Types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
  teacher?: Teacher;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Statistics Types
export interface TeacherStats {
  teacher_id: number;
  total_group_hours: number;
  total_individual_hours: number;
  hours_by_level: {
    level_id: number;
    level_name: string;
    group_hours: number;
    individual_hours: number;
  }[];
  total_earnings: number;
  pending_lessons_count: number;
}

export interface StudentStats {
  student_id: number;
  total_individual_hours: number;
  total_group_hours: number;
  total_paid: number;
  total_cost: number;
  remaining_balance: number;
  payment_history: Payment[];
}

export interface LevelStats {
  level_id: number;
  level_name: string;
  total_hours: number;
  total_revenue: number;
}

export interface GlobalStats {
  total_lessons: number;
  total_teachers: number;
  total_students: number;
  monthly_income: number;
}

// Filter Types
export interface LessonFilters {
  date_from?: string;
  date_to?: string;
  teacher_id?: number;
  student_id?: number;
  education_level_id?: number;
  approved?: boolean;
  page?: number;
  limit?: number;
}

