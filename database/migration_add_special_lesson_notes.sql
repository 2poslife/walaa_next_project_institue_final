-- Migration: Add special_lesson_notes table for special/exceptional lessons
-- Run this in your Supabase SQL Editor
-- This table stores notes about special lessons that don't affect regular payments/lessons

CREATE TABLE IF NOT EXISTS special_lesson_notes (
    id SERIAL PRIMARY KEY,
    
    -- معلومات المعلم (إلزامي)
    teacher_id INT NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    
    -- معلومات الدرس (إلزامية)
    date DATE NOT NULL,
    start_time TIME,  -- وقت بداية الدرس (اختياري)
    hours DECIMAL(4,2),  -- عدد الساعات (اختياري)
    
    -- المستوى التعليمي والصف (اختياري)
    education_level_id INT REFERENCES education_levels(id),
    class VARCHAR(50),  -- الصف (مثل: أول، ثاني، ثالث)
    
    -- الطلاب (إلزامي - JSON array لتخزين IDs)
    student_ids INTEGER[] NOT NULL DEFAULT '{}',  -- Array of student IDs
    
    -- الملاحظات (إلزامية)
    teacher_note TEXT NOT NULL,  -- ملاحظة المعلم (إلزامي)
    admin_note TEXT,  -- ملاحظة المدير (اختياري)
    
    -- حالة القراءة
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,  -- تاريخ ووقت القراءة
    read_by INT REFERENCES users(id),  -- من قرأها (المدير)
    
    -- التواريخ
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes للأداء
CREATE INDEX IF NOT EXISTS idx_special_lesson_notes_teacher ON special_lesson_notes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_special_lesson_notes_date ON special_lesson_notes(date);
CREATE INDEX IF NOT EXISTS idx_special_lesson_notes_is_read ON special_lesson_notes(is_read);
CREATE INDEX IF NOT EXISTS idx_special_lesson_notes_education_level ON special_lesson_notes(education_level_id);
CREATE INDEX IF NOT EXISTS idx_special_lesson_notes_created_at ON special_lesson_notes(created_at DESC);

-- Add comment to explain the table
COMMENT ON TABLE special_lesson_notes IS 'ملاحظات عن دروس خاصة/استثنائية لا تؤثر على المدفوعات أو الدروس العادية';

