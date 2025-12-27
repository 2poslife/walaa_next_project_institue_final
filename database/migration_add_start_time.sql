-- Migration: Add start_time column to individual_lessons and group_lessons
-- Run this in your Supabase SQL Editor

-- Add start_time column to individual_lessons
ALTER TABLE individual_lessons 
ADD COLUMN IF NOT EXISTS start_time TIME;

-- Add start_time column to group_lessons
ALTER TABLE group_lessons 
ADD COLUMN IF NOT EXISTS start_time TIME;

-- Add index for better performance when querying by start_time
CREATE INDEX IF NOT EXISTS idx_individual_lessons_start_time ON individual_lessons(start_time);
CREATE INDEX IF NOT EXISTS idx_group_lessons_start_time ON group_lessons(start_time);

