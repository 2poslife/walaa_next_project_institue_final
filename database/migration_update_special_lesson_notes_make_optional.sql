-- Migration: Make education_level_id and class optional in special_lesson_notes
-- Run this in your Supabase SQL Editor if the table already exists
-- This is needed if you created the table with NOT NULL constraints and need to change them

-- Make education_level_id nullable (only if NOT NULL constraint exists)
DO $$ 
BEGIN
    -- Check if column exists and has NOT NULL constraint
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'special_lesson_notes' 
        AND column_name = 'education_level_id'
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE special_lesson_notes 
        ALTER COLUMN education_level_id DROP NOT NULL;
    END IF;
END $$;

-- Make class nullable (only if NOT NULL constraint exists)
DO $$ 
BEGIN
    -- Check if column exists and has NOT NULL constraint
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'special_lesson_notes' 
        AND column_name = 'class'
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE special_lesson_notes 
        ALTER COLUMN class DROP NOT NULL;
    END IF;
END $$;







