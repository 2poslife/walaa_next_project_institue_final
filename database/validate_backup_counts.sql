-- ============================================================
-- Validate backup counts: run in DB and compare with CSV rows
-- (Backup exports ALL rows including deleted)
-- ============================================================

-- 1) Lesson counts (individual, group, remedial)
SELECT
  'individual_lessons' AS table_name,
  COUNT(*) AS total_rows
FROM individual_lessons
UNION ALL
SELECT
  'group_lessons',
  COUNT(*)
FROM group_lessons
UNION ALL
SELECT
  'remedial_lessons',
  COUNT(*)
FROM remedial_lessons;

-- 2) Payments and special notes
SELECT
  'payments' AS table_name,
  COUNT(*) AS total_rows
FROM payments
UNION ALL
SELECT
  'special_lesson_notes',
  COUNT(*)
FROM special_lesson_notes;

-- 3) Single query: all counts in one result
SELECT
  (SELECT COUNT(*) FROM individual_lessons) AS individual_lessons,
  (SELECT COUNT(*) FROM group_lessons) AS group_lessons,
  (SELECT COUNT(*) FROM remedial_lessons) AS remedial_lessons,
  (SELECT COUNT(*) FROM payments) AS payments,
  (SELECT COUNT(*) FROM special_lesson_notes) AS special_lesson_notes;

-- 4) Optional: count only non-deleted lessons (if you filter deleted in CSV later)
-- SELECT
--   (SELECT COUNT(*) FROM individual_lessons WHERE deleted_at IS NULL) AS individual_active,
--   (SELECT COUNT(*) FROM group_lessons WHERE deleted_at IS NULL) AS group_active,
--   (SELECT COUNT(*) FROM remedial_lessons WHERE deleted_at IS NULL) AS remedial_active;
