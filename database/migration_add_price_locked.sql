-- Migration: Add price_locked flag to prevent cost recalculation after payment
-- Run this in your Supabase SQL Editor

-- Add price_locked column to individual_lessons
ALTER TABLE individual_lessons 
ADD COLUMN IF NOT EXISTS price_locked BOOLEAN DEFAULT FALSE;

-- Add price_locked column to group_lessons
ALTER TABLE group_lessons 
ADD COLUMN IF NOT EXISTS price_locked BOOLEAN DEFAULT FALSE;

-- Update trigger function for individual lessons to respect price_locked flag
CREATE OR REPLACE FUNCTION update_individual_lesson_cost()
RETURNS TRIGGER AS $$
BEGIN
    -- Only recalculate cost if price is NOT locked
    IF NOT COALESCE(NEW.price_locked, FALSE) THEN
        NEW.total_cost = calculate_lesson_cost(
            NEW.education_level_id,
            'individual',
            NEW.hours
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update trigger function for group lessons to respect price_locked flag
CREATE OR REPLACE FUNCTION update_group_lesson_cost()
RETURNS TRIGGER AS $$
BEGIN
    -- Only recalculate cost if price is NOT locked
    IF NOT COALESCE(NEW.price_locked, FALSE) THEN
        NEW.total_cost = calculate_lesson_cost(
            NEW.education_level_id,
            'group',
            NEW.hours
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add index for better performance when querying locked lessons
CREATE INDEX IF NOT EXISTS idx_individual_lessons_price_locked ON individual_lessons(price_locked);
CREATE INDEX IF NOT EXISTS idx_group_lessons_price_locked ON group_lessons(price_locked);

