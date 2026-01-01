-- Migration: Add deleted_at and deletion_note columns for soft deletes on students
-- This allows soft deleting students and automatically soft deleting all their lessons
-- The deletion_note field allows admins to record why a student was deleted

-- Add deleted_at and deletion_note to students table
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS deletion_note TEXT NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_students_deleted_at ON students(deleted_at);



