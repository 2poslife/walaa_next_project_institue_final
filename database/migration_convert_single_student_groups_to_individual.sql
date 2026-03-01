-- Migration: Convert group lessons that have only 1 student into individual lessons
-- Run in Supabase SQL Editor. Use when lessons were registered as "group" but had one participant (حصة من 1).
--
-- SAFETY: Wrapped in a transaction. If anything looks wrong, change COMMIT at the end to ROLLBACK.
-- STEP 0: Run the preview query first (below) to see exactly what will be converted.

-- ========== STEP 0: PREVIEW (run this first, no changes) ==========
-- SELECT s.full_name, gl.id, gl.date, gl.hours, gl.approved, gl.total_cost
-- FROM group_lessons gl
-- JOIN group_lesson_students gls ON gls.group_lesson_id = gl.id
-- JOIN students s ON s.id = gls.student_id
-- WHERE gl.id IN (SELECT group_lesson_id FROM group_lesson_students GROUP BY group_lesson_id HAVING COUNT(*) = 1)
-- ORDER BY s.full_name, gl.date;

-- ========== CONVERSION (run when ready) ==========
BEGIN;

-- Step 1: Save the list of group_lesson ids that have exactly 1 student
DROP TABLE IF EXISTS _single_student_group_ids;
CREATE TEMP TABLE _single_student_group_ids AS
SELECT group_lesson_id AS id
FROM group_lesson_students
GROUP BY group_lesson_id
HAVING COUNT(*) = 1;

-- Step 2: Insert into individual_lessons (copy teacher, student, level, date, time, hours, approved, cost, etc.)
-- If your DB has no deleted_at/deletion_note, remove those two columns from INSERT and SELECT.
INSERT INTO individual_lessons (
  teacher_id,
  student_id,
  education_level_id,
  date,
  start_time,
  hours,
  approved,
  total_cost,
  price_locked,
  deleted_at,
  deletion_note
)
SELECT
  gl.teacher_id,
  gls.student_id,
  gl.education_level_id,
  gl.date,
  gl.start_time,
  gl.hours,
  gl.approved,
  gl.total_cost,
  gl.price_locked,
  gl.deleted_at,
  gl.deletion_note
FROM group_lessons gl
JOIN group_lesson_students gls ON gls.group_lesson_id = gl.id
WHERE gl.id IN (SELECT id FROM _single_student_group_ids);

-- Step 3: Remove links in group_lesson_students for those lessons
DELETE FROM group_lesson_students
WHERE group_lesson_id IN (SELECT id FROM _single_student_group_ids);

-- Step 4: Delete the group_lessons rows (they are now individual)
DELETE FROM group_lessons
WHERE id IN (SELECT id FROM _single_student_group_ids);

DROP TABLE IF EXISTS _single_student_group_ids;

-- Confirm: COMMIT makes changes permanent. To test without saving, replace COMMIT with ROLLBACK.
COMMIT;
