-- List all lessons (individual, group, remedial) for a student by name.
-- Change the student name in the CTE below (e.g. 'تسنيم' or 'تسنيم سيدي').
-- Run in Supabase SQL Editor.

WITH student AS (
  SELECT id, full_name
  FROM students
  WHERE full_name ILIKE '%تسنيم%'   -- adjust: e.g. '%تسنيم%' or 'تسنيم سيدي'
  LIMIT 1
)

-- Individual lessons
SELECT
  'individual' AS lesson_type,
  il.id,
  il.date,
  il.start_time,
  il.hours,
  il.approved,
  il.total_cost,
  il.deleted_at,
  t.full_name AS teacher_name,
  (SELECT full_name FROM student) AS student_name
FROM individual_lessons il
JOIN student s ON s.id = il.student_id
LEFT JOIN teachers t ON t.id = il.teacher_id
ORDER BY il.date DESC, il.start_time NULLS LAST;

-- Remedial lessons
SELECT
  'remedial' AS lesson_type,
  rl.id,
  rl.date,
  rl.start_time,
  rl.hours,
  rl.approved,
  rl.total_cost,
  rl.deleted_at,
  t.full_name AS teacher_name,
  (SELECT full_name FROM student) AS student_name
FROM remedial_lessons rl
JOIN student s ON s.id = rl.student_id
LEFT JOIN teachers t ON t.id = rl.teacher_id
ORDER BY rl.date DESC, rl.start_time NULLS LAST;

-- Group lessons (where this student participates)
SELECT
  'group' AS lesson_type,
  gl.id,
  gl.date,
  gl.start_time,
  gl.hours,
  gl.approved,
  gl.total_cost,
  gl.deleted_at,
  t.full_name AS teacher_name,
  (SELECT full_name FROM student) AS student_name
FROM group_lessons gl
JOIN group_lesson_students gls ON gls.group_lesson_id = gl.id
JOIN student s ON s.id = gls.student_id
LEFT JOIN teachers t ON t.id = gl.teacher_id
ORDER BY gl.date DESC, gl.start_time NULLS LAST;


-- ========== Optional: one result set with all three types (UNION) ==========
-- Uncomment below to get a single table with lesson_type = 'individual' | 'remedial' | 'group'

/*
WITH student AS (
  SELECT id, full_name FROM students WHERE full_name ILIKE '%تسنيم%' LIMIT 1
)
SELECT * FROM (
  SELECT 'individual' AS lesson_type, il.id, il.date, il.start_time, il.hours, il.approved, il.total_cost, il.deleted_at,
         t.full_name AS teacher_name, (SELECT full_name FROM student) AS student_name
  FROM individual_lessons il
  JOIN student s ON s.id = il.student_id
  LEFT JOIN teachers t ON t.id = il.teacher_id
  UNION ALL
  SELECT 'remedial', rl.id, rl.date, rl.start_time, rl.hours, rl.approved, rl.total_cost, rl.deleted_at,
         t.full_name, (SELECT full_name FROM student)
  FROM remedial_lessons rl
  JOIN student s ON s.id = rl.student_id
  LEFT JOIN teachers t ON t.id = rl.teacher_id
  UNION ALL
  SELECT 'group', gl.id, gl.date, gl.start_time, gl.hours, gl.approved, gl.total_cost, gl.deleted_at,
         t.full_name, (SELECT full_name FROM student)
  FROM group_lessons gl
  JOIN group_lesson_students gls ON gls.group_lesson_id = gl.id
  JOIN student s ON s.id = gls.student_id
  LEFT JOIN teachers t ON t.id = gl.teacher_id
) u
ORDER BY date DESC, start_time NULLS LAST;
*/
