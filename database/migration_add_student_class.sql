-- Migration: Add class column to students table
-- Run this in your Supabase SQL Editor

-- Add class column to students table
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS class VARCHAR(50);

-- Add comment to explain the column
COMMENT ON COLUMN students.class IS 'Class/grade (e.g., أول, ثاني, ثالث, etc.)';

