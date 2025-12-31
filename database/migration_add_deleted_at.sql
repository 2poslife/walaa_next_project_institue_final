-- Migration: Add deleted_at and deletion_note columns for soft deletes
-- This allows filtering deleted lessons without permanently removing them
-- The deletion_note field allows admins to record why a lesson was deleted

-- Add deleted_at and deletion_note to individual_lessons
ALTER TABLE individual_lessons 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS deletion_note TEXT NULL;

-- Add deleted_at and deletion_note to group_lessons
ALTER TABLE group_lessons 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS deletion_note TEXT NULL;

-- Add deleted_at and deletion_note to remedial_lessons
ALTER TABLE remedial_lessons 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS deletion_note TEXT NULL;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_individual_lessons_deleted_at ON individual_lessons(deleted_at);
CREATE INDEX IF NOT EXISTS idx_group_lessons_deleted_at ON group_lessons(deleted_at);
CREATE INDEX IF NOT EXISTS idx_remedial_lessons_deleted_at ON remedial_lessons(deleted_at);

