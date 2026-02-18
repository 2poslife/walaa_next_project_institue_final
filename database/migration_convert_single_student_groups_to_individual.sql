-- Migration: Convert group lessons that have only 1 student into individual lessons
-- Run in Supabase SQL Editor. Use when lessons were registered as "group" but had one participant (حصة من 1).
-- Steps: 1) Insert into individual_lessons, 2) Remove from group_lesson_students, 3) Delete from group_lessons.

-- Optional: preview which rows will be converted (run this first to check)
-- SELECT gl.id, gl.date, gl.hours, gl.approved, gl.total_cost, gls.student_id
-- FROM group_lessons gl
-- JOIN group_lesson_students gls ON gls.group_lesson_id = gl.id
-- WHERE gl.id IN (
--   SELECT group_lesson_id FROM group_lesson_students GROUP BY group_lesson_id HAVING COUNT(*) = 1
-- );

-- Step 1: Save the list of group_lesson ids that have exactly 1 student (so we can delete them after)
CREATE TEMP TABLE IF NOT EXISTS _single_student_group_ids AS
SELECT group_lesson_id AS id
FROM group_lesson_students
GROUP BY group_lesson_id
HAVING COUNT(*) = 1;

-- Step 2: Insert into individual_lessons (copy teacher, student, level, date, time, hours, approved, cost, etc.)
-- If your DB has no deleted_at/deletion_note on individual_lessons, remove those two columns from INSERT and SELECT.
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

-- Optional: drop temp table (session-bound anyway)
DROP TABLE IF EXISTS _single_student_group_ids;
