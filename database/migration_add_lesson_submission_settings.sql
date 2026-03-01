-- Add app_settings for lesson submission deadline (admin-configurable)
-- Run in Supabase SQL Editor.

INSERT INTO app_settings (key, value, description) VALUES
  ('lesson_submission_deadline_day', '2', 'آخر موعد إضافة الدروس: يوم الشهر التالي (1 = الأول، 2 = الثاني، ... حتى 31)'),
  ('lesson_submission_deadline_inclusive', 'true', 'هل ذلك اليوم مشمول؟ true = مسموح فيه، false = غير مشمول (آخر يوم مسموح هو اليوم السابق)')
ON CONFLICT (key) DO NOTHING;
