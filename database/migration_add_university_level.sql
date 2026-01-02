-- Migration: Add 'جامعي' (University) education level
-- This level is only available for individual lessons, not group lessons
-- Price per hour: 140 for individual lessons

DO $$
DECLARE
    v_level_id INTEGER;
BEGIN
    -- Check if the education level already exists
    SELECT id INTO v_level_id
    FROM education_levels
    WHERE name_ar = 'جامعي'
    LIMIT 1;

    -- If it doesn't exist, insert it
    IF v_level_id IS NULL THEN
        INSERT INTO education_levels (name_ar, name_en)
        VALUES ('جامعي', 'University')
        RETURNING id INTO v_level_id;
    END IF;

    -- Insert pricing for individual lessons only (140 per hour)
    -- Note: We do NOT add group pricing, so this level won't be available for group lessons
    INSERT INTO pricing (education_level_id, lesson_type, price_per_hour)
    VALUES (v_level_id, 'individual', 140.00)
    ON CONFLICT (education_level_id, lesson_type) 
    DO UPDATE SET price_per_hour = 140.00;
END $$;

