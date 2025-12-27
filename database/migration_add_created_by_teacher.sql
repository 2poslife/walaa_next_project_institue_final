-- Migration: Add created_by_teacher_id column to students table
-- Run this in your Supabase SQL Editor

-- Add created_by_teacher_id column to students table
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS created_by_teacher_id INT REFERENCES teachers(id) ON DELETE SET NULL;

-- Add comment to explain the column
COMMENT ON COLUMN students.created_by_teacher_id IS 'ID of the teacher who added this student';

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_students_created_by_teacher ON students(created_by_teacher_id);


