-- Copy all approved lessons from student "تسنيم سيدي" to student "test"
-- Does NOT change anything for تسنيم سيدي. Only inserts new rows for "test".
-- All copied lessons are assigned to teacher "testtest" (id 23) so they don't affect real teachers.
-- Run in Supabase SQL Editor.
--
-- STEP 0: Restore "test" if still deleted (run restore_student_test.sql first if needed).
-- STEP 1: Run the PREVIEW below to see what will be copied.
-- STEP 2: Run the main script.
--
-- To assign existing "test" lessons to testtest without copying again, run:
--   database/assign_test_student_lessons_to_teacher_testtest.sql

-- ========== STEP 1: PREVIEW (run first, no changes) ==========
/*
WITH src AS (SELECT id FROM students WHERE full_name = N'تسنيم سيدي' LIMIT 1),
     tgt AS (SELECT id FROM students WHERE full_name = 'test' AND deleted_at IS NULL LIMIT 1)
SELECT 'individual' AS kind, COUNT(*) AS cnt FROM individual_lessons il, src, tgt
WHERE il.student_id = src.id AND il.approved = true AND (il.deleted_at IS NULL)
UNION ALL
SELECT 'remedial', COUNT(*) FROM remedial_lessons rl, src, tgt
WHERE rl.student_id = src.id AND rl.approved = true AND (rl.deleted_at IS NULL)
UNION ALL
SELECT 'group', COUNT(*) FROM group_lessons gl
JOIN group_lesson_students gls ON gls.group_lesson_id = gl.id, src, tgt
WHERE gls.student_id = src.id AND gl.approved = true AND (gl.deleted_at IS NULL);
*/

-- ========== MAIN: COPY LESSONS ==========
DO $$
DECLARE
  src_id INT;
  tgt_id INT;
  teacher_testtest_id INT := 23;  -- teachers.id for "testtest" (NOT user_id; lesson tables use teachers.id)
  r RECORD;
  new_gl_id INT;
BEGIN
  -- Resolve student IDs
  SELECT id INTO src_id FROM students WHERE full_name = N'تسنيم سيدي' LIMIT 1;
  SELECT id INTO tgt_id FROM students WHERE full_name = 'test' AND deleted_at IS NULL LIMIT 1;

  IF src_id IS NULL THEN
    RAISE EXCEPTION 'Student not found: تسنيم سيدي';
  END IF;
  IF tgt_id IS NULL THEN
    RAISE EXCEPTION 'Student "test" not found or still deleted. Restore test first (restore_student_test.sql).';
  END IF;

  -- 1) Individual lessons: copy to "test" and assign to teacher testtest (id 23)
  INSERT INTO individual_lessons (
    teacher_id, student_id, education_level_id, date, start_time, hours,
    approved, total_cost, price_locked
  )
  SELECT
    teacher_testtest_id, tgt_id, education_level_id, date, start_time, hours,
    approved, total_cost, price_locked
  FROM individual_lessons
  WHERE student_id = src_id
    AND approved = true
    AND (deleted_at IS NULL);

  -- 2) Remedial lessons: copy to "test" and assign to teacher testtest (id 23)
  INSERT INTO remedial_lessons (
    teacher_id, student_id, date, start_time, hours, approved, total_cost
  )
  SELECT
    teacher_testtest_id, tgt_id, date, start_time, hours, approved, total_cost
  FROM remedial_lessons
  WHERE student_id = src_id
    AND approved = true
    AND (deleted_at IS NULL);

  -- 3) Group lessons: create new rows under teacher testtest and link "test" only
  FOR r IN
    SELECT gl.education_level_id, gl.date, gl.start_time, gl.hours,
           gl.approved, gl.total_cost, gl.price_locked
    FROM group_lessons gl
    JOIN group_lesson_students gls ON gls.group_lesson_id = gl.id
    WHERE gls.student_id = src_id
      AND gl.approved = true
      AND (gl.deleted_at IS NULL)
    ORDER BY gl.id
  LOOP
    INSERT INTO group_lessons (
      teacher_id, education_level_id, date, start_time, hours,
      approved, total_cost, price_locked
    )
    VALUES (
      teacher_testtest_id, r.education_level_id, r.date, r.start_time, r.hours,
      r.approved, r.total_cost, r.price_locked
    )
    RETURNING id INTO new_gl_id;
    INSERT INTO group_lesson_students (group_lesson_id, student_id)
    VALUES (new_gl_id, tgt_id);
  END LOOP;
END $$;

-- Verify: check counts for "test"
-- SELECT 'individual' AS kind, COUNT(*) FROM individual_lessons il
-- JOIN students s ON s.id = il.student_id WHERE s.full_name = 'test' AND il.approved
-- UNION ALL
-- SELECT 'remedial', COUNT(*) FROM remedial_lessons rl
-- JOIN students s ON s.id = rl.student_id WHERE s.full_name = 'test' AND rl.approved
-- UNION ALL
-- SELECT 'group', COUNT(*) FROM group_lesson_students gls
-- JOIN students s ON s.id = gls.student_id WHERE s.full_name = 'test'
-- UNION ALL
-- SELECT 'group_lessons', COUNT(*) FROM group_lessons gl
-- JOIN group_lesson_students gls ON gls.group_lesson_id = gl.id
-- JOIN students s ON s.id = gls.student_id WHERE s.full_name = 'test';
