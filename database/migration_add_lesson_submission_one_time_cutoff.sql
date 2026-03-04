-- One-time cutoff date for lesson submission: before this date, teachers can submit
-- lessons for months before the cutoff month (e.g. Jan & Feb when cutoff is 2026-03-02).
-- Run in Supabase SQL Editor.

INSERT INTO app_settings (key, value, description) VALUES
  ('lesson_submission_one_time_cutoff_date', '', 'موعد قطع إضافي (مرة واحدة): تاريخ YYYY-MM-DD. قبل هذا التاريخ يمكن إضافة دروس الأشهر السابقة لشهر الموعد. فارغ = معطّل.')
ON CONFLICT (key) DO NOTHING;
b