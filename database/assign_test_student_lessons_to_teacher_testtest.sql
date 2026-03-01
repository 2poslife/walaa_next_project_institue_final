-- Assign all lessons for student "test" to teacher "testtest"
-- Run in Supabase SQL Editor. No change to other students or teachers.
--
-- Use teachers.id (23), NOT users.id / user_id. Lesson tables reference teachers(id).
-- testtest row: teachers.id = 23, teachers.user_id = 25.

-- 1) Individual lessons: set teacher_id = 23 where student is "test"
UPDATE individual_lessons il
SET teacher_id = 23
FROM students s
WHERE il.student_id = s.id
  AND s.full_name = 'test';

-- 2) Remedial lessons: set teacher_id = 23 where student is "test"
UPDATE remedial_lessons rl
SET teacher_id = 23
FROM students s
WHERE rl.student_id = s.id
  AND s.full_name = 'test';

-- 3) Group lessons: set teacher_id = 23 for any group that has student "test"
UPDATE group_lessons gl
SET teacher_id = 23
WHERE gl.id IN (
  SELECT gls.group_lesson_id
  FROM group_lesson_students gls
  JOIN students s ON s.id = gls.student_id
  WHERE s.full_name = 'test'
);

-- Verify (optional): count lessons for student test per type
-- SELECT 'individual' AS kind, COUNT(*) FROM individual_lessons il
-- JOIN students s ON s.id = il.student_id WHERE s.full_name = 'test'
-- UNION ALL
-- SELECT 'remedial', COUNT(*) FROM remedial_lessons rl
-- JOIN students s ON s.id = rl.student_id WHERE s.full_name = 'test'
-- UNION ALL
-- SELECT 'group', COUNT(*) FROM group_lesson_students gls
-- JOIN students s ON s.id = gls.student_id WHERE s.full_name = 'test';
