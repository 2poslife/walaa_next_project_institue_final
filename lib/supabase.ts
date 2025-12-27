/**
 * Supabase Client Configuration
 */

import { createClient } from '@supabase/supabase-js';
import { config } from './config';

// Client-side Supabase client (for browser)
export const supabase = createClient(
  config.supabase.url,
  config.supabase.anonKey
);

// Server-side Supabase client (for API routes with service role)
export const supabaseAdmin = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Database types (you can generate these from Supabase CLI)
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: number;
          username: string;
          password_hash: string;
          role: 'admin' | 'subAdmin' | 'teacher';
          is_active: boolean;
        };
        Insert: {
          id?: number;
          username: string;
          password_hash: string;
          role: 'admin' | 'subAdmin' | 'teacher';
          is_active?: boolean;
        };
        Update: {
          id?: number;
          username?: string;
          password_hash?: string;
          role?: 'admin' | 'subAdmin' | 'teacher';
          is_active?: boolean;
        };
      };
      teachers: {
        Row: {
          id: number;
          user_id: number;
          full_name: string;
          phone: string | null;
        };
        Insert: {
          id?: number;
          user_id: number;
          full_name: string;
          phone?: string | null;
        };
        Update: {
          id?: number;
          user_id?: number;
          full_name?: string;
          phone?: string | null;
        };
      };
      education_levels: {
        Row: {
          id: number;
          name_ar: string;
          name_en: string;
        };
        Insert: {
          id?: number;
          name_ar: string;
          name_en: string;
        };
        Update: {
          id?: number;
          name_ar?: string;
          name_en?: string;
        };
      };
      students: {
        Row: {
          id: number;
          full_name: string;
          parent_contact: string | null;
          education_level_id: number | null;
        };
        Insert: {
          id?: number;
          full_name: string;
          parent_contact?: string | null;
          education_level_id?: number | null;
        };
        Update: {
          id?: number;
          full_name?: string;
          parent_contact?: string | null;
          education_level_id?: number | null;
        };
      };
      pricing: {
        Row: {
          id: number;
          education_level_id: number;
          lesson_type: 'individual' | 'group';
          price_per_hour: number;
        };
        Insert: {
          id?: number;
          education_level_id: number;
          lesson_type: 'individual' | 'group';
          price_per_hour: number;
        };
        Update: {
          id?: number;
          education_level_id?: number;
          lesson_type?: 'individual' | 'group';
          price_per_hour?: number;
        };
      };
      individual_lessons: {
        Row: {
          id: number;
          teacher_id: number;
          student_id: number;
          education_level_id: number;
          date: string;
          hours: number;
          approved: boolean;
          total_cost: number | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          teacher_id: number;
          student_id: number;
          education_level_id: number;
          date: string;
          hours: number;
          approved?: boolean;
          total_cost?: number | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          teacher_id?: number;
          student_id?: number;
          education_level_id?: number;
          date?: string;
          hours?: number;
          approved?: boolean;
          total_cost?: number | null;
          created_at?: string;
        };
      };
      group_lessons: {
        Row: {
          id: number;
          teacher_id: number;
          education_level_id: number;
          date: string;
          hours: number;
          approved: boolean;
          total_cost: number | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          teacher_id: number;
          education_level_id: number;
          date: string;
          hours: number;
          approved?: boolean;
          total_cost?: number | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          teacher_id?: number;
          education_level_id?: number;
          date?: string;
          hours?: number;
          approved?: boolean;
          total_cost?: number | null;
          created_at?: string;
        };
      };
      group_lesson_students: {
        Row: {
          group_lesson_id: number;
          student_id: number;
        };
        Insert: {
          group_lesson_id: number;
          student_id: number;
        };
        Update: {
          group_lesson_id?: number;
          student_id?: number;
        };
      };
      payments: {
        Row: {
          id: number;
          student_id: number;
          amount: number;
          payment_date: string;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          student_id: number;
          amount: number;
          payment_date?: string;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          student_id?: number;
          amount?: number;
          payment_date?: string;
          note?: string | null;
          created_at?: string;
        };
      };
    };
  };
};

