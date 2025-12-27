-- ============================================
-- Institute Management System - Database Schema
-- ============================================
-- Run this SQL in your Supabase SQL Editor
-- ============================================

-- Drop existing tables to avoid conflicts when re-running the schema
DROP TABLE IF EXISTS group_lesson_students CASCADE;
DROP TABLE IF EXISTS group_lessons CASCADE;
DROP TABLE IF EXISTS individual_lessons CASCADE;
DROP TABLE IF EXISTS group_pricing_tiers CASCADE;
DROP TABLE IF EXISTS pricing CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS teachers CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS education_levels CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. Users Table
-- Handles all login and authentication logic
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'subAdmin', 'teacher')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Teachers Table
-- Links each teacher to their user account and stores contact info
CREATE TABLE IF NOT EXISTS teachers (
    id SERIAL PRIMARY KEY,
    user_id INT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(120) NOT NULL,
    phone VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Education Levels Table
-- Reusable for lessons, pricing, and student categorization
CREATE TABLE IF NOT EXISTS education_levels (
    id SERIAL PRIMARY KEY,
    name_ar VARCHAR(50) NOT NULL,  -- e.g. 'ابتدائي'
    name_en VARCHAR(50) NOT NULL,   -- e.g. 'Elementary'
    created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Students Table
-- Student list linked to education level (not users, since no login)
CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    parent_contact VARCHAR(100),
    education_level_id INT REFERENCES education_levels(id),
    class VARCHAR(50),  -- Class/grade (e.g., 'أول', 'ثاني', 'ثالث', etc.)
    created_at TIMESTAMP DEFAULT NOW()
);

-- Ensure student names stay unique system-wide
DO $$
BEGIN
    ALTER TABLE students
        ADD CONSTRAINT students_full_name_unique UNIQUE (full_name);
EXCEPTION
    WHEN duplicate_object THEN
        -- constraint already exists, ignore
        NULL;
END $$;

-- 5. Pricing Table
-- Defines prices for education level and lesson type combinations
CREATE TABLE IF NOT EXISTS pricing (
    id SERIAL PRIMARY KEY,
    education_level_id INT REFERENCES education_levels(id),
    lesson_type VARCHAR(20) NOT NULL CHECK (lesson_type IN ('individual', 'group')),
    price_per_hour DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(education_level_id, lesson_type)
);

-- 5b. Group Pricing Tiers
-- Allows variable group lesson pricing based on student count
CREATE TABLE IF NOT EXISTS group_pricing_tiers (
    id SERIAL PRIMARY KEY,
    education_level_id INT REFERENCES education_levels(id) ON DELETE CASCADE,
    student_count INT NOT NULL CHECK (student_count >= 2),
    total_price DECIMAL(10,2) NOT NULL,
    price_per_student DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(education_level_id, student_count)
);

-- 6. Individual Lessons Table
CREATE TABLE IF NOT EXISTS individual_lessons (
    id SERIAL PRIMARY KEY,
    teacher_id INT REFERENCES teachers(id),
    student_id INT REFERENCES students(id),
    education_level_id INT REFERENCES education_levels(id),
    date DATE NOT NULL,
    start_time TIME,  -- Lesson start time (10:00 to 23:00 in 15-minute intervals)
    hours DECIMAL(4,2) NOT NULL,
    approved BOOLEAN DEFAULT FALSE,
    total_cost DECIMAL(10,2),
    price_locked BOOLEAN DEFAULT FALSE,  -- Prevents cost recalculation when pricing changes
    seeded_by_script BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 7. Group Lessons Table
CREATE TABLE IF NOT EXISTS group_lessons (
    id SERIAL PRIMARY KEY,
    teacher_id INT REFERENCES teachers(id),
    education_level_id INT REFERENCES education_levels(id),
    date DATE NOT NULL,
    start_time TIME,  -- Lesson start time (10:00 to 23:00 in 15-minute intervals)
    hours DECIMAL(4,2) NOT NULL,
    approved BOOLEAN DEFAULT FALSE,
    total_cost DECIMAL(10,2),
    price_locked BOOLEAN DEFAULT FALSE,  -- Prevents cost recalculation when pricing changes
    seeded_by_script BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS group_lesson_students (
    group_lesson_id INT REFERENCES group_lessons(id) ON DELETE CASCADE,
    student_id INT REFERENCES students(id) ON DELETE CASCADE,
    seeded_by_script BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (group_lesson_id, student_id)
);

-- 8. Group Lesson Students Table
-- A mapping table (many-to-many) between group lessons and students
CREATE TABLE IF NOT EXISTS group_lesson_students (
    group_lesson_id INT REFERENCES group_lessons(id) ON DELETE CASCADE,
    student_id INT REFERENCES students(id) ON DELETE CASCADE,
    PRIMARY KEY (group_lesson_id, student_id)
);

-- 9. Payments Table
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    student_id INT REFERENCES students(id),
    amount DECIMAL(10,2) NOT NULL,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    note TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- Create Indexes for Better Performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_teachers_user_id ON teachers(user_id);
CREATE INDEX IF NOT EXISTS idx_students_education_level ON students(education_level_id);
CREATE INDEX IF NOT EXISTS idx_individual_lessons_teacher ON individual_lessons(teacher_id);
CREATE INDEX IF NOT EXISTS idx_individual_lessons_student ON individual_lessons(student_id);
CREATE INDEX IF NOT EXISTS idx_individual_lessons_date ON individual_lessons(date);
CREATE INDEX IF NOT EXISTS idx_individual_lessons_approved ON individual_lessons(approved);
CREATE INDEX IF NOT EXISTS idx_individual_lessons_start_time ON individual_lessons(start_time);
CREATE INDEX IF NOT EXISTS idx_group_lessons_teacher ON group_lessons(teacher_id);
CREATE INDEX IF NOT EXISTS idx_group_lessons_date ON group_lessons(date);
CREATE INDEX IF NOT EXISTS idx_group_lessons_approved ON group_lessons(approved);
CREATE INDEX IF NOT EXISTS idx_group_lessons_start_time ON group_lessons(start_time);
CREATE INDEX IF NOT EXISTS idx_payments_student ON payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_pricing_level_type ON pricing(education_level_id, lesson_type);

-- ============================================
-- Initial Data
-- ============================================

-- Insert Education Levels
INSERT INTO education_levels (name_ar, name_en) VALUES
('ابتدائي', 'Elementary'),
('إعدادي', 'Middle'),
('ثانوي', 'Secondary')
ON CONFLICT DO NOTHING;

-- Insert an initial admin account (update credentials before production)
INSERT INTO users (username, password_hash, role, is_active)
VALUES (
    'admin',
    '$2a$10$D/VBppQglR2KSZAGa14ltrNUcPt7T9yx4ZqzM0JpkZ5CA4Qjdf6OO', -- bcrypt hash for 'admin123'
    'admin',
    TRUE
)
ON CONFLICT (username) DO NOTHING;

-- ============================================
-- Optional: Create a function to calculate lesson cost
-- ============================================

CREATE OR REPLACE FUNCTION calculate_lesson_cost(
    p_education_level_id INT,
    p_lesson_type VARCHAR,
    p_hours DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
    v_price_per_hour DECIMAL;
BEGIN
    SELECT price_per_hour INTO v_price_per_hour
    FROM pricing
    WHERE education_level_id = p_education_level_id
    AND lesson_type = p_lesson_type;
    
    IF v_price_per_hour IS NULL THEN
        RETURN NULL;
    END IF;
    
    RETURN v_price_per_hour * p_hours;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Optional: Create a trigger to auto-calculate lesson cost
-- ============================================

-- Trigger for individual lessons
CREATE OR REPLACE FUNCTION update_individual_lesson_cost()
RETURNS TRIGGER AS $$
BEGIN
    NEW.total_cost = calculate_lesson_cost(
        NEW.education_level_id,
        'individual',
        NEW.hours
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_individual_lesson_cost
BEFORE INSERT OR UPDATE ON individual_lessons
FOR EACH ROW
EXECUTE FUNCTION update_individual_lesson_cost();

-- Trigger for group lessons
CREATE OR REPLACE FUNCTION update_group_lesson_cost()
RETURNS TRIGGER AS $$
BEGIN
    NEW.total_cost = calculate_lesson_cost(
        NEW.education_level_id,
        'group',
        NEW.hours
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_group_lesson_cost
BEFORE INSERT OR UPDATE ON group_lessons
FOR EACH ROW
EXECUTE FUNCTION update_group_lesson_cost();

-- ============================================
-- End of Schema
-- ============================================

