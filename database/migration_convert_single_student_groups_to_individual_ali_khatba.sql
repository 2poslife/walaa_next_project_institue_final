-- Convert group lessons with 1 student → individual, ONLY for student: علي خطبا
-- Run in Supabase SQL Editor.

-- Optional: preview what will be converted (run first to check)
-- SELECT gl.id, gl.date, gl.hours, gl.approved, gl.total_cost, s.full_name
-- FROM group_lessons gl
-- JOIN group_lesson_students gls ON gls.group_lesson_id = gl.id
-- JOIN students s ON s.id = gls.student_id
-- WHERE s.full_name = 'علي خطبا'
--   AND gl.id IN (SELECT group_lesson_id FROM group_lesson_students GROUP BY group_lesson_id HAVING COUNT(*) = 1);

-- Step 1: Group lessons that have exactly 1 student AND that student is علي خطبا
DROP TABLE IF EXISTS _single_student_group_ids;
CREATE TEMP TABLE _single_student_group_ids AS
SELECT gls.group_lesson_id AS id
FROM group_lesson_students gls
JOIN students s ON s.id = gls.student_id
WHERE s.full_name = 'علي خطبا'
  AND gls.group_lesson_id IN (
    SELECT group_lesson_id FROM group_lesson_students GROUP BY group_lesson_id HAVING COUNT(*) = 1
  );

-- Step 2: Insert into individual_lessons
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

-- Step 3: Remove from group_lesson_students
DELETE FROM group_lesson_students
WHERE group_lesson_id IN (SELECT id FROM _single_student_group_ids);

-- Step 4: Delete from group_lessons
DELETE FROM group_lessons
WHERE id IN (SELECT id FROM _single_student_group_ids);

DROP TABLE IF EXISTS _single_student_group_ids;
